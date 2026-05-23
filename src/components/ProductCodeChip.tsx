'use client';

type Props = {
  code: string | null | undefined;
  className?: string;
  showRequiredHint?: boolean;
  /** chip = badge, hero = top of product page, order = simple line in order form */
  variant?: 'chip' | 'hero' | 'order';
};

/** Displays auto product ID e.g. CS#12051 */
export default function ProductCodeChip({
  code,
  className = '',
  showRequiredHint = false,
  variant = 'chip',
}: Props) {
  const value = code?.trim()?.toUpperCase();
  if (!value) return null;

  if (variant === 'hero') {
    return (
      <p className={`product-code-hero${className ? ` ${className}` : ''}`}>
        <span className="product-code-hero__label">Product ID</span>
        <span className="product-code-hero__value">{value}</span>
      </p>
    );
  }

  if (variant === 'order') {
    return (
      <p className={`product-code-order${className ? ` ${className}` : ''}`}>
        ID: <strong>{value}</strong>
      </p>
    );
  }

  return (
    <span className={`product-code-chip${className ? ` ${className}` : ''}`}>
      <span className="product-code-chip__label">
        Product ID{showRequiredHint ? <span className="product-code-chip__req">*</span> : null}
      </span>
      <span className="product-code-chip__value">{value}</span>
    </span>
  );
}
