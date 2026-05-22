import { jsPDF } from 'jspdf';
import type { Order } from '@/types/order';

const STORE_NAME = 'StylesNest';
const SLIP_WIDTH_MM = 80;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatMoney(amount: number): string {
  return `${amount.toLocaleString('en-PK')} PKR`;
}

function productLineLabel(p: Order['products'][number]): string {
  const id =
    typeof p.productId === 'number' && p.productId > 0 ? `ID ${p.productId} · ` : '';
  const opts = [p.selectedSize, p.selectedColor].filter(Boolean).join(', ');
  const suffix = opts ? ` (${opts})` : '';
  return `${id}${p.name}${suffix}`;
}

export function buildOrderSlipHtml(order: Order, storeName = STORE_NAME): string {
  const productsHtml = order.products
    .map((p) => {
      const lineTotal = (p.lineTotal ?? p.price * p.quantity).toLocaleString('en-PK');
      return `<tr>
        <td class="item-name">${escapeHtml(productLineLabel(p))}</td>
        <td class="item-qty">×${p.quantity}</td>
        <td class="item-amt">${lineTotal}</td>
      </tr>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(order.id)} — ${escapeHtml(storeName)}</title>
  <style>
    @page { size: 80mm auto; margin: 4mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 6mm 4mm;
      width: 72mm;
      font-family: "Segoe UI", system-ui, sans-serif;
      font-size: 11px;
      line-height: 1.35;
      color: #0f172a;
      background: #fff;
    }
    .brand {
      text-align: center;
      border-bottom: 2px dashed #cbd5e1;
      padding-bottom: 8px;
      margin-bottom: 8px;
    }
    .brand h1 {
      margin: 0;
      font-size: 15px;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    .brand p {
      margin: 4px 0 0;
      font-size: 10px;
      color: #64748b;
      font-weight: 600;
    }
    .order-id {
      font-size: 13px;
      font-weight: 700;
      text-align: center;
      margin: 0 0 6px;
    }
    .meta {
      font-size: 10px;
      color: #64748b;
      text-align: center;
      margin: 0 0 10px;
    }
    .block {
      margin-bottom: 8px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e2e8f0;
    }
    .block strong { display: block; font-size: 12px; margin-bottom: 2px; }
    .block span { display: block; font-size: 10px; color: #334155; }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
      margin: 6px 0;
    }
    th {
      text-align: left;
      font-size: 9px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      border-bottom: 1px solid #e2e8f0;
      padding: 4px 2px;
    }
    td { padding: 5px 2px; vertical-align: top; border-bottom: 1px dotted #e2e8f0; }
    .item-name { width: 58%; word-break: break-word; }
    .item-qty { width: 14%; text-align: center; }
    .item-amt { width: 28%; text-align: right; white-space: nowrap; }
    .total-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
      font-weight: 700;
      margin-top: 8px;
      padding-top: 6px;
      border-top: 2px solid #0f172a;
    }
    .note, .track {
      font-size: 10px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      padding: 6px;
      margin-top: 8px;
    }
    .footer {
      margin-top: 10px;
      text-align: center;
      font-size: 9px;
      color: #94a3b8;
    }
    @media print {
      body { padding: 0; width: 72mm; }
    }
  </style>
</head>
<body>
  <div class="brand">
    <h1>${escapeHtml(storeName)}</h1>
    <p>Packing slip</p>
  </div>
  <p class="order-id">${escapeHtml(order.id)}</p>
  <p class="meta">${escapeHtml(order.date)} · ${escapeHtml(order.time)} · ${escapeHtml(order.status)}</p>
  <div class="block">
    <strong>${escapeHtml(order.customer)}</strong>
    <span>${escapeHtml(order.phone)}</span>
    <span>${escapeHtml(order.city)}</span>
    <span>${escapeHtml(order.address)}</span>
  </div>
  ${order.trackingId?.trim() ? `<div class="track"><strong>Tracking:</strong> ${escapeHtml(order.trackingId.trim())}</div>` : ''}
  <table>
    <thead><tr><th>Item</th><th>Qty</th><th>PKR</th></tr></thead>
    <tbody>${productsHtml}</tbody>
  </table>
  <div class="total-row"><span>Total</span><span>${formatMoney(order.total)}</span></div>
  ${order.notes?.trim() ? `<div class="note"><strong>Note:</strong> ${escapeHtml(order.notes.trim())}</div>` : ''}
  <p class="footer">Thank you for shopping with ${escapeHtml(storeName)}</p>
</body>
</html>`;
}

/** Print via hidden iframe (works when popups are blocked). */
export function printOrderSlip(order: Order, storeName = STORE_NAME): void {
  const html = buildOrderSlipHtml(order, storeName);
  const iframe = document.createElement('iframe');
  iframe.setAttribute(
    'style',
    'position:fixed;left:-10000px;top:0;width:0;height:0;border:0;visibility:hidden',
  );
  iframe.setAttribute('title', 'Print order slip');
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
  if (!doc) {
    iframe.remove();
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();

  const runPrint = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } finally {
      window.setTimeout(() => iframe.remove(), 1200);
    }
  };

  if (iframe.contentWindow?.document?.readyState === 'complete') {
    runPrint();
  } else {
    iframe.onload = runPrint;
    window.setTimeout(runPrint, 400);
  }
}

function slipFilename(order: Order): string {
  const id = order.id.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'order';
  return `StylesNest-slip-${id}.pdf`;
}

function estimateSlipHeightMm(order: Order): number {
  const base = 52;
  const perProduct = 11;
  const extras =
    (order.trackingId?.trim() ? 8 : 0) + (order.notes?.trim() ? 12 : 0);
  return Math.min(180, Math.max(85, base + order.products.length * perProduct + extras));
}

/** Compact 80mm PDF for courier / packing. */
export function downloadOrderSlipPdf(order: Order, storeName = STORE_NAME): void {
  const margin = 4;
  const contentWidth = SLIP_WIDTH_MM - margin * 2;
  const pageHeight = estimateSlipHeightMm(order);

  const doc = new jsPDF({
    unit: 'mm',
    format: [SLIP_WIDTH_MM, pageHeight],
    orientation: 'portrait',
  });

  let y = margin + 2;

  const addText = (
    text: string,
    size: number,
    opts?: { bold?: boolean; align?: 'left' | 'center' | 'right' },
  ) => {
    doc.setFontSize(size);
    doc.setFont('helvetica', opts?.bold ? 'bold' : 'normal');
    const lines = doc.splitTextToSize(text, contentWidth) as string[];
    const x =
      opts?.align === 'center'
        ? SLIP_WIDTH_MM / 2
        : opts?.align === 'right'
          ? SLIP_WIDTH_MM - margin
          : margin;
    const mode = opts?.align === 'center' ? 'center' : opts?.align === 'right' ? 'right' : 'left';
    doc.text(lines, x, y, { align: mode, maxWidth: contentWidth });
    y += lines.length * (size * 0.38) + 1.2;
  };

  const addRule = () => {
    doc.setDrawColor(200);
    doc.line(margin, y, SLIP_WIDTH_MM - margin, y);
    y += 3;
  };

  addText(storeName.toUpperCase(), 11, { bold: true, align: 'center' });
  addText('PACKING SLIP', 8, { align: 'center' });
  y += 1;
  addRule();
  addText(order.id, 10, { bold: true, align: 'center' });
  addText(`${order.date} · ${order.time} · ${order.status}`, 7, { align: 'center' });
  y += 1;
  addRule();
  addText(order.customer, 9, { bold: true });
  addText(order.phone, 8);
  addText(order.city, 8);
  addText(order.address, 8);
  if (order.trackingId?.trim()) {
    y += 1;
    addText(`Tracking: ${order.trackingId.trim()}`, 8, { bold: true });
  }
  y += 1;
  addRule();

  for (const p of order.products) {
    const amt = p.lineTotal ?? p.price * p.quantity;
    addText(productLineLabel(p), 7.5, { bold: true });
    addText(`Qty ${p.quantity}  ·  ${amt.toLocaleString('en-PK')} PKR`, 7, { align: 'right' });
    y += 0.5;
  }

  addRule();
  addText(`TOTAL  ${formatMoney(order.total)}`, 10, { bold: true, align: 'right' });

  if (order.notes?.trim()) {
    y += 1;
    addText(`Note: ${order.notes.trim()}`, 7);
  }

  y += 4;
  addText(`Thank you — ${storeName}`, 7, { align: 'center' });

  doc.save(slipFilename(order));
}
