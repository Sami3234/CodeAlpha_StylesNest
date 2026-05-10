'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useOrders } from '@/context/OrderContext';
import type { Order } from '@/context/OrderContext';
import './admin-cart-orders.css';

const STATUS_OPTIONS: Order['status'][] = [
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
];

/** Prefer readable local datetime when DB sends ISO in `date`. */
function formatOrderTimestamp(order: Order): string {
  const { date, time } = order;
  if (date && date.includes('T')) {
    try {
      const d = new Date(date);
      if (!Number.isNaN(d.getTime())) {
        return d.toLocaleString(undefined, {
          dateStyle: 'medium',
          timeStyle: 'short',
        });
      }
    } catch {
      /* fall through */
    }
  }
  const parts = [date, time].filter(Boolean);
  return parts.length ? parts.join(' · ') : '—';
}

function StatusBadge({ status }: { status: Order['status'] }) {
  const map: Record<Order['status'], string> = {
    pending: 'aco-badge aco-badge--pending',
    processing: 'aco-badge aco-badge--processing',
    shipped: 'aco-badge aco-badge--shipped',
    delivered: 'aco-badge aco-badge--delivered',
    cancelled: 'aco-badge aco-badge--cancelled',
  };
  return <span className={map[status]}>{status}</span>;
}

export default function AdminCartOrdersPage() {
  const { orders, loading, updateOrderStatus } = useOrders();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState('');

  const multiItemOrders = useMemo(() => {
    const list = orders.filter((o) => Array.isArray(o.products) && o.products.length >= 2);
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((o) => {
      const blob = [
        o.id,
        o.customer,
        o.phone,
        o.city,
        ...o.products.map((p) => p.name),
      ]
        .join(' ')
        .toLowerCase();
      return blob.includes(q);
    });
  }, [orders, query]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="aco-wrap">
      <header className="aco-hero">
        <h1 className="aco-title">Multi-item orders</h1>
        <p className="aco-lede">
          Cart checkouts with <strong>two or more product lines</strong>. Review line items, totals, and delivery
          details here — update order status without switching pages.
        </p>
        <Link href="/admin/orders" className="aco-back">
          ← All orders
        </Link>
      </header>

      <div className="aco-toolbar">
        <input
          type="search"
          className="aco-search"
          placeholder="Search ID, customer, phone, city, product…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search multi-item orders"
        />
        <span className="aco-count">
          Showing <strong>{multiItemOrders.length}</strong> order{multiItemOrders.length !== 1 ? 's' : ''}
        </span>
      </div>

      {loading ? (
        <p className="aco-loading">Loading orders…</p>
      ) : multiItemOrders.length === 0 ? (
        <div className="aco-empty">No multi-item orders yet.</div>
      ) : (
        <div className="aco-stack">
          {multiItemOrders.map((order) => (
            <article key={order.id} className="aco-card">
              <div className="aco-card__head">
                <div className="aco-card__head-left">
                  <button
                    type="button"
                    className="aco-expand"
                    onClick={() => toggleExpand(order.id)}
                    aria-expanded={!!expanded[order.id]}
                  >
                    <span aria-hidden>{expanded[order.id] ? '▼' : '▶'}</span>
                    {order.products.length} line items
                  </button>
                  <span className="aco-order-id">{order.id}</span>
                  <StatusBadge status={order.status} />
                </div>
                <div className="aco-when">{formatOrderTimestamp(order)}</div>
              </div>

              <div className="aco-meta">
                <div>
                  <span className="aco-label">Customer</span>
                  <div className="aco-customer-name">{order.customer || '—'}</div>
                  <div className="aco-customer-phone">{order.phone || '—'}</div>
                </div>
                <div>
                  <span className="aco-label">Ship to</span>
                  <div className="aco-city">{order.city || '—'}</div>
                  <div className="aco-address">{order.address || '—'}</div>
                </div>
                <div className="aco-total-col">
                  <span className="aco-label">Order total</span>
                  <div className="aco-total-amt">{Number(order.total).toFixed(2)} PKR</div>
                  <div className="aco-status-field">
                    <label htmlFor={`status-${order.id}`}>Order status</label>
                    <select
                      id={`status-${order.id}`}
                      className="aco-select"
                      value={order.status}
                      onChange={(e) =>
                        updateOrderStatus(order.id, e.target.value as Order['status'])
                      }
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {expanded[order.id] ? (
                <div className="aco-lines">
                  <span className="aco-label">Products in this order</span>
                  <div className="aco-table-scroll">
                    <table className="aco-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Product</th>
                          <th>Qty</th>
                          <th>Unit price</th>
                          <th>Line total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.products.map((p, idx) => (
                          <tr key={`${order.id}-${idx}`}>
                            <td className="aco-td-num">{idx + 1}</td>
                            <td className="aco-td-product">{p.name}</td>
                            <td className="aco-td-qty">{p.quantity}</td>
                            <td className="aco-td-price">{Number(p.price).toFixed(2)} PKR</td>
                            <td className="aco-td-line">
                              {(Number(p.price) * p.quantity).toFixed(2)} PKR
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
