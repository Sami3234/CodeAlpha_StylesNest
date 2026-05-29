import { getDefaultLegalPages } from '@/lib/legal-pages-defaults';
import {
  LEGAL_PAGE_SLUGS,
  type LegalPageContent,
  type LegalPageSlug,
  type LegalPagesStore,
  type LegalSection,
} from '@/lib/legal-pages-types';

const MAX_SECTIONS = 24;
const MAX_PARAGRAPHS = 12;
const MAX_BULLETS = 16;
const MAX_TEXT = 4000;
const MAX_TITLE = 120;

function cleanText(value: unknown, max = MAX_TEXT): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

function slugifyId(title: string, index: number): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  return base || `section-${index + 1}`;
}

function sanitizeSection(raw: unknown, index: number): LegalSection | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const title = cleanText(r.title, MAX_TITLE);
  if (!title) return null;

  const paragraphs = Array.isArray(r.paragraphs)
    ? r.paragraphs
        .map((p) => cleanText(p))
        .filter(Boolean)
        .slice(0, MAX_PARAGRAPHS)
    : [];

  const bullets = Array.isArray(r.bullets)
    ? r.bullets
        .map((b) => cleanText(b, 500))
        .filter(Boolean)
        .slice(0, MAX_BULLETS)
    : undefined;

  if (paragraphs.length === 0 && (!bullets || bullets.length === 0)) {
    return null;
  }

  const id = cleanText(r.id, 60) || slugifyId(title, index);

  return {
    id,
    title,
    paragraphs: paragraphs.length > 0 ? paragraphs : [''],
    ...(bullets && bullets.length > 0 ? { bullets } : {}),
  };
}

export function sanitizeLegalPageContent(raw: unknown, slug: LegalPageSlug): LegalPageContent {
  const fallback = getDefaultLegalPages()[slug];
  if (!raw || typeof raw !== 'object') return { ...fallback };

  const r = raw as Record<string, unknown>;
  const title = cleanText(r.title, MAX_TITLE) || fallback.title;
  const intro = cleanText(r.intro, MAX_TEXT) || fallback.intro;

  const sectionsRaw = Array.isArray(r.sections) ? r.sections : [];
  const sections = sectionsRaw
    .map((s, i) => sanitizeSection(s, i))
    .filter((s): s is LegalSection => s !== null)
    .slice(0, MAX_SECTIONS);

  return {
    title,
    intro,
    sections: sections.length > 0 ? sections : fallback.sections,
  };
}

export function sanitizeLegalPages(raw: unknown): LegalPagesStore {
  const defaults = getDefaultLegalPages();
  if (!raw || typeof raw !== 'object') return defaults;

  const r = raw as Record<string, unknown>;
  const out = { ...defaults };

  for (const slug of LEGAL_PAGE_SLUGS) {
    if (r[slug] != null) {
      out[slug] = sanitizeLegalPageContent(r[slug], slug);
    }
  }

  return out;
}

export function parseLegalPagesJson(raw: string | null | undefined): LegalPagesStore {
  if (!raw || !raw.trim()) return getDefaultLegalPages();
  try {
    return sanitizeLegalPages(JSON.parse(raw));
  } catch {
    return getDefaultLegalPages();
  }
}

export function legalPagesToJson(pages: LegalPagesStore): string {
  return JSON.stringify(sanitizeLegalPages(pages));
}
