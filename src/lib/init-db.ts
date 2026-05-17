import { sql } from './db';
import {
  ensureContactAnnouncementColumns,
  ensureContactLandingExtrasColumns,
  ensureContactSocialColumns,
} from './contact-settings-schema';
import { ensureShopUsersTable } from './shop-users-schema';
import { ensureAdminSessionsTable } from './admin-session';

/**
 * Initialize database tables
 * This script creates the necessary tables for products and orders
 */
export async function initDatabase() {
  try {
    console.log('Initializing database...');

    // Create products table
    await sql`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        title_en TEXT NOT NULL,
        title_ar TEXT NOT NULL,
        description_en TEXT NOT NULL,
        description_ar TEXT NOT NULL,
        current_price DECIMAL(10, 2) NOT NULL,
        original_price DECIMAL(10, 2) NOT NULL,
        discount INTEGER NOT NULL,
        image TEXT NOT NULL,
        images JSONB DEFAULT '[]',
        free_delivery BOOLEAN DEFAULT true,
        sold_count INTEGER DEFAULT 0,
        category TEXT NOT NULL,
        features_en JSONB DEFAULT '[]',
        features_ar JSONB DEFAULT '[]',
        pricing_tiers JSONB DEFAULT '[]',
        clothes_options JSONB DEFAULT NULL,
        status TEXT DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      ALTER TABLE products
      ADD COLUMN IF NOT EXISTS clothes_options JSONB DEFAULT NULL
    `;

    // Create orders table
    await sql`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        customer TEXT NOT NULL,
        phone TEXT NOT NULL,
        city TEXT NOT NULL,
        address TEXT NOT NULL,
        products JSONB NOT NULL,
        total DECIMAL(10, 2) NOT NULL,
        status TEXT DEFAULT 'pending',
        date DATE NOT NULL,
        time TIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create abandoned_orders table (unsubmitted orders)
    await sql`
      CREATE TABLE IF NOT EXISTS abandoned_orders (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        city TEXT,
        address TEXT,
        quantity TEXT,
        product_id TEXT,
        status TEXT DEFAULT 'unsubmitted',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create admin table
    await sql`
      CREATE TABLE IF NOT EXISTS admin (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create contact_settings table
    await sql`
      CREATE TABLE IF NOT EXISTS contact_settings (
        id INTEGER PRIMARY KEY DEFAULT 1,
        whatsapp TEXT NOT NULL DEFAULT '923001234567',
        phone TEXT DEFAULT '+92 300 1234567',
        email TEXT DEFAULT 'info@stylesnest.com',
        address TEXT DEFAULT 'Vehari, Pakistan',
        social_whatsapp TEXT DEFAULT '',
        social_facebook TEXT DEFAULT '',
        social_tiktok TEXT DEFAULT '',
        social_daraz TEXT DEFAULT '',
        social_shopify TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT single_row CHECK (id = 1)
      )
    `;

    await ensureContactSocialColumns();
    await ensureContactAnnouncementColumns();
    await ensureContactLandingExtrasColumns();
    await ensureShopUsersTable();
    await ensureAdminSessionsTable();

    await sql`
      INSERT INTO contact_settings (id, whatsapp, phone, email, address, social_whatsapp, social_facebook, social_tiktok, social_daraz, social_shopify)
      VALUES (1, '923001234567', '+92 300 1234567', 'info@stylesnest.com', 'Vehari, Pakistan', '', '', '', '', '')
      ON CONFLICT (id) DO NOTHING
    `;

    // Create landing_images table
    await sql`
      CREATE TABLE IF NOT EXISTS landing_images (
        id SERIAL PRIMARY KEY,
        section TEXT NOT NULL,
        image_type TEXT NOT NULL,
        image_url TEXT NOT NULL,
        cloudinary_public_id TEXT,
        display_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(section, image_type, display_order)
      )
    `;

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

    // Create indexes for better performance
    await sql`CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_products_status ON products(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders(phone)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(date)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_abandoned_phone ON abandoned_orders(phone)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_abandoned_name ON abandoned_orders(name)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_landing_images_section ON landing_images(section)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_landing_images_active ON landing_images(is_active)`;

    console.log('Database initialized successfully!');
    return { success: true };
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

