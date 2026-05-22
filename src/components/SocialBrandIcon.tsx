'use client';

import { FaFacebookF, FaWhatsapp } from 'react-icons/fa';
import { SiShopify, SiTiktok } from 'react-icons/si';
import type { SocialLinkKey } from '@/lib/admin-social-links';

type Props = {
  platform: SocialLinkKey;
  size?: number;
  className?: string;
};

/** Daraz brand mark (Simple Icons path) — not in react-icons. */
function DarazIcon({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 0C5.372 0 0 5.372 0 12c0 6.628 5.372 12 12 12s12-5.372 12-12C24 5.372 18.628 0 12 0zm.849 5.959h2.404v12.082h-2.404V5.959z" />
    </svg>
  );
}

const ICON_COLOR: Partial<Record<SocialLinkKey, string>> = {
  social_whatsapp: '#25D366',
  social_facebook: '#1877F2',
  social_tiktok: '#000000',
  social_daraz: '#F85606',
  social_shopify: '#95BF47',
};

export function socialBrandColor(platform: SocialLinkKey): string {
  return ICON_COLOR[platform] ?? '#64748b';
}

export default function SocialBrandIcon({ platform, size = 20, className }: Props) {
  const props = { size, className, 'aria-hidden': true as const };

  switch (platform) {
    case 'social_whatsapp':
      return <FaWhatsapp {...props} />;
    case 'social_facebook':
      return <FaFacebookF {...props} />;
    case 'social_tiktok':
      return <SiTiktok {...props} />;
    case 'social_daraz':
      return <DarazIcon size={size} className={className} />;
    case 'social_shopify':
      return <SiShopify {...props} />;
    default:
      return null;
  }
}
