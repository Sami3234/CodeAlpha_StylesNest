import { sql } from '@/lib/db';

let ready: Promise<void> | null = null;

/** Adds admin workflow columns (notes, tracking) if missing. */
export async function ensureOrdersAdminColumns(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT ''`;
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_id TEXT DEFAULT ''`;
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`;
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`;
      await sql`
        UPDATE orders
        SET created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
            updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP)
        WHERE created_at IS NULL OR updated_at IS NULL
      `;
    })();
  }
  await ready;
}
