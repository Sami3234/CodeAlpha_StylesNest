import type { Order, OrderProduct } from '@/types/order';
import {
  getCurrentTimeInTimezone,
  getTodayDateInTimezone,
  normalizeOrderDateKey,
} from '@/lib/order-date';

export function normalizeOrderDate(raw: unknown): string {
  const key = normalizeOrderDateKey(raw);
  return key || getTodayDateInTimezone();
}

export function normalizeOrderTime(raw: unknown): string {
  if (raw == null || String(raw).trim() === '') {
    return getCurrentTimeInTimezone();
  }
  if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
    return raw.toTimeString().slice(0, 8);
  }
  const s = String(raw ?? '').trim();
  const match = s.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!match) return '12:00:00';
  const h = match[1].padStart(2, '0');
  const m = match[2];
  const sec = match[3] ?? '00';
  return `${h}:${m}:${sec}`;
}

export function parseOrderProducts(raw: unknown): OrderProduct[] {
  if (Array.isArray(raw)) return raw as OrderProduct[];
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed) ? (parsed as OrderProduct[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function productsToJsonb(products: OrderProduct[]): string {
  return JSON.stringify(products);
}

const ORDER_STATUSES = new Set([
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
]);

export function normalizeOrderStatus(raw: unknown): Order['status'] {
  const s = String(raw ?? 'pending').trim().toLowerCase();
  return ORDER_STATUSES.has(s) ? (s as Order['status']) : 'pending';
}

export type NormalizedOrderRow = {
  customer: string;
  phone: string;
  city: string;
  address: string;
  products: OrderProduct[];
  productsJson: string;
  total: number;
  status: Order['status'];
  date: string;
  time: string;
  notes: string;
  trackingId: string;
};

export function normalizeOrderPayload(input: {
  customer?: unknown;
  phone?: unknown;
  city?: unknown;
  address?: unknown;
  products?: unknown;
  total?: unknown;
  status?: unknown;
  date?: unknown;
  time?: unknown;
  notes?: unknown;
  trackingId?: unknown;
  tracking_id?: unknown;
}): NormalizedOrderRow {
  const products = parseOrderProducts(input.products);
  const totalRaw = Number(input.total);
  const computedTotal = products.reduce(
    (sum, p) => sum + (Number(p.lineTotal) || Number(p.price) * Number(p.quantity) || 0),
    0,
  );

  return {
    customer: String(input.customer ?? '').trim(),
    phone: String(input.phone ?? '').trim(),
    city: String(input.city ?? '').trim(),
    address: String(input.address ?? '').trim(),
    products,
    productsJson: productsToJsonb(products),
    total: Number.isFinite(totalRaw) && totalRaw >= 0 ? totalRaw : computedTotal,
    status: normalizeOrderStatus(input.status),
    date: normalizeOrderDate(input.date),
    time: normalizeOrderTime(input.time),
    notes: String(input.notes ?? '').trim(),
    trackingId: String(input.trackingId ?? input.tracking_id ?? '').trim(),
  };
}
