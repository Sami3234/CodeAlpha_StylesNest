'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import type { Product } from '@/data/products';
import { ClothesColorSelector, ClothesSizeSelector } from '@/components/ClothesImageBadges';
import { validateCartLineOptions, type CartLineOptions } from '@/lib/cart-line-options';
import { getProductTitle } from '@/utils/getProductText';
import { formatPrice } from '@/utils/formatPrice';
import { getLineTotal } from '@/lib/product-pricing';
import { isOutOfStock, getMaxPurchasableQuantity } from '@/lib/product-stock';
import { useCart } from '@/context/CartContext';
import '@/app/cart/cart-page.css';

type AddToCartOptionsModalProps = {
  product: Product;
  open: boolean;
  onClose: () => void;
  onConfirm: (options: CartLineOptions, quantity: number) => void;
};

export default function AddToCartOptionsModal({
  product,
  open,
  onClose,
  onConfirm,
}: AddToCartOptionsModalProps) {
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [modalSession, setModalSession] = useState({ open: false, productId: product.id });
  const { lines } = useCart();

  if (open && (!modalSession.open || modalSession.productId !== product.id)) {
    setModalSession({ open: true, productId: product.id });
    setSelectedSize('');
    setSelectedColor('');
    setQuantity(1);
    setError(null);
  } else if (!open && modalSession.open) {
    setModalSession({ open: false, productId: product.id });
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const title = getProductTitle(product);
  const outOfStock = isOutOfStock(product);
  const maxQty = getMaxPurchasableQuantity(product, lines);
  const lineTotal = getLineTotal(product, quantity);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const options: CartLineOptions = { selectedSize, selectedColor };
    if (outOfStock) {
      setError('This item is out of stock.');
      return;
    }
    const result = validateCartLineOptions(product, options);
    if (!result.valid) {
      setError(result.error ?? 'Please complete all required options.');
      return;
    }
    if (quantity > maxQty) {
      setError(maxQty <= 0 ? 'Out of stock' : `Only ${maxQty} can be added.`);
      return;
    }
    onConfirm(options, quantity);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-200 flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-cart-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-[rgba(102,126,234,0.25)] bg-white p-5 shadow-2xl sm:p-6">
        <div className="mb-4 flex gap-3">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
            <Image
              src={product.image}
              alt={title}
              fill
              className="object-cover"
              sizes="64px"
              unoptimized
            />
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="add-cart-modal-title" className="line-clamp-2 text-base font-bold text-slate-900">
              {title}
            </h2>
            <p className="mt-1 text-sm font-semibold text-[#c44569]">
              {formatPrice(lineTotal)} PKR
              {quantity > 1 ? ` (${quantity} pcs)` : ''}
            </p>
            {outOfStock ? (
              <p className="mt-1 text-xs font-semibold text-red-600">Out of stock</p>
            ) : maxQty <= 5 && maxQty > 0 ? (
              <p className="mt-1 text-xs text-amber-700">Only {maxQty} available</p>
            ) : null}
            <p className="mt-1 text-xs text-slate-500">Choose size and color before adding to cart.</p>
          </div>
        </div>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <ClothesSizeSelector product={product} value={selectedSize} onChange={setSelectedSize} embedded />
          <ClothesColorSelector
            product={product}
            value={selectedColor}
            onChange={setSelectedColor}
            embedded
            idPrefix="cart-modal"
          />

          <div>
            <label htmlFor="cart-modal-qty" className="mb-2 block text-sm font-semibold text-slate-700">
              Quantity
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-lg font-bold"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={outOfStock}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span id="cart-modal-qty" className="min-w-8 text-center font-bold tabular-nums">
                {quantity}
              </span>
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-lg font-bold"
                onClick={() => setQuantity((q) => Math.min(maxQty || 99, q + 1))}
                disabled={outOfStock || quantity >= maxQty}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>

          {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

          <div className="cart-actions pt-1">
            <button
              type="button"
              className="cart-actions__btn cart-actions__btn--secondary min-h-[44px]! text-sm!"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={outOfStock}
              className="cart-actions__btn cart-actions__btn--accent min-h-[44px]! border-0! text-sm! font-bold!"
            >
              Add to cart
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
