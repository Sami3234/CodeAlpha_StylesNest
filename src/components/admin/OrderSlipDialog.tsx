'use client';

import { useEffect, useCallback } from 'react';
import type { Order } from '@/types/order';
import { downloadOrderSlipPdf, printOrderSlip } from '@/lib/order-slip';
import './order-slip-dialog.css';

const STORE_NAME = 'StylesNest';

function productLineLabel(p: Order['products'][number]): string {
  const id =
    typeof p.productId === 'number' && p.productId > 0 ? `ID ${p.productId} · ` : '';
  const opts = [p.selectedSize, p.selectedColor].filter(Boolean).join(', ');
  const suffix = opts ? ` (${opts})` : '';
  return `${id}${p.name}${suffix}`;
}

function formatMoney(amount: number): string {
  return `${amount.toLocaleString('en-PK')} PKR`;
}

type Props = {
  order: Order;
  open: boolean;
  onClose: () => void;
};

export default function OrderSlipDialog({ order, open, onClose }: Props) {
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener('keydown', handleKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = prev;
    };
  }, [open, handleKey]);

  if (!open) return null;

  return (
    <div
      className="osd-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="osd-dialog" role="dialog" aria-labelledby="osd-title" aria-modal="true">
        <div className="osd-header">
          <h2 id="osd-title">Packing slip — {order.id}</h2>
          <button type="button" className="osd-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="osd-preview-wrap">
          <article className="osd-slip" aria-label="Slip preview">
            <div className="osd-slip__brand">
              <h3>{STORE_NAME}</h3>
              <p>Packing slip</p>
            </div>
            <p className="osd-slip__id">{order.id}</p>
            <p className="osd-slip__meta">
              {order.date} · {order.time} · {order.status}
            </p>
            <div className="osd-slip__customer">
              <strong>{order.customer}</strong>
              <span>{order.phone}</span>
              <span>{order.city}</span>
              <span>{order.address}</span>
            </div>
            {order.trackingId?.trim() ? (
              <div className="osd-slip__track">
                <strong>Tracking:</strong> {order.trackingId.trim()}
              </div>
            ) : null}
            <table>
              <thead>
                <tr>
                  <th className="col-name">Item</th>
                  <th className="col-qty">Qty</th>
                  <th className="col-amt">PKR</th>
                </tr>
              </thead>
              <tbody>
                {order.products.map((p, i) => (
                  <tr key={`${p.productId ?? p.name}-${i}`}>
                    <td className="col-name">{productLineLabel(p)}</td>
                    <td className="col-qty">×{p.quantity}</td>
                    <td className="col-amt">
                      {(p.lineTotal ?? p.price * p.quantity).toLocaleString('en-PK')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="osd-slip__total">
              <span>Total</span>
              <span>{formatMoney(order.total)}</span>
            </div>
            {order.notes?.trim() ? (
              <div className="osd-slip__note">
                <strong>Note:</strong> {order.notes}
              </div>
            ) : null}
            <p className="osd-slip__footer">Thank you for shopping with {STORE_NAME}</p>
          </article>
        </div>

        <div className="osd-actions">
          <button
            type="button"
            className="osd-btn osd-btn--print"
            onClick={() => printOrderSlip(order)}
          >
            Print
          </button>
          <button
            type="button"
            className="osd-btn osd-btn--pdf"
            onClick={() => downloadOrderSlipPdf(order)}
          >
            Download PDF
          </button>
          <button type="button" className="osd-btn osd-btn--ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
