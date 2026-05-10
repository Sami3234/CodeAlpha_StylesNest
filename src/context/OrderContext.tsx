'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface OrderProduct {
  name: string;
  quantity: number;
  price: number;
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

interface OrderContextType {
  orders: Order[];
  /** Persists order via API. Returns true if the write succeeded. */
  addOrder: (order: Omit<Order, 'id' | 'date' | 'time'>) => Promise<boolean>;
  updateOrder: (id: string, orderData: Partial<Omit<Order, 'id'>>) => void;
  updateOrderStatus: (id: string, status: Order['status']) => void;
  deleteOrder: (id: string) => void;
  getOrdersByStatus: (status: Order['status']) => Order[];
  getOrderStats: () => {
    total: number;
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
    pendingAmount: number;
    processingAmount: number;
    completedAmount: number;
    cancelledAmount: number;
    totalRevenue: number;
    todayOrders: number;
  };
  loading: boolean;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

// Get today's date in YYYY-MM-DD format
const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

// Get current time in HH:MM format
const getCurrentTime = () => {
  const now = new Date();
  return now.toTimeString().slice(0, 5);
};

// Generate unique order ID in format #QE1001, #QE1002, etc.
const generateOrderId = async () => {
  try {
    // Get the count of existing orders to generate next number
    const response = await fetch('/api/orders', { cache: 'no-store' });
    if (response.ok) {
      const data = await response.json();
      const orderCount = data.orders.length;
      const nextNumber = orderCount + 1;
      return `#QE${nextNumber.toString().padStart(4, '0')}`;
    }
  } catch (error) {
    console.error('Error generating order ID:', error);
  }
  // Fallback to timestamp-based ID
  const random = Math.floor(Math.random() * 9999) + 1;
  return `#QE${random.toString().padStart(4, '0')}`;
};

export function OrderProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch orders from API on mount
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders', { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders);
      } else {
        console.error('Failed to fetch orders from API');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Add Order with Smart Grouping
   * - If same customer (phone) has an order within 1 hour: Add products to existing order
   * - Otherwise: Create new order
   * - Updated order moves to top of list
   */
  const addOrder = async (orderData: Omit<Order, 'id' | 'date' | 'time'>): Promise<boolean> => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago
    
    // Check if there's an existing order from same customer (phone) within 1 hour
    const existingOrderIndex = orders.findIndex(order => {
      // Match by phone number
      if (order.phone !== orderData.phone) return false;
      
      // Check if order is within 1 hour
      try {
        // Parse date and time (format: YYYY-MM-DD and HH:MM or HH:MM:SS)
        const [year, month, day] = order.date.split('-').map(Number);
        const [hours, minutes] = order.time.split(':').map(Number);
        const orderDateTime = new Date(year, month - 1, day, hours, minutes);
        
        return orderDateTime >= oneHourAgo && orderDateTime <= now;
      } catch (e) {
        return false; // If date parsing fails, don't group
      }
    });
    
    if (existingOrderIndex >= 0) {
      // Add products to existing order
      const existingOrder = orders[existingOrderIndex];
      const updatedOrder = {
        ...existingOrder,
        products: [...existingOrder.products, ...orderData.products],
        total: existingOrder.total + orderData.total,
        // Update customer info if changed
        customer: orderData.customer,
        city: orderData.city,
        address: orderData.address,
        // Update time to show recent activity
        time: getCurrentTime(),
      };
      
      try {
        const response = await fetch('/api/orders', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedOrder),
        });

        if (response.ok) {
          const data = await response.json();
          // Remove old order and add updated order at the top
          const filteredOrders = orders.filter((_, index) => index !== existingOrderIndex);
          setOrders([data.order, ...filteredOrders]);
          return true;
        }
        console.error('Failed to merge order:', await response.text().catch(() => ''));
        return false;
      } catch (error) {
        console.error('Error updating existing order:', error);
        return false;
      }
    } else {
      // Create new order
      const orderId = await generateOrderId();
      const newOrder: Order = {
        ...orderData,
        id: orderId,
        date: getTodayDate(),
        time: getCurrentTime(),
      };

      try {
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newOrder),
        });

        if (response.ok) {
          const data = await response.json();
          setOrders([data.order, ...orders]);
          return true;
        }
        console.error('Failed to add order:', await response.text().catch(() => ''));
        return false;
      } catch (error) {
        console.error('Error adding order:', error);
        return false;
      }
    }
  };

  const updateOrder = async (id: string, orderData: Partial<Omit<Order, 'id'>>) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;

    const updatedOrder = { ...order, ...orderData };

    try {
      const response = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedOrder),
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(orders.map(o => 
          o.id === data.order.id ? data.order : o
        ));
      } else {
        console.error('Failed to update order');
      }
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const updateOrderStatus = async (id: string, status: Order['status']) => {
    await updateOrder(id, { status });
  };

  const deleteOrder = async (id: string) => {
    try {
      const response = await fetch(`/api/orders?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setOrders(orders.filter(order => order.id !== id));
      } else {
        const errorData = await response.json();
        console.error('Failed to delete order:', errorData);
      }
    } catch (error) {
      console.error('Error deleting order:', error);
    }
  };

  const getOrdersByStatus = (status: Order['status']) => {
    return orders.filter(order => order.status === status);
  };

  const getOrderStats = () => {
    const today = getTodayDate();
    
    return {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      processing: orders.filter(o => o.status === 'processing').length,
      shipped: orders.filter(o => o.status === 'shipped').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
      pendingAmount: orders.filter(o => o.status === 'pending').reduce((sum, o) => sum + o.total, 0),
      processingAmount: orders.filter(o => o.status === 'processing' || o.status === 'shipped').reduce((sum, o) => sum + o.total, 0),
      completedAmount: orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + o.total, 0),
      cancelledAmount: orders.filter(o => o.status === 'cancelled').reduce((sum, o) => sum + o.total, 0),
      totalRevenue: orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + o.total, 0),
      todayOrders: orders.filter(o => o.date === today).length,
    };
  };

  return (
    <OrderContext.Provider value={{
      orders,
      addOrder,
      updateOrder,
      updateOrderStatus,
      deleteOrder,
      getOrdersByStatus,
      getOrderStats,
      loading,
    }}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
}
