'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
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

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
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

  if (loading || total === 0) {
    return null;
  }

  return (
    <motion.section
      className="pr-section"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5 }}
      aria-labelledby="product-reviews-heading"
    >
      <div className="pr-section__head">
        <h2 id="product-reviews-heading" className="pr-section__title">
          Customer reviews
        </h2>
        {summary && total > 0 ? (
          <div className="pr-summary">
            <span className="pr-summary__score">{summary.averageRating.toFixed(1)}</span>
            <div className="pr-summary__meta">
              <StarRating value={summary.averageRating} size={20} />
              <span className="pr-summary__count">
                {total} review{total === 1 ? '' : 's'}
              </span>
            </div>
          </div>
        ) : null}
      </div>

      {summary && total > 0 ? (
        <div className="pr-bars" aria-hidden>
          {([5, 4, 3, 2, 1] as const).map((star) => {
            const count = summary.distribution[star] ?? 0;
            const pct = total > 0 ? (count / total) * 100 : 0;
            return (
              <div key={star} className="pr-bar-row">
                <span>{star}★</span>
                <div className="pr-bar-track">
                  <div className="pr-bar-fill" style={{ width: `${pct}%` }} />
                </div>
                <span style={{ width: 24, textAlign: 'right' }}>{count}</span>
              </div>
            );
          })}
        </div>
      ) : null}

      {reviews.length > 0 ? (
        <div className="pr-list">
          {reviews.map((r, index) => (
            <motion.article
              key={r.id}
              className="pr-card"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: index * 0.06 }}
            >
              <div className="pr-card__top">
                <div className="pr-card__user">
                  <div className="pr-avatar" aria-hidden>
                    {initials(r.reviewerName)}
                  </div>
                  <div>
                    <div className="pr-card__name">{r.reviewerName}</div>
                    <span className="pr-card__badge">✓ Verified purchase</span>
                  </div>
                </div>
                <time className="pr-card__date" dateTime={r.createdAt}>
                  {formatReviewDate(r.createdAt)}
                </time>
              </div>
              <StarRating value={r.rating} size={16} />
              {r.title ? <h3 className="pr-card__title">{r.title}</h3> : null}
              <p className="pr-card__body">{r.body}</p>
              {r.images?.length > 0 ? (
                <div className="pr-card__photos">
                  {r.images.map((src, pi) => (
                    <a
                      key={`${r.id}-img-${pi}`}
                      href={src}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="pr-card__photo"
                    >
                      <Image src={src} alt="" fill sizes="100px" unoptimized />
                    </a>
                  ))}
                </div>
              ) : null}
            </motion.article>
          ))}
        </div>
      ) : null}

    </motion.section>
  );
}
