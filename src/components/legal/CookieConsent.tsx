'use client';

import { useEffect } from 'react';

const STORAGE_KEY = 'stylesnest_cookie_consent';

/** Silently record cookie consent on first visit — no banner. */
export default function CookieConsent() {
  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        localStorage.setItem(STORAGE_KEY, 'accepted');
      }
    } catch {
      /* ignore */
    }
  }, []);

  return null;
}
