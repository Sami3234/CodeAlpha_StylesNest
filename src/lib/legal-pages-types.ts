export type LegalSection = {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

export type LegalPageContent = {
  title: string;
  intro: string;
  sections: LegalSection[];
};

export const LEGAL_PAGE_SLUGS = [
  'privacy-policy',
  'terms',
  'shipping-delivery',
  'returns-refunds',
] as const;

export type LegalPageSlug = (typeof LEGAL_PAGE_SLUGS)[number];

export type LegalPagesStore = Record<LegalPageSlug, LegalPageContent>;

export const legalPageMeta: Record<
  LegalPageSlug,
  { path: string; label: string; adminLabel: string }
> = {
  'privacy-policy': {
    path: '/privacy-policy',
    label: 'Privacy Policy',
    adminLabel: 'Privacy Policy',
  },
  terms: { path: '/terms', label: 'Terms & Conditions', adminLabel: 'Terms & Conditions' },
  'shipping-delivery': {
    path: '/shipping-delivery',
    label: 'Shipping & Delivery',
    adminLabel: 'Shipping & Delivery',
  },
  'returns-refunds': {
    path: '/returns-refunds',
    label: 'Returns & Refunds',
    adminLabel: 'Returns & Refunds',
  },
};

export const legalPagePaths = LEGAL_PAGE_SLUGS.map((slug) => ({
  slug,
  path: legalPageMeta[slug].path,
  label: legalPageMeta[slug].label,
}));
