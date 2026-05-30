import { sql } from '@/lib/db';

let schemaReady: Promise<void> | null = null;

async function runProductSchemaMigrations(): Promise<void> {
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
    ADD COLUMN IF NOT EXISTS shoes_options JSONB DEFAULT NULL
  `;
  await sql`
    ALTER TABLE products
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'
  `;
  await sql`
    ALTER TABLE products
    ADD COLUMN IF NOT EXISTS product_meta JSONB DEFAULT '{}'
  `;
  await sql`
    ALTER TABLE products
    ADD COLUMN IF NOT EXISTS delivery_charge DECIMAL(10,2) DEFAULT 0
  `;

  await sql`
    UPDATE products
    SET status = 'active'
    WHERE status IS NULL OR TRIM(status) = ''
  `;
}

/**
 * Ensures optional product columns exist (safe for existing Neon DBs).
 * Runs once per server process — not on every API request.
 */
export function ensureProductSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = runProductSchemaMigrations().catch((err) => {
      schemaReady = null;
      throw err;
    });
  }
  return schemaReady;
}
