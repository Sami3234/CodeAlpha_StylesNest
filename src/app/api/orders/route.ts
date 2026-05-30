import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireShopSession } from '@/lib/require-shop-session';
import { requireAdminSession } from '@/lib/require-admin-session';
import { apiErrorResponse } from '@/lib/safe-errors';
import {
  decrementStockForOrderLines,
  validateAndPriceOrderLines,
  type OrderLineInput,
} from '@/lib/validate-order-request';
import {
  normalizeOrderPayload,
} from '@/lib/normalize-order-payload';
import { paymentTypeLabel } from '@/lib/payment-methods';
import { defaultPaymentStatusForType, requireOrderPaymentMethodType } from '@/lib/order-payment';
import { getCurrentTimeInTimezone, getTodayDateInTimezone } from '@/lib/order-date';
import { ensureOrdersAdminColumns } from '@/lib/orders-schema';
import { mapOrderRow } from '@/lib/admin-orders-query';
import { logAdminAction } from '@/lib/admin-audit';
import { nextOrderId } from '@/lib/next-order-id';
import {
  incrementSoldCountForOrderLines,
  isCancelledOrderStatus,
  reconcileSoldCountChange,
} from '@/lib/product-sold-count';
import { parseOrderProducts } from '@/lib/normalize-order-payload';
import { deleteReviewsForOrder } from '@/lib/product-reviews';

export const dynamic = 'force-dynamic';

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: string }).code === '23505'
  );
}

function clientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() || null;
  return request.headers.get('x-real-ip');
}

/** Admin only — list all orders (dashboard sync). Prefer /api/admin/orders/list for paginated UI. */
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminSession(request);
    if (!admin.ok) return admin.response;

    await ensureOrdersAdminColumns();

    let rows;
    try {
      rows = await sql`
        SELECT
          id,
          customer,
          phone,
          city,
          address,
          products,
          total,
          status,
          date,
          time,
          notes,
          tracking_id,
          created_at,
          updated_at
        FROM orders
        ORDER BY date DESC, time DESC
      `;
    } catch {
      rows = await sql`
        SELECT
          id,
          customer,
          phone,
          city,
          address,
          products,
          total,
          status,
          date,
          time,
          created_at,
          updated_at
        FROM orders
        ORDER BY date DESC, time DESC
      `;
    }

    const orders = rows.map((row: Record<string, unknown>) => mapOrderRow(row));

    return NextResponse.json(
      { orders },
      { headers: { 'Cache-Control': 'private, no-store, max-age=0' } },
    );
  } catch (error) {
    return apiErrorResponse({ message: 'Failed to fetch orders', status: 500, cause: error });
  }
}

/** Customer checkout — requires shop login; order id assigned server-side. */
export async function POST(request: NextRequest) {
  try {
    const { session, error: authError } = await requireShopSession();
    if (authError) return authError;

    const shopUserId = Number(session!.user!.id);
    if (!Number.isFinite(shopUserId) || shopUserId < 1) {
      return NextResponse.json({ error: 'Invalid account session.' }, { status: 401 });
    }

    const body = await request.json();
    const {
      customer,
      phone,
      city,
      address,
      products: rawProducts,
      status,
      date,
      time,
      paymentMethodType: rawPaymentType,
      paymentMethodLabel: rawPaymentLabel,
    } = body;

    if (!customer?.trim() || !phone?.trim() || !city?.trim() || !address?.trim()) {
      return NextResponse.json({ error: 'All delivery fields are required.' }, { status: 400 });
    }

    const phoneDigits = String(phone).replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      return NextResponse.json({ error: 'Valid phone number is required.' }, { status: 400 });
    }

    const lineInputs: OrderLineInput[] = Array.isArray(rawProducts)
      ? rawProducts.map((p: Record<string, unknown>) => ({
          productId: Number(p.productId),
          quantity: Number(p.quantity),
          selectedSize: typeof p.selectedSize === 'string' ? p.selectedSize : undefined,
          selectedColor: typeof p.selectedColor === 'string' ? p.selectedColor : undefined,
          paymentMethod: typeof p.paymentMethod === 'string' ? p.paymentMethod : undefined,
        }))
      : [];

    const paymentCheck = requireOrderPaymentMethodType(rawPaymentType);
    if (!paymentCheck.ok) {
      return NextResponse.json({ error: paymentCheck.error }, { status: 400 });
    }
    const paymentMethodType = paymentCheck.paymentMethodType;
    const paymentMethodLabel =
      typeof rawPaymentLabel === 'string' && rawPaymentLabel.trim()
        ? rawPaymentLabel.trim().slice(0, 120)
        : paymentTypeLabel(paymentMethodType);
    const paymentStatus = defaultPaymentStatusForType(paymentMethodType);

    const priced = await validateAndPriceOrderLines(lineInputs, { paymentMethodType });
    if (!priced.ok) {
      return NextResponse.json({ error: priced.error }, { status: priced.status });
    }

    const storedProducts = priced.products.map((p) => ({
      productId: p.productId,
      name: p.name,
      quantity: p.quantity,
      price: p.price,
      lineTotal: p.lineTotal,
      paymentMethod: p.paymentMethod,
      selectedSize: p.selectedSize,
      selectedColor: p.selectedColor,
      pickPoint: p.pickPoint,
    }));

    const serverTotal = priced.total;
    const serverDeliveryFee = priced.deliveryFee;
    const id = await nextOrderId();

    const orderDate =
      typeof date === 'string' && date.trim()
        ? normalizeOrderPayload({ date }).date
        : getTodayDateInTimezone();
    const orderTime =
      typeof time === 'string' && time.trim()
        ? normalizeOrderPayload({ time }).time
        : getCurrentTimeInTimezone();

    await ensureOrdersAdminColumns();

    const result = await sql`
      INSERT INTO orders (
        id,
        customer,
        phone,
        city,
        address,
        products,
        total,
        delivery_fee,
        shop_user_id,
        payment_method_type,
        payment_method_label,
        payment_status,
        status,
        date,
        time
      )
      VALUES (
        ${id},
        ${customer.trim()},
        ${phone.trim()},
        ${city.trim()},
        ${address.trim()},
        ${JSON.stringify(storedProducts)}::jsonb,
        ${serverTotal}::decimal,
        ${serverDeliveryFee}::decimal,
        ${shopUserId},
        ${paymentMethodType},
        ${paymentMethodLabel},
        ${paymentStatus},
        ${status || 'pending'},
        ${orderDate}::date,
        ${orderTime}::time
      )
      RETURNING *
    `;

    await decrementStockForOrderLines(priced.products);

    const orderStatus = String(status || 'pending');
    if (!isCancelledOrderStatus(orderStatus)) {
      await incrementSoldCountForOrderLines(priced.products);
    }

    const order = mapOrderRow(result[0] as Record<string, unknown>);

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return apiErrorResponse({
        message: 'Order reference conflict. Please submit again.',
        status: 409,
        cause: error,
      });
    }
    return apiErrorResponse({
      message: 'We could not place your order. Please try again or contact support.',
      status: 500,
      cause: error,
    });
  }
}

/** Admin only — update order. */
export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdminSession(request);
    if (!admin.ok) return admin.response;

    await ensureOrdersAdminColumns();

    const body = await request.json();
    const id = typeof body.id === 'string' ? body.id.trim() : '';
    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const existing = await sql`
      SELECT customer, phone, city, address, products, total, status, date, time, notes, tracking_id
      FROM orders
      WHERE id = ${id}
      LIMIT 1
    `;

    if (!existing.length) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const row = existing[0] as Record<string, unknown>;
    const normalized = normalizeOrderPayload({
      customer: body.customer ?? row.customer,
      phone: body.phone ?? row.phone,
      city: body.city ?? row.city,
      address: body.address ?? row.address,
      products: body.products ?? row.products,
      total: body.total ?? row.total,
      status: body.status ?? row.status,
      date: body.date ?? row.date,
      time: body.time ?? row.time,
      notes: body.notes ?? row.notes,
      trackingId: body.trackingId ?? body.tracking_id ?? row.tracking_id,
    });

    if (!normalized.customer || !normalized.phone || !normalized.city || !normalized.address) {
      return NextResponse.json({ error: 'Customer delivery fields are required.' }, { status: 400 });
    }

    const previousStatus = String(row.status ?? '');
    const previousProducts = parseOrderProducts(row.products);

    const result = await sql`
      UPDATE orders
      SET
        customer = ${normalized.customer},
        phone = ${normalized.phone},
        city = ${normalized.city},
        address = ${normalized.address},
        products = ${normalized.productsJson}::jsonb,
        total = ${normalized.total}::decimal,
        status = ${normalized.status},
        date = ${normalized.date}::date,
        time = ${normalized.time}::time,
        notes = ${normalized.notes},
        tracking_id = ${normalized.trackingId},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;

    await reconcileSoldCountChange(
      { status: previousStatus, products: previousProducts },
      { status: normalized.status, products: normalized.products },
    );

    await logAdminAction({
      adminId: admin.adminId,
      adminEmail: admin.email,
      action: 'order.update',
      entityType: 'order',
      entityId: id,
      details: {
        status: normalized.status,
        previousStatus,
      },
      ip: clientIp(request),
    });

    return NextResponse.json({ order: mapOrderRow(result[0] as Record<string, unknown>) });
  } catch (error) {
    return apiErrorResponse({ message: 'Failed to update order', status: 500, cause: error });
  }
}

/** Admin only — delete order. */
export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdminSession(request);
    if (!admin.ok) return admin.response;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const existing = await sql`
      SELECT status, products FROM orders WHERE id = ${id} LIMIT 1
    `;

    if (!existing.length) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const prev = existing[0] as { status: string; products: unknown };
    const previousProducts = parseOrderProducts(prev.products);
    const previousStatus = String(prev.status ?? '');

    const result = await sql`
      DELETE FROM orders
      WHERE id = ${id}
      RETURNING id
    `;

    await deleteReviewsForOrder(id);

    await reconcileSoldCountChange(
      { status: previousStatus, products: previousProducts },
      { status: 'cancelled', products: [] },
    );

    await logAdminAction({
      adminId: admin.adminId,
      adminEmail: admin.email,
      action: 'order.delete',
      entityType: 'order',
      entityId: id,
      ip: clientIp(request),
    });

    return NextResponse.json({ success: true, id: result[0].id });
  } catch (error) {
    return apiErrorResponse({ message: 'Failed to delete order', status: 500, cause: error });
  }
}
