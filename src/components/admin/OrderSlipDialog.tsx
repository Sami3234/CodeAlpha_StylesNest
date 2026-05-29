'use client';

import { useEffect, useCallback, useState, useMemo, useRef } from 'react';
import type { Order } from '@/types/order';
import { buildOrderSlipHtml, downloadOrderSlipPdf, printOrderSlip } from '@/lib/order-slip';
import './order-slip-dialog.css';

type Props = {
  order: Order;
  open: boolean;
  onClose: () => void;
};

export default function OrderSlipDialog({ order, open, onClose }: Props) {
  const [pdfLoading, setPdfLoading] = useState(false);
  const previewRef = useRef<HTMLIFrameElement>(null);
  const slipHtml = useMemo(() => buildOrderSlipHtml(order), [order]);

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

  useEffect(() => {
    if (!open) return;
    const iframe = previewRef.current;
    if (!iframe) return;

    const resize = () => {
      const doc = iframe.contentDocument;
      if (!doc) return;
      const h = Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight);
      iframe.style.height = `${h}px`;
    };

    iframe.addEventListener('load', resize);
    const t = window.setTimeout(resize, 300);
    return () => {
      iframe.removeEventListener('load', resize);
      window.clearTimeout(t);
    };
  }, [slipHtml, open]);

  const handlePdf = async () => {
    setPdfLoading(true);
    try {
      await downloadOrderSlipPdf(order);
    } finally {
      setPdfLoading(false);
    }
  };

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
          <iframe
            ref={previewRef}
            srcDoc={slipHtml}
            title="Slip preview"
            className="osd-slip-iframe"
            aria-label="Slip preview — same as print and PDF"
          />
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
            onClick={() => void handlePdf()}
            disabled={pdfLoading}
          >
            {pdfLoading ? 'Preparing…' : 'Download PDF'}
          </button>
          <button type="button" className="osd-btn osd-btn--ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
