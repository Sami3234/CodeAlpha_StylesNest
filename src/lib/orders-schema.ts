import { sql } from '@/lib/db';

let ready: Promise<void> | null = null;

/** Adds admin workflow columns (notes, tracking) if missing. */
export async function ensureOrdersAdminColumns(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT ''`;
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_id TEXT DEFAULT ''`;
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_fee DECIMAL(10,2) DEFAULT 0`;
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS shop_user_id INTEGER`;
      await sql`CREATE INDEX IF NOT EXISTS orders_shop_user_id_idx ON orders (shop_user_id)`;
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method_type TEXT DEFAULT ''`;
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method_label TEXT DEFAULT ''`;
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'awaiting_payment'`;
      await sql`CREATE INDEX IF NOT EXISTS orders_payment_method_type_idx ON orders (payment_method_type)`;
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
