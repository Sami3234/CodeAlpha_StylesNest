'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Product } from '@/data/products';
import { MAX_TRENDING_PRODUCTS, SEO_TRENDING_IMAGE_COUNT } from '@/lib/trending-products';
import { getProductTitle } from '@/utils/getProductText';
import AdminPkrAmount from '@/components/admin/AdminPkrAmount';
import AdminLoading from '@/components/admin/AdminLoading';
import './trending-products-picker.css';

interface TrendingProductsPickerProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

function isActiveProduct(p: Product): boolean {
  return p.status === 'active' || !p.status;
}

export default function TrendingProductsPicker({
  isOpen,
  onClose,
  products,
  onToast,
}: TrendingProductsPickerProps) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const userEditedRef = useRef(false);
  const fetchedOpenRef = useRef(false);
  const onToastRef = useRef(onToast);
  onToastRef.current = onToast;

  const markEdited = () => {
    userEditedRef.current = true;
  };

  const productById = useMemo(() => {
    const map = new Map<number, Product>();
    for (const p of products) map.set(p.id, p);
    return map;
  }, [products]);

  /** Load saved trending list once per modal open — never overwrite in-progress picks. */
  useEffect(() => {
    if (!isOpen) {
      fetchedOpenRef.current = false;
      userEditedRef.current = false;
      return;
    }
    if (fetchedOpenRef.current) return;
    fetchedOpenRef.current = true;
    setSearch('');

    let cancelled = false;
    setLoading(true);

    fetch('/api/admin/trending-products', {
      credentials: 'same-origin',
      cache: 'no-store',
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load');
        const ids = Array.isArray(data.ids)
          ? data.ids
              .map((x: unknown) => Number(x))
              .filter((n: number) => Number.isInteger(n) && n > 0)
              .slice(0, MAX_TRENDING_PRODUCTS)
          : [];
        if (!cancelled && !userEditedRef.current) {
          setSelectedIds(ids);
        }
      })
      .catch((e) => {
        console.error(e);
        onToastRef.current?.('Could not load saved trending list', 'error');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const removeId = (id: number) => {
    markEdited();
    setSelectedIds((prev) => prev.filter((x) => x !== id));
  };

  const toggleId = (id: number) => {
    markEdited();
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_TRENDING_PRODUCTS) {
        onToast?.(`Maximum ${MAX_TRENDING_PRODUCTS} products allowed`, 'info');
        return prev;
      }
      return [...prev, id];
    });
  };

  const moveId = (id: number, direction: -1 | 1) => {
    markEdited();
    setSelectedIds((prev) => {
      const idx = prev.indexOf(id);
      if (idx < 0) return prev;
      const next = idx + direction;
      if (next < 0 || next >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[next]] = [copy[next], copy[idx]];
      return copy;
    });
  };

  const filteredBrowse = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = products.filter(isActiveProduct);
    if (!q) return list;
    return list.filter((p) => {
      const title = getProductTitle(p).toLowerCase();
      const cat = String(p.category || '').toLowerCase();
      return title.includes(q) || cat.includes(q) || String(p.id).includes(q);
    });
  }, [products, search]);

  const selectedEntries = useMemo(
    () =>
      selectedIds.map((id) => ({
        id,
        product: productById.get(id) ?? null,
      })),
    [selectedIds, productById],
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = selectedIds.slice(0, MAX_TRENDING_PRODUCTS);
      const res = await fetch('/api/admin/trending-products', {
        method: 'PUT',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setSelectedIds(
        Array.isArray(data.ids)
          ? data.ids
              .map((x: unknown) => Number(x))
              .filter((n: number) => Number.isInteger(n) && n > 0)
              .slice(0, MAX_TRENDING_PRODUCTS)
          : [],
      );
      userEditedRef.current = false;
      onToast?.(
        `Saved ${Math.min(payload.length, MAX_TRENDING_PRODUCTS)} trending products — home strip + top ${SEO_TRENDING_IMAGE_COUNT} SEO previews updated`,
        'success',
      );
      onClose();
    } catch (e) {
      console.error(e);
      onToast?.('Could not save trending products', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const selectedSet = new Set(selectedIds);

  return (
    <div
      className="tpp-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="trending-picker-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="tpp-dialog">
        <div className="tpp-head">
          <div>
            <h2 id="trending-picker-title" className="tpp-title">
              Trending products
            </h2>
            <p className="tpp-sub">
              Pick up to <strong>{MAX_TRENDING_PRODUCTS}</strong> for the home page strip. Use{' '}
              <strong>↑ ↓</strong> to set order — positions <strong>1–{SEO_TRENDING_IMAGE_COUNT}</strong>{' '}
              become Google / social search preview images with product links.
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="tpp-close">
            ×
          </button>
        </div>

        <div className="tpp-toolbar">
          <input
            type="search"
            className="tpp-search"
            placeholder="Filter products by title, category, ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="tpp-toolbar-meta">
            <span className="tpp-count">
              Selected: <strong>{selectedIds.length}</strong> / {MAX_TRENDING_PRODUCTS}
            </span>
            <span className="tpp-seo-hint">
              SEO previews: {Math.min(selectedIds.length, SEO_TRENDING_IMAGE_COUNT)} /{' '}
              {SEO_TRENDING_IMAGE_COUNT}
            </span>
            <button
              type="button"
              className="tpp-clear"
              onClick={() => {
                markEdited();
                setSelectedIds([]);
              }}
              disabled={selectedIds.length === 0 || saving}
            >
              Clear all
            </button>
            {loading ? (
              <AdminLoading
                message="Loading"
                variant="compact"
                className="admin-loading--inline-toolbar"
              />
            ) : null}
          </div>
        </div>

        <div className="tpp-body">
          <section className="tpp-selected" aria-label="Selected trending order">
            <h3 className="tpp-section-title">Selected order (home + SEO)</h3>
            {selectedIds.length === 0 ? (
              <p className="tpp-empty">
                {loading ? 'Loading saved list…' : 'No products selected — check items below or use search.'}
              </p>
            ) : (
              <ol className="tpp-selected-list">
                {selectedEntries.map(({ id, product }, index) => {
                  const title = product ? getProductTitle(product) || 'Untitled' : `Product #${id}`;
                  const isSeo = index < SEO_TRENDING_IMAGE_COUNT;
                  return (
                    <li key={id} className={`tpp-selected-item${isSeo ? ' tpp-selected-item--seo' : ''}`}>
                      <span className="tpp-rank">{index + 1}</span>
                      <div className="tpp-thumb">
                        {product?.image ? (
                          <Image src={product.image} alt="" fill sizes="44px" unoptimized />
                        ) : (
                          <span className="tpp-thumb-ph" aria-hidden>
                            …
                          </span>
                        )}
                      </div>
                      <div className="tpp-selected-text">
                        <p className="tpp-selected-name">{title}</p>
                        <p className="tpp-selected-meta">
                          ID {id}
                          {product ? ` · ${product.category}` : ' · details loading'}
                          {isSeo ? (
                            <span className="tpp-seo-badge">Google preview #{index + 1}</span>
                          ) : null}
                        </p>
                      </div>
                      {product ? (
                        <AdminPkrAmount amount={product.currentPrice} size="compact" />
                      ) : (
                        <span className="tpp-price-ph">—</span>
                      )}
                      <div className="tpp-reorder">
                        <button
                          type="button"
                          className="tpp-move"
                          aria-label={`Move ${title} up`}
                          disabled={index === 0 || saving}
                          onClick={() => moveId(id, -1)}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          className="tpp-move"
                          aria-label={`Move ${title} down`}
                          disabled={index === selectedEntries.length - 1 || saving}
                          onClick={() => moveId(id, 1)}
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          className="tpp-remove"
                          aria-label={`Remove ${title}`}
                          disabled={saving}
                          onClick={() => removeId(id)}
                        >
                          ×
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>

          <section className="tpp-browse" aria-label="Browse products">
            <h3 className="tpp-section-title">
              {search.trim() ? 'Search results' : 'All active products'}
            </h3>
            <ul className="tpp-browse-list">
              {filteredBrowse.map((product) => {
                const checked = selectedSet.has(product.id);
                const orderIndex = selectedIds.indexOf(product.id);
                const title = getProductTitle(product) || 'Untitled';
                return (
                  <li key={product.id}>
                    <label className={`tpp-browse-row${checked ? ' tpp-browse-row--on' : ''}`}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleId(product.id)}
                      />
                      <div className="tpp-thumb">
                        <Image src={product.image} alt="" fill sizes="48px" unoptimized />
                      </div>
                      <div className="tpp-browse-text">
                        <p className="tpp-browse-name">{title}</p>
                        <p className="tpp-browse-meta">
                          ID {product.id} · {product.category}
                          {checked ? (
                            <span className="tpp-order-tag"> · Slot #{orderIndex + 1}</span>
                          ) : null}
                        </p>
                      </div>
                      <AdminPkrAmount amount={product.currentPrice} size="compact" />
                    </label>
                  </li>
                );
              })}
            </ul>
            {!loading && filteredBrowse.length === 0 ? (
              <p className="tpp-empty">No products match this filter.</p>
            ) : null}
          </section>
        </div>

        <div className="tpp-foot">
          <button type="button" className="tpp-btn tpp-btn--ghost" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
            type="button"
            className="tpp-btn tpp-btn--primary"
            onClick={handleSave}
            disabled={saving || (loading && selectedIds.length === 0)}
          >
            {saving ? 'Saving…' : `Save ${selectedIds.length} trending`}
          </button>
        </div>
      </div>
    </div>
  );
}
