'use client';

import type { Order } from '@/types/order';
import {
  formatOrderDate,
  formatOrderDateParts,
  getStatusBadgeClass,
  getStatusHeadline,
  getStatusHint,
  getStatusLabel,
  getTrackingSteps,
} from '@/lib/order-tracking';
import { formatPrice } from '@/utils/formatPrice';
import { IoArrowBack, IoCalendarOutline, IoTimeOutline } from 'react-icons/io5';
import OrderPaymentBadge from '@/components/OrderPaymentBadge';

type ProfileOrderDetailProps = {
  order: Order;
  onBack: () => void;
};

export default function ProfileOrderDetail({ order, onBack }: ProfileOrderDetailProps) {
  const { steps, activeIndex, isCancelled } = getTrackingSteps(order.status);
  const itemCount = order.products.reduce((s, p) => s + p.quantity, 0);
  const { dateLabel, timeLabel } = formatOrderDateParts(order.date, order.time);
  const placedOn = formatOrderDate(order.date, order.time);

  return (
    <div className="profile-order-detail">
      <button type="button" className="profile-order-detail__back" onClick={onBack}>
        <IoArrowBack size={18} aria-hidden />
        All orders
      </button>

      <header className="profile-order-detail__header">
        <div className="profile-order-detail__header-top">
          <h3 className="profile-order-detail__id">{order.id}</h3>
          <span className={getStatusBadgeClass(order.status)}>{getStatusLabel(order.status)}</span>
        </div>

        <div className="profile-order-detail__meta">
          <div className="profile-order-detail__meta-item">
            <IoCalendarOutline size={18} aria-hidden />
            <div>
              <span className="profile-order-detail__meta-label">Order date</span>
              <span className="profile-order-detail__meta-value">{dateLabel}</span>
            </div>
          </div>
          {timeLabel ? (
            <div className="profile-order-detail__meta-item">
              <IoTimeOutline size={18} aria-hidden />
              <div>
                <span className="profile-order-detail__meta-label">Time</span>
                <span className="profile-order-detail__meta-value">{timeLabel}</span>
              </div>
            </div>
          ) : null}
        </div>

        <p className="profile-order-detail__placed-full">
          Placed on <strong>{placedOn}</strong>
        </p>

        <div className="profile-order-detail__totals">
          <span>
            {itemCount} item{itemCount === 1 ? '' : 's'}
          </span>
          <strong>{formatPrice(order.total)}</strong>
        </div>

        <div className="profile-order-detail__payment">
          <span className="profile-order-detail__meta-label">Payment</span>
          <OrderPaymentBadge order={order} size="sm" showPaidOnly />
        </div>
      </header>

      <section className="profile-order-detail__status" aria-labelledby="track-heading">
        <h4 id="track-heading" className="profile-order-detail__section-title">
          Order status
        </h4>
        <p className="profile-order-card__headline">{getStatusHeadline(order.status)}</p>
        <p className="profile-order-card__hint">{getStatusHint(order.status)}</p>

        {isCancelled ? (
          <p className="profile-order-card__cancelled" role="status">
            This order will not be shipped.
          </p>
        ) : (
          <ol className="profile-order-tracker" aria-label="Order progress">
            {steps.map((step, index) => {
              const done = index <= activeIndex;
              const current = index === activeIndex;
              return (
                <li
                  key={step.key}
                  className={`profile-order-tracker__step${done ? ' profile-order-tracker__step--done' : ''}${current ? ' profile-order-tracker__step--current' : ''}`}
                >
                  <span className="profile-order-tracker__dot" aria-hidden />
                  <div className="profile-order-tracker__text">
                    <strong>{step.label}</strong>
                    <span>{step.description}</span>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <section className="profile-order-card__section">
        <h4 className="profile-order-detail__section-title">Items</h4>
        <ul className="profile-order-items">
          {order.products.map((p, i) => (
            <li key={`${order.id}-${i}`}>
              <span className="profile-order-items__name">{p.name}</span>
              <span className="profile-order-items__qty">×{p.quantity}</span>
              <span className="profile-order-items__price">{formatPrice(p.price * p.quantity)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="profile-order-card__section profile-order-card__delivery">
        <h4 className="profile-order-detail__section-title">Delivery address</h4>
        <p>
          {order.customer}
          <br />
          {order.phone}
          <br />
          {order.city} — {order.address}
        </p>
      </section>

      {order.status === 'delivered' ? (
        <p className="profile-order-card__hint" style={{ marginTop: 16 }}>
          Delivered — add your review with photos under{' '}
          <strong>My reviews</strong> in the account menu.
        </p>
      ) : null}
    </div>
  );
}
