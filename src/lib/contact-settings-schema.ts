import { sql } from '@/lib/db';

/** Add social link columns when DB was created before these fields existed. */
export async function ensureContactSocialColumns(): Promise<void> {
  await sql`ALTER TABLE contact_settings ADD COLUMN IF NOT EXISTS social_whatsapp TEXT DEFAULT ''`;
  await sql`ALTER TABLE contact_settings ADD COLUMN IF NOT EXISTS social_facebook TEXT DEFAULT ''`;
  await sql`ALTER TABLE contact_settings ADD COLUMN IF NOT EXISTS social_tiktok TEXT DEFAULT ''`;
  await sql`ALTER TABLE contact_settings ADD COLUMN IF NOT EXISTS social_daraz TEXT DEFAULT ''`;
  await sql`ALTER TABLE contact_settings ADD COLUMN IF NOT EXISTS social_shopify TEXT DEFAULT ''`;
}

/** Top announcement marquee + customer care link */
export async function ensureContactAnnouncementColumns(): Promise<void> {
  await sql`ALTER TABLE contact_settings ADD COLUMN IF NOT EXISTS announcement_text TEXT DEFAULT ''`;
  await sql`ALTER TABLE contact_settings ADD COLUMN IF NOT EXISTS customer_care_url TEXT DEFAULT ''`;
}

/** Footer services list + extra top-bar text links (JSON TEXT columns) */
export async function ensureContactLandingExtrasColumns(): Promise<void> {
  await sql`ALTER TABLE contact_settings ADD COLUMN IF NOT EXISTS footer_services_json TEXT DEFAULT ''`;
  await sql`ALTER TABLE contact_settings ADD COLUMN IF NOT EXISTS top_bar_links_json TEXT DEFAULT ''`;
}

export async function ensurePaymentMethodsColumn(): Promise<void> {
  await sql`ALTER TABLE contact_settings ADD COLUMN IF NOT EXISTS payment_methods_json TEXT DEFAULT ''`;
}
