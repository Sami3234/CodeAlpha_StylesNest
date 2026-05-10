const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
require('dotenv').config({ path: path.join(__dirname, '../.env') });

/**
 * Database Migration via JSON File
 * 
 * Step 1: Export data from old database to JSON file
 * Step 2: Import data from JSON file to new database
 * 
 * Usage:
 *   node scripts/migrate-via-json.js export    - Export old DB to JSON
 *   node scripts/migrate-via-json.js import     - Import JSON to new DB
 *   node scripts/migrate-via-json.js migrate   - Do both (export + import)
 */

const JSON_FILE = path.join(__dirname, '../database-backup.json');

async function exportToJson() {
  try {
    const oldDatabaseUrl = process.env.OLD_DATABASE_URL;
    
    if (!oldDatabaseUrl) {
      console.error('❌ OLD_DATABASE_URL environment variable is not set');
      process.exit(1);
    }

    console.log('📤 Exporting data from old database...');
    const oldSql = neon(oldDatabaseUrl, { fetchOptions: { cache: 'no-store' } });

    const data = {
      exported_at: new Date().toISOString(),
      products: [],
      orders: [],
      abandoned_orders: [],
      admin: [],
      contact_settings: null,
      landing_images: []
    };

    // Export Products
    console.log('📦 Exporting products...');
    const products = await oldSql`SELECT * FROM products ORDER BY id`;
    data.products = products;
    console.log(`   ✅ Exported ${products.length} products`);

    // Export Orders
    console.log('📋 Exporting orders...');
    const orders = await oldSql`SELECT * FROM orders ORDER BY created_at`;
    data.orders = orders;
    console.log(`   ✅ Exported ${orders.length} orders`);

    // Export Abandoned Orders
    console.log('🛒 Exporting abandoned orders...');
    const abandoned = await oldSql`SELECT * FROM abandoned_orders ORDER BY created_at`;
    data.abandoned_orders = abandoned;
    console.log(`   ✅ Exported ${abandoned.length} abandoned orders`);

    // Export Admin
    console.log('👤 Exporting admin users...');
    const admins = await oldSql`SELECT * FROM admin ORDER BY id`;
    data.admin = admins;
    console.log(`   ✅ Exported ${admins.length} admin users`);

    // Export Contact Settings
    console.log('📞 Exporting contact settings...');
    const contact = await oldSql`SELECT * FROM contact_settings LIMIT 1`;
    if (contact && contact.length > 0) {
      data.contact_settings = contact[0];
      console.log('   ✅ Exported contact settings');
    } else {
      console.log('   ⚠️  No contact settings found');
    }

    // Export Landing Images
    console.log('🖼️  Exporting landing images...');
    const images = await oldSql`SELECT * FROM landing_images ORDER BY id`;
    data.landing_images = images;
    console.log(`   ✅ Exported ${images.length} landing images`);

    // Save to JSON file
    fs.writeFileSync(JSON_FILE, JSON.stringify(data, null, 2), 'utf8');
    
    const totalRecords = 
      data.products.length + 
      data.orders.length + 
      data.abandoned_orders.length + 
      data.admin.length + 
      (data.contact_settings ? 1 : 0) + 
      data.landing_images.length;

    console.log(`\n✅ Export completed!`);
    console.log(`📊 Total records: ${totalRecords}`);
    console.log(`📁 File saved: ${JSON_FILE}`);
    
    return data;
  } catch (error) {
    console.error('❌ Export failed:', error);
    throw error;
  }
}

async function importFromJson() {
  try {
    const newDatabaseUrl = process.env.DATABASE_URL;
    
    if (!newDatabaseUrl) {
      console.error('❌ DATABASE_URL environment variable is not set');
      process.exit(1);
    }

    if (!fs.existsSync(JSON_FILE)) {
      console.error(`❌ JSON file not found: ${JSON_FILE}`);
      console.error('   Run "export" first to create the backup file');
      process.exit(1);
    }

    console.log('📥 Importing data to new database...');
    const newSql = neon(newDatabaseUrl, { fetchOptions: { cache: 'no-store' } });

    // Read JSON file
    const jsonData = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'));
    console.log(`📁 Loaded backup from: ${jsonData.exported_at || 'unknown date'}`);

    const results = {
      products: { migrated: 0, errors: 0 },
      orders: { migrated: 0, errors: 0 },
      abandoned_orders: { migrated: 0, errors: 0 },
      admin: { migrated: 0, errors: 0 },
      contact_settings: { migrated: 0, errors: 0 },
      landing_images: { migrated: 0, errors: 0 }
    };

    // Import Products
    if (jsonData.products && jsonData.products.length > 0) {
      console.log(`\n📦 Importing ${jsonData.products.length} products...`);
      for (const product of jsonData.products) {
        try {
          await newSql`
            INSERT INTO products (
              id, title_en, title_ar, description_en, description_ar,
              current_price, original_price, discount, image, images,
              free_delivery, sold_count, category, features_en, features_ar,
              pricing_tiers, status, created_at, updated_at
            )
            VALUES (
              ${product.id}, ${product.title_en}, ${product.title_ar},
              ${product.description_en}, ${product.description_ar},
              ${product.current_price}, ${product.original_price}, ${product.discount},
              ${product.image}, ${JSON.stringify(product.images || [])}::jsonb,
              ${product.free_delivery}, ${product.sold_count}, ${product.category},
              ${JSON.stringify(product.features_en || [])}::jsonb,
              ${JSON.stringify(product.features_ar || [])}::jsonb,
              ${JSON.stringify(product.pricing_tiers || [])}::jsonb,
              ${product.status || 'active'},
              ${product.created_at}, ${product.updated_at}
            )
            ON CONFLICT (id) DO UPDATE SET
              title_en = EXCLUDED.title_en,
              title_ar = EXCLUDED.title_ar,
              description_en = EXCLUDED.description_en,
              description_ar = EXCLUDED.description_ar,
              current_price = EXCLUDED.current_price,
              original_price = EXCLUDED.original_price,
              discount = EXCLUDED.discount,
              image = EXCLUDED.image,
              images = EXCLUDED.images,
              free_delivery = EXCLUDED.free_delivery,
              sold_count = EXCLUDED.sold_count,
              category = EXCLUDED.category,
              features_en = EXCLUDED.features_en,
              features_ar = EXCLUDED.features_ar,
              pricing_tiers = EXCLUDED.pricing_tiers,
              status = EXCLUDED.status,
              updated_at = CURRENT_TIMESTAMP
          `;
          results.products.migrated++;
        } catch (error) {
          console.error(`   ❌ Error importing product ${product.id}:`, error.message);
          results.products.errors++;
        }
      }
      console.log(`   ✅ Products: ${results.products.migrated} migrated, ${results.products.errors} errors`);
    }

    // Import Orders
    if (jsonData.orders && jsonData.orders.length > 0) {
      console.log(`\n📋 Importing ${jsonData.orders.length} orders...`);
      for (const order of jsonData.orders) {
        try {
          await newSql`
            INSERT INTO orders (
              id, customer, phone, city, address, products,
              total, status, date, time, created_at, updated_at
            )
            VALUES (
              ${order.id}, ${order.customer}, ${order.phone},
              ${order.city}, ${order.address}, ${JSON.stringify(order.products)}::jsonb,
              ${order.total}, ${order.status || 'pending'},
              ${order.date}::date, ${order.time}::time,
              ${order.created_at}, ${order.updated_at}
            )
            ON CONFLICT (id) DO UPDATE SET
              customer = EXCLUDED.customer,
              phone = EXCLUDED.phone,
              city = EXCLUDED.city,
              address = EXCLUDED.address,
              products = EXCLUDED.products,
              total = EXCLUDED.total,
              status = EXCLUDED.status,
              date = EXCLUDED.date,
              time = EXCLUDED.time,
              updated_at = CURRENT_TIMESTAMP
          `;
          results.orders.migrated++;
        } catch (error) {
          console.error(`   ❌ Error importing order ${order.id}:`, error.message);
          results.orders.errors++;
        }
      }
      console.log(`   ✅ Orders: ${results.orders.migrated} migrated, ${results.orders.errors} errors`);
    }

    // Import Abandoned Orders
    if (jsonData.abandoned_orders && jsonData.abandoned_orders.length > 0) {
      console.log(`\n🛒 Importing ${jsonData.abandoned_orders.length} abandoned orders...`);
      for (const abandoned of jsonData.abandoned_orders) {
        try {
          await newSql`
            INSERT INTO abandoned_orders (
              id, name, phone, city, address, quantity,
              product_id, status, created_at, updated_at
            )
            VALUES (
              ${abandoned.id}, ${abandoned.name}, ${abandoned.phone},
              ${abandoned.city || null}, ${abandoned.address || null},
              ${abandoned.quantity || null}, ${abandoned.product_id || null},
              ${abandoned.status || 'unsubmitted'},
              ${abandoned.created_at}, ${abandoned.updated_at}
            )
            ON CONFLICT (id) DO UPDATE SET
              name = EXCLUDED.name,
              phone = EXCLUDED.phone,
              city = EXCLUDED.city,
              address = EXCLUDED.address,
              quantity = EXCLUDED.quantity,
              product_id = EXCLUDED.product_id,
              status = EXCLUDED.status,
              updated_at = CURRENT_TIMESTAMP
          `;
          results.abandoned_orders.migrated++;
        } catch (error) {
          console.error(`   ❌ Error importing abandoned order ${abandoned.id}:`, error.message);
          results.abandoned_orders.errors++;
        }
      }
      console.log(`   ✅ Abandoned Orders: ${results.abandoned_orders.migrated} migrated, ${results.abandoned_orders.errors} errors`);
    }

    // Import Admin
    if (jsonData.admin && jsonData.admin.length > 0) {
      console.log(`\n👤 Importing ${jsonData.admin.length} admin users...`);
      for (const admin of jsonData.admin) {
        try {
          await newSql`
            INSERT INTO admin (id, email, password, created_at, updated_at)
            VALUES (
              ${admin.id}, ${admin.email}, ${admin.password},
              ${admin.created_at}, ${admin.updated_at}
            )
            ON CONFLICT (id) DO UPDATE SET
              email = EXCLUDED.email,
              password = EXCLUDED.password,
              updated_at = CURRENT_TIMESTAMP
          `;
          results.admin.migrated++;
        } catch (error) {
          console.error(`   ❌ Error importing admin ${admin.id}:`, error.message);
          results.admin.errors++;
        }
      }
      console.log(`   ✅ Admin: ${results.admin.migrated} migrated, ${results.admin.errors} errors`);
    }

    // Import Contact Settings
    if (jsonData.contact_settings) {
      console.log(`\n📞 Importing contact settings...`);
      try {
        const contact = jsonData.contact_settings;
        await newSql`
          INSERT INTO contact_settings (
            id, whatsapp, phone, email, address, created_at, updated_at
          )
          VALUES (
            ${contact.id}, ${contact.whatsapp}, ${contact.phone || null},
            ${contact.email || null}, ${contact.address || null},
            ${contact.created_at}, ${contact.updated_at}
          )
          ON CONFLICT (id) DO UPDATE SET
            whatsapp = EXCLUDED.whatsapp,
            phone = EXCLUDED.phone,
            email = EXCLUDED.email,
            address = EXCLUDED.address,
            updated_at = CURRENT_TIMESTAMP
        `;
        results.contact_settings.migrated = 1;
        console.log('   ✅ Contact settings migrated');
      } catch (error) {
        console.error('   ❌ Error importing contact settings:', error.message);
        results.contact_settings.errors = 1;
      }
    }

    // Import Landing Images
    if (jsonData.landing_images && jsonData.landing_images.length > 0) {
      console.log(`\n🖼️  Importing ${jsonData.landing_images.length} landing images...`);
      for (const image of jsonData.landing_images) {
        try {
          await newSql`
            INSERT INTO landing_images (
              id, section, image_type, image_url, cloudinary_public_id,
              display_order, is_active, created_at, updated_at
            )
            VALUES (
              ${image.id}, ${image.section}, ${image.image_type},
              ${image.image_url}, ${image.cloudinary_public_id || null},
              ${image.display_order || 0}, ${image.is_active !== false},
              ${image.created_at}, ${image.updated_at}
            )
            ON CONFLICT (id) DO UPDATE SET
              section = EXCLUDED.section,
              image_type = EXCLUDED.image_type,
              image_url = EXCLUDED.image_url,
              cloudinary_public_id = EXCLUDED.cloudinary_public_id,
              display_order = EXCLUDED.display_order,
              is_active = EXCLUDED.is_active,
              updated_at = CURRENT_TIMESTAMP
          `;
          results.landing_images.migrated++;
        } catch (error) {
          console.error(`   ❌ Error importing landing image ${image.id}:`, error.message);
          results.landing_images.errors++;
        }
      }
      console.log(`   ✅ Landing Images: ${results.landing_images.migrated} migrated, ${results.landing_images.errors} errors`);
    }

    // Summary
    const totalMigrated = Object.values(results).reduce((sum, r) => sum + r.migrated, 0);
    const totalErrors = Object.values(results).reduce((sum, r) => sum + r.errors, 0);

    console.log(`\n🎉 Import completed!`);
    console.log(`📊 Total: ${totalMigrated} records migrated, ${totalErrors} errors`);
    
    return results;
  } catch (error) {
    console.error('❌ Import failed:', error);
    throw error;
  }
}

async function migrate() {
  try {
    console.log('🔄 Starting full migration (export + import)...\n');
    
    // Step 1: Export
    await exportToJson();
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Step 2: Import
    await importFromJson();
    
    console.log('\n✅ Migration completed successfully!');
    console.log(`\n💡 Note: Backup file saved at ${JSON_FILE}`);
    console.log('   You can delete it after verifying the migration.');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Main
const command = process.argv[2] || 'migrate';

if (command === 'export') {
  exportToJson().catch(() => process.exit(1));
} else if (command === 'import') {
  importFromJson().catch(() => process.exit(1));
} else if (command === 'migrate') {
  migrate();
} else {
  console.log('Usage:');
  console.log('  node scripts/migrate-via-json.js export   - Export old DB to JSON');
  console.log('  node scripts/migrate-via-json.js import    - Import JSON to new DB');
  console.log('  node scripts/migrate-via-json.js migrate  - Do both (export + import)');
  process.exit(1);
}
