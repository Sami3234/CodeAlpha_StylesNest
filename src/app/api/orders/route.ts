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

export const dynamic = 'force-dynamic';

async function nextOrderId(): Promise<string> {
  const rows = await sql`SELECT COUNT(*)::int AS c FROM orders`;
  const count = Number(rows[0]?.c ?? 0);
  return `#QE${String(count + 1).padStart(4, '0')}`;
}

function mapOrderRow(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    customer: row.customer as string,
    phone: row.phone as string,
    city: row.city as string,
    address: row.address as string,
    products: row.products,
    total: parseFloat(String(row.total)),
    status: row.status as string,
    date: String(row.date).slice(0, 10),
    time: String(row.time).slice(0, 8),
  };
}

/** Admin only — list orders for the panel. */
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminSession(request);
    if (!admin.ok) return admin.response;

    const rows = await sql`
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

    const orders = rows.map((row) => mapOrderRow(row as Record<string, unknown>));

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
    const { error: authError } = await requireShopSession();
    if (authError) return authError;

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

    const priced = await validateAndPriceOrderLines(lineInputs);
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
    }));

    const serverTotal = priced.total;
    const id = typeof body.id === 'string' && body.id.trim() ? body.id.trim() : await nextOrderId();

    const orderDate =
      typeof date === 'string' && date.trim()
        ? date.trim().slice(0, 10)
        : new Date().toISOString().slice(0, 10);
    const orderTime =
      typeof time === 'string' && time.trim()
        ? time.trim().slice(0, 8)
        : new Date().toTimeString().slice(0, 8);

    const result = await sql`
      INSERT INTO orders (
        id,
        customer,
        phone,
        city,
        address,
        products,
        total,
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
        ${status || 'pending'},
        ${orderDate}::date,
        ${orderTime}::time
      )
      RETURNING *
    `;

    await decrementStockForOrderLines(priced.products);

    const order = mapOrderRow(result[0] as Record<string, unknown>);

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    return apiErrorResponse({ message: 'Failed to create order', status: 500, cause: error });
  }
}

/** Admin only — update order. */
export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdminSession(request);
    if (!admin.ok) return admin.response;

    const body = await request.json();
    const {
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
    } = body;

    const result = await sql`
      UPDATE orders
      SET
        customer = ${customer},
        phone = ${phone},
        city = ${city},
        address = ${address},
        products = ${JSON.stringify(products)}::jsonb,
        total = ${total},
        status = ${status},
        date = ${date},
        time = ${time},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

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

    const result = await sql`
      DELETE FROM orders
      WHERE id = ${id}
      RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, id: result[0].id });
  } catch (error) {
    return apiErrorResponse({ message: 'Failed to delete order', status: 500, cause: error });
  }
}
