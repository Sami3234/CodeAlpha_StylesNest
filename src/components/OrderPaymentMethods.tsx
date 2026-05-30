'use client';

import type { PaymentMethod } from '@/lib/payment-methods';
import { COD_SERVICE_FEE } from '@/lib/payment-methods';
import PaymentMethodLogo from '@/components/PaymentMethodLogo';

type Props = {
  methods: PaymentMethod[];
  selectedId: string;
  onSelect: (id: string) => void;
  error?: string;
  compact?: boolean;
};

export default function OrderPaymentMethods({ methods, selectedId, onSelect, error, compact = false }: Props) {
  if (!methods.length) return null;

  const selected = selectedId ? methods.find((m) => m.id === selectedId) ?? null : null;

  return (
    <div className={`order-payment-block${compact ? ' order-payment-block--checkout-tight' : ''}`}>
      <label className="order-form-label">
        Payment method<span className="order-form-required">*</span>
      </label>
      {!compact ? (
        <p className="order-form-hint">Choose how you will pay for this order.</p>
      ) : null}
      <div className="order-payment-grid">
        {methods.map((method) => {
          const isSelected = method.id === selectedId;
          return (
            <button
              key={method.id}
              type="button"
              onClick={() => onSelect(method.id)}
              className={`order-payment-option order-payment-option--logo${isSelected ? ' order-payment-option--active' : ''}`}
              aria-label={method.label}
            >
              <PaymentMethodLogo type={method.type} size={44} />
            </button>
          );
        })}
      </div>

      {selected ? (
        <div className="order-payment-details">
          {selected.instructions ? (
            <p className="order-payment-details__note">{selected.instructions}</p>
          ) : null}
          {selected.type === 'cod' ? (
            <p className="order-payment-details__note">
              You will pay in cash when the order arrives. A {COD_SERVICE_FEE} PKR COD handling fee
              applies.
            </p>
          ) : null}
          {selected.bankName ? (
            <div className="order-payment-details__row">
              <span>Bank</span>
              <strong>{selected.bankName}</strong>
            </div>
          ) : null}
          {selected.accountTitle ? (
            <div className="order-payment-details__row">
              <span>Account title</span>
              <strong>{selected.accountTitle}</strong>
            </div>
          ) : null}
          {selected.accountNumber ? (
            <div className="order-payment-details__row">
              <span>{selected.type === 'bank' ? 'Account number' : 'Mobile number'}</span>
              <strong>{selected.accountNumber}</strong>
            </div>
          ) : null}
          {selected.iban ? (
            <div className="order-payment-details__row">
              <span>IBAN</span>
              <strong>{selected.iban}</strong>
            </div>
          ) : null}
        </div>
      ) : null}

      {error ? <p className="order-form-error">⚠️ {error}</p> : null}
    </div>
  );
}
