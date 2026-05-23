import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import {
  ensureContactAnnouncementColumns,
  ensureContactLandingExtrasColumns,
  ensureContactSocialColumns,
} from '@/lib/contact-settings-schema';
import { apiErrorResponse } from '@/lib/safe-errors';
import { sanitizeAnnouncementText, sanitizeCustomerCareUrl } from '@/lib/sanitize-announcement';
import { sanitizeSocialUrl } from '@/lib/sanitize-social-url';
import {
  footerServicesToJson,
  sanitizeFooterServices,
  sanitizeTopBarUrls,
  topBarUrlsToJson,
} from '@/lib/sanitize-contact-extras';

// Get contact settings
export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('admin_session');

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // First, ensure table exists
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
    } catch (tableError) {
      // Table might already exist, continue
      console.log('Table creation check:', tableError);
    }

    try {
      await ensureContactSocialColumns();
      await ensureContactAnnouncementColumns();
      await ensureContactLandingExtrasColumns();
    } catch (e) {
      console.log('Social columns ensure:', e);
    }

    // Get contact settings (create default if not exists)
    let result: Array<{
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
    }> = [];
    try {
      result = await sql`
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
      ` as typeof result;
    } catch (selectError) {
      console.error('Error selecting contact settings:', selectError);
    }

    if (result.length === 0) {
      // Return default values if no settings exist
      const defaultFooterServices = sanitizeFooterServices(null);
      const defaultSettings = {
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
        footer_services: defaultFooterServices,
        top_bar_links: [] as string[],
      };
      
      // Try to create default settings
      try {
        await sql`
          INSERT INTO contact_settings (id, whatsapp, phone, email, address, social_whatsapp, social_facebook, social_tiktok, social_daraz, social_shopify)
          VALUES (1, ${defaultSettings.whatsapp}, ${defaultSettings.phone}, ${defaultSettings.email}, ${defaultSettings.address}, '', '', '', '', '')
          ON CONFLICT (id) DO NOTHING
        `;
      } catch (insertError) {
        console.error('Error inserting default settings:', insertError);
      }
      
      return NextResponse.json({
        success: true,
        settings: defaultSettings,
      });
    }

    const fsJson = result[0].footer_services_json ?? '';
    const tblJson = result[0].top_bar_links_json ?? '';
    let footer_services = sanitizeFooterServices(null);
    let top_bar_links: string[] = [];
    try {
      footer_services = sanitizeFooterServices(fsJson.trim() ? JSON.parse(fsJson) : null);
    } catch {
      footer_services = sanitizeFooterServices(null);
    }
    try {
      top_bar_links = sanitizeTopBarUrls(tblJson.trim() ? JSON.parse(tblJson) : []);
    } catch {
      top_bar_links = [];
    }

    return NextResponse.json({
      success: true,
      settings: {
        whatsapp: result[0].whatsapp,
        phone: result[0].phone,
        email: result[0].email,
        address: result[0].address,
        social_whatsapp: result[0].social_whatsapp ?? '',
        social_facebook: result[0].social_facebook ?? '',
        social_tiktok: result[0].social_tiktok ?? '',
        social_daraz: result[0].social_daraz ?? '',
        social_shopify: result[0].social_shopify ?? '',
        announcement_text: result[0].announcement_text ?? '',
        customer_care_url: result[0].customer_care_url ?? '',
        footer_services,
        top_bar_links,
      },
    });
  } catch (error) {
    console.error('Get contact settings error:', error);
    return apiErrorResponse({ message: 'Failed to get contact settings', status: 500, cause: error });
  }
}

// Update contact settings
export async function PUT(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('admin_session');

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      whatsapp,
      phone,
      email,
      address,
      social_whatsapp,
      social_facebook,
      social_tiktok,
      social_daraz,
      social_shopify,
      announcement_text,
      customer_care_url,
      footer_services: footer_services_raw,
      top_bar_links: top_bar_links_raw,
    } = body;

    if (!whatsapp) {
      return NextResponse.json(
        { error: 'WhatsApp number is required' },
        { status: 400 }
      );
    }

    const sw = sanitizeSocialUrl(social_whatsapp);
    const sf = sanitizeSocialUrl(social_facebook);
    const st = sanitizeSocialUrl(social_tiktok);
    const sd = sanitizeSocialUrl(social_daraz);
    const ss = sanitizeSocialUrl(social_shopify);
    const announcement = sanitizeAnnouncementText(announcement_text);
    const careUrl = sanitizeCustomerCareUrl(customer_care_url);
    const footerServices = sanitizeFooterServices(footer_services_raw);
    const topBarUrls = sanitizeTopBarUrls(top_bar_links_raw);
    const footerServicesJson = footerServicesToJson(footerServices);
    const topBarLinksJson = topBarUrlsToJson(topBarUrls);

    // First, try to create table if it doesn't exist
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
    } catch (tableError) {
      console.log('Table creation check:', tableError);
    }

    try {
      await ensureContactSocialColumns();
      await ensureContactAnnouncementColumns();
      await ensureContactLandingExtrasColumns();
    } catch (e) {
      console.log('Social columns ensure:', e);
    }

    // Check if settings exist
    let existing: Array<{ id: number }> = [];
    try {
      existing = await sql`
        SELECT id FROM contact_settings LIMIT 1
      ` as Array<{ id: number }>;
    } catch (selectError) {
      console.error('Error checking existing settings:', selectError);
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
    }

    if (existing.length === 0) {
      try {
        await sql`
          INSERT INTO contact_settings (
            id, whatsapp, phone, email, address,
            social_whatsapp, social_facebook, social_tiktok, social_daraz, social_shopify,
            announcement_text, customer_care_url,
            footer_services_json, top_bar_links_json
          )
          VALUES (
            1, ${whatsapp}, ${phone || ''}, ${email || ''}, ${address || ''},
            ${sw}, ${sf}, ${st}, ${sd}, ${ss},
            ${announcement}, ${careUrl},
            ${footerServicesJson}, ${topBarLinksJson}
          )
          ON CONFLICT (id) DO UPDATE SET
            whatsapp = ${whatsapp},
            phone = ${phone || ''},
            email = ${email || ''},
            address = ${address || ''},
            social_whatsapp = ${sw},
            social_facebook = ${sf},
            social_tiktok = ${st},
            social_daraz = ${sd},
            social_shopify = ${ss},
            announcement_text = ${announcement},
            customer_care_url = ${careUrl},
            footer_services_json = ${footerServicesJson},
            top_bar_links_json = ${topBarLinksJson},
            updated_at = CURRENT_TIMESTAMP
        `;
      } catch {
        await sql`
          UPDATE contact_settings 
          SET whatsapp = ${whatsapp},
              phone = ${phone || ''},
              email = ${email || ''},
              address = ${address || ''},
              social_whatsapp = ${sw},
              social_facebook = ${sf},
              social_tiktok = ${st},
              social_daraz = ${sd},
              social_shopify = ${ss},
              announcement_text = ${announcement},
              customer_care_url = ${careUrl},
              footer_services_json = ${footerServicesJson},
              top_bar_links_json = ${topBarLinksJson},
              updated_at = CURRENT_TIMESTAMP
          WHERE id = 1
        `;
      }
    } else {
      await sql`
        UPDATE contact_settings 
        SET whatsapp = ${whatsapp},
            phone = ${phone || ''},
            email = ${email || ''},
            address = ${address || ''},
            social_whatsapp = ${sw},
            social_facebook = ${sf},
            social_tiktok = ${st},
            social_daraz = ${sd},
            social_shopify = ${ss},
            announcement_text = ${announcement},
            customer_care_url = ${careUrl},
            footer_services_json = ${footerServicesJson},
            top_bar_links_json = ${topBarLinksJson},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${existing[0].id}
      `;
    }

    return NextResponse.json({
      success: true,
      message: 'Contact settings updated successfully',
      settings: {
        whatsapp,
        phone: phone || '',
        email: email || '',
        address: address || '',
        social_whatsapp: sw,
        social_facebook: sf,
        social_tiktok: st,
        social_daraz: sd,
        social_shopify: ss,
        announcement_text: announcement,
        customer_care_url: careUrl,
        footer_services: footerServices,
        top_bar_links: topBarUrls,
      },
    });
  } catch (error: unknown) {
    console.error('Update contact settings error:', error);
    return apiErrorResponse({ message: 'Failed to update contact settings', status: 500, cause: error });
  }
}

