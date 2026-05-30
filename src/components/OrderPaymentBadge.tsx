'use client';

import type { Order } from '@/types/order';
import { getPaymentMethodBadgeStyle } from '@/lib/order-payment';

type Props = {
  order: Pick<Order, 'paymentMethodType' | 'paymentMethodLabel' | 'paymentStatus'>;
  /** Show green "Paid" tag when payment is confirmed. Never shows "Awaiting payment". */
  showPaidOnly?: boolean;
  size?: 'sm' | 'md';
};

export default function OrderPaymentBadge({
  order,
  showPaidOnly = false,
  size = 'md',
}: Props) {
  const methodStyle = getPaymentMethodBadgeStyle(order.paymentMethodType);
  const label = methodStyle.label;
  const fontSize = size === 'sm' ? '11px' : '12px';
  const padding = size === 'sm' ? '5px 10px' : '6px 12px';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding,
        borderRadius: '8px',
        fontSize,
        fontWeight: 700,
        lineHeight: 1,
        letterSpacing: '0.02em',
        backgroundColor: methodStyle.bg,
        color: methodStyle.color,
        border: `1px solid ${methodStyle.border}`,
        whiteSpace: 'nowrap',
        minWidth: size === 'sm' ? '52px' : '56px',
        textAlign: 'center',
      }}
    >
      {label}
      {showPaidOnly && order.paymentStatus === 'paid' ? (
        <span
          style={{
            marginLeft: '6px',
            padding: '2px 6px',
            borderRadius: '6px',
            fontSize: '10px',
            fontWeight: 700,
            backgroundColor: '#dcfce7',
            color: '#15803d',
            border: '1px solid #bbf7d0',
          }}
        >
          Paid
        </span>
      ) : null}
    </span>
  );
}
