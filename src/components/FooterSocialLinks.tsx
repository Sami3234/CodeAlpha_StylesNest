'use client';

import { motion } from 'framer-motion';
import SocialBrandIcon, { socialBrandColor } from '@/components/SocialBrandIcon';
import type { SocialLinkKey } from '@/lib/admin-social-links';

export type FooterSocialSettings = {
  whatsapp: string;
  social_whatsapp: string;
  social_facebook: string;
  social_tiktok: string;
  social_daraz: string;
  social_shopify: string;
};

function waLinkFromNumber(num: string): string {
  const digits = num.replace(/\D/g, '');
  if (!digits) return '';
  return `https://wa.me/${digits}`;
}

const iconBtn =
  'flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-xl transition-colors hover:bg-white/20';

export function FooterSocialLinks({ settings }: { settings: FooterSocialSettings }) {
  const waHref =
    settings.social_whatsapp.trim() || waLinkFromNumber(settings.whatsapp);

  const items: { href: string; label: string; platform: SocialLinkKey }[] = [];

  if (waHref) {
    items.push({ href: waHref, label: 'WhatsApp', platform: 'social_whatsapp' });
  }
  if (settings.social_facebook.trim()) {
    items.push({
      href: settings.social_facebook,
      label: 'Facebook',
      platform: 'social_facebook',
    });
  }
  if (settings.social_tiktok.trim()) {
    items.push({
      href: settings.social_tiktok,
      label: 'TikTok',
      platform: 'social_tiktok',
    });
  }
  if (settings.social_daraz.trim()) {
    items.push({
      href: settings.social_daraz,
      label: 'Daraz',
      platform: 'social_daraz',
    });
  }
  if (settings.social_shopify.trim()) {
    items.push({
      href: settings.social_shopify,
      label: 'Shopify',
      platform: 'social_shopify',
    });
  }

  if (items.length === 0) return null;

  return (
    <div className="mt-6 flex flex-wrap gap-3">
      {items.map(({ href, label, platform }) => (
        <motion.a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          title={label}
          whileHover={{ scale: 1.08, y: -2 }}
          whileTap={{ scale: 0.95 }}
          className={iconBtn}
          style={{ color: socialBrandColor(platform) }}
        >
          <SocialBrandIcon platform={platform} size={22} />
        </motion.a>
      ))}
    </div>
  );
}
