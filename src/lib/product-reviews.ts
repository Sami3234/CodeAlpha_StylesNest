import { parseAdminLiveSince } from '@/lib/admin-live-sync';
import { sql } from '@/lib/db';
import { getShopUserProfile } from '@/lib/shop-users';
import {
  ensureProductReviewsTable,
  type ProductReviewRow,
  type ReviewStatus,
} from '@/lib/product-reviews-schema';
import { getProductCodesByIds } from '@/lib/product-code';
import { parseReviewImageUrls, validateReviewImages } from '@/lib/review-images';
import type { Order, OrderProduct } from '@/types/order';

export type PublicProductReview = {
  id: number;
  rating: number;
  title: string;
  body: string;
  images: string[];
  reviewerName: string;
  createdAt: string;
  orderId: string;
};

export type ProductReviewSummary = {
  averageRating: number;
  totalCount: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
};

export type ReviewableItem = {
  orderId: string;
  productId: number;
  productName: string;
  productCode: string;
  deliveredAt: string;
  existingReviewId: number | null;
  existingStatus: ReviewStatus | null;
};

export type AdminProductReview = {
  id: number;
  productId: number;
  productName: string | null;
  productCode: string | null;
  shopUserId: number;
  orderId: string;
  rating: number;
  title: string;
  body: string;
  images: string[];
  status: ReviewStatus;
  reviewerName: string;
  createdAt: string;
};

function mapPublicReview(row: ProductReviewRow): PublicProductReview {
  return {
    id: row.id,
    rating: row.rating,
    title: String(row.title ?? '').trim(),
    body: row.body,
    images: parseReviewImageUrls(row.images),
    reviewerName: String(row.reviewer_name ?? 'Customer').trim() || 'Customer',
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at),
    orderId: row.order_id,
  };
}

function parseOrderProducts(raw: unknown): OrderProduct[] {
  if (Array.isArray(raw)) return raw as OrderProduct[];
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as OrderProduct[];
    } catch {
      return [];
    }
  }
  return [];
}

export async function getProductReviewSummary(productId: number): Promise<ProductReviewSummary> {
  await ensureProductReviewsTable();
  const rows = await sql`
    SELECT pr.rating
    FROM product_reviews pr
    INNER JOIN orders o ON o.id = pr.order_id
    WHERE pr.product_id = ${productId} AND pr.status = 'approved'
  `;
  const distribution: ProductReviewSummary['distribution'] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;
  for (const row of rows) {
    const r = Number((row as { rating: number }).rating) as 1 | 2 | 3 | 4 | 5;
    if (r >= 1 && r <= 5) {
      distribution[r] += 1;
      sum += r;
    }
  }
  const totalCount = rows.length;
  return {
    averageRating: totalCount > 0 ? Math.round((sum / totalCount) * 10) / 10 : 0,
    totalCount,
    distribution,
  };
}

export type ProductReviewSummaryCompact = {
  averageRating: number;
  reviewCount: number;
};

/** All approved review averages in one query (shop product cards). */
export async function getProductReviewSummariesMap(): Promise<
  Map<number, ProductReviewSummaryCompact>
> {
  await ensureProductReviewsTable();
  const rows = await sql`
    SELECT
      pr.product_id,
      AVG(pr.rating)::float AS avg_rating,
      COUNT(*)::int AS review_count
    FROM product_reviews pr
    INNER JOIN orders o ON o.id = pr.order_id
    WHERE pr.status = 'approved'
    GROUP BY pr.product_id
  `;

  const map = new Map<number, ProductReviewSummaryCompact>();
  for (const row of rows) {
    const r = row as {
      product_id: number;
      avg_rating: number | string;
      review_count: number | string;
    };
    const reviewCount = Number(r.review_count);
    if (reviewCount <= 0) continue;
    map.set(Number(r.product_id), {
      averageRating: Math.round(Number(r.avg_rating) * 10) / 10,
      reviewCount,
    });
  }
  return map;
}

export function attachReviewSummariesToProducts<T extends { id: number }>(
  products: T[],
  summaries: Map<number, ProductReviewSummaryCompact>,
): (T & { reviewSummary?: ProductReviewSummaryCompact })[] {
  return products.map((product) => {
    const summary = summaries.get(Number(product.id));
    if (!summary?.reviewCount) return product;
    return { ...product, reviewSummary: summary };
  });
}

export async function listApprovedProductReviews(
  productId: number,
  limit = 50,
): Promise<PublicProductReview[]> {
  await ensureProductReviewsTable();
  const rows = await sql`
    SELECT pr.*
    FROM product_reviews pr
    INNER JOIN orders o ON o.id = pr.order_id
    WHERE pr.product_id = ${productId} AND pr.status = 'approved'
    ORDER BY pr.created_at DESC
    LIMIT ${limit}
  `;
  return (rows as ProductReviewRow[]).map(mapPublicReview);
}

async function findDeliveredOrderForUser(
  userId: number,
  orderId: string,
): Promise<Order | null> {
  const rows = await sql`
    SELECT id, customer, phone, city, address, products, total, status, date, time
    FROM orders
    WHERE id = ${orderId}
      AND status = 'delivered'
      AND shop_user_id = ${userId}
    LIMIT 1
  `;

  if (!rows.length) return null;

  const row = rows[0] as Record<string, unknown>;
  return {
    id: String(row.id),
    customer: String(row.customer),
    phone: String(row.phone),
    city: String(row.city),
    address: String(row.address),
    products: parseOrderProducts(row.products),
    total: parseFloat(String(row.total)),
    status: 'delivered',
    date: String(row.date),
    time: String(row.time),
  };
}

export function formatReviewDeliveredAt(date: string, time: string): string {
  try {
    const datePart = /^\d{4}-\d{2}-\d{2}/.test(date) ? date.slice(0, 10) : date;
    const timePart = String(time).match(/(\d{1,2}):(\d{2})/)?.[0] ?? '12:00';
    const parsed = new Date(`${datePart}T${timePart}:00`);
    if (Number.isNaN(parsed.getTime())) return datePart;
    return parsed.toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return date.slice(0, 10);
  }
}

export async function getReviewableItemsForUser(userId: number): Promise<ReviewableItem[]> {
  await ensureProductReviewsTable();

  const [orderRows, reviewRows] = await Promise.all([
    sql`
      SELECT id, products, date, time
      FROM orders
      WHERE status = 'delivered'
        AND shop_user_id = ${userId}
      ORDER BY date DESC, time DESC
      LIMIT 30
    `,
    sql`
      SELECT id, order_id, product_id, status
      FROM product_reviews
      WHERE shop_user_id = ${userId}
    `,
  ]);
  const reviewByKey = new Map<string, { id: number; status: ReviewStatus }>();
  for (const r of reviewRows) {
    const row = r as { id: number; order_id: string; product_id: number; status: ReviewStatus };
    reviewByKey.set(`${row.order_id}:${row.product_id}`, { id: row.id, status: row.status });
  }

  const items: ReviewableItem[] = [];
  const seen = new Set<string>();

  for (const row of orderRows) {
    const orderId = String((row as { id: string }).id);
    const products = parseOrderProducts((row as { products: unknown }).products);
    const date = String((row as { date: string }).date);
    const time = String((row as { time: string }).time);

    for (const p of products) {
      const productId = typeof p.productId === 'number' ? p.productId : null;
      if (!productId || productId <= 0) continue;

      const key = `${orderId}:${productId}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const existing = reviewByKey.get(key);
      items.push({
        orderId,
        productId,
        productName: p.name,
        productCode: '',
        deliveredAt: formatReviewDeliveredAt(date, time),
        existingReviewId: existing?.id ?? null,
        existingStatus: existing?.status ?? null,
      });
    }
  }

  const productIds = items.map((i) => i.productId);
  const codeMap = await getProductCodesByIds(productIds);
  for (const item of items) {
    item.productCode = codeMap.get(item.productId) ?? '';
  }

  return items;
}

export async function createProductReview(input: {
  userId: number;
  orderId: string;
  productId: number;
  rating: number;
  title?: string;
  body: string;
  images: string[];
}): Promise<{ ok: true; reviewId: number; productCode: string } | { ok: false; error: string }> {
  const rating = Math.round(input.rating);
  if (rating < 1 || rating > 5) {
    return { ok: false, error: 'Rating must be between 1 and 5 stars' };
  }

  const body = input.body.trim();
  if (body.length < 10) {
    return { ok: false, error: 'Review must be at least 10 characters' };
  }
  if (body.length > 2000) {
    return { ok: false, error: 'Review is too long (max 2000 characters)' };
  }

  const imageCheck = validateReviewImages(input.images);
  if (!imageCheck.ok) {
    return { ok: false, error: imageCheck.error };
  }

  const order = await findDeliveredOrderForUser(input.userId, input.orderId.trim());
  if (!order) {
    return {
      ok: false,
      error: 'You can only review products from delivered orders linked to your account',
    };
  }

  const line = order.products.find((p) => p.productId === input.productId);
  if (!line) {
    return { ok: false, error: 'This product was not found in that order' };
  }

  await ensureProductReviewsTable();

  const existing = await sql`
    SELECT id FROM product_reviews
    WHERE order_id = ${order.id}
      AND product_id = ${input.productId}
      AND shop_user_id = ${input.userId}
    LIMIT 1
  `;
  if (existing.length > 0) {
    return { ok: false, error: 'You already submitted a review for this item' };
  }

  const profile = await getShopUserProfile(input.userId);
  const reviewerName = profile?.fullName?.trim() || order.customer.trim() || 'Customer';
  const title = (input.title ?? '').trim().slice(0, 120);

  const inserted = await sql`
    INSERT INTO product_reviews (
      product_id,
      shop_user_id,
      order_id,
      rating,
      title,
      body,
      images,
      status,
      reviewer_name
    )
    VALUES (
      ${input.productId},
      ${input.userId},
      ${order.id},
      ${rating},
      ${title},
      ${body},
      ${JSON.stringify(imageCheck.urls)}::jsonb,
      'pending',
      ${reviewerName}
    )
    RETURNING id
  `;

  const codeMap = await getProductCodesByIds([input.productId]);
  const productCode = codeMap.get(input.productId) ?? '';

  return { ok: true, reviewId: inserted[0].id as number, productCode };
}

export async function listAdminReviews(
  statusFilter: 'all' | ReviewStatus,
): Promise<AdminProductReview[]> {
  await ensureProductReviewsTable();

  const rows =
    statusFilter === 'all'
      ? await sql`
          SELECT
            r.*,
            p.title_en AS product_title,
            p.product_meta->>'sku' AS product_code
          FROM product_reviews r
          LEFT JOIN products p ON p.id = r.product_id
          ORDER BY r.created_at DESC
          LIMIT 500
        `
      : await sql`
          SELECT
            r.*,
            p.title_en AS product_title,
            p.product_meta->>'sku' AS product_code
          FROM product_reviews r
          LEFT JOIN products p ON p.id = r.product_id
          WHERE r.status = ${statusFilter}
          ORDER BY r.created_at DESC
          LIMIT 500
        `;

  return rows.map((row: Record<string, unknown>) => {
    const r = row as ProductReviewRow & {
      product_title?: string | null;
      product_code?: string | null;
    };
    const code = r.product_code?.trim();
    return {
      id: r.id,
      productId: r.product_id,
      productName: r.product_title ?? null,
      productCode: code ? code.toUpperCase() : null,
      shopUserId: r.shop_user_id,
      orderId: r.order_id,
      rating: r.rating,
      title: String(r.title ?? '').trim(),
      body: r.body,
      images: parseReviewImageUrls(r.images),
      status: r.status,
      reviewerName: String(r.reviewer_name ?? 'Customer').trim() || 'Customer',
      createdAt:
        r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
    };
  });
}

export async function setReviewStatus(
  reviewId: number,
  status: ReviewStatus,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (status !== 'approved' && status !== 'rejected' && status !== 'pending') {
    return { ok: false, error: 'Invalid status' };
  }

  await ensureProductReviewsTable();
  const rows = await sql`
    UPDATE product_reviews
    SET status = ${status}, updated_at = CURRENT_TIMESTAMP
    WHERE id = ${reviewId}
    RETURNING id
  `;
  if (!rows.length) return { ok: false, error: 'Review not found' };
  return { ok: true };
}

export async function deleteProductReview(
  reviewId: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await ensureProductReviewsTable();
  const rows = await sql`DELETE FROM product_reviews WHERE id = ${reviewId} RETURNING id`;
  if (!rows.length) return { ok: false, error: 'Review not found' };
  return { ok: true };
}

export async function countPendingReviews(): Promise<number> {
  await ensureProductReviewsTable();
  const rows = await sql`
    SELECT COUNT(*)::int AS c FROM product_reviews WHERE status = 'pending'
  `;
  return Number(rows[0]?.c ?? 0);
}

export async function countProductReviews(): Promise<number> {
  await ensureProductReviewsTable();
  const rows = await sql`SELECT COUNT(*)::int AS c FROM product_reviews`;
  return Number((rows[0] as { c?: number })?.c ?? 0);
}

export async function countApprovedReviews(): Promise<number> {
  await ensureProductReviewsTable();
  const rows = await sql`
    SELECT COUNT(*)::int AS c FROM product_reviews WHERE status = 'approved'
  `;
  return Number((rows[0] as { c?: number })?.c ?? 0);
}

export type AdminReviewAlert = {
  id: number;
  productId: number;
  productName: string | null;
  reviewerName: string;
  rating: number;
  orderId: string;
  createdAt: string;
};

export async function listNewPendingReviewsSince(
  since: string | null,
): Promise<AdminReviewAlert[]> {
  await ensureProductReviewsTable();

  const sinceAt = parseAdminLiveSince(since);

  const rows = sinceAt
    ? await sql`
        SELECT
          r.id,
          r.product_id,
          r.order_id,
          r.rating,
          r.reviewer_name,
          r.created_at,
          p.title_en AS product_title
        FROM product_reviews r
        LEFT JOIN products p ON p.id = r.product_id
        WHERE r.status = 'pending'
          AND r.created_at > ${sinceAt}
        ORDER BY r.created_at DESC
        LIMIT 50
      `
    : await sql`
        SELECT
          r.id,
          r.product_id,
          r.order_id,
          r.rating,
          r.reviewer_name,
          r.created_at,
          p.title_en AS product_title
        FROM product_reviews r
        LEFT JOIN products p ON p.id = r.product_id
        WHERE r.status = 'pending'
        ORDER BY r.created_at DESC
        LIMIT 20
      `;

  return rows.map((row: Record<string, unknown>) => {
    const r = row as {
      id: number;
      product_id: number;
      order_id: string;
      rating: number;
      reviewer_name: string | null;
      created_at: string | Date;
      product_title?: string | null;
    };
    return {
      id: r.id,
      productId: r.product_id,
      productName: r.product_title ?? null,
      reviewerName: String(r.reviewer_name ?? 'Customer').trim() || 'Customer',
      rating: r.rating,
      orderId: r.order_id,
      createdAt:
        r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
    };
  });
}

/** Remove all reviews tied to an order (e.g. when admin deletes the order). */
export async function deleteReviewsForOrder(orderId: string): Promise<void> {
  await ensureProductReviewsTable();
  await sql`DELETE FROM product_reviews WHERE order_id = ${orderId.trim()}`;
}
