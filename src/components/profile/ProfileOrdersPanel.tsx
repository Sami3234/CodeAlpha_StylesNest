'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { Order } from '@/types/order';
import { clientMessageFromApi } from '@/lib/safe-errors';
import {
  formatOrderDateParts,
  getStatusBadgeClass,
  getStatusLabel,
} from '@/lib/order-tracking';
import { formatPrice } from '@/utils/formatPrice';
import ConnectionProblem from '@/components/network/ConnectionProblem';
import ProfileOrderDetail from '@/components/profile/ProfileOrderDetail';
import { clientFetch, NetworkError } from '@/lib/client-fetch';
import { IoChevronForward } from 'react-icons/io5';
import './profile-orders.css';

type ProfileOrdersPanelProps = {
  refreshKey?: number;
};

export default function ProfileOrdersPanel({ refreshKey = 0 }: ProfileOrdersPanelProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsPhone, setNeedsPhone] = useState(false);
  const [hint, setHint] = useState('');
  const [error, setError] = useState('');
  const [fetchError, setFetchError] = useState<'offline' | 'network' | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    setFetchError(null);
    try {
      const res = await clientFetch('/api/account/orders', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) {
        setError(clientMessageFromApi(data, 'Could not load orders'));
        setOrders([]);
        setSelectedId(null);
        return;
      }
      const list: Order[] = Array.isArray(data.orders) ? data.orders : [];
      setOrders(list);
      setNeedsPhone(Boolean(data.needsPhone));
      setHint(typeof data.message === 'string' ? data.message : '');
      setSelectedId((prev) => (prev && list.some((o) => o.id === prev) ? prev : null));
    } catch (err) {
      if (err instanceof NetworkError) {
        setFetchError(err.kind);
      } else {
        setError('Could not load orders');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders, refreshKey]);

  const selectedOrder = useMemo(
    () => orders.find((o) => o.id === selectedId) ?? null,
    [orders, selectedId],
  );

  if (loading) {
    return (
      <section className="profile-panel profile-orders" aria-labelledby="orders-heading">
        <div className="profile-orders__loading" role="status">
          <span className="profile-orders__spinner" aria-hidden />
          <p>Loading your orders…</p>
        </div>
      </section>
    );
  }

  if (fetchError) {
    return (
      <ConnectionProblem
        kind={fetchError}
        variant="section"
        onRetry={() => void loadOrders()}
        homeHref="/shop"
        homeLabel="Continue shopping"
      />
    );
  }

  if (selectedOrder) {
    return (
      <section className="profile-panel profile-orders" aria-labelledby="orders-heading">
        <ProfileOrderDetail order={selectedOrder} onBack={() => setSelectedId(null)} />
      </section>
    );
  }

  return (
    <section className="profile-panel profile-orders" aria-labelledby="orders-heading">
      <div className="profile-panel__head">
        <div>
          <h2 id="orders-heading" className="profile-panel__title">
            My orders
          </h2>
          <p className="profile-panel__desc">Select an order to view status and details</p>
        </div>
      </div>

      {error ? (
        <p className="profile-msg profile-msg--err" role="alert">
          {error}
        </p>
      ) : null}

      {needsPhone ? (
        <div className="profile-orders__empty">
          <p>{hint || 'Save your mobile number in delivery details to see orders here.'}</p>
          <p className="profile-orders__empty-hint">
            Use the same WhatsApp number you enter when placing an order.
          </p>
        </div>
      ) : null}

      {!needsPhone && orders.length === 0 ? (
        <div className="profile-orders__empty">
          <p>No orders yet</p>
          <p className="profile-orders__empty-hint">
            When you place an order while signed in, it will appear here for tracking.
          </p>
          <Link href="/shop" className="profile-btn profile-btn--primary profile-orders__shop-link">
            Start shopping
          </Link>
        </div>
      ) : null}

      {!needsPhone && orders.length > 0 ? (
        <ul className="profile-orders__list profile-orders__list--compact">
          {orders.map((order) => {
            const itemCount = order.products.reduce((s, p) => s + p.quantity, 0);
            const { dateLabel, timeLabel } = formatOrderDateParts(order.date, order.time);

            return (
              <li key={order.id}>
                <button
                  type="button"
                  className="profile-order-row"
                  onClick={() => setSelectedId(order.id)}
                >
                  <div className="profile-order-row__main">
                    <span className="profile-order-row__id">{order.id}</span>
                    <span className={getStatusBadgeClass(order.status)}>
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                  <div className="profile-order-row__date">
                    <span>{dateLabel}</span>
                    {timeLabel ? <span className="profile-order-row__time">{timeLabel}</span> : null}
                  </div>
                  <div className="profile-order-row__footer">
                    <span>
                      {itemCount} item{itemCount === 1 ? '' : 's'}
                    </span>
                    <strong>{formatPrice(order.total)}</strong>
                  </div>
                  <IoChevronForward className="profile-order-row__chevron" size={20} aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
