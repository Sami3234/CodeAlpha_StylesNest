'use client';

import { useState, useEffect } from 'react';
import { useProducts } from '@/context/ProductContext';
import { useOrders } from '@/context/OrderContext';
import Image from 'next/image';
import Link from 'next/link';
import { getProductTitle } from '@/utils/getProductText';

const statusConfig: Record<string, { color: string; bgColor: string; icon: string }> = {
  pending: { color: '#FF6B35', bgColor: 'rgba(255, 107, 53, 0.12)', icon: '⏳' },
  processing: { color: '#3B82F6', bgColor: 'rgba(59, 130, 246, 0.12)', icon: '⚙️' },
  shipped: { color: '#8B5CF6', bgColor: 'rgba(139, 92, 246, 0.12)', icon: '🚚' },
  delivered: { color: '#10B981', bgColor: 'rgba(16, 185, 129, 0.12)', icon: '✅' },
  cancelled: { color: '#EF4444', bgColor: 'rgba(239, 68, 68, 0.12)', icon: '❌' },
};

export default function AdminDashboard() {
  const { products } = useProducts();
  const { orders, getOrderStats } = useOrders();

  // Calculate product stats
  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.status === 'active' || !p.status).length;
  const inactiveProducts = products.filter(p => p.status === 'inactive').length;
  const totalCategories = [...new Set(products.map(p => p.category))].length;

  // Get order stats from context
  const stats = getOrderStats();
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
  } = stats;

  // Recent products & orders
  const recentProducts = products.slice(0, 5);
  const recentOrders = orders.slice(0, 5);

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
        <Link href="/admin/orders?status=pending" style={{ textDecoration: 'none' }}>
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
            <p style={{ fontSize: '32px', fontWeight: '700' }}>{pendingAmount.toFixed(2)} PKR</p>
            <p style={{ fontSize: '12px', opacity: 0.8, marginTop: '8px' }}>
              {pendingOrders} orders waiting
            </p>
          </div>
        </Link>

        {/* In Progress Amount Card */}
        <Link href="/admin/orders?status=processing" style={{ textDecoration: 'none' }}>
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
            <p style={{ fontSize: '32px', fontWeight: '700' }}>{processingAmount.toFixed(2)} PKR</p>
            <p style={{ fontSize: '12px', opacity: 0.8, marginTop: '8px' }}>
              {processingOrders + shippedOrders} orders in progress
            </p>
          </div>
        </Link>

        {/* Completed Amount Card */}
        <Link href="/admin/orders?status=delivered" style={{ textDecoration: 'none' }}>
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
            <p style={{ fontSize: '32px', fontWeight: '700' }}>{completedAmount.toFixed(2)} PKR</p>
            <p style={{ fontSize: '12px', opacity: 0.8, marginTop: '8px' }}>
              {deliveredOrders} orders delivered
            </p>
          </div>
        </Link>

        {/* Cancelled Amount Card */}
        <Link href="/admin/orders?status=cancelled" style={{ textDecoration: 'none' }}>
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
            <p style={{ fontSize: '32px', fontWeight: '700' }}>{cancelledAmount.toFixed(2)} PKR</p>
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
            <p style={{ fontSize: '28px', fontWeight: '700', color: '#10B981' }}>{totalRevenue.toFixed(2)} PKR</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>Total Orders</p>
            <p style={{ fontSize: '20px', fontWeight: '600', color: '#fff' }}>{totalOrders}</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>Today</p>
            <p style={{ fontSize: '20px', fontWeight: '600', color: '#fff' }}>{todayOrders}</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>Avg Order</p>
            <p style={{ fontSize: '20px', fontWeight: '600', color: '#fff' }}>{(totalRevenue / (totalOrders - cancelledOrders) || 0).toFixed(2)} PKR</p>
          </div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4" style={{ gap: '12px', marginBottom: '24px' }}>
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          padding: '16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
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
            <p style={{ fontSize: '12px', color: '#666' }}>Active</p>
            <p style={{ fontSize: '20px', fontWeight: '700', color: '#2c3e50' }}>{activeProducts}</p>
          </div>
        </div>

        <div style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          padding: '16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
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
          </div>
        </div>

        <div style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          padding: '16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
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
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          </div>
          <div>
            <p style={{ fontSize: '12px', color: '#666' }}>Categories</p>
            <p style={{ fontSize: '20px', fontWeight: '700', color: '#2c3e50' }}>{totalCategories}</p>
          </div>
        </div>

        <div style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          padding: '16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#8B5CF6',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div>
            <p style={{ fontSize: '12px', color: '#666' }}>Avg Order</p>
            <p style={{ fontSize: '20px', fontWeight: '700', color: '#2c3e50' }}>${Math.round(totalRevenue / (totalOrders - cancelledOrders) || 0)}</p>
          </div>
        </div>
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
            <Link href="/admin/orders" style={{ color: '#10B981', fontSize: '13px', textDecoration: 'none' }}>
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
                  <p style={{ fontSize: '15px', fontWeight: '600', color: '#10B981' }}>{order.total.toFixed(2)} PKR</p>
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
            <Link href="/admin/products" style={{ color: '#10B981', fontSize: '13px', textDecoration: 'none' }}>
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
                  <Image 
                    src={product.image} 
                    alt={getProductTitle(product)} 
                    fill 
                    style={{ objectFit: 'cover' }} 
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
                    <span style={{ color: '#10B981', fontWeight: '600', fontSize: '14px' }}>
                      {product.currentPrice} PKR
                    </span>
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
