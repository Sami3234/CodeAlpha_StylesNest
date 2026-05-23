'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WhatsAppFab from '@/components/WhatsAppFab';
import { useCart } from '@/context/CartContext';
import { useProducts } from '@/context/ProductContext';
import CartLineOptionsEditor from '@/components/CartLineOptionsEditor';
import {
  formatCartLineOptionsSummary,
  validateCartLineOptions,
} from '@/lib/cart-line-options';
import { persistCheckoutLineKeys } from '@/lib/checkout-selection';
import { getProductTitle } from '@/utils/getProductText';
import { formatPrice } from '@/utils/formatPrice';
import { getLineTotal } from '@/lib/product-pricing';
import { isOutOfStock, validateStockForQuantity } from '@/lib/product-stock';
import {
  clearOrderWhatsAppConfirm,
  readOrderWhatsAppConfirm,
} from '@/lib/order-whatsapp-storage';

function CartPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { lines, hydrated, setLineQuantity, removeCartLine, updateLineOptions, clearCart } =
    useCart();
  const { products, loading } = useProducts();

  const rows = useMemo(
    () =>
      lines.map((line) => ({
        line,
        product: products.find((p) => p.id === line.productId) ?? null,
      })),
    [lines, products],
  );

  const selectableRows = useMemo(() => rows.filter((r) => r.product !== null), [rows]);

  const selectableSignature = useMemo(
    () =>
      selectableRows
        .map(
          (r) =>
            `${r.line.lineKey}:${r.line.quantity}:${r.line.selectedSize ?? ''}:${r.line.selectedColor ?? ''}`,
        )
        .sort()
        .join('|'),
    [selectableRows],
  );

  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [selectionSignature, setSelectionSignature] = useState('');
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [whatsappConfirm, setWhatsappConfirm] = useState(
    () => (typeof window !== 'undefined' ? readOrderWhatsAppConfirm() : null),
  );
  const [orderPlacedHandled, setOrderPlacedHandled] = useState(false);

  if (searchParams.get('placed') === '1' && !orderPlacedHandled) {
    setOrderPlacedHandled(true);
    setWhatsappConfirm(readOrderWhatsAppConfirm());
    setBanner({
      type: 'success',
      text: 'Order placed successfully. We will contact you soon.',
    });
  }

  useEffect(() => {
    if (searchParams.get('placed') === '1') {
      router.replace('/cart', { scroll: false });
    }
  }, [searchParams, router]);

  if (selectableSignature !== selectionSignature) {
    setSelectionSignature(selectableSignature);
    const validKeys = selectableRows.map((r) => r.line.lineKey);
    const validSet = new Set(validKeys);
    setSelectedKeys((prev) => {
      const next = new Set<string>();
      prev.forEach((key) => {
        if (validSet.has(key)) next.add(key);
      });
      validKeys.forEach((key) => {
        if (!prev.has(key)) next.add(key);
      });
      return next;
    });
  }

  const toggleSelected = useCallback((lineKey: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(lineKey)) next.delete(lineKey);
      else next.add(lineKey);
      return next;
    });
  }, []);

  const selectAllValid = useCallback(() => {
    setSelectedKeys(new Set(selectableRows.map((r) => r.line.lineKey)));
  }, [selectableRows]);

  const selectNoneValid = useCallback(() => {
    setSelectedKeys(new Set());
  }, []);

  const subtotalAll = rows.reduce((sum, { line, product }) => {
    if (!product) return sum;
    return sum + getLineTotal(product, line.quantity);
  }, 0);

  const selectedLines = useMemo(
    () => selectableRows.filter((r) => selectedKeys.has(r.line.lineKey)),
    [selectableRows, selectedKeys],
  );

  const selectedSubtotal = selectedLines.reduce(
    (sum, { line, product }) => sum + (product ? getLineTotal(product, line.quantity) : 0),
    0,
  );

  const changeLineQuantity = useCallback(
    (lineKey: string, product: NonNullable<(typeof rows)[0]['product']>, line: (typeof lines)[0], nextQty: number) => {
      const check = validateStockForQuantity(product, lines, nextQty, {
        selectedSize: line.selectedSize,
        selectedColor: line.selectedColor,
      });
      if (!check.ok) {
        setBanner({ type: 'error', text: check.error });
        return;
      }
      setBanner(null);
      setLineQuantity(lineKey, check.quantity);
    },
    [lines, setLineQuantity],
  );

  const selectedCount = selectedLines.length;
  const allSelectableSelected =
    selectableRows.length > 0 && selectedCount === selectableRows.length;

  const goToCheckout = () => {
    if (selectedCount === 0) return;

    const invalid = selectedLines
      .map(({ line, product }) => {
        const result = validateCartLineOptions(product!, {
          selectedSize: line.selectedSize,
          selectedColor: line.selectedColor,
        });
        return result.valid ? null : { title: getProductTitle(product!), error: result.error };
      })
      .filter((x): x is { title: string; error: string | undefined } => x !== null);

    if (invalid.length > 0) {
      setBanner({
        type: 'error',
        text: `${invalid[0].title}: ${invalid[0].error ?? 'Please select size and color.'}`,
      });
      return;
    }

    for (const { line, product } of selectedLines) {
      if (!product) continue;
      if (isOutOfStock(product)) {
        setBanner({ type: 'error', text: `${getProductTitle(product)} is out of stock.` });
        return;
      }
      const stockCheck = validateStockForQuantity(product, lines, line.quantity, {
        selectedSize: line.selectedSize,
        selectedColor: line.selectedColor,
      });
      if (!stockCheck.ok) {
        setBanner({ type: 'error', text: `${getProductTitle(product)}: ${stockCheck.error}` });
        return;
      }
    }

    setBanner(null);
    persistCheckoutLineKeys([...selectedKeys]);
    router.push('/cart/checkout');
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: 'linear-gradient(180deg, #f5f7fa 0%, #eef2f6 50%, #f5f7fa 100%)',
        paddingTop: 'var(--site-header-h, 90px)',
      }}
    >
      <Header />

      <main
        className="flex-1 w-full min-w-0"
        style={{
          maxWidth: '960px',
          margin: '0 auto',
          width: '100%',
          padding: 'clamp(16px, 4vw, 28px) clamp(12px, 4vw, 20px) 48px',
        }}
      >
        <h1
          style={{
            fontSize: 'clamp(1.5rem, 4vw, 2rem)',
            fontWeight: 800,
            color: '#1a1a2e',
            marginBottom: '8px',
            fontFamily: 'var(--font-poppins), system-ui, sans-serif',
          }}
        >
          Shopping cart
        </h1>
        <p style={{ color: '#64748b', marginBottom: '20px', fontSize: '15px' }}>
          Select items with the checkbox, then open{' '}
          <strong>Place order</strong> for the full checkout page.           Continue browsing on{' '}
          <Link href="/shop" style={{ color: '#667eea', fontWeight: 600 }}>
            Shop
          </Link>
          .
        </p>

        {whatsappConfirm ? (
          <div className="order-success-whatsapp mb-5">
            <h3>Confirm on WhatsApp</h3>
            <p>
              Your order has been submitted. Please confirm on WhatsApp so we can process it quickly. (Order
              ID: {whatsappConfirm.orderId})
            </p>
            <a href={whatsappConfirm.confirmUrl} target="_blank" rel="noopener noreferrer">
              Confirm on WhatsApp
            </a>
            <button
              type="button"
              className="mt-3 block text-sm text-slate-500 underline"
              onClick={() => {
                clearOrderWhatsAppConfirm();
                setWhatsappConfirm(null);
              }}
            >
              Dismiss
            </button>
          </div>
        ) : null}

        {banner ? (
          <div
            role="status"
            className="mb-5 rounded-2xl px-4 py-3 text-sm font-medium"
            style={{
              background: banner.type === 'success' ? 'rgba(56, 161, 105, 0.12)' : 'rgba(229, 62, 62, 0.1)',
              color: banner.type === 'success' ? '#276749' : '#c53030',
              border: `1px solid ${banner.type === 'success' ? 'rgba(56,161,105,0.35)' : 'rgba(229,62,62,0.25)'}`,
            }}
          >
            {banner.text}
          </div>
        ) : null}

        {!hydrated || loading ? (
          <div className="rounded-2xl bg-white/90 p-10 text-center shadow-lg border border-white/80">
            <p style={{ color: '#64748b' }}>Loading cart…</p>
          </div>
        ) : rows.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border-2 border-[rgba(102,126,234,0.2)] bg-white p-12 text-center shadow-xl"
          >
            <p style={{ fontSize: '18px', fontWeight: 600, color: '#334155', marginBottom: '16px' }}>
              Your cart is empty
            </p>
            <Link
              href="/shop"
              className="inline-block rounded-full px-8 py-3 font-semibold text-white shadow-lg transition hover:opacity-95"
              style={{
                background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ff8c42 100%)',
              }}
            >
              Browse shop
            </Link>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-6">
            {selectableRows.length > 0 ? (
              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[rgba(102,126,234,0.2)] bg-white px-4 py-3 shadow-sm">
                <span className="text-sm font-semibold text-slate-700">Selection:</span>
                <button
                  type="button"
                  className="rounded-full border border-[rgba(102,126,234,0.45)] px-4 py-2 text-sm font-semibold text-[#4338ca] hover:bg-[rgba(102,126,234,0.06)]"
                  onClick={allSelectableSelected ? selectNoneValid : selectAllValid}
                >
                  {allSelectableSelected ? 'Deselect all' : 'Select all'}
                </button>
                <span className="text-sm text-slate-500">
                  {selectedCount} of {selectableRows.length} items selected ·{' '}
                  <span className="font-semibold text-[#667eea]">{formatPrice(selectedSubtotal)} PKR</span>
                </span>
              </div>
            ) : null}

            <ul className="flex flex-col gap-4">
              {rows.map(({ line, product }) => {
                const canSelect = !!product;
                const isSelected = selectedKeys.has(line.lineKey);
                const optionsSummary = product
                  ? formatCartLineOptionsSummary(product, line)
                  : null;
                return (
                  <motion.li
                    key={line.lineKey}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`flex flex-col gap-4 rounded-2xl border bg-white p-4 shadow-md sm:flex-row sm:items-center ${
                      canSelect && isSelected
                        ? 'border-[rgba(102,126,234,0.45)] ring-1 ring-[rgba(102,126,234,0.2)]'
                        : 'border-[rgba(102,126,234,0.15)]'
                    }`}
                  >
                    <div className="flex shrink-0 items-start gap-3 sm:items-center">
                      <label
                        className={`relative mt-1 flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md border-2 sm:mt-0 ${
                          !canSelect ? 'cursor-not-allowed opacity-40' : ''
                        } ${isSelected ? 'border-[#667eea] bg-[#667eea]' : 'border-slate-300 bg-white'}`}
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={isSelected}
                          disabled={!canSelect}
                          onChange={() => canSelect && toggleSelected(line.lineKey)}
                          aria-label={
                            product
                              ? `Select ${product && getProductTitle(product)} for checkout`
                              : 'Unavailable product'
                          }
                        />
                        {isSelected && canSelect ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                            <path
                              d="M20 6L9 17l-5-5"
                              stroke="white"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        ) : null}
                      </label>

                      <div className="relative mx-auto h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-gray-100 sm:mx-0">
                        {product?.image ? (
                          <Image
                            src={product.image}
                            alt={product ? getProductTitle(product) : ''}
                            fill
                            className="object-cover"
                            sizes="96px"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-gray-400">
                            No image
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      {product ? (
                        <>
                          <Link
                            href={`/product/${product.id}`}
                            className="line-clamp-2 font-semibold text-[#1e293b] hover:text-[#667eea]"
                          >
                            {getProductTitle(product)}
                          </Link>
                          {isOutOfStock(product) ? (
                            <p className="mt-1 text-sm font-semibold text-red-600">Out of stock</p>
                          ) : null}
                          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '6px' }}>
                            Line total: {formatPrice(getLineTotal(product, line.quantity))} PKR
                          </p>
                          {optionsSummary ? (
                            <p className="mt-1 text-sm font-medium text-[#4338ca]">{optionsSummary}</p>
                          ) : null}
                          <CartLineOptionsEditor
                            product={product}
                            value={{
                              selectedSize: line.selectedSize,
                              selectedColor: line.selectedColor,
                            }}
                            onChange={(options) => updateLineOptions(line.lineKey, options)}
                          />
                        </>
                      ) : (
                        <p className="font-medium text-amber-700">
                          Product unavailable (removed from store)
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 sm:flex-col sm:items-end">
                      <div className="flex items-center gap-1 rounded-full border-2 border-slate-200 bg-white px-1 py-1 shadow-sm">
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          className="flex h-9 w-9 items-center justify-center rounded-full text-lg font-bold text-slate-700 transition hover:bg-slate-100"
                          onClick={() =>
                            changeLineQuantity(line.lineKey, product!, line, line.quantity - 1)
                          }
                          disabled={!product}
                        >
                          −
                        </button>
                        <span
                          className="min-w-11 text-center text-base font-bold tabular-nums tracking-tight text-slate-900"
                          style={{ color: '#0f172a' }}
                        >
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          className="flex h-9 w-9 items-center justify-center rounded-full text-lg font-bold text-slate-700 transition hover:bg-slate-100"
                          onClick={() =>
                            changeLineQuantity(line.lineKey, product!, line, line.quantity + 1)
                          }
                          disabled={!product || isOutOfStock(product)}
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        className="text-sm font-semibold text-red-600 hover:underline"
                        onClick={() => removeCartLine(line.lineKey)}
                      >
                        Remove
                      </button>
                      {product ? (
                        <p className="w-full text-right text-lg font-bold text-[#c44569] sm:w-auto">
                          {formatPrice(getLineTotal(product, line.quantity))} PKR
                        </p>
                      ) : null}
                    </div>
                  </motion.li>
                );
              })}
            </ul>

            <div className="rounded-2xl border border-[rgba(102,126,234,0.2)] bg-white p-6 shadow-lg">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#64748b' }}>Cart subtotal</span>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#667eea' }}>
                    {formatPrice(subtotalAll)} PKR
                  </div>
                </div>
                <div className="text-right">
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#64748b' }}>
                    Selected for order
                  </span>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#c44569' }}>
                    {formatPrice(selectedSubtotal)} PKR
                  </div>
                </div>
              </div>
              <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '12px' }}>
                Shipping and final total can be confirmed after we contact you.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={selectedCount === 0}
                  className="inline-flex flex-1 min-w-[160px] justify-center rounded-full px-6 py-3 text-center font-semibold text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-45"
                  style={{
                    background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ff8c42 100%)',
                  }}
                  onClick={goToCheckout}
                >
                  Place order ({selectedCount})
                </button>
                <Link
                  href="/shop"
                  className="inline-flex flex-1 min-w-[140px] justify-center rounded-full border-2 border-[rgba(102,126,234,0.45)] px-6 py-3 text-center font-semibold text-[#4338ca] hover:bg-[rgba(102,126,234,0.06)]"
                >
                  Continue shopping
                </Link>
                <button
                  type="button"
                  className="inline-flex flex-1 min-w-[140px] justify-center rounded-full px-6 py-3 text-center font-semibold text-white shadow-md transition hover:opacity-95"
                  style={{
                    background: '#dc2626',
                    border: '2px solid #991b1b',
                    boxShadow: '0 4px 14px rgba(220, 38, 38, 0.35)',
                  }}
                  onClick={() => clearCart()}
                >
                  Clear cart
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
      <WhatsAppFab />
    </div>
  );
}

export default function CartPage() {
  return (
    <Suspense
      fallback={
        <div
          className="flex min-h-screen flex-col items-center justify-center"
          style={{
            background: 'linear-gradient(180deg, #f5f7fa 0%, #eef2f6 50%, #f5f7fa 100%)',
            paddingTop: 'var(--site-header-h, 90px)',
          }}
        >
          <p className="text-slate-600">Loading cart…</p>
        </div>
      }
    >
      <CartPageContent />
    </Suspense>
  );
}
