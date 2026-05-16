import { sql } from '@/lib/db';

/**
 * Ensures optional product columns exist (safe for existing Neon DBs).
 * Called before product reads/writes so API does not fail on missing columns.
 */
export async function ensureProductSchema(): Promise<void> {
  await sql`
    ALTER TABLE products
    ADD COLUMN IF NOT EXISTS pricing_tiers JSONB DEFAULT '[]'
  `;
  await sql`
    ALTER TABLE products
    ADD COLUMN IF NOT EXISTS clothes_options JSONB DEFAULT NULL
  `;
  await sql`
    ALTER TABLE products
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'
  `;
  await sql`
    ALTER TABLE products
    ADD COLUMN IF NOT EXISTS product_meta JSONB DEFAULT '{}'
  `;

  /** Legacy rows: empty/null status should behave as active on the storefront */
  await sql`
    UPDATE products
    SET status = 'active'
    WHERE status IS NULL OR TRIM(status) = ''
  `;
}
