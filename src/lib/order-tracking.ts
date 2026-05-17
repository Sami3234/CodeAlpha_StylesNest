import type { Order } from '@/types/order';

export type OrderStatus = Order['status'];

export type TrackingStep = {
  key: OrderStatus | 'placed';
  label: string;
  description: string;
};

const TRACKING_STEPS: TrackingStep[] = [
  {
    key: 'placed',
    label: 'Order placed',
    description: 'We received your order',
  },
  {
    key: 'pending',
    label: 'Pending',
    description: 'Waiting to be confirmed & packed',
  },
  {
    key: 'processing',
    label: 'Processing',
    description: 'Your items are being prepared',
  },
  {
    key: 'shipped',
    label: 'Shipped',
    description: 'On the way to your address',
  },
  {
    key: 'delivered',
    label: 'Delivered',
    description: 'Order completed',
  },
];

const STATUS_INDEX: Record<OrderStatus, number> = {
  pending: 1,
  processing: 2,
  shipped: 3,
  delivered: 4,
  cancelled: -1,
};

export function getTrackingSteps(status: OrderStatus): {
  steps: TrackingStep[];
  activeIndex: number;
  isCancelled: boolean;
} {
  if (status === 'cancelled') {
    return { steps: TRACKING_STEPS, activeIndex: -1, isCancelled: true };
  }
  const activeIndex = STATUS_INDEX[status] ?? 1;
  return { steps: TRACKING_STEPS, activeIndex, isCancelled: false };
}

export function getStatusHeadline(status: OrderStatus): string {
  switch (status) {
    case 'pending':
      return 'Your order is pending';
    case 'processing':
      return 'We are preparing your order';
    case 'shipped':
      return 'Your order has been shipped';
    case 'delivered':
      return 'Delivered — thank you!';
    case 'cancelled':
      return 'This order was cancelled';
    default:
      return 'Order status';
  }
}

export function getStatusHint(status: OrderStatus): string {
  switch (status) {
    case 'pending':
      return 'Please wait — our team will confirm and pack your items soon.';
    case 'processing':
      return 'Your order is being packed. Shipping updates will appear here.';
    case 'shipped':
      return 'Your parcel is on the way. Please keep your phone available for delivery.';
    case 'delivered':
      return 'We hope you enjoy your purchase. Need help? Contact us on WhatsApp.';
    case 'cancelled':
      return 'If you have questions about this cancellation, please contact customer support.';
    default:
      return '';
  }
}

export function getStatusBadgeClass(status: OrderStatus): string {
  return `profile-order-status profile-order-status--${status}`;
}

export function getStatusLabel(status: OrderStatus): string {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'processing':
      return 'Processing';
    case 'shipped':
      return 'Shipped';
    case 'delivered':
      return 'Delivered';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
}

/** Parse DB/API date + time (handles Postgres objects and odd strings). */
export function parseOrderDateTime(date: string, time: string): Date | null {
  const dStr = String(date ?? '').trim();
  const tStr = String(time ?? '00:00').trim();
  if (!dStr) return null;

  const timeMatch = tStr.match(/(\d{1,2}):(\d{2})/);
  const hh = timeMatch ? Number(timeMatch[1]) : 0;
  const mm = timeMatch ? Number(timeMatch[2]) : 0;

  if (/^\d{4}-\d{2}-\d{2}/.test(dStr)) {
    const [y, m, d] = dStr.slice(0, 10).split('-').map(Number);
    if (y && m && d) {
      const dt = new Date(y, m - 1, d, hh, mm);
      return Number.isNaN(dt.getTime()) ? null : dt;
    }
  }

  const isoTry = new Date(tStr.includes(':') ? `${dStr}T${tStr}` : dStr);
  if (!Number.isNaN(isoTry.getTime())) return isoTry;

  const fallback = new Date(dStr);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

export function formatOrderDate(date: string, time: string): string {
  const dt = parseOrderDateTime(date, time);
  if (!dt) {
    const raw = [date, time].filter(Boolean).join(' ').trim();
    return raw || '—';
  }
  return dt.toLocaleString('en-PK', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function formatOrderDateParts(date: string, time: string): {
  dateLabel: string;
  timeLabel: string;
} {
  const dt = parseOrderDateTime(date, time);
  if (!dt) {
    return { dateLabel: '—', timeLabel: '' };
  }
  return {
    dateLabel: dt.toLocaleDateString('en-PK', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
    timeLabel: dt.toLocaleTimeString('en-PK', {
      hour: 'numeric',
      minute: '2-digit',
    }),
  };
}
