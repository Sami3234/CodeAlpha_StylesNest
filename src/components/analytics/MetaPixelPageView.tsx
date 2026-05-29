'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { META_PIXEL_ID } from '@/lib/meta-pixel-config';

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

function isAdminPath(pathname: string | null): boolean {
  return (
    pathname?.startsWith('/khanadmin') === true ||
    pathname?.startsWith('/admin') === true
  );
}

/** SPA route changes — initial PageView is fired by MetaPixelScript. */
export default function MetaPixelPageView() {
  const pathname = usePathname();
  const isFirst = useRef(true);

  useEffect(() => {
    if (!META_PIXEL_ID || isAdminPath(pathname)) return;
    if (typeof window.fbq !== 'function') return;
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    window.fbq('track', 'PageView');
  }, [pathname]);

  return null;
}
