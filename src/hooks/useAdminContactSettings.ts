'use client';

import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_FOOTER_SERVICES } from '@/lib/sanitize-contact-extras';
import { clientFetch, NetworkError } from '@/lib/client-fetch';
import type { FetchErrorKind } from '@/lib/is-network-error';

/** Mirrors `/api/admin/contact-settings` payload */
export interface AdminContactSettings {
  whatsapp: string;
  phone: string;
  email: string;
  address: string;
  announcement_text: string;
  customer_care_url: string;
  social_whatsapp: string;
  social_facebook: string;
  social_tiktok: string;
  social_daraz: string;
  social_shopify: string;
  footer_services: string[];
  /** URLs only; shown only on the orange top bar */
  top_bar_links: string[];
}

const defaults: AdminContactSettings = {
  whatsapp: '',
  phone: '',
  email: '',
  address: '',
  announcement_text: '',
  customer_care_url: '',
  social_whatsapp: '',
  social_facebook: '',
  social_tiktok: '',
  social_daraz: '',
  social_shopify: '',
  footer_services: [...DEFAULT_FOOTER_SERVICES],
  top_bar_links: [],
};

export function useAdminContactSettings() {
  const [settings, setSettings] = useState<AdminContactSettings>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fetchError, setFetchError] = useState<FetchErrorKind | null>(null);
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    setFetchError(null);
    try {
      const response = await clientFetch('/api/admin/contact-settings');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.settings) {
          setSettings({ ...defaults, ...data.settings });
        }
      } else {
        setError('Failed to load settings');
      }
    } catch (err) {
      if (err instanceof NetworkError) {
        setFetchError(err.kind);
      } else {
        setError('Failed to load settings');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = useCallback(async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const response = await clientFetch('/api/admin/contact-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setSuccess('Saved successfully.');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Save failed');
      }
    } catch (err) {
      if (err instanceof NetworkError) {
        setError(
          err.kind === 'offline'
            ? 'You are offline. Reconnect to save settings.'
            : 'Connection problem. Could not save — try again.',
        );
      } else {
        setError('Save failed');
      }
    } finally {
      setSaving(false);
    }
  }, [settings]);

  return {
    settings,
    setSettings,
    loading,
    saving,
    error,
    fetchError,
    success,
    save,
    reload: load,
  };
}
