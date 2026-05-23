'use client';

import { useEffect, useState } from 'react';
import { useProducts } from '@/context/ProductContext';
import { useOrders } from '@/context/OrderContext';
import Link from 'next/link';
import { getProductTitle } from '@/utils/getProductText';
import AdminThumbImage from '@/components/admin/AdminThumbImage';
import AdminPkrAmount from '@/components/admin/AdminPkrAmount';
import type { AdminDashboardStats } from '@/lib/admin-dashboard-stats';
import { ADMIN_BOOTSTRAP_EVENT, type AdminBootstrapPayload } from '@/lib/admin-bootstrap';
import { safeCount } from '@/lib/safe-number';

const statusConfig: Record<string, { color: string; bgColor: string; icon: string }> = {
  pending: { color: '#FF6B35', bgColor: 'rgba(255, 107, 53, 0.12)', icon: '⏳' },
  processing: { color: '#3B82F6', bgColor: 'rgba(59, 130, 246, 0.12)', icon: '⚙️' },
  shipped: { color: '#8B5CF6', bgColor: 'rgba(139, 92, 246, 0.12)', icon: '🚚' },
  delivered: { color: '#10B981', bgColor: 'rgba(16, 185, 129, 0.12)', icon: '✅' },
  cancelled: { color: '#EF4444', bgColor: 'rgba(239, 68, 68, 0.12)', icon: '❌' },
};

const defaultDashboardExtras = (): AdminDashboardStats => ({
  totalUsers: 0,
  totalReviews: 0,
  pendingReviews: 0,
  approvedReviews: 0,
  openSupportTickets: 0,
  totalSupportTickets: 0,
  unsubmittedOrders: 0,
});

const quickStatCardStyle = {
  backgroundColor: '#fff',
  borderRadius: '12px',
  padding: '16px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  textDecoration: 'none',
  color: 'inherit',
  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
} as const;

export default function AdminDashboard() {
  const { products } = useProducts();
  const { orders, getOrderStats, orderNotifications } = useOrders();
  const [dashboardExtras, setDashboardExtras] = useState<AdminDashboardStats>(defaultDashboardExtras);

  useEffect(() => {
    const applyBootstrap = (detail: AdminBootstrapPayload) => {
      setDashboardExtras({
        totalUsers: safeCount(detail.totalUsers),
        totalReviews: safeCount(detail.totalReviews),
        pendingReviews: safeCount(detail.pendingReviews),
        approvedReviews: safeCount(detail.approvedReviews),
        openSupportTickets: safeCount(detail.openSupportTickets),
        totalSupportTickets: safeCount(detail.totalSupportTickets),
        unsubmittedOrders: safeCount(detail.unsubmittedOrders),
      });
    };

    const onBootstrap = (event: Event) => {
      applyBootstrap((event as CustomEvent<AdminBootstrapPayload>).detail);
    };

    window.addEventListener(ADMIN_BOOTSTRAP_EVENT, onBootstrap);
    return () => window.removeEventListener(ADMIN_BOOTSTRAP_EVENT, onBootstrap);
  }, []);

  // Calculate product stats
  const activeProducts = products.filter(p => p.status === 'active' || !p.status).length;
  const inactiveProducts = products.filter(p => p.status === 'inactive').length;
  const totalProducts = products.length;

  // Get order stats from context (sanitized in OrderProvider)
  const {
    total: totalOrders,
    pending: pendingOrders,
    processing: processingOrders,
    shipped: shippedOrders,
    delivered: deliveredOrders,
    cancelled: cancelledOrders,
    pendingAmount,
    processingAmount,
    completedAmount,
    cancelledAmount,
    totalRevenue,
    todayOrders,
  } = getOrderStats();

  // Recent products & orders
  const recentProducts = products.slice(0, 5);
  const recentOrders = orders.slice(0, 5);
  const {
    totalUsers,
    totalReviews,
    pendingReviews,
    approvedReviews,
    openSupportTickets,
    totalSupportTickets,
    unsubmittedOrders: unsubmittedFromApi,
  } = dashboardExtras;

  /** Average product pieces per order (count only, not PKR). */
  const ordersForAvg = orders.filter((o) => o.status !== 'cancelled');
  const avgOrderItems =
    ordersForAvg.length > 0
      ? ordersForAvg.reduce(
          (sum, o) =>
            sum +
            (o.products ?? []).reduce((s, p) => s + safeCount(p.quantity || 1), 0),
          0,
        ) / ordersForAvg.length
      : 0;
  const avgOrderItemsSafe = Number.isFinite(avgOrderItems) ? avgOrderItems : 0;
  const avgOrderItemsLabel =
    avgOrderItemsSafe % 1 === 0
      ? String(Math.round(avgOrderItemsSafe))
      : avgOrderItemsSafe.toFixed(1);
  const unsubmittedTotal = Math.max(
    safeCount(orderNotifications.abandoned),
    safeCount(unsubmittedFromApi),
  );
  const inProgressOrders = safeCount(processingOrders) + safeCount(shippedOrders);
  const cartOrdersCount = orders.filter((o) => o.products.length > 1).length;

  return (
    <div>
      {/* Page Title */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '600', color: '#2c3e50' }}>
          Dashboard
        </h1>
        <p style={{ color: '#666', fontSize: '14px', marginTop: '4px' }}>
          Welcome to your admin dashboard
        </p>
      </div>

      {/* Revenue Overview Cards - Pending vs Completed (Clickable) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4" style={{ gap: '16px', marginBottom: '24px' }}>
        {/* Pending Amount Card */}
        <Link href="/khanadmin/orders?status=pending" style={{ textDecoration: 'none' }}>
          <div style={{
            background: 'linear-gradient(135deg, #FF6B35 0%, #C2410C 100%)',
            borderRadius: '16px',
            padding: '24px',
            color: '#fff',
            position: 'relative',
            overflow: 'hidden',
            cursor: 'pointer',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          }} className="hover:scale-105 hover:shadow-lg">
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.1, fontSize: '100px' }}>⏳</div>
            <p style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px' }}>Pending Amount</p>
            <AdminPkrAmount amount={pendingAmount} size="hero" decimals={2} onDark />
            <p style={{ fontSize: '12px', opacity: 0.8, marginTop: '8px' }}>
              {pendingOrders} orders waiting
            </p>
          </div>
        </Link>

        {/* In Progress Amount Card */}
        <Link href="/khanadmin/orders?status=processing" style={{ textDecoration: 'none' }}>
          <div style={{
            background: 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)',
            borderRadius: '16px',
            padding: '24px',
            color: '#fff',
            position: 'relative',
            overflow: 'hidden',
            cursor: 'pointer',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          }} className="hover:scale-105 hover:shadow-lg">
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.1, fontSize: '100px' }}>🚚</div>
            <p style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px' }}>In Progress</p>
            <AdminPkrAmount amount={processingAmount} size="hero" decimals={2} onDark />
            <p style={{ fontSize: '12px', opacity: 0.8, marginTop: '8px' }}>
              {safeCount(processingOrders) + safeCount(shippedOrders)} orders in progress
            </p>
          </div>
        </Link>

        {/* Completed Amount Card */}
        <Link href="/khanadmin/orders?status=delivered" style={{ textDecoration: 'none' }}>
          <div style={{
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            borderRadius: '16px',
            padding: '24px',
            color: '#fff',
            position: 'relative',
            overflow: 'hidden',
            cursor: 'pointer',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          }} className="hover:scale-105 hover:shadow-lg">
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.1, fontSize: '100px' }}>✅</div>
            <p style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px' }}>Completed Amount</p>
            <AdminPkrAmount amount={completedAmount} size="hero" decimals={2} onDark />
            <p style={{ fontSize: '12px', opacity: 0.8, marginTop: '8px' }}>
              {deliveredOrders} orders delivered
            </p>
          </div>
        </Link>

        {/* Cancelled Amount Card */}
        <Link href="/khanadmin/orders?status=cancelled" style={{ textDecoration: 'none' }}>
          <div style={{
            background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
            borderRadius: '16px',
            padding: '24px',
            color: '#fff',
            position: 'relative',
            overflow: 'hidden',
            cursor: 'pointer',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            opacity: cancelledOrders > 0 ? 1 : 0.7,
          }} className="hover:scale-105 hover:shadow-lg">
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.1, fontSize: '100px' }}>❌</div>
            <p style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px' }}>Cancelled</p>
            <AdminPkrAmount amount={cancelledAmount} size="hero" decimals={2} onDark />
            <p style={{ fontSize: '12px', opacity: 0.8, marginTop: '8px' }}>
              {cancelledOrders} orders cancelled
            </p>
          </div>
        </Link>
      </div>

      {/* Total Revenue Summary */}
      <div style={{
        background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
        borderRadius: '16px',
        padding: '20px 24px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '12px',
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
          }}>
            💰
          </div>
          <div>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>Total Revenue</p>
            <AdminPkrAmount
              amount={totalRevenue}
              size="summary"
              decimals={2}
              onDark
              style={{ color: '#10B981' }}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          <Link href="/khanadmin/orders?period=today" style={{ textDecoration: 'none' }}>
            <div style={{ textAlign: 'center', cursor: 'pointer' }} className="hover:opacity-90">
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>Today</p>
              <p style={{ fontSize: '20px', fontWeight: '600', color: '#fff' }}>{todayOrders}</p>
              <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)', marginTop: '2px' }}>orders</p>
            </div>
          </Link>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>Avg Order</p>
            <p style={{ fontSize: '20px', fontWeight: '600', color: '#fff' }}>{avgOrderItemsLabel}</p>
            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)', marginTop: '2px' }}>items / order</p>
          </div>
          <Link href="/khanadmin/unsubmitted" style={{ textDecoration: 'none' }}>
            <div style={{ textAlign: 'center', cursor: 'pointer' }} className="hover:opacity-90">
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>Unsubmitted</p>
              <p
                style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: unsubmittedTotal > 0 ? '#FB923C' : '#fff',
                }}
              >
                {unsubmittedTotal}
              </p>
              <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)', marginTop: '2px' }}>not completed</p>
            </div>
          </Link>
          <Link href="/khanadmin/orders?status=processing" style={{ textDecoration: 'none' }}>
            <div style={{ textAlign: 'center', cursor: 'pointer' }} className="hover:opacity-90">
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>In Progress</p>
              <p style={{ fontSize: '20px', fontWeight: '600', color: '#fff' }}>{inProgressOrders}</p>
              <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)', marginTop: '2px' }}>processing</p>
            </div>
          </Link>
          {cartOrdersCount > 0 ? (
            <Link href="/khanadmin/cart-orders" style={{ textDecoration: 'none' }}>
              <div style={{ textAlign: 'center', cursor: 'pointer' }} className="hover:opacity-90">
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>Cart Orders</p>
                <p style={{ fontSize: '20px', fontWeight: '600', color: '#fff' }}>{cartOrdersCount}</p>
                <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)', marginTop: '2px' }}>multi-item</p>
              </div>
            </Link>
          ) : null}
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4" style={{ gap: '12px', marginBottom: '24px' }}>
        <Link href="/khanadmin/products" style={quickStatCardStyle} className="hover:scale-[1.02] hover:shadow-md">
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            backgroundColor: 'rgba(52, 152, 219, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#3498db',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div>
            <p style={{ fontSize: '12px', color: '#666' }}>Active Products</p>
            <p style={{ fontSize: '20px', fontWeight: '700', color: '#2c3e50' }}>{activeProducts}</p>
            <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{totalProducts} total</p>
          </div>
        </Link>

        <Link href="/khanadmin/products" style={quickStatCardStyle} className="hover:scale-[1.02] hover:shadow-md">
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            backgroundColor: 'rgba(229, 57, 53, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#e53935',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
            </svg>
          </div>
          <div>
            <p style={{ fontSize: '12px', color: '#666' }}>Inactive</p>
            <p style={{ fontSize: '20px', fontWeight: '700', color: '#2c3e50' }}>{inactiveProducts}</p>
            <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>need attention</p>
          </div>
        </Link>

        <Link href="/khanadmin/users" style={quickStatCardStyle} className="hover:scale-[1.02] hover:shadow-md">
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#3B82F6',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div>
            <p style={{ fontSize: '12px', color: '#666' }}>Total Users</p>
            <p style={{ fontSize: '20px', fontWeight: '700', color: '#2c3e50' }}>
              {totalUsers.toLocaleString('en-PK')}
            </p>
            <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>shop accounts</p>
          </div>
        </Link>

        <Link href="/khanadmin/reviews" style={quickStatCardStyle} className="hover:scale-[1.02] hover:shadow-md">
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            backgroundColor: 'rgba(245, 158, 11, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#D97706',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <div>
            <p style={{ fontSize: '12px', color: '#666' }}>Total Reviews</p>
            <p style={{ fontSize: '20px', fontWeight: '700', color: '#2c3e50' }}>
              {totalReviews.toLocaleString('en-PK')}
            </p>
            <p style={{ fontSize: '11px', color: pendingReviews > 0 ? '#D97706' : '#94a3b8', marginTop: '2px' }}>
              {pendingReviews} pending · {approvedReviews} live
            </p>
          </div>
        </Link>
      </div>

      {/* Engagement snapshot */}
      <div className="grid grid-cols-2 md:grid-cols-4" style={{ gap: '12px', marginBottom: '24px' }}>
        <Link href="/khanadmin/orders" style={quickStatCardStyle} className="hover:scale-[1.02] hover:shadow-md">
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#10B981',
            fontSize: '18px',
          }}>
            📦
          </div>
          <div>
            <p style={{ fontSize: '12px', color: '#666' }}>All Orders</p>
            <p style={{ fontSize: '20px', fontWeight: '700', color: '#2c3e50' }}>{totalOrders}</p>
            <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{shippedOrders} shipped</p>
          </div>
        </Link>

        <Link href="/khanadmin/support" style={quickStatCardStyle} className="hover:scale-[1.02] hover:shadow-md">
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#EF4444',
            fontSize: '18px',
          }}>
            💬
          </div>
          <div>
            <p style={{ fontSize: '12px', color: '#666' }}>Support Tickets</p>
            <p style={{ fontSize: '20px', fontWeight: '700', color: '#2c3e50' }}>{totalSupportTickets}</p>
            <p style={{ fontSize: '11px', color: openSupportTickets > 0 ? '#EF4444' : '#94a3b8', marginTop: '2px' }}>
              {openSupportTickets} open
            </p>
          </div>
        </Link>

        <Link href="/khanadmin/orders?status=pending" style={quickStatCardStyle} className="hover:scale-[1.02] hover:shadow-md">
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            backgroundColor: 'rgba(255, 107, 53, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FF6B35',
            fontSize: '18px',
          }}>
            ⏳
          </div>
          <div>
            <p style={{ fontSize: '12px', color: '#666' }}>Pending Orders</p>
            <p style={{ fontSize: '20px', fontWeight: '700', color: '#2c3e50' }}>{pendingOrders}</p>
            <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>awaiting action</p>
          </div>
        </Link>

        <Link href="/khanadmin/orders?status=delivered" style={quickStatCardStyle} className="hover:scale-[1.02] hover:shadow-md">
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#10B981',
            fontSize: '18px',
          }}>
            ✅
          </div>
          <div>
            <p style={{ fontSize: '12px', color: '#666' }}>Delivered</p>
            <p style={{ fontSize: '20px', fontWeight: '700', color: '#2c3e50' }}>{deliveredOrders}</p>
            <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>completed</p>
          </div>
        </Link>
      </div>

      {/* Recent Orders & Products Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: '20px' }}>
        {/* Recent Orders */}
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          overflow: 'hidden',
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            padding: '16px 20px',
            borderBottom: '1px solid #eee',
          }}>
            <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#2c3e50' }}>
              Recent Orders
            </h2>
            <Link href="/khanadmin/orders" style={{ color: '#10B981', fontSize: '13px', textDecoration: 'none' }}>
              View All
            </Link>
          </div>

          <div>
            {recentOrders.map((order) => (
              <div
                key={order.id}
                style={{
                  padding: '14px 20px',
                  borderBottom: '1px solid #f5f5f5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: '#1E293B',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: '600',
                  }}>
                    {order.customer.charAt(0)}
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: '500', color: '#2c3e50' }}>{order.customer}</p>
                    <p style={{ fontSize: '12px', color: '#999' }}>#{order.id} • {order.city}</p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <AdminPkrAmount
                    amount={order.total}
                    size="inline"
                    decimals={2}
                    style={{ color: '#10B981' }}
                  />
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: '500',
                    backgroundColor: statusConfig[order.status]?.bgColor,
                    color: statusConfig[order.status]?.color,
                  }}>
                    {statusConfig[order.status]?.icon} {order.status === 'pending' ? 'Pending' : order.status === 'processing' ? 'Processing' : order.status === 'shipped' ? 'Shipped' : order.status === 'delivered' ? 'Delivered' : 'Cancelled'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Products */}
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          overflow: 'hidden',
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            padding: '16px 20px',
            borderBottom: '1px solid #eee',
          }}>
            <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#2c3e50' }}>
              Recent Products
            </h2>
            <Link href="/khanadmin/products" style={{ color: '#10B981', fontSize: '13px', textDecoration: 'none' }}>
              View All
            </Link>
          </div>

          <div>
            {recentProducts.map((product) => (
              <div
                key={product.id}
                style={{
                  padding: '14px 20px',
                  borderBottom: '1px solid #f5f5f5',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div style={{ width: '50px', height: '50px', borderRadius: '10px', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                  <AdminThumbImage
                    src={product.image}
                    alt={getProductTitle(product)}
                    sizes="50px"
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ 
                    fontSize: '14px', 
                    color: '#2c3e50', 
                    fontWeight: '500',
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis', 
                    whiteSpace: 'nowrap',
                  }}>
                    {getProductTitle(product)}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <AdminPkrAmount
                      amount={product.currentPrice}
                      size="compact"
                      style={{ color: '#10B981' }}
                    />
                    <span style={{
                      backgroundColor: '#ffebee',
                      color: '#e53935',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '500',
                    }}>
                      {product.discount}% OFF
                    </span>
                    <span style={{
                      backgroundColor: product.status === 'inactive' ? '#ffebee' : '#D1FAE5',
                      color: product.status === 'inactive' ? '#e53935' : '#10B981',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      fontSize: '10px',
                      fontWeight: '500',
                    }}>
                      {product.status === 'inactive' ? 'Inactive' : 'Active'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
