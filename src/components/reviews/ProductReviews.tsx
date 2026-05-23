'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import StarRating from '@/components/reviews/StarRating';
import './product-reviews.css';

type Review = {
  id: number;
  rating: number;
  title: string;
  body: string;
  images: string[];
  reviewerName: string;
  createdAt: string;
};

type Summary = {
  averageRating: number;
  totalCount: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
};

function maskName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'Customer';
  if (parts.length === 1) {
    const p = parts[0];
    return p.length <= 2 ? p : `${p[0]}${'*'.repeat(Math.min(p.length - 1, 4))}`;
  }
  const first = parts[0];
  const last = parts[parts.length - 1];
  const maskedLast =
    last.length <= 1 ? last : `${last[0]}${'*'.repeat(Math.min(last.length - 1, 4))}`;
  return `${first} ${maskedLast}`;
}

function formatReviewDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

type Props = {
  productId: number;
};

export default function ProductReviews({ productId }: Props) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadedProductId, setLoadedProductId] = useState(productId);

  if (productId !== loadedProductId) {
    setLoadedProductId(productId);
    setReviews([]);
    setSummary(null);
    setLoading(true);
  }

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/products/${productId}/reviews`, { cache: 'no-store' })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        if (!cancelled) {
          setReviews(data.reviews ?? []);
          setSummary(data.summary ?? null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setReviews([]);
          setSummary({ averageRating: 0, totalCount: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const total = summary?.totalCount ?? 0;

  if (loading || total === 0 || !summary) {
    return null;
  }

  return (
    <section className="dz-reviews" aria-labelledby="product-reviews-heading">
      <header className="dz-reviews__header">
        <h2 id="product-reviews-heading" className="dz-reviews__title">
          Customer Reviews
        </h2>
        <span className="dz-reviews__count-pill">
          {total} rating{total === 1 ? '' : 's'}
        </span>
      </header>

      <div className="dz-reviews__summary">
        <div className="dz-reviews__score-block">
          <span className="dz-reviews__score" aria-hidden>
            {summary.averageRating.toFixed(1)}
          </span>
          <div className="dz-reviews__score-meta">
            <StarRating value={summary.averageRating} size={15} />
            <span className="dz-reviews__score-caption">out of 5 stars</span>
          </div>
        </div>
        <div className="dz-reviews__summary-divider" aria-hidden />
        <div className="dz-reviews__bars" aria-label="Rating breakdown">
          {([5, 4, 3, 2, 1] as const).map((star) => {
            const count = summary.distribution[star] ?? 0;
            const pct = total > 0 ? (count / total) * 100 : 0;
            const active = count > 0;
            return (
              <div
                key={star}
                className={`dz-reviews__bar-row${active ? ' dz-reviews__bar-row--active' : ''}`}
              >
                <span className="dz-reviews__bar-label">
                  <span className="dz-reviews__bar-num">{star}</span>
                  <span className="dz-reviews__bar-star" aria-hidden>
                    ★
                  </span>
                </span>
                <div className="dz-reviews__bar-track">
                  <div
                    className="dz-reviews__bar-fill"
                    style={{ width: `${active ? Math.max(pct, 4) : 0}%` }}
                  />
                </div>
                <span className="dz-reviews__bar-count">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {reviews.length > 0 ? (
        <ul className="dz-reviews__list">
          {reviews.map((r) => {
            const displayName = maskName(r.reviewerName);
            const text = [r.title, r.body].filter(Boolean).join(' — ');
            return (
              <li key={r.id} className="dz-review">
                <div className="dz-review__top">
                  <span className="dz-review__name">{displayName}</span>
                  <div className="dz-review__rating-line">
                    <StarRating value={r.rating} size={14} />
                    <span className="dz-review__sep" aria-hidden>
                      |
                    </span>
                    <time className="dz-review__date" dateTime={r.createdAt}>
                      {formatReviewDate(r.createdAt)}
                    </time>
                  </div>
                  <span className="dz-review__verified">Verified Purchase</span>
                </div>
                <p className="dz-review__text">{text}</p>
                {r.images?.length > 0 ? (
                  <div className="dz-review__photos">
                    {r.images.map((src, pi) => (
                      <a
                        key={`${r.id}-img-${pi}`}
                        href={src}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="dz-review__photo"
                      >
                        <Image src={src} alt="" fill sizes="72px" unoptimized />
                      </a>
                    ))}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
