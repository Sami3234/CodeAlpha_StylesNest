import {
  parsePaymentMethodType,
  paymentTypeLabel,
  type PaymentMethodType,
} from '@/lib/payment-methods';
import type { OrderProduct } from '@/types/order';

/** How payment is settled for the order. */
export type OrderPaymentStatus = 'cod' | 'awaiting_payment' | 'paid';

const VALID_PAYMENT_STATUSES = new Set<OrderPaymentStatus>([
  'cod',
  'awaiting_payment',
  'paid',
]);

export function parseOrderPaymentStatus(raw: unknown): OrderPaymentStatus | undefined {
  if (typeof raw !== 'string') return undefined;
  const value = raw.trim() as OrderPaymentStatus;
  return VALID_PAYMENT_STATUSES.has(value) ? value : undefined;
}

export function defaultPaymentStatusForType(
  type?: PaymentMethodType | null,
): OrderPaymentStatus {
  return type === 'cod' ? 'cod' : 'awaiting_payment';
}

export function inferPaymentMethodTypeFromProducts(
  products: OrderProduct[],
): PaymentMethodType | undefined {
  const raw = products.find((p) => p.paymentMethod?.trim())?.paymentMethod?.toLowerCase() ?? '';
  if (!raw) return undefined;
  if (raw.includes('cash on delivery') || raw.includes('cod')) return 'cod';
  if (raw.includes('jazzcash') || raw.includes('jazz cash')) return 'jazzcash';
  if (raw.includes('easypaisa') || raw.includes('easy paisa')) return 'easypaisa';
  if (raw.includes('bank')) return 'bank';
  return 'other';
}

export function inferPaymentLabelFromProducts(products: OrderProduct[]): string | undefined {
  const line = products.find((p) => p.paymentMethod?.trim())?.paymentMethod?.trim();
  if (!line) return undefined;
  return line.split('|')[0]?.trim() || undefined;
}

export type ResolvedOrderPayment = {
  paymentMethodType?: PaymentMethodType;
  paymentMethodLabel: string;
  paymentStatus: OrderPaymentStatus;
};

export function resolveOrderPayment(
  row: Record<string, unknown>,
  products: OrderProduct[],
): ResolvedOrderPayment {
  const fromColumn = parsePaymentMethodType(row.payment_method_type);
  const fromProducts = inferPaymentMethodTypeFromProducts(products);
  const paymentMethodType = fromColumn ?? fromProducts;

  const labelFromColumn = String(row.payment_method_label ?? '').trim();
  const labelFromProducts = inferPaymentLabelFromProducts(products);
  const paymentMethodLabel =
    labelFromColumn ||
    labelFromProducts ||
    (paymentMethodType ? paymentTypeLabel(paymentMethodType) : 'Not set');

  const statusFromColumn = parseOrderPaymentStatus(row.payment_status);
  const paymentStatus =
    statusFromColumn ?? defaultPaymentStatusForType(paymentMethodType);

  return { paymentMethodType, paymentMethodLabel, paymentStatus };
}

export type PaymentMethodBadgeStyle = {
  label: string;
  bg: string;
  color: string;
  border: string;
};

export function getPaymentMethodBadgeStyle(
  type?: PaymentMethodType | null,
): PaymentMethodBadgeStyle {
  switch (type) {
    case 'cod':
      return { label: 'COD', bg: '#fff7ed', color: '#c2410c', border: '#fdba74' };
    case 'jazzcash':
      return { label: 'Jazz', bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' };
    case 'easypaisa':
      return { label: 'Easy', bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' };
    case 'bank':
      return { label: 'Bank', bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' };
    case 'other':
      return { label: 'Other', bg: '#f8fafc', color: '#475569', border: '#e2e8f0' };
    default:
      return { label: 'Unknown', bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0' };
  }
}

export function getPaymentStatusLabel(status: OrderPaymentStatus): string {
  switch (status) {
    case 'cod':
      return 'Pay on delivery';
    case 'paid':
      return 'Paid';
    default:
      return 'Awaiting payment';
  }
}

export function getPaymentStatusBadgeClass(status: OrderPaymentStatus): string {
  switch (status) {
    case 'paid':
      return 'order-payment-status order-payment-status--paid';
    case 'cod':
      return 'order-payment-status order-payment-status--cod';
    default:
      return 'order-payment-status order-payment-status--pending';
  }
}

/** Server + client: order cannot be placed without a valid payment method type. */
export function requireOrderPaymentMethodType(
  raw: unknown,
): { ok: true; paymentMethodType: PaymentMethodType } | { ok: false; error: string } {
  const paymentMethodType = parsePaymentMethodType(raw);
  if (!paymentMethodType) {
    return {
      ok: false,
      error: 'Please select a payment method before placing your order.',
    };
  }
  return { ok: true, paymentMethodType };
}
