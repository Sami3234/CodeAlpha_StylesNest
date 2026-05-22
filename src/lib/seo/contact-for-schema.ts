import { sql } from '@/lib/db';
import {
  ensureContactAnnouncementColumns,
  ensureContactLandingExtrasColumns,
  ensureContactSocialColumns,
} from '@/lib/contact-settings-schema';
import { siteConfig } from '@/lib/seo/site';

export type SchemaContact = {
  phone: string;
  email: string;
  address: string;
  sameAs: string[];
};

const defaults: SchemaContact = {
  phone: siteConfig.phone,
  email: siteConfig.contactEmail,
  address: siteConfig.address,
  sameAs: [],
};

function normalizeSocialUrl(raw: string | null | undefined): string {
  const t = (raw ?? '').trim();
  if (!t) return '';
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

function collectSameAs(row: {
  social_facebook?: string | null;
  social_tiktok?: string | null;
  social_whatsapp?: string | null;
  social_daraz?: string | null;
  social_shopify?: string | null;
  whatsapp?: string | null;
}): string[] {
  const urls = [
    normalizeSocialUrl(row.social_facebook),
    normalizeSocialUrl(row.social_tiktok),
    normalizeSocialUrl(row.social_daraz),
    normalizeSocialUrl(row.social_shopify),
    normalizeSocialUrl(row.social_whatsapp),
    row.whatsapp?.trim()
      ? `https://wa.me/${row.whatsapp.replace(/\D/g, '')}`
      : '',
  ];
  return [...new Set(urls.filter(Boolean))];
}

/** Contact fields for JSON-LD — DB when available, else site defaults. */
export async function getContactForSchema(): Promise<SchemaContact> {
  try {
    await ensureContactSocialColumns();
    await ensureContactAnnouncementColumns();
    await ensureContactLandingExtrasColumns();
    const rows = await sql`
      SELECT
        phone, email, address, whatsapp,
        COALESCE(social_facebook, '') AS social_facebook,
        COALESCE(social_tiktok, '') AS social_tiktok,
        COALESCE(social_whatsapp, '') AS social_whatsapp,
        COALESCE(social_daraz, '') AS social_daraz,
        COALESCE(social_shopify, '') AS social_shopify
      FROM contact_settings
      LIMIT 1
    `;
    if (!rows.length) return defaults;
    const row = rows[0] as {
      phone?: string;
      email?: string;
      address?: string;
      whatsapp?: string;
      social_facebook?: string;
      social_tiktok?: string;
      social_whatsapp?: string;
      social_daraz?: string;
      social_shopify?: string;
    };
    return {
      phone: (row.phone?.trim() || defaults.phone).replace(/\s+/g, ' '),
      email: row.email?.trim() || defaults.email,
      address: row.address?.trim() || defaults.address,
      sameAs: collectSameAs(row),
    };
  } catch {
    return defaults;
  }
}

export function phoneToE164(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('92')) return `+${digits}`;
  if (digits.startsWith('0')) return `+92${digits.slice(1)}`;
  return digits ? `+${digits}` : siteConfig.phone;
}
