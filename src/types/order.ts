/** Shared order types (safe for server + client imports). */

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
}

export interface Order {
  id: string;
  customer: string;
  phone: string;
  city: string;
  address: string;
  products: OrderProduct[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  date: string;
  time: string;
}
