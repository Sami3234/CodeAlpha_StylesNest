'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { IoStar, IoStarOutline } from 'react-icons/io5';
import { toast } from 'sonner';
import {
  emptyPhotoSlots,
  slotsToImageUrls,
  type ReviewPhotoSlots,
} from '@/components/reviews/ReviewImagePicker';
import { usePendingReviews } from '@/context/PendingReviewsContext';
import { clientMessageFromApi } from '@/lib/safe-errors';
import type { ReviewableItem } from '@/context/PendingReviewsContext';
import type { ReviewStatus } from '@/lib/product-reviews-schema';
import { useState } from 'react';
import '../profile/profile-order-review.css';
import './profile-reviews-panel.css';

const ReviewImagePicker = dynamic(
  () => import('@/components/reviews/ReviewImagePicker'),
  {
    ssr: false,
    loading: () => <div className="prp-photo-skeleton" aria-hidden />,
  },
);

export default function ProfileReviewsPanel() {
  const { items, loading, ready, refresh, pendingCount } = usePendingReviews();

  const pending = useMemo(() => items.filter((i) => !i.existingStatus), [items]);
  const submitted = useMemo(() => items.filter((i) => i.existingStatus), [items]);

  const showSkeleton = !ready || (loading && items.length === 0);

  if (showSkeleton) {
    return (
      <section className="profile-panel prp-panel" aria-labelledby="reviews-heading">
        <div className="prp-skeleton-head" />
        <div className="prp-skeleton-card" />
      </section>
    );
  }

  return (
    <section className="profile-panel prp-panel" aria-labelledby="reviews-heading">
      <div className="profile-panel__head">
        <div>
          <h2 id="reviews-heading" className="profile-panel__title">
            My reviews
          </h2>
          <p className="profile-panel__desc">
            Review delivered products. Tap + to add photos (1 required, 2 optional).
          </p>
        </div>
      </div>

      {pendingCount > 0 ? (
        <div className="prp-pending-banner" role="status">
          <strong>
            {pendingCount} product{pendingCount === 1 ? '' : 's'} waiting for your review
          </strong>
          <p>Share your experience with photos after delivery.</p>
        </div>
      ) : null}

      {pending.length === 0 && submitted.length === 0 ? (
        <div className="prp-empty">
          <p>No reviews to write yet.</p>
          <p className="prp-empty__hint">
            When an order is marked <strong>Delivered</strong>, you can review items here.
          </p>
          <Link href="/shop" className="profile-btn profile-btn--primary">
            Continue shopping
          </Link>
        </div>
      ) : null}

      {pending.map((item) => (
        <ReviewFormCard
          key={`${item.orderId}-${item.productId}`}
          item={item}
          onDone={() => void refresh(true)}
        />
      ))}

      {submitted.map((item) => (
        <SubmittedReviewCard key={`${item.orderId}-${item.productId}`} item={item} />
      ))}
    </section>
  );
}

function ReviewFormCard({
  item,
  onDone,
}: {
  item: ReviewableItem;
  onDone: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [photoSlots, setPhotoSlots] = useState<ReviewPhotoSlots>(emptyPhotoSlots());
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoSlots[0]) {
      setMsg({ type: 'err', text: 'Please add at least one photo.' });
      return;
    }
    setSubmitting(true);
    setMsg(null);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: item.orderId,
          productId: item.productId,
          rating,
          title,
          body,
          images: slotsToImageUrls(photoSlots),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ type: 'err', text: clientMessageFromApi(data, 'Could not submit review') });
        return;
      }
      toast.success('Review submitted');
      onDone();
    } catch {
      setMsg({ type: 'err', text: 'Could not submit review' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <article className="prp-card">
      <div className="prp-card__head">
        <div className="prp-card__head-text">
          <h3 className="prp-card__product">{item.productName}</h3>
          <p className="prp-card__meta">
            Order {item.orderId} · Delivered {item.deliveredAt}
          </p>
          <Link href={`/product/${item.productId}`} className="prp-card__link">
            View product →
          </Link>
        </div>
      </div>

      <form className="prp-form" onSubmit={(e) => void handleSubmit(e)}>
        <div className="prp-stars" role="group" aria-label="Star rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              className={`prp-star-btn${rating >= n ? '' : ' prp-star-btn--off'}`}
              onClick={() => setRating(n)}
              aria-label={`${n} stars`}
            >
              {rating >= n ? <IoStar size={26} /> : <IoStarOutline size={26} />}
            </button>
          ))}
        </div>

        <ReviewImagePicker
          slots={photoSlots}
          onSlotsChange={setPhotoSlots}
          disabled={submitting}
        />

        <input
          type="text"
          className="prp-input"
          placeholder="Review title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
        />
        <textarea
          className="prp-textarea"
          placeholder="Share your experience (min. 10 characters)"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          minLength={10}
          maxLength={2000}
        />
        {msg ? (
          <p className={`prp-msg prp-msg--${msg.type}`} role="alert">
            {msg.text}
          </p>
        ) : null}
        <button type="submit" className="prp-submit" disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit review'}
        </button>
      </form>
    </article>
  );
}

function SubmittedReviewCard({ item }: { item: ReviewableItem }) {
  const status = item.existingStatus as ReviewStatus;
  const showStatus = status === 'approved' || status === 'rejected';
  const label = status === 'approved' ? 'Published' : 'Not published';
  const cls =
    status === 'approved'
      ? 'prp-status prp-status--approved'
      : 'prp-status prp-status--rejected';

  return (
    <article className="prp-card prp-card--submitted">
      <div className="prp-card__head">
        <div className="prp-card__head-text">
          <h3 className="prp-card__product">{item.productName}</h3>
          <p className="prp-card__meta">Order {item.orderId}</p>
          <Link href={`/product/${item.productId}`} className="prp-card__link">
            View product →
          </Link>
        </div>
        {showStatus ? <span className={cls}>{label}</span> : null}
      </div>
      {!showStatus ? (
        <p className="prp-submitted-note" role="status">
          Review submitted. Thank you!
        </p>
      ) : null}
    </article>
  );
}
