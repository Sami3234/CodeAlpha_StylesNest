'use client';

import type { Product } from '@/data/products';
import { categoryColorsRequired, getProductAvailableColors } from '@/lib/product-colors';
import './color-selector.css';

type Props = {
  product: Product;
  value: string;
  onChange: (color: string) => void;
  embedded?: boolean;
  idPrefix?: string;
};

/** Shows admin-defined color names only (no auto hex swatches). */
export default function ProductColorSelector({
  product,
  value,
  onChange,
  embedded = false,
  idPrefix = 'color',
}: Props) {
  const colors = getProductAvailableColors(product);
  if (colors.length === 0) return null;

  const colorRequired = categoryColorsRequired(product.category) || colors.length > 0;
  const groupId = `${idPrefix}-color-group`;

  return (
    <div className={`color-selector${embedded ? ' color-selector--embedded' : ''}`}>
      <span className="color-selector__label" id={`${groupId}-label`}>
        Select Color
        {colorRequired ? <span className="order-form-required">*</span> : null}
      </span>
      <div
        className="color-selector__grid"
        role="listbox"
        aria-labelledby={`${groupId}-label`}
        id={groupId}
      >
        {colors.map((color) => {
          const selected = value === color;
          return (
            <button
              key={color}
              type="button"
              role="option"
              aria-selected={selected}
              className={`color-selector__chip color-selector__chip--text${selected ? ' is-selected' : ''}`}
              onClick={() => onChange(color)}
            >
              {color}
            </button>
          );
        })}
      </div>
      {colorRequired && !value ? (
        <p className="color-selector__hint">Choose a color you added for this product</p>
      ) : null}
    </div>
  );
}
