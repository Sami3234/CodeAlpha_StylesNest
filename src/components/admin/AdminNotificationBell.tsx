'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  IoNotificationsOutline,
  IoStar,
  IoReceiptOutline,
  IoChatbubbleEllipsesOutline,
  IoPersonAddOutline,
} from 'react-icons/io5';
import { useOrders } from '@/context/OrderProvider';
import { adminPath } from '@/lib/admin-path';
import { formatOrderProductIds } from '@/lib/order-product-ids';
import type { Order } from '@/types/order';
import type { AdminReviewAlert } from '@/lib/product-reviews';
import type { AdminSupportAlert } from '@/lib/support-tickets';
import type { AdminUserAlert } from '@/lib/shop-users';
import './admin-notification-bell.css';

export default function AdminNotificationBell() {
  const {
    newOrderAlerts,
    newReviewAlerts,
    newSupportAlerts,
    newUserAlerts,
    clearOrderNotifications,
    clearReviewNotifications,
    clearSupportNotifications,
    clearUserNotifications,
  } = useOrders();
  const [open, setOpen] = useState(false);
  const [panelOrders, setPanelOrders] = useState<Order[]>([]);
  const [panelReviews, setPanelReviews] = useState<AdminReviewAlert[]>([]);
  const [panelSupport, setPanelSupport] = useState<AdminSupportAlert[]>([]);
  const [panelUsers, setPanelUsers] = useState<AdminUserAlert[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  const badgeCount =
    newOrderAlerts.length +
    newReviewAlerts.length +
    newSupportAlerts.length +
    newUserAlerts.length;

  const resetPanel = () => {
    setPanelOrders([]);
    setPanelReviews([]);
    setPanelSupport([]);
    setPanelUsers([]);
  };

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
        resetPanel();
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
      resetPanel();
      return;
    }

    const orderSnapshot = [...newOrderAlerts];
    const reviewSnapshot = [...newReviewAlerts];
    const supportSnapshot = [...newSupportAlerts];
    const userSnapshot = [...newUserAlerts];
    setPanelOrders(orderSnapshot);
    setPanelReviews(reviewSnapshot);
    setPanelSupport(supportSnapshot);
    setPanelUsers(userSnapshot);
    setOpen(true);

    if (orderSnapshot.length > 0) clearOrderNotifications();
    if (reviewSnapshot.length > 0) clearReviewNotifications();
    if (supportSnapshot.length > 0) clearSupportNotifications();
    if (userSnapshot.length > 0) clearUserNotifications();
  };

  const closePanel = () => {
    setOpen(false);
    resetPanel();
  };

  const hasItems =
    panelOrders.length > 0 ||
    panelReviews.length > 0 ||
    panelSupport.length > 0 ||
    panelUsers.length > 0;

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
              {panelSupport.length > 0 ? (
                <div className="anb-section">
                  <p className="anb-section__title">
                    <IoChatbubbleEllipsesOutline size={14} aria-hidden />
                    Support ({panelSupport.length})
                  </p>
                  {panelSupport.map((ticket) => (
                    <Link
                      key={ticket.id}
                      href={adminPath('/support')}
                      className="anb-item anb-item--support"
                      onClick={closePanel}
                    >
                      <p className="anb-item__name">{ticket.name}</p>
                      <p className="anb-item__products">{ticket.subject}</p>
                    </Link>
                  ))}
                </div>
              ) : null}

              {panelUsers.length > 0 ? (
                <div className="anb-section">
                  <p className="anb-section__title">
                    <IoPersonAddOutline size={14} aria-hidden />
                    New users ({panelUsers.length})
                  </p>
                  {panelUsers.map((user) => (
                    <Link
                      key={user.id}
                      href={adminPath('/users')}
                      className="anb-item anb-item--user"
                      onClick={closePanel}
                    >
                      <p className="anb-item__name">{user.name ?? user.email ?? `User #${user.id}`}</p>
                      <p className="anb-item__products">
                        {user.email ?? 'No email'} · {user.provider}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : null}

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
                      onClick={closePanel}
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
                      onClick={closePanel}
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
                <Link href={adminPath('/support')} className="anb-empty__link" onClick={closePanel}>
                  Support
                </Link>
                <Link href={adminPath('/users')} className="anb-empty__link" onClick={closePanel}>
                  Users
                </Link>
                <Link href={adminPath('/orders')} className="anb-empty__link" onClick={closePanel}>
                  Orders
                </Link>
                <Link href={adminPath('/reviews')} className="anb-empty__link" onClick={closePanel}>
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
