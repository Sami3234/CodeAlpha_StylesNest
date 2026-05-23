'use client';

import Link from 'next/link';
import { useAdminContactSettings } from '@/hooks/useAdminContactSettings';
import AdminLoading from '@/components/admin/AdminLoading';
import AdminSocialLinksEditor from '@/components/admin/AdminSocialLinksEditor';
import ConnectionProblem from '@/components/network/ConnectionProblem';
import { TOP_BAR_ICON_FIELDS, type SocialLinkKey } from '@/lib/admin-social-links';
import '../admin-landing.css';

export default function LandingTopBarPage() {
  const { settings, setSettings, loading, saving, error, success, save, fetchError, reload } =
    useAdminContactSettings();

  if (loading) {
    return <AdminLoading message="Loading settings" subMessage="Top announcement bar" />;
  }

  if (fetchError) {
    return (
      <ConnectionProblem
        theme="admin"
        kind={fetchError}
        onRetry={() => void reload()}
        homeHref="/khanadmin"
        homeLabel="Dashboard"
      />
    );
  }

  return (
    <div className="alp-page">
      <header className="alp-head">
        <h1>Top announcement bar</h1>
        <p>
          Marquee text and 4 social icons (WhatsApp, Facebook, Daraz, Shopify). TikTok and more are on{' '}
          <Link href="/khanadmin/landing/footer" style={{ color: '#3498db', fontWeight: 600 }}>
            Footer &amp; links
          </Link>
          .
        </p>
      </header>

      {success ? <div className="alp-alert alp-alert--ok">{success}</div> : null}
      {error ? <div className="alp-alert alp-alert--err">{error}</div> : null}

      <div className="alp-card">
        <div className="alp-section">
          <label className="alp-label" htmlFor="announcement-text">
            Marquee text
          </label>
          <textarea
            id="announcement-text"
            className="alp-textarea"
            value={settings.announcement_text}
            onChange={(e) => setSettings({ ...settings, announcement_text: e.target.value })}
            placeholder="STORE | FREE DELIVERY — Shop now."
            rows={3}
          />
        </div>

        <hr className="alp-divider" />

        <AdminSocialLinksEditor
          settings={settings}
          fields={TOP_BAR_ICON_FIELDS}
          layout="grid"
          title="Social icons (4)"
          description="Same brand icons as on the orange bar. WhatsApp uses footer number if URL is empty."
          onChange={(key: SocialLinkKey, value: string) =>
            setSettings({ ...settings, [key]: value })
          }
        />

        <button
          type="button"
          className="alp-save alp-save--blue"
          onClick={() => save()}
          disabled={saving}
        >
          {saving ? 'Saving…' : 'Save top bar'}
        </button>
      </div>
    </div>
  );
}
