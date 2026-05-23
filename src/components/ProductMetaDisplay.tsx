'use client';

import { motion } from 'framer-motion';
import type { Product } from '@/data/products';
import {
  getProductMetaDisplayRows,
  getProductMetaTags,
  hasCustomerProductMeta,
} from '@/lib/product-meta-display';

const valueColors = {
  success: '#2f855a',
  warning: '#c05621',
  danger: '#c53030',
  default: '#1a202c',
};

type ProductMetaDisplayProps = {
  product: Product;
  /** compact = shop chips; full = boxed section; embedded = compact inside product-details-card */
  variant?: 'compact' | 'full' | 'embedded';
  /** Hide inner heading when wrapped in an outer card title */
  hideTitle?: boolean;
  /** Hide Product ID row when shown elsewhere on the page */
  hideProductId?: boolean;
};

export function ProductShortSummary({
  product,
  compact = false,
}: {
  product: Product;
  compact?: boolean;
}) {
  const text = product.productMeta?.shortSummary?.trim();
  if (!text) return null;

  return (
    <p
      className={compact ? 'line-clamp-2' : undefined}
      style={{
        margin: compact ? '0 0 8px' : '0 0 16px',
        fontSize: compact ? '13px' : '16px',
        lineHeight: 1.5,
        color: '#4a5568',
        fontWeight: 500,
      }}
    >
      {text}
    </p>
  );
}

export default function ProductMetaDisplay({
  product,
  variant = 'full',
  hideTitle = false,
  hideProductId = false,
}: ProductMetaDisplayProps) {
  const meta = product.productMeta;
  if (!hasCustomerProductMeta(meta)) return null;

  const rows = getProductMetaDisplayRows(meta).filter(
    (row) => !hideProductId || row.label !== 'Product ID',
  );
  const tags = getProductMetaTags(meta);

  if (variant === 'compact' && rows.length === 0 && tags.length === 0) {
    return null;
  }

  if (variant === 'compact') {
    return (
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          marginBottom: '16px',
        }}
      >
        {rows.map((row) => (
          <span
            key={row.label}
            style={{
              fontSize: '13px',
              padding: '6px 12px',
              borderRadius: '20px',
              background: 'rgba(102, 126, 234, 0.08)',
              color: valueColors[row.highlight ?? 'default'],
              fontWeight: 600,
            }}
          >
            {row.label}: {row.value}
          </span>
        ))}
        {tags.map((tag) => (
          <span
            key={tag}
            style={{
              fontSize: '12px',
              padding: '5px 10px',
              borderRadius: '16px',
              background: '#edf2f7',
              color: '#4a5568',
              fontWeight: 500,
            }}
          >
            #{tag}
          </span>
        ))}
      </div>
    );
  }

  if (variant === 'embedded') {
    if (rows.length === 0 && tags.length === 0) return null;

    return (
      <div className="product-details-body">
        {rows.length > 0 ? (
          <dl className="product-details-specs">
            {rows.map((row) => (
              <div key={row.label} className="product-details-spec">
                <dt className="product-details-spec__label">{row.label}</dt>
                <dd
                  className={`product-details-spec__value${
                    row.highlight ? ` product-details-spec__value--${row.highlight}` : ''
                  }`}
                >
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
        {tags.length > 0 ? (
          <div className="product-details-tags-row">
            <span className="product-details-tags__label">Tags</span>
            <div className="product-details-tags" aria-label="Product tags">
              {tags.map((tag) => (
                <span key={tag} className="product-details-tag">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.55 }}
      style={{
        marginTop: hideTitle ? 0 : '20px',
        padding: hideTitle ? 0 : '20px',
        borderRadius: hideTitle ? 0 : '16px',
        background: hideTitle ? 'transparent' : 'linear-gradient(145deg, #f8fafc 0%, #edf2f7 100%)',
        border: hideTitle ? 'none' : '1px solid rgba(102, 126, 234, 0.15)',
      }}
    >
      {!hideTitle ? (
        <h4
          style={{
            margin: '0 0 14px',
            fontSize: '15px',
            fontWeight: 700,
            color: '#2d3748',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          Product details
        </h4>
      ) : null}
      <dl
        style={{
          margin: 0,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: '12px 20px',
        }}
      >
        {rows.map((row) => (
          <motion.div key={row.label}>
            <dt
              style={{
                margin: 0,
                fontSize: '11px',
                fontWeight: 600,
                color: '#718096',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {row.label}
            </dt>
            <dd
              style={{
                margin: '4px 0 0',
                fontSize: '15px',
                fontWeight: 600,
                color: valueColors[row.highlight ?? 'default'],
              }}
            >
              {row.value}
            </dd>
          </motion.div>
        ))}
      </dl>
      {tags.length > 0 ? (
        <div style={{ marginTop: '14px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {tags.map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: '12px',
                padding: '6px 12px',
                borderRadius: '20px',
                background: '#fff',
                border: '1px solid #e2e8f0',
                color: '#5a67d8',
                fontWeight: 600,
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}
    </motion.div>
  );
}
