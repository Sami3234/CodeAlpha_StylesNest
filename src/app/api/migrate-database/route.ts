import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';

/**
 * API endpoint to migrate data from old database to new database
 * Uses OLD_DATABASE_URL for source and current DATABASE_URL for destination
 * 
 * Usage: POST /api/migrate-database
 */
export async function POST() {
  try {
    const oldDatabaseUrl = process.env.OLD_DATABASE_URL;
    const newDatabaseUrl = process.env.DATABASE_URL;

    if (!oldDatabaseUrl) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'OLD_DATABASE_URL environment variable is not set. Please add it to .env.local' 
        },
        { status: 400 }
      );
    }

    if (!newDatabaseUrl) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'DATABASE_URL environment variable is not set' 
        },
        { status: 400 }
      );
    }

    console.log('🔄 Starting database migration...');
    console.log('📤 Source: Old Database');
    console.log('📥 Destination: New Database');

    // Create connections
    const oldSql = neon(oldDatabaseUrl, {
      fetchOptions: { cache: 'no-store' }
    });
    
    const newSql = neon(newDatabaseUrl, {
      fetchOptions: { cache: 'no-store' }
    });

    const results: Record<string, { migrated: number; errors: number }> = {};

    // 1. Migrate Products
    try {
      console.log('\n📦 Migrating products...');
      const oldProducts = await oldSql`SELECT * FROM products ORDER BY id`;
      let migrated = 0;
      let errors = 0;

      for (const product of oldProducts) {
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
          migrated++;
        } catch (error) {
          console.error(`Error migrating product ${product.id}:`, error);
          errors++;
        }
      }
      results.products = { migrated, errors };
      console.log(`✅ Products: ${migrated} migrated, ${errors} errors`);
    } catch (error) {
      console.error('Error migrating products:', error);
      results.products = { migrated: 0, errors: 1 };
    }

    // 2. Migrate Orders
    try {
      console.log('\n📋 Migrating orders...');
      const oldOrders = await oldSql`SELECT * FROM orders ORDER BY created_at`;
      let migrated = 0;
      let errors = 0;

      for (const order of oldOrders) {
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
          migrated++;
        } catch (error) {
          console.error(`Error migrating order ${order.id}:`, error);
          errors++;
        }
      }
      results.orders = { migrated, errors };
      console.log(`✅ Orders: ${migrated} migrated, ${errors} errors`);
    } catch (error) {
      console.error('Error migrating orders:', error);
      results.orders = { migrated: 0, errors: 1 };
    }

    // 3. Migrate Abandoned Orders
    try {
      console.log('\n🛒 Migrating abandoned orders...');
      const oldAbandoned = await oldSql`SELECT * FROM abandoned_orders ORDER BY created_at`;
      let migrated = 0;
      let errors = 0;

      for (const abandoned of oldAbandoned) {
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
          migrated++;
        } catch (error) {
          console.error(`Error migrating abandoned order ${abandoned.id}:`, error);
          errors++;
        }
      }
      results.abandoned_orders = { migrated, errors };
      console.log(`✅ Abandoned Orders: ${migrated} migrated, ${errors} errors`);
    } catch (error) {
      console.error('Error migrating abandoned orders:', error);
      results.abandoned_orders = { migrated: 0, errors: 1 };
    }

    // 4. Migrate Admin
    try {
      console.log('\n👤 Migrating admin users...');
      const oldAdmins = await oldSql`SELECT * FROM admin ORDER BY id`;
      let migrated = 0;
      let errors = 0;

      for (const admin of oldAdmins) {
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
          migrated++;
        } catch (error) {
          console.error(`Error migrating admin ${admin.id}:`, error);
          errors++;
        }
      }
      results.admin = { migrated, errors };
      console.log(`✅ Admin: ${migrated} migrated, ${errors} errors`);
    } catch (error) {
      console.error('Error migrating admin:', error);
      results.admin = { migrated: 0, errors: 1 };
    }

    // 5. Migrate Contact Settings
    try {
      console.log('\n📞 Migrating contact settings...');
      const oldContact = await oldSql`SELECT * FROM contact_settings LIMIT 1`;
      let migrated = 0;
      let errors = 0;

      if (oldContact && oldContact.length > 0) {
        try {
          const contact = oldContact[0];
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
          migrated++;
        } catch (error) {
          console.error('Error migrating contact settings:', error);
          errors++;
        }
      }
      results.contact_settings = { migrated, errors };
      console.log(`✅ Contact Settings: ${migrated} migrated, ${errors} errors`);
    } catch (error) {
      console.error('Error migrating contact settings:', error);
      results.contact_settings = { migrated: 0, errors: 1 };
    }

    // 6. Migrate Landing Images
    try {
      console.log('\n🖼️  Migrating landing images...');
      const oldImages = await oldSql`SELECT * FROM landing_images ORDER BY id`;
      let migrated = 0;
      let errors = 0;

      for (const image of oldImages) {
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
          migrated++;
        } catch (error) {
          console.error(`Error migrating landing image ${image.id}:`, error);
          errors++;
        }
      }
      results.landing_images = { migrated, errors };
      console.log(`✅ Landing Images: ${migrated} migrated, ${errors} errors`);
    } catch (error) {
      console.error('Error migrating landing images:', error);
      results.landing_images = { migrated: 0, errors: 1 };
    }

    // Calculate totals
    const totalMigrated = Object.values(results).reduce((sum, r) => sum + r.migrated, 0);
    const totalErrors = Object.values(results).reduce((sum, r) => sum + r.errors, 0);

    console.log('\n🎉 Migration completed!');
    console.log(`📊 Total: ${totalMigrated} records migrated, ${totalErrors} errors`);

    return NextResponse.json({
      success: true,
      message: 'Database migration completed',
      results,
      summary: {
        totalMigrated,
        totalErrors
      }
    });

  } catch (error) {
    console.error('Migration failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Migration failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Database Migration API',
    instructions: 'Send a POST request to migrate data from OLD_DATABASE_URL to DATABASE_URL',
    required: {
      OLD_DATABASE_URL: 'Connection string for old database',
      DATABASE_URL: 'Connection string for new database (already set)'
    },
    tables: [
      'products',
      'orders',
      'abandoned_orders',
      'admin',
      'contact_settings',
      'landing_images'
    ]
  });
}
