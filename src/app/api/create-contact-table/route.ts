import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdminSession } from '@/lib/require-admin-session';
import {
  ensureContactAnnouncementColumns,
  ensureContactLandingExtrasColumns,
  ensureContactSocialColumns,
} from '@/lib/contact-settings-schema';
import { apiErrorResponse } from '@/lib/safe-errors';

/**
 * Quick endpoint to create contact_settings table
 * Call this if you get table not found errors
 */
export async function GET(request: NextRequest) {
  const admin = await requireAdminSession(request);
  if (!admin.ok) return admin.response;

  try {
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

    await sql`
      INSERT INTO contact_settings (id, whatsapp, phone, email, address, social_whatsapp, social_facebook, social_tiktok, social_daraz, social_shopify)
      VALUES (1, '923001234567', '+92 300 1234567', 'info@stylesnest.com', 'Vehari, Pakistan', '', '', '', '', '')
      ON CONFLICT (id) DO NOTHING
    `;

    return NextResponse.json({
      success: true,
      message: 'Contact settings table created successfully',
    });
  } catch (error) {
    console.error('Failed to create contact_settings table:', error);
    return apiErrorResponse({
      message: 'Failed to create contact settings table',
      status: 500,
      cause: error,
    });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
