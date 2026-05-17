'use client';

import type { Product } from '@/data/products';
import { ClothesColorSelector, ClothesSizeSelector } from '@/components/ClothesImageBadges';
import { productNeedsCartOptions } from '@/lib/cart-line-options';
import type { CartLineOptions } from '@/lib/cart-line-options';

type CartLineOptionsEditorProps = {
  product: Product;
  value: CartLineOptions;
  onChange: (options: CartLineOptions) => void;
};

export default function CartLineOptionsEditor({
  product,
  value,
  onChange,
}: CartLineOptionsEditorProps) {
  if (!productNeedsCartOptions(product)) return null;

  return (
    <div className="mt-3 flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
      <ClothesSizeSelector
        product={product}
        value={value.selectedSize ?? ''}
        onChange={(selectedSize) => onChange({ ...value, selectedSize })}
      />
      <ClothesColorSelector
        product={product}
        value={value.selectedColor ?? ''}
        onChange={(selectedColor) => onChange({ ...value, selectedColor })}
      />
    </div>
  );
}
