'use client';

import { useState, type CSSProperties } from 'react';
import type { Order } from '@/types/order';
import { buildOrderWhatsAppUrl } from '@/lib/order-workflow';
import OrderSlipDialog from '@/components/admin/OrderSlipDialog';

type Props = {
  order: Order;
  compact?: boolean;
};

function buttonStyle(compact?: boolean): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: compact ? '8px 12px' : '10px 16px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    border: 'none',
    textDecoration: 'none',
  };
}

export default function OrderWorkflowActions({ order, compact }: Props) {
  const [slipOpen, setSlipOpen] = useState(false);

  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        <a
          href={buildOrderWhatsAppUrl(order)}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            ...buttonStyle(compact),
            backgroundColor: '#25D366',
            color: '#fff',
          }}
        >
          WhatsApp
        </a>
        <button
          type="button"
          onClick={() => setSlipOpen(true)}
          style={{
            ...buttonStyle(compact),
            backgroundColor: '#1E293B',
            color: '#fff',
          }}
        >
          Print slip
        </button>
      </div>
      <OrderSlipDialog order={order} open={slipOpen} onClose={() => setSlipOpen(false)} />
    </>
  );
}
