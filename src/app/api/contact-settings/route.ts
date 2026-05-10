import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import {
  ensureContactAnnouncementColumns,
  ensureContactLandingExtrasColumns,
  ensureContactSocialColumns,
} from '@/lib/contact-settings-schema';
import { sanitizeFooterServices, sanitizeTopBarUrls } from '@/lib/sanitize-contact-extras';

type Row = {
  whatsapp: string;
  phone: string;
  email: string;
  address: string;
  social_whatsapp: string | null;
  social_facebook: string | null;
  social_tiktok: string | null;
  social_daraz: string | null;
  social_shopify: string | null;
  announcement_text: string | null;
  customer_care_url: string | null;
  footer_services_json: string | null;
  top_bar_links_json: string | null;
};

const defaults: Row = {
  whatsapp: '923001234567',
  phone: '+92 300 1234567',
  email: 'info@stylesnest.com',
  address: 'Vehari, Pakistan',
  social_whatsapp: '',
  social_facebook: '',
  social_tiktok: '',
  social_daraz: '',
  social_shopify: '',
  announcement_text: '',
  customer_care_url: '',
  footer_services_json: '',
  top_bar_links_json: '',
};

function parseFooterServicesJson(raw: string | null | undefined): string[] {
  if (raw == null || raw.trim() === '') return sanitizeFooterServices(null);
  try {
    return sanitizeFooterServices(JSON.parse(raw));
  } catch {
    return sanitizeFooterServices(null);
  }
}

function parseTopBarUrlsJson(raw: string | null | undefined): string[] {
  if (raw == null || raw.trim() === '') return [];
  try {
    return sanitizeTopBarUrls(JSON.parse(raw));
  } catch {
    return [];
  }
}

function rowToSettings(r: Row) {
  return {
    whatsapp: r.whatsapp,
    phone: r.phone,
    email: r.email,
    address: r.address,
    social_whatsapp: r.social_whatsapp ?? '',
    social_facebook: r.social_facebook ?? '',
    social_tiktok: r.social_tiktok ?? '',
    social_daraz: r.social_daraz ?? '',
    social_shopify: r.social_shopify ?? '',
    announcement_text: r.announcement_text ?? '',
    customer_care_url: r.customer_care_url ?? '',
    footer_services: parseFooterServicesJson(r.footer_services_json),
    top_bar_links: parseTopBarUrlsJson(r.top_bar_links_json),
  };
}

// Public endpoint to get contact settings (no auth required)
export async function GET() {
  try {
    try {
      await ensureContactSocialColumns();
      await ensureContactAnnouncementColumns();
      await ensureContactLandingExtrasColumns();
    } catch {
      // table may not exist yet
    }

    const result = (await sql`
      SELECT whatsapp, phone, email, address,
        COALESCE(social_whatsapp, '') AS social_whatsapp,
        COALESCE(social_facebook, '') AS social_facebook,
        COALESCE(social_tiktok, '') AS social_tiktok,
        COALESCE(social_daraz, '') AS social_daraz,
        COALESCE(social_shopify, '') AS social_shopify,
        COALESCE(announcement_text, '') AS announcement_text,
        COALESCE(customer_care_url, '') AS customer_care_url,
        COALESCE(footer_services_json, '') AS footer_services_json,
        COALESCE(top_bar_links_json, '') AS top_bar_links_json
      FROM contact_settings LIMIT 1
    `) as Row[];

    if (result.length > 0) {
      return NextResponse.json({
        success: true,
        settings: rowToSettings(result[0]),
      });
    }

    return NextResponse.json({
      success: true,
      settings: rowToSettings(defaults),
    });
  } catch {
    return NextResponse.json({
      success: true,
      settings: rowToSettings(defaults),
    });
  }
}
