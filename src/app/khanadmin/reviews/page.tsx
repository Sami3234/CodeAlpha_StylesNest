'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import AdminLoading from '@/components/admin/AdminLoading';
import ProductCodeChip from '@/components/ProductCodeChip';
import ConnectionProblem from '@/components/network/ConnectionProblem';
import { clientFetch, NetworkError } from '@/lib/client-fetch';
import type { FetchErrorKind } from '@/lib/is-network-error';
import type { ReviewStatus } from '@/lib/product-reviews-schema';
import './admin-reviews.css';

type AdminReview = {
  id: number;
  productId: number;
  productName: string | null;
  productCode: string | null;
  shopUserId: number;
  orderId: string;
  rating: number;
  title: string;
  body: string;
  images: string[];
  status: ReviewStatus;
  reviewerName: string;
  createdAt: string;
};

type StatusFilter = 'all' | ReviewStatus;

function stars(n: number): string {
  return '★'.repeat(n) + '☆'.repeat(5 - n);
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [filter, setFilter] = useState<StatusFilter>('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fetchError, setFetchError] = useState<FetchErrorKind | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const loadReviews = useCallback(() => {
    setLoading(true);
    setError('');
    setFetchError(null);
    const q = filter === 'all' ? '' : `?status=${filter}`;
    clientFetch(`/api/admin/reviews${q}`, { cache: 'no-store' })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load');
        setReviews(data.reviews ?? []);
        setPendingCount(Number(data.pendingCount ?? 0));
      })
      .catch((err) => {
        if (err instanceof NetworkError) setFetchError(err.kind);
        else setError('Failed to load reviews');
      })
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const patchStatus = async (id: number, status: ReviewStatus) => {
    setBusyId(id);
    try {
      const res = await clientFetch(`/api/admin/reviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');
      toast.success(status === 'approved' ? 'Review approved' : status === 'rejected' ? 'Review rejected' : 'Review updated');
      loadReviews();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (r: AdminReview) => {
    if (!window.confirm(`Delete review from ${r.reviewerName}?`)) return;
    setBusyId(r.id);
    try {
      const res = await clientFetch(`/api/admin/reviews/${r.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed');
      toast.success('Review deleted');
      loadReviews();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="ar-page">
      <header className="ar-header">
        <h1>Reviews</h1>
        <p>Approve customer reviews before they appear on product pages.</p>
      </header>

      {pendingCount > 0 && filter !== 'approved' ? (
        <div className="ar-pending-banner" role="status">
          {pendingCount} review{pendingCount === 1 ? '' : 's'} waiting for approval
        </div>
      ) : null}

      <div className="ar-toolbar" role="group" aria-label="Filter reviews">
        {(['pending', 'approved', 'rejected', 'all'] as const).map((key) => (
          <button
            key={key}
            type="button"
            className={filter === key ? 'is-active' : ''}
            onClick={() => setFilter(key)}
          >
            {key === 'all' ? 'All' : key.charAt(0).toUpperCase() + key.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <AdminLoading message="Loading reviews" subMessage="Customer product feedback" variant="section" />
      ) : null}

      {fetchError ? (
        <ConnectionProblem
          theme="admin"
          kind={fetchError}
          variant="section"
          onRetry={loadReviews}
          homeHref="/khanadmin"
          homeLabel="Dashboard"
        />
      ) : null}

      {error ? <p style={{ color: '#c62828' }}>{error}</p> : null}

      {!loading && !error && reviews.length === 0 ? (
        <p className="ar-empty">No reviews in this category.</p>
      ) : null}

      {!loading && !error && reviews.length > 0 ? (
        <div className="ar-list">
          {reviews.map((r) => (
            <article
              key={r.id}
              className={`ar-card${r.status === 'pending' ? ' is-pending' : ''}`}
            >
              <div className="ar-card__top">
                <div>
                  <span className={`ar-badge ar-badge--${r.status}`}>{r.status}</span>
                  {r.productCode ? (
                    <div style={{ marginTop: 10 }}>
                      <ProductCodeChip code={r.productCode} showRequiredHint />
                    </div>
                  ) : null}
                  <div className="ar-card__meta" style={{ marginTop: 8 }}>
                    <strong>{r.reviewerName}</strong> · Order {r.orderId}
                  </div>
                  <div className="ar-card__meta">
                    Product:{' '}
                    <Link href={`/product/${r.productId}`} target="_blank" rel="noopener noreferrer">
                      {r.productName || `#${r.productId}`}
                    </Link>
                    {' · '}
                    {formatDate(r.createdAt)}
                  </div>
                </div>
                <span className="ar-stars" aria-label={`${r.rating} stars`}>
                  {stars(r.rating)}
                </span>
              </div>
              {r.title ? <h3 className="ar-card__title">{r.title}</h3> : null}
              <p className="ar-card__body">{r.body}</p>
              {r.images?.length > 0 ? (
                <div className="ar-card__photos">
                  {r.images.map((src, pi) => (
                    <a
                      key={`${r.id}-ph-${pi}`}
                      href={src}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ar-card__photo"
                    >
                      <Image src={src} alt="" fill sizes="80px" unoptimized />
                    </a>
                  ))}
                </div>
              ) : null}
              <div className="ar-actions">
                {r.status === 'pending' ? (
                  <>
                    <button
                      type="button"
                      className="ar-btn ar-btn--approve"
                      disabled={busyId === r.id}
                      onClick={() => void patchStatus(r.id, 'approved')}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className="ar-btn ar-btn--reject"
                      disabled={busyId === r.id}
                      onClick={() => void patchStatus(r.id, 'rejected')}
                    >
                      Reject
                    </button>
                  </>
                ) : null}
                {r.status === 'rejected' ? (
                  <button
                    type="button"
                    className="ar-btn ar-btn--approve"
                    disabled={busyId === r.id}
                    onClick={() => void patchStatus(r.id, 'approved')}
                  >
                    Approve
                  </button>
                ) : null}
                {r.status === 'approved' ? (
                  <button
                    type="button"
                    className="ar-btn ar-btn--reject"
                    disabled={busyId === r.id}
                    onClick={() => void patchStatus(r.id, 'pending')}
                  >
                    Unpublish
                  </button>
                ) : null}
                <button
                  type="button"
                  className="ar-btn ar-btn--delete"
                  disabled={busyId === r.id}
                  onClick={() => void handleDelete(r)}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}
