'use client';

import Link from 'next/link';
import {
  useAdminContactSettings,
  type AdminContactSettings,
} from '@/hooks/useAdminContactSettings';

const MAX_FOOTER_SERVICES = 8;

const socialFields: {
  key: keyof Pick<
    AdminContactSettings,
    'social_whatsapp' | 'social_facebook' | 'social_tiktok' | 'social_daraz' | 'social_shopify'
  >;
  aria: string;
  placeholder: string;
}[] = [
  { key: 'social_whatsapp', aria: 'WhatsApp URL', placeholder: 'https://wa.me/923001234567' },
  { key: 'social_facebook', aria: 'Facebook URL', placeholder: 'https://www.facebook.com/yourpage' },
  { key: 'social_tiktok', aria: 'TikTok URL', placeholder: 'https://www.tiktok.com/@yourshop' },
  { key: 'social_daraz', aria: 'Daraz URL', placeholder: 'https://www.daraz.pk/shop/yourstore' },
  { key: 'social_shopify', aria: 'Shopify URL', placeholder: 'https://yourstore.myshopify.com' },
];

export default function LandingFooterPage() {
  const { settings, setSettings, loading, saving, error, success, save } = useAdminContactSettings();

  const inputStyle = {
    width: '100%',
    padding: '11px 14px',
    fontSize: '14px',
    color: '#2c3e50',
    backgroundColor: '#fff',
    border: '2px solid #e0e0e0',
    borderRadius: '10px',
    outline: 'none',
    boxSizing: 'border-box' as const,
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Loading settings…</div>
    );
  }

  return (
    <div
      style={{
        maxWidth: '1180px',
        width: '100%',
        margin: '0 auto',
        padding: '12px 20px 48px',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#1e293b', marginBottom: '6px' }}>
          Footer &amp; site links
        </h1>
        <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
          Contact + services + footer icons. Top orange bar icons are edited on the{' '}
          <Link href="/admin/landing/top-bar" style={{ color: '#3498db', fontWeight: 600 }}>
            Top bar
          </Link>{' '}
          page (WA / Facebook / Daraz / Shopify).
        </p>
      </div>

      {success ? (
        <div
          style={{
            background: '#d4edda',
            color: '#155724',
            padding: '12px 16px',
            borderRadius: '10px',
            marginBottom: '16px',
            fontSize: '14px',
          }}
        >
          {success}
        </div>
      ) : null}
      {error ? (
        <div
          style={{
            background: '#ffebee',
            color: '#c62828',
            padding: '12px 16px',
            borderRadius: '10px',
            marginBottom: '16px',
            fontSize: '14px',
          }}
        >
          {error}
        </div>
      ) : null}

      <div
        style={{
          background: '#fff',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          padding: 'clamp(20px, 3vw, 32px)',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
            gap: '28px',
            alignItems: 'start',
          }}
        >
          <section style={{ minWidth: 0 }}>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#2c3e50', marginBottom: '14px' }}>
              Contact
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
                gap: '14px 18px',
              }}
            >
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: '#475569' }}>
                  WhatsApp number <span style={{ color: '#e74c3c' }}>*</span>
                </label>
                <input
                  type="text"
                  value={settings.whatsapp}
                  onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })}
                  placeholder="923001234567"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: '#475569' }}>
                  Phone
                </label>
                <input
                  type="text"
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  placeholder="+92 300 1234567"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: '#475569' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  placeholder="info@stylesnest.com"
                  style={inputStyle}
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: '#475569' }}>
                  Address
                </label>
                <input
                  type="text"
                  value={settings.address}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  placeholder="City, Pakistan"
                  style={inputStyle}
                />
              </div>
            </div>
          </section>

          <section style={{ minWidth: 0 }}>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#2c3e50', marginBottom: '10px' }}>
              Footer — Services
            </h2>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '12px', lineHeight: 1.45 }}>
              Blank lines drop on save; all blank restores defaults.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {settings.footer_services.map((line, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={line}
                    onChange={(e) => {
                      const next = [...settings.footer_services];
                      next[i] = e.target.value;
                      setSettings({ ...settings, footer_services: next });
                    }}
                    placeholder={`Line ${i + 1}`}
                    aria-label={`Service line ${i + 1}`}
                    style={{ ...inputStyle, flex: 1 }}
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
                      padding: '10px 12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#c62828',
                      background: '#fff5f5',
                      border: '1px solid #ffcdd2',
                      borderRadius: '8px',
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
                marginTop: '10px',
                padding: '9px 14px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#334155',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                cursor: settings.footer_services.length >= MAX_FOOTER_SERVICES ? 'not-allowed' : 'pointer',
                opacity: settings.footer_services.length >= MAX_FOOTER_SERVICES ? 0.55 : 1,
              }}
            >
              + Line ({settings.footer_services.length}/{MAX_FOOTER_SERVICES})
            </button>
          </section>
        </div>

        <div
          style={{
            marginTop: '28px',
            paddingTop: '24px',
            borderTop: '1px solid #eee',
          }}
        >
          <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#2c3e50', marginBottom: '12px' }}>
            Footer social icons (URLs)
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 220px), 1fr))',
              gap: '12px',
            }}
          >
            {socialFields.map(({ key, aria, placeholder }) => (
              <input
                key={key}
                type="url"
                aria-label={aria}
                value={settings[key]}
                onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
                placeholder={placeholder}
                style={inputStyle}
              />
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => save()}
          disabled={saving}
          style={{
            marginTop: '28px',
            width: '100%',
            maxWidth: '420px',
            padding: '14px 24px',
            fontSize: '15px',
            fontWeight: 700,
            color: '#fff',
            backgroundColor: saving ? '#95a5a6' : '#4CAF50',
            border: 'none',
            borderRadius: '10px',
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? 'Saving…' : 'Save footer & links'}
        </button>
      </div>
    </div>
  );
}
