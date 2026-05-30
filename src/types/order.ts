/** Shared order types (safe for server + client imports). */

import type { PaymentMethodType } from '@/lib/payment-methods';
import type { OrderPaymentStatus } from '@/lib/order-payment';

export interface OrderProduct {
  name: string;
  quantity: number;
  /** Unit price in PKR */
  price: number;
  productId?: number;
  lineTotal?: number;
  paymentMethod?: string;
  selectedSize?: string;
  selectedColor?: string;
  /** Snapshotted from product at order time — admin packing only. */
  pickPoint?: string;
}

export interface Order {
  id: string;
  customer: string;
  phone: string;
  city: string;
  address: string;
  products: OrderProduct[];
  /** Product subtotal in PKR */
  subtotal?: number;
  /** Delivery fee in PKR */
  deliveryFee?: number;
  /** COD handling fee in PKR (30 when paying cash on delivery). */
  codFee?: number;
  /** Selected payment type — used for server-side total validation. */
  paymentMethodType?: PaymentMethodType;
  /** Display label at order time (e.g. JazzCash). */
  paymentMethodLabel?: string;
  /** Payment settlement: cod | awaiting_payment | paid */
  paymentStatus?: OrderPaymentStatus;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  date: string;
  time: string;
  /** Internal admin note (not shown to customer on storefront). */
  notes?: string;
  /** Courier / tracking reference. */
  trackingId?: string;
  /** Shop account that placed this order (for email-based tracking). */
  shopUserId?: number;
}
