'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import AdminLoading from '@/components/admin/AdminLoading';
import ConnectionProblem from '@/components/network/ConnectionProblem';
import { clientFetch, NetworkError } from '@/lib/client-fetch';
import type { FetchErrorKind } from '@/lib/is-network-error';
import { getDefaultLegalPages } from '@/lib/legal-pages-defaults';
import {
  LEGAL_PAGE_SLUGS,
  legalPageMeta,
  type LegalPageContent,
  type LegalPageSlug,
  type LegalPagesStore,
  type LegalSection,
} from '@/lib/legal-pages-types';
import '../admin-landing.css';

function paragraphsToText(paragraphs: string[]): string {
  return paragraphs.join('\n\n');
}

function textToParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function bulletsToText(bullets?: string[]): string {
  return bullets?.join('\n') ?? '';
}

function textToBullets(text: string): string[] | undefined {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  return lines.length > 0 ? lines : undefined;
}

export default function AdminLegalPagesPage() {
  const [pages, setPages] = useState<LegalPagesStore>(() => getDefaultLegalPages());
  const [active, setActive] = useState<LegalPageSlug>('privacy-policy');
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
      const res = await clientFetch('/api/admin/legal-pages');
      const data = await res.json();
      if (res.ok && data.success && data.pages) {
        setPages({ ...getDefaultLegalPages(), ...data.pages });
      } else {
        setError(data.error || 'Failed to load');
      }
    } catch (err) {
      if (err instanceof NetworkError) setFetchError(err.kind);
      else setError('Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const updatePage = (patch: Partial<LegalPageContent>) => {
    setPages((prev) => ({
      ...prev,
      [active]: { ...prev[active], ...patch },
    }));
  };

  const updateSection = (index: number, patch: Partial<LegalSection>) => {
    setPages((prev) => {
      const page = prev[active];
      const sections = [...page.sections];
      sections[index] = { ...sections[index], ...patch };
      return { ...prev, [active]: { ...page, sections } };
    });
  };

  const addSection = () => {
    setPages((prev) => {
      const page = prev[active];
      return {
        ...prev,
        [active]: {
          ...page,
          sections: [
            ...page.sections,
            {
              id: `section-${page.sections.length + 1}`,
              title: 'New section',
              paragraphs: ['Add your text here.'],
            },
          ],
        },
      };
    });
  };

  const removeSection = (index: number) => {
    setPages((prev) => {
      const page = prev[active];
      if (page.sections.length <= 1) return prev;
      return {
        ...prev,
        [active]: {
          ...page,
          sections: page.sections.filter((_, i) => i !== index),
        },
      };
    });
  };

  const save = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await clientFetch('/api/admin/legal-pages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pages }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess('Policies saved. They will appear on the live site.');
        setTimeout(() => setSuccess(''), 4000);
        if (data.pages) setPages(data.pages);
      } else {
        setError(data.error || 'Save failed');
      }
    } catch (err) {
      if (err instanceof NetworkError) {
        setError(
          err.kind === 'offline'
            ? 'You are offline. Reconnect to save.'
            : 'Connection problem — try again.',
        );
      } else {
        setError('Save failed');
      }
    } finally {
      setSaving(false);
    }
  };

  const resetCurrent = () => {
    if (!confirm(`Reset "${legalPageMeta[active].adminLabel}" to default text?`)) return;
    setPages((prev) => ({
      ...prev,
      [active]: getDefaultLegalPages()[active],
    }));
  };

  if (loading) {
    return <AdminLoading message="Loading policies" subMessage="Legal pages" />;
  }

  if (fetchError) {
    return (
      <ConnectionProblem
        theme="admin"
        kind={fetchError}
        onRetry={() => void load()}
        homeHref="/khanadmin"
        homeLabel="Dashboard"
      />
    );
  }

  const page = pages[active];

  return (
    <div className="alp-page alp-page--wide">
      <header className="alp-head">
        <h1>Policies &amp; legal pages</h1>
        <p>
          Edit Privacy, Terms, Shipping, and Returns. Contact details come from{' '}
          <Link href="/khanadmin/landing/footer" style={{ color: '#3498db', fontWeight: 600 }}>
            Footer &amp; links
          </Link>{' '}
          and show automatically at the bottom of each policy page.
        </p>
      </header>

      {success ? <div className="alp-alert alp-alert--ok">{success}</div> : null}
      {error ? <div className="alp-alert alp-alert--err">{error}</div> : null}

      <div className="alp-card">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {LEGAL_PAGE_SLUGS.map((slug) => (
            <button
              key={slug}
              type="button"
              onClick={() => setActive(slug)}
              style={{
                padding: '10px 16px',
                borderRadius: 8,
                border: active === slug ? '2px solid #3498db' : '1px solid #e2e8f0',
                background: active === slug ? '#ebf5fb' : '#fff',
                fontWeight: active === slug ? 700 : 500,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              {legalPageMeta[slug].adminLabel}
            </button>
          ))}
        </div>

        <section className="alp-section">
          <label className="alp-label">Page title</label>
          <input
            type="text"
            className="alp-input"
            value={page.title}
            onChange={(e) => updatePage({ title: e.target.value })}
          />
        </section>

        <section className="alp-section" style={{ marginTop: 12 }}>
          <label className="alp-label">Short intro (shown under title)</label>
          <textarea
            className="alp-input"
            rows={3}
            value={page.intro}
            onChange={(e) => updatePage({ intro: e.target.value })}
            style={{ resize: 'vertical', minHeight: 72 }}
          />
        </section>

        <hr className="alp-divider" />

        <h2 className="asle__title" style={{ marginBottom: 8 }}>
          Sections
        </h2>
        <p className="asle__desc" style={{ marginBottom: 14 }}>
          Write in simple language. Separate paragraphs with a blank line. Use bullet lines for lists.
        </p>

        {page.sections.map((section, index) => (
          <div
            key={`${section.id}-${index}`}
            style={{
              marginBottom: 16,
              padding: 14,
              border: '1px solid #e8ecf0',
              borderRadius: 10,
              background: '#fafbfc',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
              <label className="alp-label" style={{ margin: 0 }}>
                Section {index + 1} title
              </label>
              {page.sections.length > 1 ? (
                <button
                  type="button"
                  onClick={() => removeSection(index)}
                  style={{
                    fontSize: 12,
                    color: '#c0392b',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Remove
                </button>
              ) : null}
            </div>
            <input
              type="text"
              className="alp-input"
              value={section.title}
              onChange={(e) => updateSection(index, { title: e.target.value })}
              style={{ marginBottom: 8 }}
            />
            <label className="alp-label">Content</label>
            <textarea
              className="alp-input"
              rows={5}
              value={paragraphsToText(section.paragraphs)}
              onChange={(e) =>
                updateSection(index, { paragraphs: textToParagraphs(e.target.value) })
              }
              style={{ resize: 'vertical', marginBottom: 8 }}
            />
            <label className="alp-label">Bullet points (one per line, optional)</label>
            <textarea
              className="alp-input"
              rows={3}
              value={bulletsToText(section.bullets)}
              onChange={(e) =>
                updateSection(index, { bullets: textToBullets(e.target.value) })
              }
              style={{ resize: 'vertical' }}
            />
          </div>
        ))}

        <button
          type="button"
          onClick={addSection}
          style={{
            marginBottom: 16,
            padding: '8px 14px',
            fontSize: 13,
            fontWeight: 600,
            border: '1px dashed #94a3b8',
            borderRadius: 8,
            background: '#fff',
            cursor: 'pointer',
          }}
        >
          + Add section
        </button>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <button type="button" className="alp-save alp-save--green" onClick={() => void save()} disabled={saving}>
            {saving ? 'Saving…' : 'Save all policies'}
          </button>
          <button
            type="button"
            onClick={resetCurrent}
            style={{
              padding: '12px 18px',
              fontSize: 14,
              fontWeight: 600,
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              background: '#fff',
              cursor: 'pointer',
            }}
          >
            Reset this page to defaults
          </button>
          <Link
            href={legalPageMeta[active].path}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '12px 18px',
              fontSize: 14,
              fontWeight: 600,
              color: '#3498db',
            }}
          >
            Preview live page ↗
          </Link>
        </div>
      </div>
    </div>
  );
}
