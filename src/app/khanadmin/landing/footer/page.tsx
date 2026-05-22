'use client';

import Link from 'next/link';
import { useAdminContactSettings } from '@/hooks/useAdminContactSettings';
import AdminLoading from '@/components/admin/AdminLoading';
import AdminSocialLinksEditor from '@/components/admin/AdminSocialLinksEditor';
import ConnectionProblem from '@/components/network/ConnectionProblem';
import type { SocialLinkKey } from '@/lib/admin-social-links';
import '../admin-landing.css';

const MAX_FOOTER_SERVICES = 8;

export default function LandingFooterPage() {
  const { settings, setSettings, loading, saving, error, success, save, fetchError, reload } =
    useAdminContactSettings();

  if (loading) {
    return <AdminLoading message="Loading settings" subMessage="Footer and contact" />;
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
    <div className="alp-page alp-page--wide">
      <header className="alp-head">
        <h1>Footer &amp; site links</h1>
        <p>
          Contact details, footer services, and social links (5 platforms). Top bar uses 4 icons on{' '}
          <Link href="/khanadmin/landing/top-bar" style={{ color: '#3498db', fontWeight: 600 }}>
            Top bar
          </Link>
          .
        </p>
      </header>

      {success ? <div className="alp-alert alp-alert--ok">{success}</div> : null}
      {error ? <div className="alp-alert alp-alert--err">{error}</div> : null}

      <div className="alp-card">
        <section className="alp-section">
          <h2 className="asle__title" style={{ marginBottom: 10 }}>
            Contact
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 10,
            }}
          >
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="alp-label">
                WhatsApp number <span style={{ color: '#e74c3c' }}>*</span>
              </label>
              <input
                type="text"
                className="alp-input"
                value={settings.whatsapp}
                onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })}
                placeholder="923001234567"
              />
            </div>
            <div>
              <label className="alp-label">Phone</label>
              <input
                type="text"
                className="alp-input"
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                placeholder="+92 300 1234567"
              />
            </div>
            <div>
              <label className="alp-label">Email</label>
              <input
                type="email"
                className="alp-input"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                placeholder="info@stylesnest.com"
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="alp-label">Address</label>
              <input
                type="text"
                className="alp-input"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                placeholder="City, Pakistan"
              />
            </div>
          </div>
        </section>

        <hr className="alp-divider" />

        <section className="alp-section">
          <h2 className="asle__title" style={{ marginBottom: 4 }}>
            Footer — Services
          </h2>
          <p className="asle__desc" style={{ marginBottom: 10 }}>
            Blank lines drop on save; all blank restores defaults.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {settings.footer_services.map((line, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input
                  type="text"
                  className="alp-input"
                  style={{ flex: 1 }}
                  value={line}
                  onChange={(e) => {
                    const next = [...settings.footer_services];
                    next[i] = e.target.value;
                    setSettings({ ...settings, footer_services: next });
                  }}
                  placeholder={`Line ${i + 1}`}
                  aria-label={`Service line ${i + 1}`}
                />
                <button
                  type="button"
                  onClick={() => {
                    let next = settings.footer_services.filter((_, j) => j !== i);
                    if (next.length === 0) next = [''];
                    setSettings({ ...settings, footer_services: next });
                  }}
                  style={{
                    flexShrink: 0,
                    padding: '8px 10px',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#c62828',
                    background: '#fff5f5',
                    border: '1px solid #ffcdd2',
                    borderRadius: 6,
                    cursor: 'pointer',
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            disabled={settings.footer_services.length >= MAX_FOOTER_SERVICES}
            onClick={() => {
              if (settings.footer_services.length >= MAX_FOOTER_SERVICES) return;
              setSettings({
                ...settings,
                footer_services: [...settings.footer_services, ''],
              });
            }}
            style={{
              marginTop: 8,
              padding: '8px 12px',
              fontSize: 12,
              fontWeight: 600,
              color: '#334155',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 6,
              cursor:
                settings.footer_services.length >= MAX_FOOTER_SERVICES ? 'not-allowed' : 'pointer',
              opacity: settings.footer_services.length >= MAX_FOOTER_SERVICES ? 0.55 : 1,
            }}
          >
            + Line ({settings.footer_services.length}/{MAX_FOOTER_SERVICES})
          </button>
        </section>

        <hr className="alp-divider" />

        <AdminSocialLinksEditor
          settings={settings}
          layout="grid"
          title="Footer social links"
          description="Shown in site footer with brand icons."
          onChange={(key: SocialLinkKey, value: string) =>
            setSettings({ ...settings, [key]: value })
          }
        />

        <button
          type="button"
          className="alp-save alp-save--green"
          onClick={() => save()}
          disabled={saving}
        >
          {saving ? 'Saving…' : 'Save footer & links'}
        </button>
      </div>
    </div>
  );
}
