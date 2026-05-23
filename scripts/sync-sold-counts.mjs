/**
 * Rebuild products.sold_count from non-cancelled orders.
 * Usage: node scripts/sync-sold-counts.mjs
 */
import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';

config({ path: '.env.local' });
config({ path: '.env' });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const sql = neon(url);

function isCancelled(status) {
  return String(status ?? '').trim().toLowerCase() === 'cancelled';
}

function parseProducts(raw) {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const p = JSON.parse(raw);
      return Array.isArray(p) ? p : [];
    } catch {
      return [];
    }
  }
  return [];
}

const orderRows = await sql`SELECT status, products FROM orders`;
const totals = new Map();

for (const row of orderRows) {
  if (isCancelled(row.status)) continue;
  for (const line of parseProducts(row.products)) {
    const id = Math.floor(Number(line.productId));
    const qty = Math.floor(Number(line.quantity));
    if (id < 1 || qty < 1) continue;
    totals.set(id, (totals.get(id) ?? 0) + qty);
  }
}

const products = await sql`SELECT id FROM products`;
for (const p of products) {
  const count = totals.get(p.id) ?? 0;
  await sql`UPDATE products SET sold_count = ${count}, updated_at = CURRENT_TIMESTAMP WHERE id = ${p.id}`;
}

console.log(`Synced sold_count for ${products.length} products from ${orderRows.length} orders.`);
