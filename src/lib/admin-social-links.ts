import type { AdminContactSettings } from '@/hooks/useAdminContactSettings';

export type SocialLinkKey = keyof Pick<
  AdminContactSettings,
  'social_whatsapp' | 'social_facebook' | 'social_tiktok' | 'social_daraz' | 'social_shopify'
>;

export type SocialLinkFieldConfig = {
  key: SocialLinkKey;
  label: string;
  shortLabel: string;
  placeholder: string;
  hint: string;
  brandColor: string;
};

export const FOOTER_SOCIAL_FIELDS: SocialLinkFieldConfig[] = [
  {
    key: 'social_whatsapp',
    label: 'WhatsApp',
    shortLabel: 'WA',
    placeholder: 'https://wa.me/923001234567',
    hint: 'Chat link or wa.me number URL',
    brandColor: '#25D366',
  },
  {
    key: 'social_facebook',
    label: 'Facebook Page',
    shortLabel: 'FB',
    placeholder: 'https://www.facebook.com/share/18iEA8juEM/',
    hint: 'Full Facebook page or share link',
    brandColor: '#1877F2',
  },
  {
    key: 'social_tiktok',
    label: 'TikTok',
    shortLabel: 'TT',
    placeholder: 'https://www.tiktok.com/@yourshop',
    hint: 'Profile or video URL',
    brandColor: '#010101',
  },
  {
    key: 'social_daraz',
    label: 'Daraz Store',
    shortLabel: 'DZ',
    placeholder: 'https://www.daraz.pk/shop/yourstore',
    hint: 'Daraz shop page URL',
    brandColor: '#F85606',
  },
  {
    key: 'social_shopify',
    label: 'Shopify',
    shortLabel: 'SH',
    placeholder: 'https://yourstore.myshopify.com',
    hint: 'Online store URL',
    brandColor: '#96BF48',
  },
];

export const TOP_BAR_ICON_FIELDS: SocialLinkFieldConfig[] = FOOTER_SOCIAL_FIELDS.filter((f) =>
  ['social_whatsapp', 'social_facebook', 'social_daraz', 'social_shopify'].includes(f.key),
);

export function normalizeSocialHref(raw: string): string {
  const v = raw.trim();
  if (!v) return '';
  if (/^https?:\/\//i.test(v)) return v;
  return `https://${v}`;
}

export function socialLinkPreviewLabel(url: string): string {
  try {
    const u = new URL(normalizeSocialHref(url));
    const host = u.hostname.replace(/^www\./, '');
    if (host.includes('facebook')) return 'Facebook';
    if (host.includes('wa.me') || host.includes('whatsapp')) return 'WhatsApp';
    if (host.includes('tiktok')) return 'TikTok';
    if (host.includes('daraz')) return 'Daraz';
    if (host.includes('shopify')) return 'Shopify';
    return host;
  } catch {
    return 'Link';
  }
}
