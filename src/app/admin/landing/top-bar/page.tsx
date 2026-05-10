'use client';

import Link from 'next/link';
import { useAdminContactSettings } from '@/hooks/useAdminContactSettings';

const iconLinkPlaceholders: {
  key: 'social_whatsapp' | 'social_facebook' | 'social_daraz' | 'social_shopify';
  aria: string;
  placeholder: string;
}[] = [
  { key: 'social_whatsapp', aria: 'WhatsApp URL', placeholder: 'https://wa.me/923001234567' },
  { key: 'social_facebook', aria: 'Facebook URL', placeholder: 'https://www.facebook.com/yourpage' },
  { key: 'social_daraz', aria: 'Daraz URL', placeholder: 'https://www.daraz.pk/shop/yourstore' },
  { key: 'social_shopify', aria: 'Shopify URL', placeholder: 'https://yourstore.myshopify.com' },
];

export default function LandingTopBarPage() {
  const { settings, setSettings, loading, saving, error, success, save } = useAdminContactSettings();

  const setTopBarUrlAt = (index: number, value: string) => {
    const next = [...settings.top_bar_links];
    while (next.length <= index) next.push('');
    next[index] = value;
    setSettings({ ...settings, top_bar_links: next.slice(0, 4) });
  };

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
          Top announcement bar
        </h1>
        <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
          Extra URLs below appear <strong>only</strong> on the orange top bar (short text is chosen from each URL). Icon row:
          WhatsApp / Facebook / Daraz / Shopify fields — WA falls back to footer number if URL empty.
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', minWidth: 0 }}>
            <label style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>Marquee</label>
            <textarea
              value={settings.announcement_text}
              onChange={(e) => setSettings({ ...settings, announcement_text: e.target.value })}
              placeholder="STORE | FREE DELIVERY — Shop now."
              rows={5}
              style={{ ...inputStyle, resize: 'vertical', minHeight: '120px' }}
            />
            <label style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>Customer care</label>
            <input
              type="text"
              value={settings.customer_care_url}
              onChange={(e) => setSettings({ ...settings, customer_care_url: e.target.value })}
              placeholder="/about or https://..."
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', minWidth: 0 }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: '12px',
              }}
              aria-label="Top bar icon links"
            >
              {iconLinkPlaceholders.map(({ key, aria, placeholder }) => (
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

            <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
              Extra links — URLs only (max 4), top bar only
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: '12px',
              }}
            >
              {[0, 1, 2, 3].map((i) => (
                <input
                  key={i}
                  type="text"
                  value={settings.top_bar_links[i] ?? ''}
                  onChange={(e) => setTopBarUrlAt(i, e.target.value)}
                  placeholder="/shop/sale or https://..."
                  aria-label={`Top bar extra link ${i + 1}`}
                  style={inputStyle}
                />
              ))}
            </div>
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
            backgroundColor: saving ? '#95a5a6' : '#3498db',
            border: 'none',
            borderRadius: '10px',
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? 'Saving…' : 'Save top bar'}
        </button>
      </div>
    </div>
  );
}
