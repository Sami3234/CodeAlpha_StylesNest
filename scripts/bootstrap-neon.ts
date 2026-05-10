/**
 * One-shot: load .env FIRST, then create tables + default contact row, seed products if empty.
 * Run from repo root:  npm run db:bootstrap
 */
import path from 'path';
import { config } from 'dotenv';

config({ path: path.resolve(process.cwd(), '.env') });

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL missing in .env');
    process.exit(1);
  }

  const { initDatabase } = await import('../src/lib/init-db');
  const { sql } = await import('../src/lib/db');
  const { products: initialProducts } = await import('../src/data/products');

  console.log('Running initDatabase()...');
  await initDatabase();

  const rows = (await sql`SELECT COUNT(*)::int as count FROM products`) as {
    count: number;
  }[];
  const count = Number(rows[0]?.count ?? 0);

  if (count > 0) {
    console.log(`Products already present (${count}), skip seed.`);
  } else {
    let migrated = 0;
    for (const product of initialProducts) {
      try {
        await sql`
          INSERT INTO products (
            id,
            title_en,
            title_ar,
            description_en,
            description_ar,
            current_price,
            original_price,
            discount,
            image,
            images,
            free_delivery,
            sold_count,
            category,
            features_en,
            features_ar,
            status
          )
          VALUES (
            ${product.id},
            ${product.title.en},
            ${product.title.ar},
            ${product.description.en},
            ${product.description.ar},
            ${product.currentPrice},
            ${product.originalPrice},
            ${product.discount},
            ${product.image},
            ${JSON.stringify(product.images || [])},
            ${product.freeDelivery},
            ${product.soldCount},
            ${product.category},
            ${JSON.stringify(product.features?.en || [])},
            ${JSON.stringify(product.features?.ar || [])},
            ${product.status || 'active'}
          )
        `;
        migrated++;
      } catch (e) {
        console.error(`Product ${product.id}:`, e);
      }
    }

    try {
      await sql`
        SELECT setval(
          pg_get_serial_sequence('products', 'id'),
          COALESCE((SELECT MAX(id) FROM products), 1)
        )
      `;
    } catch (e) {
      console.warn('setval skipped:', e);
    }

    console.log(`Seeded ${migrated} products.`);
  }

  console.log('Done. Create admin: POST /api/admin/setup with email + password (once).');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
