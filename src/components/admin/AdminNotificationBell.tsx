'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  IoNotificationsOutline,
  IoStar,
  IoReceiptOutline,
  IoChatbubbleEllipsesOutline,
  IoPersonAddOutline,
  IoCheckmarkDoneOutline,
} from 'react-icons/io5';
import { useOrders } from '@/context/OrderProvider';
import {
  buildAdminNotifications,
  formatNotificationTime,
  NOTIFICATION_KIND_LABEL,
  type AdminNotificationItem,
  type AdminNotificationKind,
} from '@/lib/admin-notifications';
import './admin-notification-bell.css';

const KIND_ICON: Record<AdminNotificationKind, typeof IoReceiptOutline> = {
  order: IoReceiptOutline,
  review: IoStar,
  support: IoChatbubbleEllipsesOutline,
  user: IoPersonAddOutline,
};

function NotificationRow({
  item,
  onNavigate,
}: {
  item: AdminNotificationItem;
  onNavigate: () => void;
}) {
  const Icon = KIND_ICON[item.kind];

  return (
    <Link
      href={item.href}
      className={`anb-feed-item anb-feed-item--${item.kind}`}
      onClick={onNavigate}
    >
      <span className={`anb-feed-item__icon anb-feed-item__icon--${item.kind}`} aria-hidden>
        <Icon size={17} />
      </span>
      <span className="anb-feed-item__body">
        <span className="anb-feed-item__top">
          <span className="anb-feed-item__title">{item.title}</span>
          <span className={`anb-feed-item__chip anb-feed-item__chip--${item.kind}`}>
            {NOTIFICATION_KIND_LABEL[item.kind]}
          </span>
        </span>
        <span className="anb-feed-item__message">{item.message}</span>
      </span>
      <span className="anb-feed-item__time">{formatNotificationTime(item.at)}</span>
    </Link>
  );
}

export default function AdminNotificationBell() {
  const {
    newOrderAlerts,
    newReviewAlerts,
    newSupportAlerts,
    newUserAlerts,
    clearAllAdminNotifications,
  } = useOrders();

  const [open, setOpen] = useState(false);
  const [panelItems, setPanelItems] = useState<AdminNotificationItem[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  const liveItems = useMemo(
    () =>
      buildAdminNotifications({
        orders: newOrderAlerts,
        reviews: newReviewAlerts,
        support: newSupportAlerts,
        users: newUserAlerts,
      }),
    [newOrderAlerts, newReviewAlerts, newSupportAlerts, newUserAlerts],
  );

  const badgeCount = liveItems.length;

  const closePanel = () => {
    setOpen(false);
    setPanelItems([]);
  };

  const openPanel = () => {
    const snapshot = buildAdminNotifications({
      orders: [...newOrderAlerts],
      reviews: [...newReviewAlerts],
      support: [...newSupportAlerts],
      users: [...newUserAlerts],
    });
    setPanelItems(snapshot);
    setOpen(true);
    if (snapshot.length > 0) {
      clearAllAdminNotifications();
    }
  };

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        closePanel();
      }
    };
    if (open) {
      document.addEventListener('mousedown', onDocClick);
      return () => document.removeEventListener('mousedown', onDocClick);
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePanel();
    };
    if (open) {
      document.addEventListener('keydown', onKey);
      return () => document.removeEventListener('keydown', onKey);
    }
  }, [open]);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (open) {
      closePanel();
      return;
    }
    openPanel();
  };

  const hasItems = panelItems.length > 0;

  return (
    <div className="anb-root" ref={panelRef}>
      <button
        type="button"
        className={`anb-trigger${badgeCount > 0 ? ' anb-trigger--active' : ''}`}
        onClick={handleToggle}
        onMouseDown={(e) => e.stopPropagation()}
        aria-label={
          badgeCount > 0
            ? `${badgeCount} unread notification${badgeCount === 1 ? '' : 's'}`
            : 'Notifications'
        }
        aria-expanded={open}
        aria-haspopup="dialog"
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
          <div className="anb-panel__head">
            <div>
              <p className="anb-panel__title">Notifications</p>
              <p className="anb-panel__sub">
                {hasItems
                  ? `${panelItems.length} new update${panelItems.length === 1 ? '' : 's'}`
                  : 'All caught up'}
              </p>
            </div>
            {hasItems ? (
              <span className="anb-panel__read" aria-hidden>
                <IoCheckmarkDoneOutline size={16} />
                Read
              </span>
            ) : null}
          </div>

          {hasItems ? (
            <div className="anb-panel__list">
              {panelItems.map((item) => (
                <NotificationRow key={item.id} item={item} onNavigate={closePanel} />
              ))}
            </div>
          ) : (
            <div className="anb-empty">
              <div className="anb-empty__icon" aria-hidden>
                <IoNotificationsOutline size={28} />
              </div>
              <p className="anb-empty__title">No new notifications</p>
              <p className="anb-empty__text">
                Orders, reviews, support tickets, and sign-ups will appear here together.
              </p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
