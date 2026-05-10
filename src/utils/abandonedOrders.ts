/**
 * Abandoned/Unsubmitted Orders Management
 * All data stored in NeonDB via API
 * 
 * Validation Rules:
 * - Name is REQUIRED (must not be empty)
 * - Phone is REQUIRED (must not be empty)
 * - At least 4 fields total must be filled (name, phone, city, address, quantity, product_id)
 * - If validation fails, order will NOT be saved
 */

export interface AbandonedOrder {
  id: string;
  name: string;
  phone: string;
  city: string;
  address: string;
  quantity: string;
  product_id: string;
  status: 'unsubmitted';
  created_at: string;
}

interface OrderFromAPI {
  id: string;
  customer: string;
  phone: string;
  city: string;
  address: string;
  products: unknown;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  date: string;
  time: string;
}

/**
 * Count how many fields are filled (non-empty)
 */
export function countFilledFields(data: Partial<AbandonedOrder>): number {
  let count = 0;
  if (data.name && data.name.trim()) count++;
  if (data.phone && data.phone.trim()) count++;
  if (data.city && data.city.trim()) count++;
  if (data.address && data.address.trim()) count++;
  if (data.quantity && data.quantity.trim()) count++;
  if (data.product_id && data.product_id.trim()) count++;
  return count;
}

/**
 * Check if customer has already submitted an order
 */
async function hasSubmittedOrder(phone: string, name: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/orders?phone=${encodeURIComponent(phone)}&customer=${encodeURIComponent(name)}`, {
      cache: 'no-store'
    });
    
    if (response.ok) {
      const data = await response.json();
      const orders: OrderFromAPI[] = data.orders || [];
      // Check if there are any submitted orders (not cancelled)
      return orders.some((order) => order.status !== 'cancelled');
    }
    return false;
  } catch (error) {
    console.error('Error checking submitted orders:', error);
    return false;
  }
}

/**
 * Save an abandoned order to database via API
 * Requirements:
 * - Name and phone are REQUIRED (must not be empty)
 * - At least 3 fields total must be filled
 * - Customer should NOT have already submitted an order
 */
export async function saveAbandonedOrder(data: {
  name: string;
  phone: string;
  city: string;
  address: string;
  quantity: string;
  product_id: string;
}): Promise<boolean> {
  // Check if name and phone are provided (REQUIRED)
  if (!data.name || !data.name.trim() || !data.phone || !data.phone.trim()) {
    console.log('❌ Validation failed: Name and phone are required', data);
    return false;
  }

  // Check if at least 3 fields are filled (reduced from 4 to make it easier to save)
  const filledCount = countFilledFields(data);
  if (filledCount < 3) {
    console.log('❌ Validation failed: At least 3 fields required. Filled:', filledCount, data);
    return false;
  }

  // Check if customer has already submitted an order
  const hasOrder = await hasSubmittedOrder(data.phone, data.name);
  if (hasOrder) {
    console.log('⏭️ Skipping save: Customer has already submitted an order', { phone: data.phone, name: data.name });
    return false;
  }

  try {
    console.log('📤 Sending abandoned order to API:', data);
    const response = await fetch('/api/abandoned', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ API Error:', response.status, errorData);
      return false;
    }

    const result = await response.json();
    console.log('✅ Abandoned order saved:', result);
    return true;
  } catch (error) {
    console.error('❌ Error saving abandoned order:', error);
    return false;
  }
}

/**
 * Remove abandoned order when user successfully submits (via API)
 */
export async function removeAbandonedOrderOnSubmit(phone: string, name: string): Promise<void> {
  try {
    await fetch(`/api/abandoned?phone=${encodeURIComponent(phone)}&name=${encodeURIComponent(name)}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.error('Error removing abandoned order:', error);
  }
}

