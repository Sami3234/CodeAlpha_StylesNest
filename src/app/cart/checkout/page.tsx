'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useLoginModal } from '@/context/LoginModalContext';
import { useSavedCustomerDetails } from '@/hooks/useSavedCustomerDetails';
import { useCallback, useEffect, useMemo, useState, Suspense } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WhatsAppFab from '@/components/WhatsAppFab';
import OrderDeliveryForm, { type OrderDeliveryFormData } from '@/components/OrderDeliveryForm';
import { useCart } from '@/context/CartContext';
import { useProducts } from '@/context/ProductContext';
import { useOrders } from '@/context/OrderContext';
import { getProductTitle } from '@/utils/getProductText';
import { removeAbandonedOrderOnSubmit } from '@/utils/abandonedOrders';
import {
  buildOrderProductName,
  formatCartLineOptionsSummary,
  validateCartLineOptions,
} from '@/lib/cart-line-options';
import { readCheckoutLineKeys, clearCheckoutLineKeys } from '@/lib/checkout-selection';
import { readCustomerDetailsFromSession, writeCustomerDetailsToSession } from '@/lib/customer-details-storage';
import type { CartLine } from '@/context/CartContext';
import { formatPrice } from '@/utils/formatPrice';
import {
  buildOrderWhatsAppMessage,
  buildWhatsAppLink,
  formatPaymentMethodForOrder,
  getCodServiceFee,
  type PaymentMethod,
} from '@/lib/payment-methods';
import { getLineTotal, getUnitPrice } from '@/lib/product-pricing';
import { getOrderDeliveryFee } from '@/lib/product-delivery';
import { isOutOfStock, validateStockForQuantity } from '@/lib/product-stock';
import { saveOrderWhatsAppConfirm } from '@/lib/order-whatsapp-storage';
import { notifyError } from '@/lib/notify';
import '@/components/product-page.css';
import '@/components/checkout-page.css';

function sanitizeCustomerField(raw: string, maxLen: number): string {
  return raw.replace(/\s+/g, ' ').trim().slice(0, maxLen);
}

function initialFormData(): OrderDeliveryFormData {
  if (typeof window === 'undefined') {
    return { fullName: '', mobile: '', city: '', address: '' };
  }
  const saved = readCustomerDetailsFromSession();
  return {
    fullName: saved?.fullName ?? '',
    mobile: saved?.mobile ?? '',
    city: saved?.city ?? '',
    address: saved?.address ?? '',
  };
}

function CheckoutPageInner() {
  const router = useRouter();
  const pathname = usePathname();
  const { status: authStatus } = useSession();
  const { openLogin } = useLoginModal();
  const { lines, hydrated, removeLinesFromCart } = useCart();
  const { products, loading: productsLoading, reloadProducts } = useProducts();
  const { addOrder } = useOrders();

  const [bootstrapped, setBootstrapped] = useState(false);
  const [checkoutKeys, setCheckoutKeys] = useState<string[]>([]);
  const [formData, setFormData] = useState<OrderDeliveryFormData>(initialFormData);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentId, setSelectedPaymentId] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storeWhatsApp, setStoreWhatsApp] = useState('');

  const showFormError = useCallback((message: string) => {
    setError(message);
    notifyError(message);
  }, []);

  useSavedCustomerDetails(setFormData, authStatus === 'authenticated');

  useEffect(() => {
    setCheckoutKeys(readCheckoutLineKeys() ?? []);
    setBootstrapped(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/payment-methods', { cache: 'no-store' });
        const data = await res.json();
        if (cancelled || !data.success) return;
        const methods = (data.methods ?? []) as PaymentMethod[];
        setPaymentMethods(methods);
        setStoreWhatsApp(typeof data.storeWhatsApp === 'string' ? data.storeWhatsApp : '');
        if (methods.length) setSelectedPaymentId(methods[0].id);
      } catch {
        /* optional */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const checkoutRows = useMemo(() => {
    if (!checkoutKeys || checkoutKeys.length === 0) return [];
    const keySet = new Set(checkoutKeys);
    return lines
      .filter((l) => keySet.has(l.lineKey))
      .map((line) => ({
        line,
        product: products.find((p) => p.id === line.productId) ?? null,
      }))
      .filter((r) => r.product !== null) as {
      line: CartLine;
      product: NonNullable<(typeof products)[0]>;
    }[];
  }, [lines, products, checkoutKeys]);

  useEffect(() => {
    if (!bootstrapped || !hydrated) return;
    if (checkoutKeys.length === 0) {
      router.replace('/cart');
    }
  }, [bootstrapped, hydrated, checkoutKeys.length, router]);

  useEffect(() => {
    if (!bootstrapped || !hydrated || productsLoading) return;
    if (checkoutKeys.length === 0) return;
    if (checkoutRows.length === 0) {
      clearCheckoutLineKeys();
      router.replace('/cart');
    }
  }, [bootstrapped, hydrated, productsLoading, checkoutKeys.length, checkoutRows.length, router]);

  const subtotal = checkoutRows.reduce(
    (s, { line, product }) => s + getLineTotal(product, line.quantity),
    0,
  );

  const deliveryFee = useMemo(
    () =>
      getOrderDeliveryFee(
        checkoutRows.map((r) => r.product),
        checkoutRows.map((r) => r.product.id),
      ),
    [checkoutRows],
  );

  const selectedPayment = useMemo(
    () => paymentMethods.find((m) => m.id === selectedPaymentId) ?? null,
    [paymentMethods, selectedPaymentId],
  );

  const codFee = getCodServiceFee(selectedPayment?.type);
  const grandTotal = subtotal + deliveryFee + codFee;

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    },
    [],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPaymentError('');

    if (authStatus !== 'authenticated') {
      openLogin(pathname || '/cart/checkout');
      return;
    }

    const fullName = sanitizeCustomerField(formData.fullName, 120);
    const phone = sanitizeCustomerField(formData.mobile, 32);
    const city = sanitizeCustomerField(formData.city, 80);
    const address = sanitizeCustomerField(formData.address, 500);

    if (!fullName || !phone || !city || !address) {
      showFormError('Please fill all required fields.');
      return;
    }
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      showFormError('Enter a valid WhatsApp number (at least 10 digits).');
      return;
    }

    const selectedPayment = paymentMethods.find((m) => m.id === selectedPaymentId);
    if (!paymentMethods.length) {
      showFormError('Payment methods are not available. Please try again later or contact support.');
      return;
    }
    if (!selectedPayment?.type) {
      const msg = 'Please select a payment method.';
      setPaymentError(msg);
      showFormError(msg);
      return;
    }
    setPaymentError('');

    if (checkoutRows.length === 0) {
      showFormError('No valid items to order. Return to cart and try again.');
      return;
    }

    for (const { line, product } of checkoutRows) {
      if (isOutOfStock(product)) {
        showFormError(`${getProductTitle(product)} is out of stock.`);
        return;
      }
      const stockCheck = validateStockForQuantity(product, lines, line.quantity, {
        selectedSize: line.selectedSize,
        selectedColor: line.selectedColor,
      });
      if (!stockCheck.ok) {
        showFormError(`${getProductTitle(product)}: ${stockCheck.error}`);
        return;
      }
      const result = validateCartLineOptions(product, {
        selectedSize: line.selectedSize,
        selectedColor: line.selectedColor,
      });
      if (!result.valid) {
        showFormError(
          `${getProductTitle(product)}: ${result.error ?? 'Please select size and color.'}`,
        );
        return;
      }
    }

    const paymentLabel = formatPaymentMethodForOrder(selectedPayment);

    setSubmitting(true);
    try {
      await removeAbandonedOrderOnSubmit(phone, fullName);

      const orderProducts = checkoutRows.map(({ line, product }) => {
        const name = buildOrderProductName(getProductTitle(product), product, {
          selectedSize: line.selectedSize,
          selectedColor: line.selectedColor,
        });
        const lineTotal = getLineTotal(product, line.quantity);
        return {
          productId: product.id,
          name,
          quantity: line.quantity,
          price: getUnitPrice(product, line.quantity),
          lineTotal,
          paymentMethod: paymentLabel,
          selectedSize: line.selectedSize,
          selectedColor: line.selectedColor,
        };
      });

      const { order: placed, error: orderError } = await addOrder({
        customer: fullName,
        phone,
        city,
        address,
        products: orderProducts,
        subtotal,
        deliveryFee,
        codFee,
        paymentMethodType: selectedPayment.type,
        paymentMethodLabel: selectedPayment.label,
        total: grandTotal,
        status: 'pending',
      });

      if (!placed) {
        showFormError(orderError ?? 'Order could not be saved. Please try again.');
        return;
      }

      void reloadProducts();

      const waPhone = storeWhatsApp.replace(/\D/g, '') || digits;
      const waMessage = buildOrderWhatsAppMessage({
        orderId: placed.id,
        customerName: fullName,
        customerWhatsApp: phone,
        items: orderProducts.map((p) => ({
          name: p.name,
          quantity: p.quantity,
          lineTotal: p.lineTotal ?? 0,
          size: p.selectedSize,
          color: p.selectedColor,
        })),
        total: placed.total,
        city,
        address,
        paymentLabel,
      });
      const confirmUrl = buildWhatsAppLink(waPhone, waMessage);
      if (confirmUrl) {
        saveOrderWhatsAppConfirm({
          orderId: placed.id,
          confirmUrl,
          total: placed.total,
        });
      }

      writeCustomerDetailsToSession({
        fullName,
        mobile: phone,
        city,
        address,
      });

      removeLinesFromCart(checkoutRows.map((r) => r.line.lineKey));
      clearCheckoutLineKeys();
      router.push('/cart?placed=1');
    } finally {
      setSubmitting(false);
    }
  };

  if (!bootstrapped || !hydrated || productsLoading || checkoutKeys.length === 0) {
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
            You are buying <strong>{checkoutRows.length}</strong> product line(s).{' '}
            {deliveryFee > 0 || codFee > 0 ? (
              <>
                Subtotal <strong className="text-[#667eea]">{formatPrice(subtotal)} PKR</strong>
                {deliveryFee > 0 ? (
                  <>
                    {' · '}Delivery <strong>{formatPrice(deliveryFee)} PKR</strong>
                  </>
                ) : (
                  <> · Free delivery</>
                )}
                {codFee > 0 ? (
                  <>
                    {' · '}COD fee <strong>{formatPrice(codFee)} PKR</strong>
                  </>
                ) : null}
                {' · '}Total <strong className="text-[#c44569]">{formatPrice(grandTotal)} PKR</strong>
              </>
            ) : (
              <>
                Total <strong className="text-[#667eea]">{formatPrice(grandTotal)} PKR</strong>
                {' '}(free delivery)
              </>
            )}
          </p>
        </div>
        <Link
          href="/cart"
          className="rounded-full border-2 border-[rgba(102,126,234,0.45)] px-5 py-2.5 text-sm font-semibold text-[#4338ca] hover:bg-[rgba(102,126,234,0.06)]"
        >
          ← Back to cart
        </Link>
      </div>

      <div className="checkout-layout">
        <section className="checkout-layout__items">
          <h2 className="checkout-items-heading">Order items</h2>
          <ul className="checkout-item-list">
            {checkoutRows.map(({ line, product }) => {
              const optionsSummary = formatCartLineOptionsSummary(product, line);
              return (
                <li key={line.lineKey} className="checkout-item-card">
                  <div className="relative mx-auto h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:mx-0">
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
                      Qty <strong>{line.quantity}</strong>
                      {product.pricingTiers?.length
                        ? ' · tier pricing applied'
                        : ` × ${formatPrice(product.currentPrice)} PKR`}
                    </p>
                    {optionsSummary ? (
                      <p className="mt-1 text-sm font-medium text-[#4338ca]">{optionsSummary}</p>
                    ) : null}
                    <p className="mt-1 text-base font-bold text-[#c44569]">
                      Line total: {formatPrice(getLineTotal(product, line.quantity))} PKR
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="checkout-layout__form">
          <OrderDeliveryForm
            title="Order Now"
            variant="checkout"
            formData={formData}
            onChange={handleInputChange}
            onSubmit={handleSubmit}
            authStatus={authStatus}
            onLoginClick={() => openLogin(pathname || '/cart/checkout')}
            paymentMethods={paymentMethods}
            selectedPaymentId={selectedPaymentId}
            onPaymentSelect={(id) => {
              setSelectedPaymentId(id);
              setPaymentError('');
            }}
            paymentError={paymentError}
            submitLabel="SUBMIT ORDER"
            submitting={submitting}
            error={error}
            orderSubtotal={subtotal}
            orderDeliveryFee={deliveryFee}
            orderCodFee={codFee}
            orderTotal={grandTotal}
          />
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
