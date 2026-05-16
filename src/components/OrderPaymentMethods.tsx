'use client';

import type { PaymentMethod } from '@/lib/payment-methods';
import PaymentMethodLogo from '@/components/PaymentMethodLogo';

type Props = {
  methods: PaymentMethod[];
  selectedId: string;
  onSelect: (id: string) => void;
  error?: string;
};

export default function OrderPaymentMethods({ methods, selectedId, onSelect, error }: Props) {
  if (!methods.length) return null;

  const selected = methods.find((m) => m.id === selectedId) ?? methods[0];

  return (
    <div className="order-payment-block">
      <label className="order-form-label">
        Payment method<span className="order-form-required">*</span>
      </label>
      <p className="order-form-hint">Choose how you will pay for this order.</p>
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
            <p className="order-payment-details__note">You will pay in cash when the order arrives.</p>
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
