'use client';

import Link from 'next/link';
import { useContactSettings } from '@/context/ContactSettingsContext';

export default function LegalContactBlock() {
  const { settings, loaded } = useContactSettings();

  if (!loaded) return null;

  const phone = settings.phone?.trim();
  const email = settings.email?.trim();
  const address = settings.address?.trim();
  const whatsapp = settings.whatsapp?.trim();

  if (!phone && !email && !address && !whatsapp) return null;

  const waHref = whatsapp
    ? `https://wa.me/${whatsapp.replace(/\D/g, '')}`
    : null;

  return (
    <section
      style={{
        marginTop: '8px',
        padding: '20px 22px',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.08) 0%, rgba(247, 147, 30, 0.05) 100%)',
        border: '2px solid rgba(255, 107, 53, 0.2)',
      }}
    >
      <h2
        style={{
          margin: '0 0 12px',
          fontSize: '20px',
          fontWeight: 700,
          color: '#222',
        }}
      >
        Contact us
      </h2>
      <div style={{ fontSize: '15px', lineHeight: 1.85, color: '#444' }}>
        {phone ? (
          <p style={{ margin: '0 0 8px' }}>
            <strong style={{ color: '#222' }}>Phone:</strong>{' '}
            <a href={`tel:${phone.replace(/\s+/g, '')}`} style={{ color: '#ff6b35', fontWeight: 600 }}>
              {phone}
            </a>
          </p>
        ) : null}
        {email ? (
          <p style={{ margin: '0 0 8px' }}>
            <strong style={{ color: '#222' }}>Email:</strong>{' '}
            <a href={`mailto:${email}`} style={{ color: '#ff6b35', fontWeight: 600 }}>
              {email}
            </a>
          </p>
        ) : null}
        {waHref ? (
          <p style={{ margin: '0 0 8px' }}>
            <strong style={{ color: '#222' }}>WhatsApp:</strong>{' '}
            <a href={waHref} target="_blank" rel="noopener noreferrer" style={{ color: '#ff6b35', fontWeight: 600 }}>
              Message on WhatsApp
            </a>
          </p>
        ) : null}
        {address ? (
          <p style={{ margin: '0 0 8px' }}>
            <strong style={{ color: '#222' }}>Address:</strong> {address}
          </p>
        ) : null}
        <p style={{ margin: '12px 0 0' }}>
          <Link href="/about#contact" style={{ color: '#ff6b35', fontWeight: 600 }}>
            Send us a message →
          </Link>
        </p>
      </div>
    </section>
  );
}
