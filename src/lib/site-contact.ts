/** Canonical StylesNest contact details — used as fallback sitewide when DB has placeholders. */
export const SITE_CONTACT = {
  whatsapp: '923374323370',
  phone: '+92 337 432 3370',
  email: 'stylesnest34@gmail.com',
  address: 'Vehari, Pakistan',
} as const;

const DEMO_WHATSAPP = new Set(['923001234567', '9230012345670']);
const DEMO_PHONES = new Set(['+923001234567', '+92 300 1234567', '03001234567']);
const DEMO_EMAILS = new Set(['info@stylesnest.com']);

function normalizeDigits(value: string): string {
  return value.replace(/\D/g, '');
}

function isDemoWhatsapp(value: string): boolean {
  const digits = normalizeDigits(value);
  return DEMO_WHATSAPP.has(digits);
}

function isDemoPhone(value: string): boolean {
  const compact = value.replace(/\s+/g, '');
  return DEMO_PHONES.has(compact) || DEMO_PHONES.has(`+${normalizeDigits(value)}`);
}

function isDemoEmail(value: string): boolean {
  return DEMO_EMAILS.has(value.trim().toLowerCase());
}

/** Replace legacy demo placeholders with real business contact info. */
export function resolveSiteContact<T extends {
  whatsapp?: string;
  phone?: string;
  email?: string;
  address?: string;
}>(raw: T): T {
  const whatsapp = raw.whatsapp?.trim() ?? '';
  const phone = raw.phone?.trim() ?? '';
  const email = raw.email?.trim() ?? '';
  const address = raw.address?.trim() ?? '';

  return {
    ...raw,
    whatsapp: !whatsapp || isDemoWhatsapp(whatsapp) ? SITE_CONTACT.whatsapp : whatsapp,
    phone: !phone || isDemoPhone(phone) ? SITE_CONTACT.phone : phone,
    email: !email || isDemoEmail(email) ? SITE_CONTACT.email : email,
    address: !address ? SITE_CONTACT.address : address,
  };
}
