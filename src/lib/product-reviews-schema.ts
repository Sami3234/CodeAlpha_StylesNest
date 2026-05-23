import { sql } from '@/lib/db';

export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export type ProductReviewRow = {
  id: number;
  product_id: number;
  shop_user_id: number;
  order_id: string;
  rating: number;
  title: string | null;
  body: string;
  images: unknown;
  status: ReviewStatus;
  reviewer_name: string | null;
  created_at: string | Date;
  updated_at: string | Date;
};

export const REVIEW_IMAGE_MIN = 1;
export const REVIEW_IMAGE_MAX = 3;

let ready: Promise<void> | null = null;

export async function ensureProductReviewsTable(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS product_reviews (
          id SERIAL PRIMARY KEY,
          product_id INTEGER NOT NULL,
          shop_user_id INTEGER NOT NULL,
          order_id TEXT NOT NULL,
          rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
          title TEXT DEFAULT '',
          body TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          reviewer_name TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE (order_id, product_id, shop_user_id)
        )
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS idx_product_reviews_product_status
        ON product_reviews (product_id, status)
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS idx_product_reviews_status_created
        ON product_reviews (status, created_at DESC)
      `;
      await sql`
        ALTER TABLE product_reviews
        ADD COLUMN IF NOT EXISTS images JSONB NOT NULL DEFAULT '[]'::jsonb
      `;
    })().catch((error) => {
      ready = null;
      throw error;
    });
  }
  await ready;
}
