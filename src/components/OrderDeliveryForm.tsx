'use client';

import Link from 'next/link';
import { cities, getCityName } from '@/data/products';
import OrderPaymentMethods from '@/components/OrderPaymentMethods';
import type { PaymentMethod } from '@/lib/payment-methods';
import { formatPrice } from '@/utils/formatPrice';

export type OrderDeliveryFormData = {
  fullName: string;
  mobile: string;
  city: string;
  address: string;
};

type OrderDeliveryFormProps = {
  title?: string;
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
  orderTotal?: number;
  children?: React.ReactNode;
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
  orderTotal,
  children,
}: OrderDeliveryFormProps) {
  return (
    <div className="product-order-card">
      <h2
        style={{
          fontSize: '28px',
          fontWeight: 700,
          background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ff8c42 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '8px',
        }}
      >
        {title}
      </h2>
      <p className="order-form-intro">
        Kindly fill the form &amp; we will deliver within 2-4 working days.
      </p>

      {authStatus === 'authenticated' ? (
        <p className="order-form-intro" style={{ marginBottom: 12, fontSize: 13, color: '#64748b' }}>
          Delivery details are filled from your{' '}
          <Link href="/profile" style={{ color: '#ff6b35', fontWeight: 600 }}>
            profile
          </Link>
          . Update them anytime there.
        </p>
      ) : null}

      {authStatus !== 'authenticated' ? (
        <div className="order-login-banner">
          <p>
            <strong>Sign in required</strong> — create an account or sign in to place your order.
          </p>
          <button type="button" className="order-login-banner__btn" onClick={onLoginClick}>
            Sign in / Register
          </button>
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="order-form-compact">
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

        {children}

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
            Delivery Address<span style={{ color: '#e53e3e', marginLeft: '4px' }}>*</span>
          </label>
          <textarea
            name="address"
            value={formData.address}
            onChange={onChange}
            placeholder="Building No, Street name, Area"
            required
            rows={3}
            style={{ ...fieldStyle, resize: 'none', fontFamily: 'inherit' }}
            onFocus={onFieldFocus}
            onBlur={onFieldBlur}
          />
        </div>

        {orderTotal != null ? (
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

        <div className="order-payment-block--compact">
          <OrderPaymentMethods
            methods={paymentMethods}
            selectedId={selectedPaymentId || paymentMethods[0]?.id || ''}
            onSelect={onPaymentSelect}
            error={paymentError}
          />
        </div>

        {error ? <p className="order-form-error">⚠️ {error}</p> : null}

        {children}

        <button
          type="submit"
          disabled={submitting}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ff8c42 100%)',
            color: 'white',
            fontWeight: 700,
            padding: '16px 24px',
            borderRadius: '16px',
            border: 'none',
            fontSize: '16px',
            letterSpacing: '0.5px',
            cursor: submitting ? 'not-allowed' : 'pointer',
            opacity: submitting ? 0.65 : 1,
            boxShadow: '0px 8px 25px rgba(255, 107, 53, 0.4)',
            transition: 'all 0.3s ease',
          }}
        >
          {submitting ? 'Placing order…' : submitLabel}
        </button>
      </form>
    </div>
  );
}
