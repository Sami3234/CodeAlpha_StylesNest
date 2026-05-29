'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import './cookie-consent.css';

const STORAGE_KEY = 'stylesnest_cookie_consent';

export default function CookieConsent() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const isAdmin =
    pathname?.startsWith('/khanadmin') ||
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/api');

  if (isAdmin) return null;

  const accept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'accepted');
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  return (
    <div className="cookie-consent" role="dialog" aria-label="Cookie notice">
      <div className="cookie-consent__inner">
        <p className="cookie-consent__text">
          We use cookies so the shop works smoothly for you. Read our{' '}
          <Link href="/privacy-policy" className="cookie-consent__link">
            Privacy Policy
          </Link>{' '}
          for more information.
        </p>
        <button type="button" className="cookie-consent__btn" onClick={accept}>
          Accept
        </button>
      </div>
    </div>
  );
}
