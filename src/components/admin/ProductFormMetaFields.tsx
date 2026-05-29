'use client';

import type { ProductMeta } from '@/lib/product-meta';
import { isClothesCategory } from '@/lib/clothes-options';
import type { AdminProductTFunction } from '@/lib/admin/product-form-shared';

type Props = {
  meta: ProductMeta;
  onChange: (meta: ProductMeta) => void;
  tagsInput: string;
  onTagsInputChange: (value: string) => void;
  category: string;
  t: AdminProductTFunction;
  fieldErrors: Record<string, string>;
};

type Visibility = 'storefront' | 'admin-only' | 'seo' | 'optional';

function Field({
  label,
  required,
  hint,
  error,
  visibility,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  visibility?: Visibility;
  children: React.ReactNode;
}) {
  const badgeLabel =
    visibility === 'storefront'
      ? 'Shows on shop'
      : visibility === 'admin-only'
        ? 'Admin only'
        : visibility === 'seo'
          ? 'SEO only'
          : visibility === 'optional'
            ? 'Optional'
            : null;

  const badgeClass =
    visibility === 'storefront'
      ? 'pf-badge pf-badge-store'
      : visibility === 'admin-only'
        ? 'pf-badge pf-badge-admin'
        : visibility === 'seo'
          ? 'pf-badge pf-badge-seo'
          : 'pf-badge pf-badge-optional';

  return (
    <div>
      <div className="pf-label-row">
        <label className="pf-label">
          {label}
          {required ? <span className="pf-label-required">*</span> : null}
        </label>
        {badgeLabel ? <span className={badgeClass}>{badgeLabel}</span> : null}
      </div>
      {children}
      {hint ? <p className="pf-hint">{hint}</p> : null}
      {error ? <p className="pf-field-error">⚠️ {error}</p> : null}
    </div>
  );
}

export default function ProductFormMetaFields({
  meta,
  onChange,
  tagsInput,
  onTagsInputChange,
  category,
  t,
  fieldErrors,
}: Props) {
  const set = <K extends keyof ProductMeta>(key: K, value: ProductMeta[K]) => {
    onChange({ ...meta, [key]: value });
  };

  const inputClass = (key: string) =>
    `pf-input${fieldErrors[key] ? ' pf-input-error' : ''}`;

  return (
    <>
      <div className="pf-section">
        <h3 className="pf-section-title">📦 Extra product info</h3>
        <p className="pf-section-desc">{t('admin.form.catalogSectionDesc')}</p>
        <div className="pf-grid-3">
          <Field
            label="Product ID"
            required
            hint="Auto-generated from category when you save (e.g. CS#12051, JY#13011). Shown on shop, orders, and reviews."
            visibility="storefront"
          >
            <div
              className="pf-input"
              style={{
                display: 'flex',
                alignItems: 'center',
                minHeight: 42,
                fontFamily: 'ui-monospace, monospace',
                fontWeight: 700,
                color: meta.sku?.trim() ? '#c2410c' : '#64748b',
                background: '#f8fafc',
                cursor: 'not-allowed',
              }}
              aria-readonly
            >
              {meta.sku?.trim() ? meta.sku.trim().toUpperCase() : 'Generated on save'}
            </div>
          </Field>
          <Field
            label={t('admin.form.brand')}
            hint={t('admin.form.brandHint')}
            visibility="storefront"
          >
            <input
              type="text"
              className={inputClass('brand')}
              value={meta.brand ?? ''}
              onChange={(e) => set('brand', e.target.value)}
              placeholder="Brand name"
            />
          </Field>
          <Field
            label={t('admin.form.stock')}
            hint={t('admin.form.stockHint')}
            visibility="storefront"
          >
            <input
              type="number"
              min={0}
              className={inputClass('stockQuantity')}
              value={meta.stockQuantity ?? 0}
              onChange={(e) => set('stockQuantity', parseInt(e.target.value, 10) || 0)}
              placeholder="0"
            />
          </Field>
        </div>
        <div className="pf-grid-2" style={{ marginTop: '16px' }}>
          <Field
            label={t('admin.form.shortDescription')}
            hint={t('admin.form.shortDescriptionHint')}
            visibility="optional"
          >
            <input
              type="text"
              className={inputClass('shortSummary')}
              value={meta.shortSummary ?? ''}
              onChange={(e) => set('shortSummary', e.target.value)}
              placeholder="Brief line for shop cards only"
            />
          </Field>
          <Field
            label={t('admin.form.tags')}
            hint={t('admin.form.tagsHint')}
            visibility="storefront"
          >
            <input
              type="text"
              className={inputClass('tags')}
              value={tagsInput}
              onChange={(e) => onTagsInputChange(e.target.value)}
              placeholder="summer, cotton, sale"
            />
          </Field>
        </div>
        <div className="pf-grid-2" style={{ marginTop: '16px' }}>
          {isClothesCategory(category) ? (
            <Field
              label={t('admin.form.fabric')}
              hint={t('admin.form.fabricHint')}
              visibility="storefront"
            >
              <input
                type="text"
                className={inputClass('fabric')}
                value={meta.fabric ?? ''}
                onChange={(e) => set('fabric', e.target.value)}
                placeholder="Cotton, lawn, silk…"
              />
            </Field>
          ) : null}
          <Field
            label={t('admin.form.costPrice')}
            hint={t('admin.form.costPriceHint')}
            visibility="admin-only"
          >
            <input
              type="number"
              min={0}
              step={0.01}
              className={inputClass('costPrice')}
              value={meta.costPrice ?? ''}
              onChange={(e) =>
                set('costPrice', e.target.value ? parseFloat(e.target.value) : undefined)
              }
              placeholder="Your cost in PKR"
            />
          </Field>
        </div>
        <div style={{ marginTop: '16px' }}>
          <Field
            label={t('admin.form.pickPoint')}
            hint={t('admin.form.pickPointHint')}
            visibility="admin-only"
          >
            <input
              type="text"
              className={inputClass('pickPoint')}
              value={meta.pickPoint ?? ''}
              onChange={(e) => set('pickPoint', e.target.value)}
              placeholder="e.g. Shelf A3, Group 2, back room rack"
              maxLength={120}
            />
          </Field>
        </div>
      </div>

      <div className="pf-section pf-panel pf-panel-seo" style={{ marginTop: '24px' }}>
        <h3 className="pf-section-title">🔍 SEO (Google & social)</h3>
        <p className="pf-section-desc">{t('admin.form.seoSectionDesc')}</p>
        <div className="pf-grid-2">
          <Field
            label={t('admin.form.seoTitle')}
            hint={t('admin.form.seoTitleHint')}
            visibility="seo"
          >
            <input
              type="text"
              className={inputClass('seoTitle')}
              value={meta.seoTitle ?? ''}
              onChange={(e) => set('seoTitle', e.target.value)}
              placeholder="Title for Google / social"
            />
          </Field>
          <Field
            label={t('admin.form.seoDescription')}
            hint={t('admin.form.seoDescriptionHint')}
            visibility="seo"
          >
            <textarea
              className={`pf-textarea${fieldErrors.seoDescription ? ' pf-input-error' : ''}`}
              rows={3}
              value={meta.seoDescription ?? ''}
              onChange={(e) => set('seoDescription', e.target.value)}
              placeholder="Short meta description"
            />
          </Field>
        </div>
      </div>
    </>
  );
}
