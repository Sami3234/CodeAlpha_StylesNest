'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import LegalContactBlock from '@/components/legal/LegalContactBlock';
import { getDefaultLegalPage } from '@/lib/legal-pages-defaults';
import { legalPagePaths, type LegalPageContent, type LegalPageSlug } from '@/lib/legal-pages-types';
import './legal-page.css';

const pageShellStyle = {
  minHeight: '100vh',
  background: 'linear-gradient(180deg, #f5f7fa 0%, #eef2f6 50%, #f5f7fa 100%)',
  paddingTop: 'var(--site-header-h, 90px)',
} as const;

const gradientTitleStyle = {
  fontSize: 'clamp(2rem, 5vw, 3rem)',
  fontWeight: 700,
  background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ff8c42 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  marginBottom: '16px',
} as const;

const cardStyle = {
  background: '#ffffff',
  borderRadius: '20px',
  padding: 'clamp(24px, 6vw, 50px) clamp(16px, 4vw, 40px)',
  boxShadow: '0px 10px 40px rgba(0, 0, 0, 0.08)',
} as const;

type Props = {
  slug: LegalPageSlug;
};

export default function LegalPageView({ slug }: Props) {
  const fallback = getDefaultLegalPage(slug);
  const [content, setContent] = useState<LegalPageContent>(fallback);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/legal-pages', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data?.success && data.pages?.[slug]) {
          setContent(data.pages[slug] as LegalPageContent);
        }
      })
      .catch(() => {
        /* keep defaults */
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const sections = content.sections ?? fallback.sections;

  return (
    <>
      <Header />
      <main style={pageShellStyle}>
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ padding: '48px 20px 32px', textAlign: 'center' }}
        >
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <motion.h1
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              style={gradientTitleStyle}
            >
              {content.title || fallback.title}
            </motion.h1>
            {(content.intro || fallback.intro) && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                style={{
                  fontSize: '18px',
                  color: '#666',
                  maxWidth: '720px',
                  margin: '0 auto',
                  lineHeight: 1.75,
                }}
              >
                {content.intro || fallback.intro}
              </motion.p>
            )}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          style={{ padding: '0 20px 40px', maxWidth: '1200px', margin: '0 auto' }}
        >
          <div style={cardStyle}>
            {!ready ? (
              <div className="legal-page-placeholder" role="status" aria-live="polite" aria-busy="true">
                <p className="legal-page-placeholder__status">
                  <span className="legal-page-placeholder__spinner" aria-hidden />
                  Loading content…
                </p>
                {[0, 1, 2].map((block) => (
                  <div key={block} className="legal-page-placeholder__section" aria-hidden>
                    <div className="legal-page-placeholder__heading" />
                    <div className="legal-page-placeholder__lines">
                      <div className="legal-page-placeholder__line legal-page-placeholder__line--full" />
                      <div className="legal-page-placeholder__line legal-page-placeholder__line--med" />
                      <div className="legal-page-placeholder__line legal-page-placeholder__line--short" />
                    </div>
                  </div>
                ))}
                <div className="legal-page-placeholder__contact" aria-hidden />
              </div>
            ) : (
              <>
            {sections.map((section, index) => (
              <motion.section
                key={section.id}
                id={section.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: index * 0.03 }}
                style={{
                  marginBottom: index < sections.length - 1 ? '28px' : 0,
                  paddingBottom: index < sections.length - 1 ? '28px' : 0,
                  borderBottom:
                    index < sections.length - 1 ? '1px solid #f0f0f0' : undefined,
                }}
              >
                <h2
                  style={{
                    fontSize: '22px',
                    fontWeight: 700,
                    color: '#222',
                    margin: '0 0 12px',
                  }}
                >
                  {section.title}
                </h2>
                {section.paragraphs.map((p, i) => (
                  <p
                    key={i}
                    style={{
                      margin: '0 0 12px',
                      fontSize: '16px',
                      lineHeight: 1.85,
                      color: '#444',
                    }}
                  >
                    {p}
                  </p>
                ))}
                {section.bullets?.length ? (
                  <ul
                    style={{
                      margin: '0 0 8px',
                      paddingLeft: '1.35rem',
                      fontSize: '16px',
                      lineHeight: 1.85,
                      color: '#444',
                    }}
                  >
                    {section.bullets.map((item) => (
                      <li key={item} style={{ marginBottom: '8px' }}>
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </motion.section>
            ))}

            <LegalContactBlock />
              </>
            )}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{
            padding: '0 20px 60px',
            maxWidth: '1200px',
            margin: '0 auto',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#666',
              marginBottom: '14px',
            }}
          >
            Related policies
          </p>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '10px',
            }}
          >
            {legalPagePaths.map((page) => (
              <Link
                key={page.slug}
                href={page.path}
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: page.slug === slug ? '#fff' : '#ff6b35',
                  textDecoration: 'none',
                  padding: '10px 18px',
                  borderRadius: '25px',
                  border:
                    page.slug === slug
                      ? 'none'
                      : '2px solid rgba(255, 107, 53, 0.35)',
                  background:
                    page.slug === slug
                      ? 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ff8c42 100%)'
                      : '#fff',
                  boxShadow:
                    page.slug === slug
                      ? '0px 6px 20px rgba(255, 107, 53, 0.35)'
                      : 'none',
                }}
              >
                {page.label}
              </Link>
            ))}
          </div>
        </motion.section>
      </main>
      <Footer />
    </>
  );
}
