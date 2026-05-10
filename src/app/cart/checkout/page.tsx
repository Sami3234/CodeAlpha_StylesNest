'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, Suspense } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WhatsAppFab from '@/components/WhatsAppFab';
import { useCart } from '@/context/CartContext';
import { useProducts } from '@/context/ProductContext';
import { useOrders } from '@/context/OrderContext';
import { getProductTitle } from '@/utils/getProductText';
import { removeAbandonedOrderOnSubmit } from '@/utils/abandonedOrders';
import { readCheckoutProductIds, clearCheckoutProductIds } from '@/lib/checkout-selection';

function sanitizeCustomerField(raw: string, maxLen: number): string {
  return raw.replace(/\s+/g, ' ').trim().slice(0, maxLen);
}

function CheckoutPageInner() {
  const router = useRouter();
  const { lines, hydrated, removeLinesFromCart } = useCart();
  const { products, loading: productsLoading } = useProducts();
  const { addOrder } = useOrders();

  const [bootstrapped, setBootstrapped] = useState(false);
  const [checkoutIds, setCheckoutIds] = useState<number[]>([]);
  const [formData, setFormData] = useState({
    fullName: '',
    mobile: '',
    city: '',
    address: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCheckoutIds(readCheckoutProductIds() ?? []);
    setBootstrapped(true);
  }, []);

  const checkoutRows = useMemo(() => {
    if (!checkoutIds || checkoutIds.length === 0) return [];
    const idSet = new Set(checkoutIds);
    return lines
      .filter((l) => idSet.has(l.productId))
      .map((line) => ({
        line,
        product: products.find((p) => p.id === line.productId) ?? null,
      }))
      .filter((r) => r.product !== null) as {
      line: { productId: number; quantity: number };
      product: NonNullable<(typeof products)[0]>;
    }[];
  }, [lines, products, checkoutIds]);

  useEffect(() => {
    if (!bootstrapped || !hydrated) return;
    if (checkoutIds.length === 0) {
      router.replace('/cart');
    }
  }, [bootstrapped, hydrated, checkoutIds.length, router]);

  useEffect(() => {
    if (!bootstrapped || !hydrated || productsLoading) return;
    if (checkoutIds.length === 0) return;
    if (checkoutRows.length === 0) {
      clearCheckoutProductIds();
      router.replace('/cart');
    }
  }, [bootstrapped, hydrated, productsLoading, checkoutIds.length, checkoutRows.length, router]);

  const subtotal = checkoutRows.reduce(
    (s, { line, product }) => s + product.currentPrice * line.quantity,
    0,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const fullName = sanitizeCustomerField(formData.fullName, 120);
    const phone = sanitizeCustomerField(formData.mobile, 32);
    const city = sanitizeCustomerField(formData.city, 80);
    const address = sanitizeCustomerField(formData.address, 500);

    if (!fullName || !phone || !city || !address) {
      setError('Please fill all required fields.');
      return;
    }
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      setError('Enter a valid mobile number (at least 10 digits).');
      return;
    }

    if (checkoutRows.length === 0) {
      setError('No valid items to order. Return to cart and try again.');
      return;
    }

    setSubmitting(true);
    try {
      await removeAbandonedOrderOnSubmit(phone, fullName);

      const orderProducts = checkoutRows.map(({ line, product }) => ({
        name: getProductTitle(product),
        quantity: line.quantity,
        price: product.currentPrice,
      }));

      const ok = await addOrder({
        customer: fullName,
        phone,
        city,
        address,
        products: orderProducts,
        total: subtotal,
        status: 'pending',
      });

      if (!ok) {
        setError('Order could not be saved. Please try again.');
        return;
      }

      removeLinesFromCart(checkoutRows.map((r) => r.line.productId));
      clearCheckoutProductIds();
      router.push('/cart?placed=1');
    } finally {
      setSubmitting(false);
    }
  };

  if (!bootstrapped || !hydrated || productsLoading || checkoutIds.length === 0) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-slate-600">Loading checkout…</p>
      </div>
    );
  }

  if (checkoutRows.length === 0) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-slate-600">Redirecting to cart…</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-extrabold text-[#1a1a2e]"
            style={{ fontFamily: 'var(--font-poppins), system-ui, sans-serif' }}
          >
            Place order
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            You are buying <strong>{checkoutRows.length}</strong> product line(s). Total{' '}
            <strong className="text-[#667eea]">{subtotal.toFixed(2)} PKR</strong>.
          </p>
        </div>
        <Link
          href="/cart"
          className="rounded-full border-2 border-[rgba(102,126,234,0.45)] px-5 py-2.5 text-sm font-semibold text-[#4338ca] hover:bg-[rgba(102,126,234,0.06)]"
        >
          ← Back to cart
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        <section className="lg:col-span-3">
          <h2 className="mb-4 text-lg font-bold text-slate-900">Order items</h2>
          <ul className="flex flex-col gap-4">
            {checkoutRows.map(({ line, product }) => (
              <li
                key={line.productId}
                className="flex flex-col gap-4 rounded-2xl border border-[rgba(102,126,234,0.2)] bg-white p-4 shadow-sm sm:flex-row sm:items-center"
              >
                <div className="relative mx-auto h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:mx-0">
                  <Image
                    src={product.image}
                    alt={getProductTitle(product)}
                    fill
                    className="object-cover"
                    sizes="96px"
                    unoptimized
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/product/${product.id}`}
                    className="line-clamp-2 font-semibold text-slate-900 hover:text-[#667eea]"
                  >
                    {getProductTitle(product)}
                  </Link>
                  <p className="mt-2 text-sm text-slate-600">
                    Qty <strong>{line.quantity}</strong> × {product.currentPrice.toFixed(2)} PKR
                  </p>
                  <p className="mt-1 text-base font-bold text-[#c44569]">
                    Line total: {(product.currentPrice * line.quantity).toFixed(2)} PKR
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="lg:col-span-2">
          <div className="rounded-2xl border border-[rgba(102,126,234,0.25)] bg-white p-6 shadow-lg">
            <h2 className="text-lg font-bold text-slate-900">Delivery details</h2>
            <p className="mt-1 text-xs text-slate-500">
              Same details we use to confirm COD / delivery across Pakistan.
            </p>

            <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="co-name" className="text-xs font-semibold text-slate-600">
                  Full name *
                </label>
                <input
                  id="co-name"
                  autoComplete="name"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData((s) => ({ ...s, fullName: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#667eea]"
                />
              </div>
              <div>
                <label htmlFor="co-phone" className="text-xs font-semibold text-slate-600">
                  Mobile *
                </label>
                <input
                  id="co-phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  value={formData.mobile}
                  onChange={(e) => setFormData((s) => ({ ...s, mobile: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#667eea]"
                />
              </div>
              <div>
                <label htmlFor="co-city" className="text-xs font-semibold text-slate-600">
                  City *
                </label>
                <input
                  id="co-city"
                  autoComplete="address-level2"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData((s) => ({ ...s, city: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#667eea]"
                />
              </div>
              <div>
                <label htmlFor="co-address" className="text-xs font-semibold text-slate-600">
                  Full address *
                </label>
                <textarea
                  id="co-address"
                  autoComplete="street-address"
                  required
                  rows={4}
                  value={formData.address}
                  onChange={(e) => setFormData((s) => ({ ...s, address: e.target.value }))}
                  className="mt-1 w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#667eea]"
                  placeholder="House / street, area, landmark"
                />
              </div>

              <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm">
                <div className="flex justify-between font-semibold text-slate-800">
                  <span>Order total</span>
                  <span className="text-[#667eea]">{subtotal.toFixed(2)} PKR</span>
                </div>
              </div>

              {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

              <button
                type="submit"
                disabled={submitting || checkoutRows.length === 0}
                className="w-full rounded-full py-3.5 text-sm font-bold text-white shadow-lg disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ff8c42 100%)',
                }}
              >
                {submitting ? 'Placing order…' : 'Confirm & place order'}
              </button>
            </form>
          </div>
        </section>
      </div>
    </>
  );
}

export default function CheckoutPage() {
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
        className="flex-1 min-w-0 py-8"
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
          width: '100%',
          paddingLeft: 'clamp(12px, 4vw, 24px)',
          paddingRight: 'clamp(12px, 4vw, 24px)',
        }}
      >
        <Suspense fallback={<p className="text-center text-slate-600">Loading…</p>}>
          <CheckoutPageInner />
        </Suspense>
      </main>
      <Footer />
      <WhatsAppFab />
    </div>
  );
}
