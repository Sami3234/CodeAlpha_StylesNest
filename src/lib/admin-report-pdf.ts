import { jsPDF } from 'jspdf';
import type { AdminReportPayload } from '@/lib/admin-business-report';
import type { Order } from '@/types/order';
import type { Product } from '@/data/products';

const MARGIN = 12;
const PAGE_W = 210;
const PAGE_H = 297;
const CONTENT_W = PAGE_W - MARGIN * 2;
const FOOTER_Y = PAGE_H - 10;
const LINE_H = 3.6;
const FONT_SM = 7.5;
const FONT_MD = 8.5;

const BRAND = 'StylesNest';
const ACCENT: [number, number, number] = [255, 107, 53];
const MUTED: [number, number, number] = [100, 116, 139];

type PdfCtx = {
  doc: jsPDF;
  y: number;
  page: number;
};

function money(n: number): string {
  return `${Math.round(n).toLocaleString('en-PK')} PKR`;
}

function clean(text: unknown): string {
  return String(text ?? '')
    .replace(/\s+/g, ' ')
    .trim();
}

function productTitle(product: Product): string {
  if (typeof product.title === 'object' && product.title?.en) {
    return clean(product.title.en);
  }
  return clean(product.title);
}

function formatReportDate(iso: string): string {
  return new Date(iso).toLocaleString('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatOrderDate(order: Order): string {
  return `${order.date}${order.time ? ` ${order.time}` : ''}`;
}

function newCtx(): PdfCtx {
  return { doc: new jsPDF({ unit: 'mm', format: 'a4' }), y: MARGIN, page: 1 };
}

function footer(ctx: PdfCtx) {
  ctx.doc.setFontSize(8);
  ctx.doc.setTextColor(...MUTED);
  ctx.doc.text(`${BRAND} · Admin Business Report · Page ${ctx.page}`, MARGIN, FOOTER_Y);
  ctx.doc.setTextColor(0, 0, 0);
}

function addPage(ctx: PdfCtx) {
  footer(ctx);
  ctx.doc.addPage();
  ctx.page += 1;
  ctx.y = MARGIN;
}

function ensureSpace(ctx: PdfCtx, needed: number) {
  if (ctx.y + needed > FOOTER_Y - 4) addPage(ctx);
}

/** Draw wrapped lines; returns new Y after last line. */
function drawWrapped(
  ctx: PdfCtx,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  opts?: { fontSize?: number; bold?: boolean; color?: [number, number, number]; lineHeight?: number },
): number {
  const { doc } = ctx;
  const fontSize = opts?.fontSize ?? FONT_SM;
  const lineHeight = opts?.lineHeight ?? LINE_H;
  doc.setFont('helvetica', opts?.bold ? 'bold' : 'normal');
  doc.setFontSize(fontSize);
  if (opts?.color) doc.setTextColor(...opts.color);
  else doc.setTextColor(0, 0, 0);

  const lines = doc.splitTextToSize(text || '—', maxWidth) as string[];
  ensureSpace(ctx, lines.length * lineHeight + 2);
  doc.text(lines, x, y);
  doc.setTextColor(0, 0, 0);
  return y + lines.length * lineHeight;
}

function drawHeader(ctx: PdfCtx, payload: AdminReportPayload) {
  const { doc } = ctx;
  doc.setFillColor(...ACCENT);
  doc.rect(0, 0, PAGE_W, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(`${BRAND} — Business Report`, MARGIN, 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Generated: ${formatReportDate(payload.generatedAt)}`, MARGIN, 19);
  doc.text(`Admin: ${payload.adminEmail}`, MARGIN, 24);
  ctx.y = 36;
  doc.setTextColor(0, 0, 0);
}

function sectionTitle(ctx: PdfCtx, title: string) {
  ensureSpace(ctx, 14);
  const { doc } = ctx;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...ACCENT);
  doc.text(title, MARGIN, ctx.y);
  ctx.y += 2;
  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(0.4);
  doc.line(MARGIN, ctx.y, MARGIN + CONTENT_W, ctx.y);
  ctx.y += 7;
  doc.setTextColor(0, 0, 0);
}

function drawLabelValue(ctx: PdfCtx, label: string, value: string, x: number, width: number): number {
  const { doc } = ctx;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(FONT_SM);
  doc.setTextColor(...MUTED);
  doc.text(label, x, ctx.y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  return drawWrapped(ctx, value, x, ctx.y + LINE_H, width, { fontSize: FONT_SM });
}

function summaryGrid(ctx: PdfCtx, payload: AdminReportPayload) {
  const s = payload.summary;
  const rows: [string, string][] = [
    ['Total products', String(s.totalProducts)],
    ['Active / inactive', `${s.activeProducts} / ${s.inactiveProducts}`],
    ['Stock units (on hand)', String(s.totalStockUnits)],
    ['Total sold (units)', String(s.totalSoldUnits)],
    ['Inventory investment', money(s.inventoryInvestment)],
    ['Inventory retail value', money(s.inventoryRetailValue)],
    ['Total orders', String(s.totalOrders)],
    [`Today's orders`, String(s.todayOrders)],
    ['Pending', `${s.pendingOrders} orders · ${money(s.pendingAmount)}`],
    ['Processing + shipped', `${s.processingOrders + s.shippedOrders} orders · ${money(s.processingAmount)}`],
    ['Delivered', `${s.deliveredOrders} orders · ${money(s.completedAmount)}`],
    ['Cancelled (loss)', `${s.cancelledOrders} orders · ${money(s.cancelledAmount)}`],
    ['Total revenue', money(s.totalRevenue)],
    ['COGS (delivered)', money(s.cogsDelivered)],
    ['Gross profit (delivered)', money(s.grossProfitDelivered)],
    ['Registered users', String(s.totalUsers)],
    ['Reviews', `${s.totalReviews} total · ${s.pendingReviews} pending · ${s.approvedReviews} approved`],
    ['Support tickets', `${s.openSupportTickets} open / ${s.totalSupportTickets} total`],
    ['Unsubmitted checkouts', String(s.unsubmittedOrders)],
  ];

  const colW = CONTENT_W / 2 - 4;
  let rowY = ctx.y;

  for (let i = 0; i < rows.length; i += 2) {
    ensureSpace(ctx, 16);
    rowY = ctx.y;
    const leftEnd = drawLabelValue(ctx, rows[i][0], rows[i][1], MARGIN, colW);
    const right = rows[i + 1];
    let rightEnd = rowY;
    if (right) {
      rightEnd = drawLabelValue(ctx, right[0], right[1], MARGIN + colW + 8, colW);
    }
    ctx.y = Math.max(leftEnd, rightEnd) + 4;
  }
  ctx.y += 4;
}

function tableHeader(ctx: PdfCtx, cols: { label: string; x: number; w: number }[]) {
  ensureSpace(ctx, 9);
  const { doc } = ctx;
  const top = ctx.y - 3;
  doc.setFillColor(248, 250, 252);
  doc.rect(MARGIN, top, CONTENT_W, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(FONT_SM);
  doc.setTextColor(51, 65, 85);
  for (const col of cols) {
    doc.text(col.label, col.x, ctx.y);
  }
  ctx.y += 5;
  doc.setDrawColor(226, 232, 240);
  doc.line(MARGIN, ctx.y, MARGIN + CONTENT_W, ctx.y);
  ctx.y += 2;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
}

function tableRow(
  ctx: PdfCtx,
  cols: { x: number; w: number }[],
  cells: string[],
  wrapAt: number[] = [],
) {
  const { doc } = ctx;
  doc.setFontSize(FONT_SM);
  const wrapSet = new Set(wrapAt);
  const lineSets = cells.map((cell, i) => {
    if (wrapSet.has(i)) {
      return doc.splitTextToSize(cell || '—', cols[i].w) as string[];
    }
    return [cell || '—'];
  });
  const maxLines = Math.max(...lineSets.map((lines) => lines.length), 1);
  const rowH = maxLines * LINE_H + 2;
  ensureSpace(ctx, rowH);
  const startY = ctx.y + 2.5;
  lineSets.forEach((lines, i) => {
    doc.text(lines, cols[i].x, startY);
  });
  ctx.y += rowH;
  doc.setDrawColor(241, 245, 249);
  doc.setLineWidth(0.2);
  doc.line(MARGIN, ctx.y, MARGIN + CONTENT_W, ctx.y);
}

const PRODUCT_COLS = [
  { label: 'ID', x: MARGIN, w: 9 },
  { label: 'Product name', x: MARGIN + 10, w: 58 },
  { label: 'Category', x: MARGIN + 69, w: 20 },
  { label: 'Price', x: MARGIN + 90, w: 21 },
  { label: 'Cost', x: MARGIN + 112, w: 21 },
  { label: 'Stock', x: MARGIN + 134, w: 11 },
  { label: 'Sold', x: MARGIN + 146, w: 11 },
  { label: 'Status', x: MARGIN + 158, w: 16 },
];

function drawProductsTable(ctx: PdfCtx, products: Product[]) {
  sectionTitle(ctx, `All Products (${products.length})`);
  tableHeader(ctx, PRODUCT_COLS);

  for (const product of products) {
    const title = productTitle(product) || `Product #${product.id}`;
    const meta = product.productMeta;
    const cost = meta?.costPrice;
    const stock = meta?.stockQuantity;
    tableRow(
      ctx,
      PRODUCT_COLS,
      [
        String(product.id),
        title,
        clean(product.category) || '—',
        money(product.currentPrice),
        cost != null ? money(cost) : '—',
        stock != null ? String(stock) : '—',
        String(product.soldCount ?? 0),
        product.status === 'inactive' ? 'Inactive' : 'Active',
      ],
      [1],
    );
  }
  ctx.y += 4;
}

const ORDER_COLS = [
  { label: 'Order ID', x: MARGIN, w: 26 },
  { label: 'Date', x: MARGIN + 27, w: 24 },
  { label: 'Customer', x: MARGIN + 52, w: 32 },
  { label: 'City', x: MARGIN + 85, w: 18 },
  { label: 'Status', x: MARGIN + 104, w: 18 },
  { label: 'Payment', x: MARGIN + 123, w: 22 },
  { label: 'Total', x: MARGIN + 146, w: 24 },
];

function drawOrdersTable(ctx: PdfCtx, orders: Order[]) {
  sectionTitle(ctx, `All Orders (${orders.length})`);
  if (orders.length === 0) {
    ctx.y = drawWrapped(ctx, 'No orders found.', MARGIN, ctx.y, CONTENT_W, { fontSize: FONT_MD });
    return;
  }

  tableHeader(ctx, ORDER_COLS);

  for (const order of orders) {
    const pay = clean(order.paymentMethodLabel || order.paymentMethodType) || '—';
    tableRow(
      ctx,
      ORDER_COLS,
      [
        clean(order.id),
        formatOrderDate(order),
        clean(order.customer),
        clean(order.city),
        order.status,
        pay,
        money(order.total),
      ],
      [2],
    );
  }

  ctx.y += 4;
  sectionTitle(ctx, 'Order Line Details');
  const { doc } = ctx;
  doc.setFontSize(FONT_SM);

  for (const order of orders) {
    const pay = clean(order.paymentMethodLabel || order.paymentMethodType) || '—';
    const header = `${clean(order.id)} · ${formatOrderDate(order)} · ${clean(order.customer)} · ${clean(order.phone)} · ${order.status} · ${pay} · ${money(order.total)}`;
    ctx.y = drawWrapped(ctx, header, MARGIN, ctx.y, CONTENT_W, {
      fontSize: FONT_SM,
      bold: true,
      color: ACCENT,
    });
    ctx.y += 1;

    if (order.products.length === 0) {
      ctx.y = drawWrapped(ctx, '  No line items', MARGIN + 2, ctx.y, CONTENT_W - 4, { fontSize: FONT_SM });
    } else {
      for (const line of order.products) {
        const pid = line.productId ? `#${line.productId}` : '—';
        const qty = line.quantity || 1;
        const extras = [
          line.selectedColor ? `Color: ${line.selectedColor}` : null,
          line.selectedSize ? `Size: ${line.selectedSize}` : null,
          line.pickPoint ? `Pick: ${line.pickPoint}` : null,
        ]
          .filter(Boolean)
          .join(' · ');
        const text = `  • ${clean(line.name) || 'Item'} (ID ${pid}) × ${qty} @ ${money(line.price)}${extras ? ` · ${extras}` : ''}`;
        ctx.y = drawWrapped(ctx, text, MARGIN + 2, ctx.y, CONTENT_W - 4, { fontSize: FONT_SM });
      }
    }

    if (clean(order.address)) {
      ctx.y = drawWrapped(ctx, `  Address: ${clean(order.address)}`, MARGIN + 2, ctx.y, CONTENT_W - 4, {
        fontSize: FONT_SM,
        color: MUTED,
      });
    }
    ctx.y += 2;
  }
  ctx.y += 2;
}

export function buildAdminReportFilename(generatedAt: string): string {
  const d = new Date(generatedAt);
  const stamp = d.toISOString().slice(0, 10);
  return `stylesnest-admin-report-${stamp}.pdf`;
}

export function downloadAdminReportPdf(payload: AdminReportPayload): void {
  const ctx = newCtx();
  drawHeader(ctx, payload);
  sectionTitle(ctx, 'Executive Summary');
  summaryGrid(ctx, payload);
  drawProductsTable(ctx, payload.products);
  drawOrdersTable(ctx, payload.orders);
  footer(ctx);
  ctx.doc.save(buildAdminReportFilename(payload.generatedAt));
}
