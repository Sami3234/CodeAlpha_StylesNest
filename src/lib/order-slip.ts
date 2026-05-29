import { jsPDF } from 'jspdf';
import type { Order } from '@/types/order';
import {
  slipParcelProductId,
  slipParcelProductTitle,
} from '@/lib/order-product-line';
import { slipLogoImgHtml } from '@/lib/order-slip-logo';

const STORE_NAME = 'StylesNest';
export const SLIP_WIDTH_MM = 80;

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

function formatSlipDate(date: string, time?: string): string {
  const raw = date?.trim();
  if (!raw) return '';
  const parsed = raw.includes('T') ? new Date(raw) : new Date(`${raw}${time?.trim() ? ` ${time.trim()}` : ''}`);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString('en-PK', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }
  return raw;
}

/** Shared B&W styles — print, PDF, and preview use the same HTML. */
export const SLIP_PRINT_STYLES = `
    @page { size: 80mm auto; margin: 4mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 4mm 4.5mm 5mm;
      width: 71mm;
      font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
      font-size: 10px;
      line-height: 1.45;
      color: #000;
      background: #fff;
    }
    .slip-header {
      text-align: center;
      margin: 0 0 12px;
      padding: 0 0 10px;
      border-bottom: 1.5px solid #000;
    }
    .slip-logo {
      display: block;
      margin: 0 auto 8px;
      width: auto;
      height: auto;
      max-width: 50mm;
      max-height: 20mm;
      object-fit: contain;
      object-position: center;
      filter: grayscale(100%);
    }
    .slip-type {
      margin: 0;
      font-size: 8.5px;
      font-weight: 700;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: #333;
    }
    .slip-section {
      margin-bottom: 12px;
    }
    .slip-section-label {
      margin: 0 0 5px;
      font-size: 7.5px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #444;
    }
    .slip-order-id {
      margin: 0;
      font-size: 15px;
      font-weight: 800;
      letter-spacing: 0.02em;
      color: #000;
      line-height: 1.2;
    }
    .slip-order-date {
      margin: 4px 0 0;
      font-size: 9px;
      color: #333;
    }
    .slip-card {
      border: 1.5px solid #000;
      border-radius: 5px;
      padding: 10px 11px;
      margin-bottom: 12px;
      background: #fff;
    }
    .slip-card strong {
      display: block;
      font-size: 12px;
      font-weight: 700;
      margin-bottom: 5px;
      color: #000;
      line-height: 1.3;
    }
    .slip-card span {
      display: block;
      font-size: 9.5px;
      color: #111;
      margin-top: 3px;
      line-height: 1.4;
    }
    .slip-track {
      font-size: 9.5px;
      border: 1px solid #000;
      border-radius: 5px;
      padding: 8px 10px;
      margin-bottom: 12px;
      color: #000;
      line-height: 1.4;
    }
    .slip-track strong {
      font-size: 7.5px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-right: 4px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9px;
      margin: 0 0 10px;
    }
    thead th {
      text-align: left;
      font-size: 7.5px;
      font-weight: 700;
      color: #000;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 6px 4px;
      border-bottom: 1.5px solid #000;
    }
    tbody td {
      padding: 7px 4px;
      vertical-align: top;
      border-bottom: 1px solid #bbb;
      color: #000;
      line-height: 1.35;
    }
    .col-id {
      width: 11%;
      font-weight: 800;
      font-size: 9px;
      white-space: nowrap;
    }
    .col-name { width: 49%; word-break: break-word; font-weight: 600; }
    .col-qty { width: 14%; text-align: center; font-weight: 700; }
    .col-amt { width: 26%; text-align: right; white-space: nowrap; font-weight: 700; }
    .slip-total {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 4px;
      padding: 10px 11px;
      border: 2px solid #000;
      border-radius: 5px;
      background: #fff;
      color: #000;
      font-size: 11px;
      font-weight: 800;
    }
    .slip-total span:last-child { font-size: 12px; }
    .slip-footer {
      margin-top: 14px;
      padding-top: 10px;
      border-top: 1px dashed #888;
      text-align: center;
      font-size: 8px;
      color: #333;
      line-height: 1.5;
    }
    @media print {
      body { padding: 3.5mm 4mm 4.5mm; width: 72mm; }
    }
`;

export function buildOrderSlipHtml(order: Order, storeName = STORE_NAME): string {
  const orderDate = formatSlipDate(order.date, order.time);
  const productsHtml = order.products
    .map((p) => {
      const lineTotal = (p.lineTotal ?? p.price * p.quantity).toLocaleString('en-PK');
      return `<tr>
        <td class="col-id">${escapeHtml(slipParcelProductId(p))}</td>
        <td class="col-name">${escapeHtml(slipParcelProductTitle(p))}</td>
        <td class="col-qty">×${p.quantity}</td>
        <td class="col-amt">${lineTotal}</td>
      </tr>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(order.id)} — ${escapeHtml(storeName)}</title>
  <style>${SLIP_PRINT_STYLES}</style>
</head>
<body>
  <header class="slip-header">
    ${slipLogoImgHtml()}
    <p class="slip-type">Packing slip</p>
  </header>

  <section class="slip-section">
    <p class="slip-section-label">Order no.</p>
    <p class="slip-order-id">${escapeHtml(order.id)}</p>
    ${orderDate ? `<p class="slip-order-date">${escapeHtml(orderDate)}</p>` : ''}
  </section>

  <section class="slip-card">
    <p class="slip-section-label">Receiver</p>
    <strong>${escapeHtml(order.customer)}</strong>
    <span>${escapeHtml(order.phone)}</span>
    <span>${escapeHtml(order.city)}</span>
    <span>${escapeHtml(order.address)}</span>
  </section>

  ${order.trackingId?.trim() ? `<div class="slip-track"><strong>Tracking</strong> ${escapeHtml(order.trackingId.trim())}</div>` : ''}

  <table>
    <thead>
      <tr>
        <th class="col-id">ID</th>
        <th class="col-name">Product</th>
        <th class="col-qty">Qty</th>
        <th class="col-amt">PKR</th>
      </tr>
    </thead>
    <tbody>${productsHtml}</tbody>
  </table>

  <div class="slip-total"><span>Total</span><span>${formatMoney(order.total)}</span></div>

  <p class="slip-footer">Thank you for shopping with ${escapeHtml(storeName)}</p>
</body>
</html>`;
}

function waitForDocumentImages(doc: Document, timeoutMs = 4000): Promise<void> {
  const images = Array.from(doc.images);
  if (images.length === 0) return Promise.resolve();

  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      resolve();
    };

    const timer = window.setTimeout(finish, timeoutMs);
    let pending = 0;

    for (const img of images) {
      if (img.complete) continue;
      pending += 1;
      img.addEventListener('load', () => {
        pending -= 1;
        if (pending <= 0) {
          window.clearTimeout(timer);
          finish();
        }
      });
      img.addEventListener('error', () => {
        pending -= 1;
        if (pending <= 0) {
          window.clearTimeout(timer);
          finish();
        }
      });
    }

    if (pending === 0) {
      window.clearTimeout(timer);
      finish();
    }
  });
}

async function mountSlipIframe(html: string): Promise<{
  iframe: HTMLIFrameElement;
  body: HTMLElement;
  cleanup: () => void;
}> {
  const iframe = document.createElement('iframe');
  iframe.setAttribute(
    'style',
    'position:fixed;left:-10000px;top:0;width:80mm;border:0;visibility:hidden',
  );
  iframe.setAttribute('title', 'Order slip render');
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
  if (!doc) {
    iframe.remove();
    throw new Error('Could not render slip');
  }

  doc.open();
  doc.write(html);
  doc.close();

  await waitForDocumentImages(doc);
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

  const body = doc.body;
  if (!body) {
    iframe.remove();
    throw new Error('Could not render slip body');
  }

  const height = Math.max(body.scrollHeight, doc.documentElement.scrollHeight);
  iframe.style.height = `${height}px`;

  return {
    iframe,
    body,
    cleanup: () => iframe.remove(),
  };
}

function slipFilename(order: Order): string {
  const id = order.id.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'order';
  return `StylesNest-slip-${id}.pdf`;
}

/** Print via hidden iframe (same HTML as PDF). */
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

  void waitForDocumentImages(doc).then(() => {
    if (iframe.contentWindow?.document?.readyState === 'complete') {
      runPrint();
    } else {
      iframe.onload = runPrint;
      window.setTimeout(runPrint, 500);
    }
  });
}

/** PDF from the same HTML as print — 100% matching layout (B&W). */
export async function downloadOrderSlipPdf(
  order: Order,
  storeName = STORE_NAME,
): Promise<void> {
  const html = buildOrderSlipHtml(order, storeName);
  const { body, cleanup } = await mountSlipIframe(html);

  try {
    const { default: html2canvas } = await import('html2canvas');
    const canvas = await html2canvas(body, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: body.scrollWidth,
      height: body.scrollHeight,
      windowWidth: body.scrollWidth,
      windowHeight: body.scrollHeight,
    });

    const imgData = canvas.toDataURL('image/png');
    const widthMm = SLIP_WIDTH_MM;
    const heightMm = (canvas.height / canvas.width) * widthMm;

    const doc = new jsPDF({
      unit: 'mm',
      format: [widthMm, heightMm],
      orientation: 'portrait',
    });

    doc.addImage(imgData, 'PNG', 0, 0, widthMm, heightMm);
    doc.save(slipFilename(order));
  } finally {
    cleanup();
  }
}
