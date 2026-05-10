import { sql } from '@/lib/db';

/**
 * Single-row settings for homepage (trending product IDs, etc.)
 */
export async function ensureHomepageSettingsTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS homepage_settings (
      id INTEGER PRIMARY KEY DEFAULT 1,
      trending_product_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT homepage_settings_singleton CHECK (id = 1)
    )
  `;

  await sql`
    INSERT INTO homepage_settings (id, trending_product_ids)
    VALUES (1, '[]'::jsonb)
    ON CONFLICT (id) DO NOTHING
  `;
}
