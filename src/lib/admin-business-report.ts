import { ensureProductSchema } from '@/lib/ensure-product-schema';
import { mapProductRow } from '@/lib/product-mapper';
import { sql } from '@/lib/db';
import {
  queryAdminOrderStats,
  sanitizeAdminOrderStats,
  type AdminOrderStats,
} from '@/lib/admin-orders-query';
import { queryAdminDashboardStats, type AdminDashboardStats } from '@/lib/admin-dashboard-stats';
import { parseOrderProducts } from '@/lib/normalize-order-payload';
import { normalizeOrderDate, normalizeOrderTime } from '@/lib/normalize-order-payload';
import { resolveOrderPayment } from '@/lib/order-payment';
import { ensureOrdersAdminColumns } from '@/lib/orders-schema';
import { safeAmount, safeCount } from '@/lib/safe-number';
import type { Product } from '@/data/products';
import type { Order } from '@/types/order';

export type AdminReportSummary = {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  totalStockUnits: number;
  inventoryInvestment: number;
  inventoryRetailValue: number;
  totalSoldUnits: number;
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  todayOrders: number;
  totalRevenue: number;
  pendingAmount: number;
  processingAmount: number;
  completedAmount: number;
  cancelledAmount: number;
  grossProfitDelivered: number;
  cogsDelivered: number;
  totalUsers: number;
  totalReviews: number;
  pendingReviews: number;
  approvedReviews: number;
  openSupportTickets: number;
  totalSupportTickets: number;
  unsubmittedOrders: number;
};

export type AdminReportPayload = {
  generatedAt: string;
  adminEmail: string;
  summary: AdminReportSummary;
  orderStats: AdminOrderStats;
  dashboard: AdminDashboardStats;
  products: Product[];
  orders: Order[];
};

function mapReportOrderRow(row: Record<string, unknown>): Order {
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

async function queryAllCatalogProducts(): Promise<Product[]> {
  await ensureProductSchema();
  const rows = await sql`
    SELECT
      id, title_en, title_ar, description_en, description_ar,
      current_price, original_price, discount, image, images,
      free_delivery, delivery_charge, sold_count, category, features_en, features_ar,
      pricing_tiers, clothes_options, shoes_options, product_meta,
      status, created_at, updated_at
    FROM products
    ORDER BY id ASC
  `;
  return rows.map((row: Record<string, unknown>) => mapProductRow(row));
}

async function queryAllOrdersForReport(): Promise<Order[]> {
  await ensureOrdersAdminColumns();
  const rows = await sql`
    SELECT
      id, customer, phone, city, address, products, total, status,
      date, time, notes, tracking_id, shop_user_id,
      payment_method_type, payment_method_label, payment_status, delivery_fee
    FROM orders
    ORDER BY date DESC, time DESC, id DESC
    LIMIT 1500
  `;
  return rows.map((row: Record<string, unknown>) => mapReportOrderRow(row));
}

function buildCostMap(products: Product[]): Map<number, number> {
  const map = new Map<number, number>();
  for (const product of products) {
    const cost = product.productMeta?.costPrice;
    if (cost != null && cost >= 0) map.set(product.id, cost);
  }
  return map;
}

function lineRevenue(line: Order['products'][number]): number {
  const qty = Math.max(1, safeCount(line.quantity));
  if (line.lineTotal != null && line.lineTotal >= 0) return safeAmount(line.lineTotal);
  return safeAmount(line.price) * qty;
}

function computeReportSummary(
  products: Product[],
  orders: Order[],
  orderStats: AdminOrderStats,
  dashboard: AdminDashboardStats,
): AdminReportSummary {
  const costMap = buildCostMap(products);

  let inventoryInvestment = 0;
  let inventoryRetailValue = 0;
  let totalStockUnits = 0;
  let totalSoldUnits = 0;

  for (const product of products) {
    const stock = safeCount(product.productMeta?.stockQuantity);
    const cost = product.productMeta?.costPrice;
    totalStockUnits += stock;
    totalSoldUnits += safeCount(product.soldCount);
    if (cost != null && cost >= 0) {
      inventoryInvestment += cost * stock;
    }
    inventoryRetailValue += safeAmount(product.currentPrice) * stock;
  }

  let grossProfitDelivered = 0;
  let cogsDelivered = 0;

  for (const order of orders) {
    if (order.status !== 'delivered') continue;
    for (const line of order.products) {
      const revenue = lineRevenue(line);
      const qty = Math.max(1, safeCount(line.quantity));
      const unitCost =
        line.productId != null && costMap.has(line.productId)
          ? costMap.get(line.productId)!
          : 0;
      const lineCost = unitCost * qty;
      cogsDelivered += lineCost;
      grossProfitDelivered += revenue - lineCost;
    }
  }

  const activeProducts = products.filter((p) => p.status !== 'inactive').length;
  const inactiveProducts = products.length - activeProducts;

  return {
    totalProducts: products.length,
    activeProducts,
    inactiveProducts,
    totalStockUnits,
    inventoryInvestment: safeAmount(inventoryInvestment),
    inventoryRetailValue: safeAmount(inventoryRetailValue),
    totalSoldUnits,
    totalOrders: safeCount(orderStats.total),
    pendingOrders: safeCount(orderStats.pending),
    processingOrders: safeCount(orderStats.processing),
    shippedOrders: safeCount(orderStats.shipped),
    deliveredOrders: safeCount(orderStats.delivered),
    cancelledOrders: safeCount(orderStats.cancelled),
    todayOrders: safeCount(orderStats.todayOrders),
    totalRevenue: safeAmount(orderStats.totalRevenue),
    pendingAmount: safeAmount(orderStats.pendingAmount),
    processingAmount: safeAmount(orderStats.processingAmount),
    completedAmount: safeAmount(orderStats.completedAmount),
    cancelledAmount: safeAmount(orderStats.cancelledAmount),
    grossProfitDelivered: safeAmount(grossProfitDelivered),
    cogsDelivered: safeAmount(cogsDelivered),
    totalUsers: safeCount(dashboard.totalUsers),
    totalReviews: safeCount(dashboard.totalReviews),
    pendingReviews: safeCount(dashboard.pendingReviews),
    approvedReviews: safeCount(dashboard.approvedReviews),
    openSupportTickets: safeCount(dashboard.openSupportTickets),
    totalSupportTickets: safeCount(dashboard.totalSupportTickets),
    unsubmittedOrders: safeCount(dashboard.unsubmittedOrders),
  };
}

export async function queryAdminBusinessReport(adminEmail: string): Promise<AdminReportPayload> {
  const [products, orders, orderStats, dashboard] = await Promise.all([
    queryAllCatalogProducts(),
    queryAllOrdersForReport(),
    queryAdminOrderStats(),
    queryAdminDashboardStats(),
  ]);

  const stats = sanitizeAdminOrderStats(orderStats);

  return {
    generatedAt: new Date().toISOString(),
    adminEmail,
    summary: computeReportSummary(products, orders, stats, dashboard),
    orderStats: stats,
    dashboard,
    products,
    orders,
  };
}
