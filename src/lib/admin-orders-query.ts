import { parseAdminLiveSince } from '@/lib/admin-live-sync';
import { safeAmount, safeCount } from '@/lib/safe-number';
import { sql } from '@/lib/db';
import {
  normalizeOrderDate,
  normalizeOrderTime,
  parseOrderProducts,
} from '@/lib/normalize-order-payload';
import { ensureOrdersAdminColumns } from '@/lib/orders-schema';
import { getTodayDateInTimezone } from '@/lib/order-date';
import { resolveOrderPayment } from '@/lib/order-payment';
import type { Order } from '@/types/order';

export type AdminOrdersListParams = {
  page?: number;
  limit?: number;
  status?: string | null;
  payment?: string | null;
  paystatus?: string | null;
  city?: string | null;
  period?: string | null;
  from?: string | null;
  to?: string | null;
  search?: string | null;
};

export type AdminOrderStats = {
  total: number;
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  pendingAmount: number;
  processingAmount: number;
  completedAmount: number;
  cancelledAmount: number;
  totalRevenue: number;
  todayOrders: number;
};

export function sanitizeAdminOrderStats(stats: AdminOrderStats): AdminOrderStats {
  return {
    total: safeCount(stats.total),
    pending: safeCount(stats.pending),
    processing: safeCount(stats.processing),
    shipped: safeCount(stats.shipped),
    delivered: safeCount(stats.delivered),
    cancelled: safeCount(stats.cancelled),
    pendingAmount: safeAmount(stats.pendingAmount),
    processingAmount: safeAmount(stats.processingAmount),
    completedAmount: safeAmount(stats.completedAmount),
    cancelledAmount: safeAmount(stats.cancelledAmount),
    totalRevenue: safeAmount(stats.totalRevenue),
    todayOrders: safeCount(stats.todayOrders),
  };
}

function mapOrderRow(row: Record<string, unknown>): Order {
  const total = parseFloat(String(row.total));
  const deliveryFee = Math.max(0, parseFloat(String(row.delivery_fee ?? 0)) || 0);
  const products = parseOrderProducts(row.products);
  const payment = resolveOrderPayment(row, products);
  return {
    id: row.id as string,
    customer: row.customer as string,
    phone: row.phone as string,
    city: row.city as string,
    address: row.address as string,
    products,
    subtotal: Math.max(0, total - deliveryFee),
    deliveryFee,
    total,
    status: row.status as Order['status'],
    date: normalizeOrderDate(row.date),
    time: normalizeOrderTime(row.time),
    notes: String(row.notes ?? ''),
    trackingId: String(row.tracking_id ?? ''),
    shopUserId:
      row.shop_user_id != null && Number.isFinite(Number(row.shop_user_id))
        ? Number(row.shop_user_id)
        : undefined,
    paymentMethodType: payment.paymentMethodType,
    paymentMethodLabel: payment.paymentMethodLabel,
    paymentStatus: payment.paymentStatus,
  };
}

function listFilters(params: AdminOrdersListParams) {
  const statusFilter =
    params.status && params.status !== 'all' ? params.status : null;
  const paymentFilter =
    params.payment && params.payment !== 'all' ? params.payment : null;
  const payStatusFilter =
    params.paystatus && params.paystatus !== 'all' ? params.paystatus : null;
  const cityFilter = params.city?.trim() || null;
  const todayOnly = params.period === 'today';
  const today = getTodayDateInTimezone();
  const fromDate = params.from?.trim() || null;
  const toDate = params.to?.trim() || null;
  const search = params.search?.trim() || null;
  const searchPattern = search ? `%${search}%` : null;
  return { statusFilter, paymentFilter, payStatusFilter, cityFilter, todayOnly, today, fromDate, toDate, searchPattern };
}

export async function queryAdminOrdersList(params: AdminOrdersListParams): Promise<{
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  await ensureOrdersAdminColumns();

  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(100, Math.max(1, params.limit ?? 50));
  const offset = (page - 1) * limit;
  const { statusFilter, paymentFilter, payStatusFilter, cityFilter, todayOnly, today, fromDate, toDate, searchPattern } =
    listFilters(params);

  const countRows = await sql`
    SELECT COUNT(*)::int AS c
    FROM orders
    WHERE
      (${statusFilter}::text IS NULL OR status = ${statusFilter})
      AND (${paymentFilter}::text IS NULL OR payment_method_type = ${paymentFilter})
      AND (${payStatusFilter}::text IS NULL OR payment_status = ${payStatusFilter})
      AND (${cityFilter}::text IS NULL OR city = ${cityFilter})
      AND (${todayOnly}::boolean IS FALSE OR date = ${today}::date)
      AND (${fromDate}::text IS NULL OR date >= ${fromDate}::date)
      AND (${toDate}::text IS NULL OR date <= ${toDate}::date)
      AND (
        ${searchPattern}::text IS NULL
        OR id ILIKE ${searchPattern}
        OR customer ILIKE ${searchPattern}
        OR phone ILIKE ${searchPattern}
      )
  `;

  const total = Number(countRows[0]?.c ?? 0);

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
      notes,
      tracking_id,
      shop_user_id,
      payment_method_type,
      payment_method_label,
      payment_status,
      delivery_fee,
      created_at,
      updated_at
    FROM orders
    WHERE
      (${statusFilter}::text IS NULL OR status = ${statusFilter})
      AND (${paymentFilter}::text IS NULL OR payment_method_type = ${paymentFilter})
      AND (${payStatusFilter}::text IS NULL OR payment_status = ${payStatusFilter})
      AND (${cityFilter}::text IS NULL OR city = ${cityFilter})
      AND (${todayOnly}::boolean IS FALSE OR date = ${today}::date)
      AND (${fromDate}::text IS NULL OR date >= ${fromDate}::date)
      AND (${toDate}::text IS NULL OR date <= ${toDate}::date)
      AND (
        ${searchPattern}::text IS NULL
        OR id ILIKE ${searchPattern}
        OR customer ILIKE ${searchPattern}
        OR phone ILIKE ${searchPattern}
      )
    ORDER BY date DESC, time DESC, id DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `;

  const orders = rows.map((row: Record<string, unknown>) => mapOrderRow(row));

  return {
    orders,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function queryAdminOrderStats(): Promise<AdminOrderStats> {
  await ensureOrdersAdminColumns();
  const today = getTodayDateInTimezone();

  const rows = await sql`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
      COUNT(*) FILTER (WHERE status = 'processing')::int AS processing,
      COUNT(*) FILTER (WHERE status = 'shipped')::int AS shipped,
      COUNT(*) FILTER (WHERE status = 'delivered')::int AS delivered,
      COUNT(*) FILTER (WHERE status = 'cancelled')::int AS cancelled,
      COALESCE(SUM(total) FILTER (WHERE status = 'pending'), 0)::float AS pending_amount,
      COALESCE(SUM(total) FILTER (WHERE status IN ('processing', 'shipped')), 0)::float AS processing_amount,
      COALESCE(SUM(total) FILTER (WHERE status = 'delivered'), 0)::float AS completed_amount,
      COALESCE(SUM(total) FILTER (WHERE status = 'cancelled'), 0)::float AS cancelled_amount,
      COALESCE(SUM(total) FILTER (WHERE status != 'cancelled'), 0)::float AS total_revenue,
      COUNT(*) FILTER (WHERE date = ${today}::date)::int AS today_orders
    FROM orders
  `;

  const r = rows[0] as Record<string, unknown>;
  return sanitizeAdminOrderStats({
    total: Number(r.total ?? 0),
    pending: Number(r.pending ?? 0),
    processing: Number(r.processing ?? 0),
    shipped: Number(r.shipped ?? 0),
    delivered: Number(r.delivered ?? 0),
    cancelled: Number(r.cancelled ?? 0),
    pendingAmount: Number(r.pending_amount ?? 0),
    processingAmount: Number(r.processing_amount ?? 0),
    completedAmount: Number(r.completed_amount ?? 0),
    cancelledAmount: Number(r.cancelled_amount ?? 0),
    totalRevenue: Number(r.total_revenue ?? 0),
    todayOrders: Number(r.today_orders ?? 0),
  });
}

export async function queryOrdersChangedSince(since: string): Promise<Order[]> {
  await ensureOrdersAdminColumns();
  const sinceAt = parseAdminLiveSince(since);
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
      notes,
      tracking_id,
      shop_user_id,
      payment_method_type,
      payment_method_label,
      payment_status,
      delivery_fee,
      created_at,
      updated_at
    FROM orders
    WHERE updated_at > ${sinceAt}
       OR created_at > ${sinceAt}
    ORDER BY updated_at DESC
    LIMIT 200
  `;
  return rows.map((row: Record<string, unknown>) => mapOrderRow(row));
}

export async function queryRecentOrders(limit = 8): Promise<Order[]> {
  await ensureOrdersAdminColumns();
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
      notes,
      tracking_id,
      shop_user_id,
      payment_method_type,
      payment_method_label,
      payment_status,
      delivery_fee,
      created_at,
      updated_at
    FROM orders
    ORDER BY updated_at DESC, date DESC, time DESC
    LIMIT ${limit}
  `;
  return rows.map((row: Record<string, unknown>) => mapOrderRow(row));
}

export async function queryAbandonedCount(): Promise<number> {
  const rows = await sql`SELECT COUNT(*)::int AS c FROM abandoned_orders`;
  return Number(rows[0]?.c ?? 0);
}

export { mapOrderRow };
