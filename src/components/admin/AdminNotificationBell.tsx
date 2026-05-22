'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { IoNotificationsOutline, IoStar, IoReceiptOutline } from 'react-icons/io5';
import { useOrders } from '@/context/OrderProvider';
import { adminPath } from '@/lib/admin-path';
import { formatOrderProductIds } from '@/lib/order-product-ids';
import type { Order } from '@/types/order';
import type { AdminReviewAlert } from '@/lib/product-reviews';
import './admin-notification-bell.css';

export default function AdminNotificationBell() {
  const {
    newOrderAlerts,
    newReviewAlerts,
    clearOrderNotifications,
    clearReviewNotifications,
  } = useOrders();
  const [open, setOpen] = useState(false);
  const [panelOrders, setPanelOrders] = useState<Order[]>([]);
  const [panelReviews, setPanelReviews] = useState<AdminReviewAlert[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  const badgeCount = newOrderAlerts.length + newReviewAlerts.length;

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
        setPanelOrders([]);
        setPanelReviews([]);
      }
    };
    if (open) {
      document.addEventListener('mousedown', onDocClick);
      return () => document.removeEventListener('mousedown', onDocClick);
    }
  }, [open]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (open) {
      setOpen(false);
      setPanelOrders([]);
      setPanelReviews([]);
      return;
    }

    const orderSnapshot = [...newOrderAlerts];
    const reviewSnapshot = [...newReviewAlerts];
    setPanelOrders(orderSnapshot);
    setPanelReviews(reviewSnapshot);
    setOpen(true);

    if (orderSnapshot.length > 0) clearOrderNotifications();
    if (reviewSnapshot.length > 0) clearReviewNotifications();
  };

  const hasItems = panelOrders.length > 0 || panelReviews.length > 0;

  return (
    <div className="anb-root" ref={panelRef}>
      <button
        type="button"
        className="anb-trigger"
        onClick={handleClick}
        onMouseDown={(e) => e.stopPropagation()}
        aria-label={
          badgeCount > 0
            ? `${badgeCount} new notification${badgeCount === 1 ? '' : 's'}`
            : 'Notifications'
        }
        aria-expanded={open}
      >
        <IoNotificationsOutline size={22} aria-hidden />
        {badgeCount > 0 ? (
          <span className="anb-badge" aria-hidden>
            {badgeCount > 99 ? '99+' : badgeCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="anb-panel" role="dialog" aria-label="Notifications">
          {hasItems ? (
            <>
              {panelReviews.length > 0 ? (
                <div className="anb-section">
                  <p className="anb-section__title">
                    <IoStar size={14} aria-hidden />
                    New reviews ({panelReviews.length})
                  </p>
                  {panelReviews.map((review) => (
                    <Link
                      key={review.id}
                      href={adminPath('/reviews')}
                      className="anb-item anb-item--review"
                      onClick={() => {
                        setOpen(false);
                        setPanelOrders([]);
                        setPanelReviews([]);
                      }}
                    >
                      <p className="anb-item__name">{review.reviewerName}</p>
                      <p className="anb-item__products">
                        <strong>{review.rating}★</strong> ·{' '}
                        {review.productName ?? `Product #${review.productId}`} · Order{' '}
                        {review.orderId}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : null}

              {panelOrders.length > 0 ? (
                <div className="anb-section">
                  <p className="anb-section__title">
                    <IoReceiptOutline size={14} aria-hidden />
                    New orders ({panelOrders.length})
                  </p>
                  {panelOrders.map((order) => (
                    <Link
                      key={order.id}
                      href={adminPath('/orders')}
                      className="anb-item"
                      onClick={() => {
                        setOpen(false);
                        setPanelOrders([]);
                        setPanelReviews([]);
                      }}
                    >
                      <p className="anb-item__name">{order.customer}</p>
                      <p className="anb-item__products">
                        <strong>Product ID:</strong> {formatOrderProductIds(order)}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : null}
            </>
          ) : (
            <div className="anb-empty">
              <p className="anb-empty__text">No new notifications right now.</p>
              <div className="anb-empty__links">
                <Link href={adminPath('/orders')} className="anb-empty__link" onClick={() => setOpen(false)}>
                  Orders
                </Link>
                <Link href={adminPath('/reviews')} className="anb-empty__link" onClick={() => setOpen(false)}>
                  Reviews
                </Link>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
