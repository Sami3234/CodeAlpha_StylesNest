'use client';

import {
  FOOTER_SOCIAL_FIELDS,
  normalizeSocialHref,
  socialLinkPreviewLabel,
  type SocialLinkFieldConfig,
  type SocialLinkKey,
} from '@/lib/admin-social-links';
import type { AdminContactSettings } from '@/hooks/useAdminContactSettings';
import SocialBrandIcon, { socialBrandColor } from '@/components/SocialBrandIcon';
import './admin-social-links-editor.css';

type Props = {
  settings: AdminContactSettings;
  onChange: (key: SocialLinkKey, value: string) => void;
  fields?: SocialLinkFieldConfig[];
  title?: string;
  description?: string;
  /** 2-column compact grid (top bar — 4 icons) */
  layout?: 'grid' | 'stack';
};

export default function AdminSocialLinksEditor({
  settings,
  onChange,
  fields = FOOTER_SOCIAL_FIELDS,
  title = 'Social links',
  description = 'Saved links appear on the site. Leave blank to hide.',
  layout = 'stack',
}: Props) {
  return (
    <section className={`asle${layout === 'grid' ? ' asle--grid' : ''}`}>
      <div className="asle__head">
        <h2 className="asle__title">{title}</h2>
        {description ? <p className="asle__desc">{description}</p> : null}
      </div>

      <div className="asle__list">
        {fields.map((field) => {
          const value = settings[field.key] ?? '';
          const href = value.trim() ? normalizeSocialHref(value) : '';
          const active = Boolean(href);
          const brand = socialBrandColor(field.key);

          return (
            <article
              key={field.key}
              className={`asle-card${active ? ' asle-card--active' : ''}${layout === 'grid' ? ' asle-card--compact' : ''}`}
            >
              <div className="asle-card__row">
                <span
                  className="asle-card__icon"
                  style={{ background: brand, color: field.key === 'social_tiktok' ? '#fff' : '#fff' }}
                  aria-hidden
                >
                  <SocialBrandIcon platform={field.key} size={layout === 'grid' ? 18 : 20} />
                </span>
                <div className="asle-card__body">
                  <div className="asle-card__title-row">
                    <h3 className="asle-card__label">{field.label}</h3>
                    {active ? (
                      <span className="asle-card__status asle-card__status--on">On</span>
                    ) : (
                      <span className="asle-card__status">Off</span>
                    )}
                  </div>
                  <input
                    type="url"
                    value={value}
                    onChange={(e) => onChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="asle-card__input"
                    aria-label={`${field.label} URL`}
                  />
                  {active ? (
                    <div className="asle-card__foot">
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="asle-card__link"
                      >
                        {socialLinkPreviewLabel(value)}
                      </a>
                      <button
                        type="button"
                        className="asle-card__clear"
                        onClick={() => onChange(field.key, '')}
                      >
                        Clear
                      </button>
                    </div>
                  ) : (
                    <p className="asle-card__hint">{field.hint}</p>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
