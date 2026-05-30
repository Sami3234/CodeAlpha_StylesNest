'use client';

import Link from 'next/link';
import { cities, getCityName } from '@/data/products';
import OrderPaymentMethods from '@/components/OrderPaymentMethods';
import type { PaymentMethod } from '@/lib/payment-methods';
import OrderTotalSummary from '@/components/OrderTotalSummary';
import { formatPrice } from '@/utils/formatPrice';

export type OrderDeliveryFormData = {
  fullName: string;
  mobile: string;
  city: string;
  address: string;
};

type OrderDeliveryFormProps = {
  title?: string;
  variant?: 'default' | 'checkout';
  formData: OrderDeliveryFormData;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => void;
  onSubmit: (e: React.FormEvent) => void;
  authStatus: 'authenticated' | 'loading' | 'unauthenticated';
  onLoginClick: () => void;
  paymentMethods: PaymentMethod[];
  selectedPaymentId: string;
  onPaymentSelect: (id: string) => void;
  paymentError?: string;
  submitLabel?: string;
  submitting?: boolean;
  error?: string | null;
  orderSubtotal?: number;
  orderDeliveryFee?: number;
  orderCodFee?: number;
  orderTotal?: number;
  footerNote?: React.ReactNode;
};

const fieldStyle: React.CSSProperties = {
  width: '100%',
  padding: '14px 18px',
  border: '2px solid rgba(102, 126, 234, 0.2)',
  borderRadius: '12px',
  fontSize: '15px',
  color: '#2d3748',
  outline: 'none',
  background: '#ffffff',
  transition: 'all 0.3s ease',
};

function onFieldFocus(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = '#ff6b35';
  e.currentTarget.style.boxShadow = '0px 0px 0px 3px rgba(255, 107, 53, 0.1)';
}

function onFieldBlur(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.2)';
  e.currentTarget.style.boxShadow = 'none';
}

export default function OrderDeliveryForm({
  title = 'Delivery details',
  variant = 'default',
  formData,
  onChange,
  onSubmit,
  authStatus,
  onLoginClick,
  paymentMethods,
  selectedPaymentId,
  onPaymentSelect,
  paymentError,
  submitLabel = 'SUBMIT ORDER',
  submitting = false,
  error,
  orderSubtotal,
  orderDeliveryFee = 0,
  orderCodFee = 0,
  orderTotal,
  footerNote,
}: OrderDeliveryFormProps) {
  const isCheckout = variant === 'checkout';
  const cardClass = isCheckout ? 'product-order-card product-order-card--checkout' : 'product-order-card';

  return (
    <div className={cardClass}>
      <h2
        className="order-form-heading"
        style={
          isCheckout
            ? {
                fontWeight: 700,
                background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ff8c42 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }
            : {
                fontSize: '28px',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ff8c42 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                marginBottom: '8px',
              }
        }
      >
        {title}
      </h2>
      <p className={isCheckout ? 'order-form-intro order-form-intro--checkout' : 'order-form-intro'}>
        {isCheckout
          ? 'Fill in delivery details — we deliver in 2–4 working days.'
          : 'Kindly fill the form & we will deliver within 2-4 working days.'}
      </p>

      {authStatus === 'authenticated' && !isCheckout ? (
        <p className="order-form-intro" style={{ marginBottom: 12, fontSize: 13, color: '#64748b' }}>
          Delivery details are filled from your{' '}
          <Link href="/profile" style={{ color: '#ff6b35', fontWeight: 600 }}>
            profile
          </Link>
          . Update them anytime there.
        </p>
      ) : null}

      {authStatus === 'authenticated' && isCheckout ? (
        <p className="order-form-intro order-form-intro--checkout order-form-intro--muted">
          Using your{' '}
          <Link href="/profile" style={{ color: '#ff6b35', fontWeight: 600 }}>
            profile
          </Link>{' '}
          delivery details.
        </p>
      ) : null}

      {authStatus !== 'authenticated' ? (
        <div className={isCheckout ? 'order-login-banner order-login-banner--checkout' : 'order-login-banner'}>
          <p>
            <strong>Sign in required</strong> — create an account or sign in to place your order.
          </p>
          <button type="button" className="order-login-banner__btn" onClick={onLoginClick}>
            Sign in / Register
          </button>
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="order-form-compact">
        <div className={isCheckout ? 'order-form-fields-grid order-form-fields-grid--checkout' : undefined}>
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '15px',
              fontWeight: 600,
              color: '#2d3748',
              marginBottom: '8px',
            }}
          >
            Full Name<span style={{ color: '#e53e3e', marginLeft: '4px' }}>*</span>
          </label>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={onChange}
            placeholder="Enter your full name"
            autoComplete="name"
            required
            style={fieldStyle}
            onFocus={onFieldFocus}
            onBlur={onFieldBlur}
          />
        </div>

        <div>
          <label className="order-form-label">
            WhatsApp Number<span className="order-form-required">*</span>
          </label>
          <input
            type="tel"
            name="mobile"
            value={formData.mobile}
            onChange={onChange}
            placeholder="0300 1234567"
            inputMode="tel"
            autoComplete="tel"
            required
            style={fieldStyle}
            onFocus={onFieldFocus}
            onBlur={onFieldBlur}
          />
        </div>

        <div className={isCheckout ? 'order-form-field--full' : undefined}>
          <label
            style={{
              display: 'block',
              fontSize: '15px',
              fontWeight: 600,
              color: '#2d3748',
              marginBottom: '8px',
            }}
          >
            City<span style={{ color: '#e53e3e', marginLeft: '4px' }}>*</span>
          </label>
          <select
            name="city"
            value={formData.city}
            onChange={onChange}
            required
            style={{ ...fieldStyle, cursor: 'pointer', backgroundColor: '#ffffff' }}
            onFocus={onFieldFocus}
            onBlur={onFieldBlur}
          >
            <option value="">Select City*</option>
            {cities.map((city, idx) => {
              const cityName = getCityName(city);
              return (
                <option key={idx} value={cityName}>
                  {cityName}
                </option>
              );
            })}
          </select>
        </div>

        <div className={isCheckout ? 'order-form-field--full' : undefined}>
          <label
            style={{
              display: 'block',
              fontSize: '15px',
              fontWeight: 600,
              color: '#2d3748',
              marginBottom: '8px',
            }}
          >
            Delivery Address<span style={{ color: '#e53e3e', marginLeft: '4px' }}>*</span>
          </label>
          <textarea
            name="address"
            value={formData.address}
            onChange={onChange}
            placeholder="Building No, Street name, Area"
            required
            rows={isCheckout ? 2 : 3}
            style={{ ...fieldStyle, resize: 'none', fontFamily: 'inherit' }}
            onFocus={onFieldFocus}
            onBlur={onFieldBlur}
          />
        </div>
        </div>

        <div className={isCheckout ? 'order-checkout-actions' : undefined}>
          <div className={`order-payment-block--compact${isCheckout ? ' order-payment-block--checkout' : ''}`}>
            <OrderPaymentMethods
              methods={paymentMethods}
              selectedId={selectedPaymentId}
              onSelect={onPaymentSelect}
              error={paymentError}
              compact={isCheckout}
            />
          </div>

        {orderSubtotal != null && orderTotal != null ? (
          <OrderTotalSummary
            subtotal={orderSubtotal}
            deliveryFee={orderDeliveryFee}
            codFee={orderCodFee}
            total={orderTotal}
            className={isCheckout ? 'order-total-summary order-total-summary--checkout' : undefined}
          />
        ) : orderTotal != null ? (
          <div
            className="rounded-xl px-4 py-3 text-sm"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.06) 0%, rgba(247, 147, 30, 0.06) 100%)',
              border: '1px solid rgba(255, 107, 53, 0.15)',
            }}
          >
            <div className="flex justify-between font-semibold text-slate-800">
              <span>Order total</span>
              <span
                style={{
                  background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {formatPrice(orderTotal)} PKR
              </span>
            </div>
          </div>
        ) : null}

        {error ? <p className="order-form-error">⚠️ {error}</p> : null}

        {footerNote && !isCheckout ? <div className="order-form-footer-note">{footerNote}</div> : null}

        <button
          type="submit"
          disabled={submitting}
          className="order-form-submit"
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ff8c42 100%)',
            color: 'white',
            fontWeight: 700,
            padding: isCheckout ? '14px 18px' : '16px 24px',
            borderRadius: isCheckout ? '14px' : '16px',
            border: 'none',
            fontSize: isCheckout ? '15px' : '16px',
            letterSpacing: '0.5px',
            cursor: submitting ? 'not-allowed' : 'pointer',
            opacity: submitting ? 0.65 : 1,
            boxShadow: '0px 8px 25px rgba(255, 107, 53, 0.4)',
            transition: 'all 0.3s ease',
          }}
        >
          {submitting ? 'Placing order…' : submitLabel}
        </button>
        </div>
      </form>
    </div>
  );
}
