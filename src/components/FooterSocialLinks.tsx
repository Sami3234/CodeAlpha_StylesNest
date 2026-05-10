'use client';

import type { ElementType } from 'react';
import { motion } from 'framer-motion';
import { FaWhatsapp, FaFacebookF, FaTiktok, FaShoppingBag } from 'react-icons/fa';
import { SiShopify } from 'react-icons/si';

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
  'flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-xl text-white transition-colors hover:bg-white/20';

export function FooterSocialLinks({ settings }: { settings: FooterSocialSettings }) {
  const waHref =
    settings.social_whatsapp.trim() || waLinkFromNumber(settings.whatsapp);

  const items: {
    href: string;
    label: string;
    Icon: ElementType<{ size?: number; 'aria-hidden'?: boolean }>;
    className?: string;
  }[] = [];

  if (waHref) {
    items.push({ href: waHref, label: 'WhatsApp', Icon: FaWhatsapp, className: 'text-[#25D366]' });
  }
  if (settings.social_facebook.trim()) {
    items.push({
      href: settings.social_facebook,
      label: 'Facebook',
      Icon: FaFacebookF,
      className: 'text-[#1877F2]',
    });
  }
  if (settings.social_tiktok.trim()) {
    items.push({
      href: settings.social_tiktok,
      label: 'TikTok',
      Icon: FaTiktok,
      className: 'text-white',
    });
  }
  if (settings.social_daraz.trim()) {
    items.push({
      href: settings.social_daraz,
      label: 'Daraz',
      Icon: FaShoppingBag,
      className: 'text-[#F85606]',
    });
  }
  if (settings.social_shopify.trim()) {
    items.push({
      href: settings.social_shopify,
      label: 'Shopify',
      Icon: SiShopify,
      className: 'text-[#95BF47]',
    });
  }

  if (items.length === 0) return null;

  return (
    <div className="mt-6 flex flex-wrap gap-3">
      {items.map(({ href, label, Icon, className }) => (
        <motion.a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          title={label}
          whileHover={{ scale: 1.08, y: -2 }}
          whileTap={{ scale: 0.95 }}
          className={`${iconBtn} ${className ?? ''}`}
        >
          <Icon size={22} aria-hidden />
        </motion.a>
      ))}
    </div>
  );
}
