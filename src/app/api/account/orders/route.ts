import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { sql } from '@/lib/db';
import { getShopUserProfile } from '@/lib/shop-users';
import { normalizePhoneDigits } from '@/lib/phone-normalize';
import { apiErrorResponse } from '@/lib/safe-errors';
import type { Order, OrderProduct } from '@/types/order';

export const dynamic = 'force-dynamic';

function parseUserId(sessionUserId: string | undefined): number | null {
  if (!sessionUserId) return null;
  const id = Number(sessionUserId);
  return Number.isFinite(id) && id > 0 ? id : null;
}

function toDateString(value: unknown): string {
  if (value == null || value === '') return '';
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  const s = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const parsed = new Date(s);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return '';
}

function toTimeString(value: unknown): string {
  if (value == null || value === '') return '00:00';
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toTimeString().slice(0, 5);
  }
  const s = String(value).trim();
  const match = s.match(/(\d{1,2}):(\d{2})/);
  if (match) {
    return `${match[1].padStart(2, '0')}:${match[2]}`;
  }
  return '00:00';
}

function mapRow(row: Record<string, unknown>): Order {
  const products = row.products;
  const parsedProducts: OrderProduct[] = Array.isArray(products)
    ? (products as OrderProduct[])
    : typeof products === 'string'
      ? (JSON.parse(products) as OrderProduct[])
      : [];

  let date = toDateString(row.date);
  let time = toTimeString(row.time);
  if (!date && row.created_at) {
    date = toDateString(row.created_at);
    time = toTimeString(row.created_at);
  }

  return {
    id: String(row.id),
    customer: String(row.customer),
    phone: String(row.phone),
    city: String(row.city),
    address: String(row.address),
    products: parsedProducts,
    total: parseFloat(String(row.total)),
    status: row.status as Order['status'],
    date,
    time,
  };
}

/** Customer's own orders only (matched by profile phone). */
export async function GET() {
  try {
    const session = await auth();
    const userId = parseUserId(session?.user?.id);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await getShopUserProfile(userId);
    if (!profile?.phone?.trim()) {
      return NextResponse.json({
        orders: [],
        needsPhone: true,
        message: 'Add your WhatsApp number in delivery details to see your orders.',
      });
    }

    const needle = normalizePhoneDigits(profile.phone);
    if (needle.length < 10) {
      return NextResponse.json({
        orders: [],
        needsPhone: true,
        message: 'Please save a valid mobile number to track orders.',
      });
    }

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
        created_at
      FROM orders
      WHERE RIGHT(regexp_replace(phone, '[^0-9]', '', 'g'), 10) = ${needle}
      ORDER BY date DESC, time DESC
      LIMIT 100
    `;

    const orders = rows.map((row) => mapRow(row as Record<string, unknown>));

    return NextResponse.json({ orders, needsPhone: false });
  } catch (error) {
    return apiErrorResponse({ message: 'Failed to load your orders', status: 500, cause: error });
  }
}
