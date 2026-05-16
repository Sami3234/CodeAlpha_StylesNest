export type PaymentMethodType =
  | 'jazzcash'
  | 'easypaisa'
  | 'bank'
  | 'cod'
  | 'other';

export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  label: string;
  accountTitle?: string;
  accountNumber?: string;
  iban?: string;
  bankName?: string;
  instructions?: string;
  active: boolean;
  sortOrder: number;
}

export const DEFAULT_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'cod-default',
    type: 'cod',
    label: 'Cash on Delivery',
    instructions: 'Pay when your order is delivered.',
    active: true,
    sortOrder: 0,
  },
  {
    id: 'jazzcash-default',
    type: 'jazzcash',
    label: 'JazzCash',
    accountTitle: 'Styles Nest',
    accountNumber: '03001234567',
    instructions: 'Send payment to the number below and mention your order ID.',
    active: true,
    sortOrder: 1,
  },
  {
    id: 'bank-default',
    type: 'bank',
    label: 'Bank Transfer',
    bankName: 'Meezan Bank',
    accountTitle: 'Styles Nest',
    accountNumber: '01234567890123',
    iban: 'PK00MEZN0001234567890123',
    instructions: 'Transfer the order amount and share screenshot on WhatsApp.',
    active: true,
    sortOrder: 2,
  },
];

const TYPE_LABELS: Record<PaymentMethodType, string> = {
  jazzcash: 'JazzCash',
  easypaisa: 'EasyPaisa',
  bank: 'Bank Transfer',
  cod: 'Cash on Delivery',
  other: 'Other',
};

export function paymentTypeLabel(type: PaymentMethodType): string {
  return TYPE_LABELS[type] ?? type;
}

export function parsePaymentMethods(raw: unknown): PaymentMethod[] {
  if (!raw) return [];
  let list: unknown[] = [];
  if (typeof raw === 'string') {
    try {
      list = JSON.parse(raw) as unknown[];
    } catch {
      return [];
    }
  } else if (Array.isArray(raw)) {
    list = raw;
  } else {
    return [];
  }

  const methods: PaymentMethod[] = [];
  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    const type = o.type as PaymentMethodType;
    if (!['jazzcash', 'easypaisa', 'bank', 'cod', 'other'].includes(type)) continue;
    const label = typeof o.label === 'string' ? o.label.trim() : '';
    if (!label) continue;
    methods.push({
      id: typeof o.id === 'string' && o.id.trim() ? o.id.trim() : `pm-${Date.now()}-${methods.length}`,
      type,
      label,
      accountTitle: typeof o.accountTitle === 'string' ? o.accountTitle.trim() : undefined,
      accountNumber: typeof o.accountNumber === 'string' ? o.accountNumber.trim() : undefined,
      iban: typeof o.iban === 'string' ? o.iban.trim() : undefined,
      bankName: typeof o.bankName === 'string' ? o.bankName.trim() : undefined,
      instructions: typeof o.instructions === 'string' ? o.instructions.trim() : undefined,
      active: o.active !== false,
      sortOrder: typeof o.sortOrder === 'number' ? o.sortOrder : methods.length,
    });
  }

  return methods.sort((a, b) => a.sortOrder - b.sortOrder);
}

export function sanitizePaymentMethods(methods: PaymentMethod[]): PaymentMethod[] {
  return methods
    .map((m, index) => ({
      ...m,
      label: m.label.trim().slice(0, 80),
      accountTitle: m.accountTitle?.trim().slice(0, 120),
      accountNumber: m.accountNumber?.trim().slice(0, 40),
      iban: m.iban?.trim().slice(0, 34),
      bankName: m.bankName?.trim().slice(0, 80),
      instructions: m.instructions?.trim().slice(0, 500),
      sortOrder: index,
    }))
    .filter((m) => m.label.length > 0);
}

export function getActivePaymentMethods(methods: PaymentMethod[]): PaymentMethod[] {
  return methods.filter((m) => m.active);
}

export function formatPaymentMethodForOrder(method: PaymentMethod): string {
  const parts = [method.label];
  if (method.bankName) parts.push(`Bank: ${method.bankName}`);
  if (method.accountTitle) parts.push(`Title: ${method.accountTitle}`);
  if (method.accountNumber) parts.push(`Account: ${method.accountNumber}`);
  if (method.iban) parts.push(`IBAN: ${method.iban}`);
  return parts.join(' | ');
}

export function buildWhatsAppLink(phoneDigits: string, message: string): string {
  const digits = phoneDigits.replace(/\D/g, '');
  if (!digits) return '';
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function buildOrderWhatsAppMessage(params: {
  orderId: string;
  customerName: string;
  customerWhatsApp: string;
  productName: string;
  quantity: number;
  total: number;
  city: string;
  address: string;
  paymentLabel: string;
  size?: string;
}): string {
  const lines = [
    'Assalam o Alaikum, I placed an order on Styles Nest.',
    '',
    `Order ID: ${params.orderId}`,
    `Name: ${params.customerName}`,
    `WhatsApp: ${params.customerWhatsApp}`,
    `Product: ${params.productName}`,
    params.size ? `Size: ${params.size}` : '',
    `Qty: ${params.quantity}`,
    `Total: ${params.total} PKR`,
    `Payment: ${params.paymentLabel}`,
    `City: ${params.city}`,
    `Address: ${params.address}`,
    '',
    'Please confirm my order. Thank you!',
  ].filter(Boolean);
  return lines.join('\n');
}
