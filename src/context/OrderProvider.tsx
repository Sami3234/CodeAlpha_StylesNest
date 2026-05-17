'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import type { Order } from '@/types/order';
import type { FetchErrorKind } from '@/lib/is-network-error';
import { clientFetch, NetworkError } from '@/lib/client-fetch';
import { isAdminPanelPath } from '@/lib/admin-path';

export type { Order, OrderProduct } from '@/types/order';

interface OrderContextType {
  orders: Order[];
  addOrder: (
    order: Omit<Order, 'id' | 'date' | 'time'>,
  ) => Promise<{ order: Order | null; error?: string }>;
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
  fetchError: FetchErrorKind | null;
  reloadOrders: () => Promise<void>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

const getTodayDate = () => new Date().toISOString().split('T')[0];

const getCurrentTime = () => new Date().toTimeString().slice(0, 5);

export function OrderProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const adminPanel = isAdminPanelPath(pathname);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(adminPanel);
  const [fetchError, setFetchError] = useState<FetchErrorKind | null>(null);

  const fetchOrders = async () => {
    try {
      setFetchError(null);
      const response = await clientFetch('/api/orders', { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders ?? []);
        setFetchError(null);
      } else {
        console.error('Failed to fetch orders from API');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      if (error instanceof NetworkError) {
        setFetchError(error.kind);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!adminPanel) {
      setLoading(false);
      return;
    }
    void fetchOrders();
  }, [adminPanel]);

  const addOrder = async (
    orderData: Omit<Order, 'id' | 'date' | 'time'>,
  ): Promise<{ order: Order | null; error?: string }> => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const existingOrderIndex = orders.findIndex((order) => {
      if (order.phone !== orderData.phone) return false;
      try {
        const [year, month, day] = order.date.split('-').map(Number);
        const [hours, minutes] = order.time.split(':').map(Number);
        const orderDateTime = new Date(year, month - 1, day, hours, minutes);
        return orderDateTime >= oneHourAgo && orderDateTime <= now;
      } catch {
        return false;
      }
    });

    if (existingOrderIndex >= 0) {
      const existingOrder = orders[existingOrderIndex];
      const updatedOrder = {
        ...existingOrder,
        products: [...existingOrder.products, ...orderData.products],
        total: existingOrder.total + orderData.total,
        customer: orderData.customer,
        city: orderData.city,
        address: orderData.address,
        time: getCurrentTime(),
      };

      try {
        const response = await clientFetch('/api/orders', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedOrder),
        });

        if (response.ok) {
          const data = await response.json();
          const filteredOrders = orders.filter((_, index) => index !== existingOrderIndex);
          setOrders([data.order, ...filteredOrders]);
          return { order: data.order as Order };
        }
        const errBody = await response.json().catch(() => ({}));
        const message =
          typeof errBody.error === 'string' ? errBody.error : 'Failed to update order';
        return { order: null, error: message };
      } catch (error) {
        console.error('Error updating existing order:', error);
        return { order: null, error: 'Network error while placing order' };
      }
    }

    const newOrder: Order = {
      ...orderData,
      id: '',
      date: getTodayDate(),
      time: getCurrentTime(),
    };

    try {
      const response = await clientFetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder),
      });

      if (response.ok) {
        const data = await response.json();
        setOrders([data.order, ...orders]);
        return { order: data.order as Order };
      }
      const errBody = await response.json().catch(() => ({}));
      const message = typeof errBody.error === 'string' ? errBody.error : 'Failed to place order';
      return { order: null, error: message };
    } catch (error) {
      console.error('Error adding order:', error);
      return { order: null, error: 'Network error while placing order' };
    }
  };

  const updateOrder = async (id: string, orderData: Partial<Omit<Order, 'id'>>) => {
    const order = orders.find((o) => o.id === id);
    if (!order) return;

    const updatedOrder = { ...order, ...orderData };

    try {
      const response = await clientFetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedOrder),
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(orders.map((o) => (o.id === data.order.id ? data.order : o)));
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
      const response = await clientFetch(`/api/orders?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setOrders(orders.filter((order) => order.id !== id));
      } else {
        const errorData = await response.json();
        console.error('Failed to delete order:', errorData);
      }
    } catch (error) {
      console.error('Error deleting order:', error);
    }
  };

  const getOrdersByStatus = (status: Order['status']) =>
    orders.filter((order) => order.status === status);

  const getOrderStats = () => {
    const today = getTodayDate();

    return {
      total: orders.length,
      pending: orders.filter((o) => o.status === 'pending').length,
      processing: orders.filter((o) => o.status === 'processing').length,
      shipped: orders.filter((o) => o.status === 'shipped').length,
      delivered: orders.filter((o) => o.status === 'delivered').length,
      cancelled: orders.filter((o) => o.status === 'cancelled').length,
      pendingAmount: orders.filter((o) => o.status === 'pending').reduce((sum, o) => sum + o.total, 0),
      processingAmount: orders
        .filter((o) => o.status === 'processing' || o.status === 'shipped')
        .reduce((sum, o) => sum + o.total, 0),
      completedAmount: orders.filter((o) => o.status === 'delivered').reduce((sum, o) => sum + o.total, 0),
      cancelledAmount: orders.filter((o) => o.status === 'cancelled').reduce((sum, o) => sum + o.total, 0),
      totalRevenue: orders.filter((o) => o.status !== 'cancelled').reduce((sum, o) => sum + o.total, 0),
      todayOrders: orders.filter((o) => o.date === today).length,
    };
  };

  return (
    <OrderContext.Provider
      value={{
        orders,
        addOrder,
        updateOrder,
        updateOrderStatus,
        deleteOrder,
        getOrdersByStatus,
        getOrderStats,
        loading,
        fetchError,
        reloadOrders: fetchOrders,
      }}
    >
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
