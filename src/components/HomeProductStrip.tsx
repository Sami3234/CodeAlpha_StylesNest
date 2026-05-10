'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useProducts } from '@/context/ProductContext';
import { getProductTitle } from '@/utils/getProductText';
import type { Product } from '@/data/products';
import { MAX_TRENDING_PRODUCTS } from '@/lib/trending-products';

const MAX_FALLBACK_ITEMS = MAX_TRENDING_PRODUCTS;

function StripSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="home-products-strip__skeleton"
          aria-hidden
        />
      ))}
    </>
  );
}

function StripCard({ product }: { product: Product }) {
  const [imgError, setImgError] = useState(false);
  const title =
    getProductTitle(product) ||
    (typeof product.title === 'object' ? product.title.en : String(product.title || 'Product'));

  return (
    <Link
      href={`/product/${product.id}`}
      className="home-products-strip__card"
      aria-label={`${title}, ${product.currentPrice.toFixed(0)} PKR`}
    >
      <div className="home-products-strip__media">
        {product.discount > 0 ? (
          <span className="home-products-strip__badge">{product.discount}% OFF</span>
        ) : null}
        {!imgError ? (
          <Image
            src={product.image}
            alt={title}
            fill
            className="home-products-strip__img object-cover"
            sizes="(max-width: 767px) 42vw, 172px"
            onError={() => setImgError(true)}
            unoptimized
          />
        ) : (
          <span className="home-products-strip__img-ph">Image</span>
        )}
      </div>
      <div className="home-products-strip__body">
        <h3 className="home-products-strip__title" suppressHydrationWarning>
          {title}
        </h3>
        <div className="home-products-strip__prices">
          <span className="home-products-strip__price">
            {product.currentPrice.toFixed(0)} <span className="home-products-strip__currency">PKR</span>
          </span>
          {product.originalPrice > product.currentPrice ? (
            <span className="home-products-strip__old">{product.originalPrice.toFixed(0)}</span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

/**
 * Compact shop picks rail below garments — RTL horizontal scroll on mobile (skin-bar style).
 */
export default function HomeProductStrip() {
  const { products, loading } = useProducts();
  const [trendingIds, setTrendingIds] = useState<number[] | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/trending-products', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.success && Array.isArray(data.ids)) {
          setTrendingIds(
            data.ids
              .map((x: unknown) => (typeof x === 'number' ? x : parseInt(String(x), 10)))
              .filter((n: number) => Number.isInteger(n) && n > 0)
          );
        } else {
          setTrendingIds([]);
        }
      })
      .catch(() => {
        if (!cancelled) setTrendingIds([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const items = useMemo(() => {
    const active = products.filter((p) => p.status === 'active' || !p.status);
    const byId = new Map(active.map((p) => [p.id, p]));
    if (trendingIds !== undefined && trendingIds.length > 0) {
      const ordered: Product[] = [];
      for (const id of trendingIds) {
        const p = byId.get(id);
        if (p) ordered.push(p);
      }
      return ordered;
    }
    return active.slice(0, MAX_FALLBACK_ITEMS);
  }, [products, trendingIds]);

  const trendingReady = trendingIds !== undefined;
  const showSkeleton = loading || !trendingReady;

  if (!showSkeleton && items.length === 0) {
    return null;
  }

  const usingTrending =
    trendingReady && Array.isArray(trendingIds) && trendingIds.length > 0;

  return (
    <section
      className="home-products-strip"
      aria-labelledby="home-products-strip-heading"
    >
      <div className="home-products-strip__inner">
        <header className="home-products-strip__head">
          <div>
            <h2 id="home-products-strip-heading" className="home-products-strip__heading">
              {usingTrending ? 'Trending now' : 'From our shop'}
            </h2>
            <p className="home-products-strip__sub">
              {usingTrending
                ? 'Admin picks — swipe sideways on mobile'
                : 'Popular picks — swipe sideways on mobile'}
            </p>
          </div>
          <Link href="/shop" className="home-products-strip__all">
            View all
          </Link>
        </header>

        <div className="home-products-strip__rail">
          {showSkeleton ? (
            <StripSkeleton />
          ) : (
            items.map((product) => <StripCard key={product.id} product={product} />)
          )}
        </div>
      </div>
    </section>
  );
}
