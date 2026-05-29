'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { DEFAULT_FOOTER_SERVICES } from '@/lib/sanitize-contact-extras';

export type ContactSettings = {
  whatsapp: string;
  phone: string;
  email: string;
  address: string;
  social_whatsapp: string;
  social_facebook: string;
  social_tiktok: string;
  social_daraz: string;
  social_shopify: string;
  announcement_text: string;
  customer_care_url: string;
  footer_services: string[];
  top_bar_links: string[];
};

const DEFAULT_SETTINGS: ContactSettings = {
  whatsapp: '',
  phone: '',
  email: '',
  address: '',
  social_whatsapp: '',
  social_facebook: '',
  social_tiktok: '',
  social_daraz: '',
  social_shopify: '',
  announcement_text: '',
  customer_care_url: '',
  footer_services: [...DEFAULT_FOOTER_SERVICES],
  top_bar_links: [],
};

type ContactSettingsContextValue = {
  settings: ContactSettings;
  loaded: boolean;
  refresh: () => Promise<void>;
};

const ContactSettingsContext = createContext<ContactSettingsContextValue | undefined>(
  undefined,
);

let inflight: Promise<ContactSettings> | null = null;

async function fetchContactSettings(): Promise<ContactSettings> {
  if (!inflight) {
    inflight = fetch('/api/contact-settings', { credentials: 'same-origin' })
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && data.settings) {
          return { ...DEFAULT_SETTINGS, ...data.settings } as ContactSettings;
        }
        return DEFAULT_SETTINGS;
      })
      .catch(() => DEFAULT_SETTINGS)
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

export function ContactSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ContactSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  const applySettings = useCallback((next: ContactSettings) => {
    setSettings(next);
    setLoaded(true);
  }, []);

  const refresh = useCallback(async () => {
    const next = await fetchContactSettings();
    applySettings(next);
  }, [applySettings]);

  useEffect(() => {
    let cancelled = false;
    fetchContactSettings().then((next) => {
      if (!cancelled) applySettings(next);
    });
    return () => {
      cancelled = true;
    };
  }, [applySettings]);

  const value = useMemo(
    () => ({ settings, loaded, refresh }),
    [settings, loaded, refresh],
  );

  return (
    <ContactSettingsContext.Provider value={value}>{children}</ContactSettingsContext.Provider>
  );
}

export function useContactSettings(): ContactSettingsContextValue {
  const ctx = useContext(ContactSettingsContext);
  if (!ctx) {
    throw new Error('useContactSettings must be used within ContactSettingsProvider');
  }
  return ctx;
}

/** Optional hook when provider may be absent (e.g. tests). */
export function useContactSettingsOptional(): ContactSettingsContextValue | null {
  return useContext(ContactSettingsContext) ?? null;
}
