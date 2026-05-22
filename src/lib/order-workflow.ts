import type { Order } from '@/types/order';

/** Pakistan WhatsApp — digits only, leading 92. */
export function normalizePhoneForWhatsApp(phone: string): string {
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) digits = `92${digits.slice(1)}`;
  if (!digits.startsWith('92') && digits.length === 10) digits = `92${digits}`;
  return digits;
}

export function buildOrderWhatsAppUrl(order: Order): string {
  const lines = [
    `Order ${order.id}`,
    `Customer: ${order.customer}`,
    `Phone: ${order.phone}`,
    `City: ${order.city}`,
    `Address: ${order.address}`,
    `Status: ${order.status}`,
    `Total: ${order.total.toLocaleString('en-PK')} PKR`,
    '',
    'Products:',
    ...order.products.map(
      (p) => `• ${p.name} x${p.quantity} — ${(p.price * p.quantity).toLocaleString('en-PK')} PKR`,
    ),
  ];
  if (order.trackingId?.trim()) {
    lines.push('', `Tracking: ${order.trackingId.trim()}`);
  }
  if (order.notes?.trim()) {
    lines.push('', `Note: ${order.notes.trim()}`);
  }
  const text = encodeURIComponent(lines.join('\n'));
  const phone = normalizePhoneForWhatsApp(order.phone);
  return `https://wa.me/${phone}?text=${text}`;
}

/** @deprecated Use printOrderSlip / OrderSlipDialog from `@/lib/order-slip` */
export { buildOrderSlipHtml as buildOrderPrintHtml, printOrderSlip as openOrderPrintWindow } from '@/lib/order-slip';
