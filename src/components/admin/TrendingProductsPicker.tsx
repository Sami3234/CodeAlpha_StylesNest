'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Product } from '@/data/products';
import { MAX_TRENDING_PRODUCTS } from '@/lib/trending-products';
import { getProductTitle } from '@/utils/getProductText';

interface TrendingProductsPickerProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onToast?: (message: string, type: 'success' | 'error' | 'info') => void;
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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/trending-products', {
        credentials: 'same-origin',
        cache: 'no-store',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      const ids = Array.isArray(data.ids) ? data.ids.map((x: unknown) => Number(x)) : [];
      setSelectedIds(ids.filter((n: number) => Number.isInteger(n) && n > 0));
    } catch (e) {
      console.error(e);
      onToast?.('Could not load trending list', 'error');
      setSelectedIds([]);
    } finally {
      setLoading(false);
    }
  }, [onToast]);

  useEffect(() => {
    if (!isOpen) return;
    setSearch('');
    load();
  }, [isOpen, load]);

  const toggleId = (id: number) => {
    setSelectedIds((prev) => {
      const idx = prev.indexOf(id);
      if (idx >= 0) {
        return prev.filter((x) => x !== id);
      }
      if (prev.length >= MAX_TRENDING_PRODUCTS) {
        onToast?.(`Maximum ${MAX_TRENDING_PRODUCTS} products`, 'info');
        return prev;
      }
      return [...prev, id];
    });
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = products.filter((p) => p.status === 'active' || !p.status);
    if (!q) return list;
    return list.filter((p) => {
      const title = getProductTitle(p).toLowerCase();
      const cat = String(p.category || '').toLowerCase();
      return title.includes(q) || cat.includes(q) || String(p.id).includes(q);
    });
  }, [products, search]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/trending-products', {
        method: 'PUT',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setSelectedIds(
        Array.isArray(data.ids) ? data.ids.map((x: unknown) => Number(x)) : []
      );
      onToast?.('Trending products saved', 'success');
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
      role="dialog"
      aria-modal="true"
      aria-labelledby="trending-picker-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 12000,
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto',
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '720px',
          maxHeight: 'min(92vh, 820px)',
          backgroundColor: '#fff',
          borderRadius: '16px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '18px 20px',
            borderBottom: '1px solid #eef2f7',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '12px',
            flexShrink: 0,
          }}
        >
          <div>
            <h2
              id="trending-picker-title"
              style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: '700',
                color: '#1a1a2e',
              }}
            >
              Trending products
            </h2>
            <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#64748b' }}>
              Choose up to {MAX_TRENDING_PRODUCTS} products for the home page strip.
              Order follows your selection sequence.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              border: 'none',
              background: '#f1f5f9',
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '20px',
              lineHeight: 1,
              color: '#475569',
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: '14px 20px', flexShrink: 0 }}>
          <input
            type="search"
            placeholder="Search by title, category, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: '10px',
              border: '2px solid #e8eef4',
              fontSize: '14px',
              outline: 'none',
              color: '#000',
              boxSizing: 'border-box',
            }}
          />
          <div
            style={{
              marginTop: '10px',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '10px',
              fontSize: '13px',
              color: '#475569',
            }}
          >
            <span style={{ fontWeight: '600' }}>
              Selected: {selectedIds.length} / {MAX_TRENDING_PRODUCTS}
            </span>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              disabled={selectedIds.length === 0 || saving}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#fff',
                cursor: selectedIds.length === 0 ? 'not-allowed' : 'pointer',
                fontSize: '12px',
                fontWeight: '600',
                color: '#64748b',
              }}
            >
              Clear all
            </button>
            {loading ? <span style={{ color: '#94a3b8' }}>Loading…</span> : null}
          </div>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '0 12px 12px',
            minHeight: '200px',
          }}
        >
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {filtered.map((product) => {
              const checked = selectedSet.has(product.id);
              const title = getProductTitle(product) || 'Untitled';
              return (
                <li key={product.id} style={{ marginBottom: '8px' }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 12px',
                      borderRadius: '12px',
                      border: checked
                        ? '2px solid rgba(102, 126, 234, 0.45)'
                        : '1px solid #eef2f7',
                      background: checked ? 'rgba(102, 126, 234, 0.06)' : '#fafbfc',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleId(product.id)}
                      style={{ width: '18px', height: '18px', flexShrink: 0 }}
                    />
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        position: 'relative',
                        flexShrink: 0,
                        background: '#e8eef4',
                      }}
                    >
                      <Image
                        src={product.image}
                        alt=""
                        fill
                        sizes="48px"
                        style={{ objectFit: 'cover' }}
                        unoptimized
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          margin: 0,
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#1e293b',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {title}
                      </p>
                      <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8' }}>
                        ID {product.id} · {product.category}
                      </p>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#c44569', flexShrink: 0 }}>
                      {product.currentPrice.toFixed(0)} PKR
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
          {!loading && filtered.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#94a3b8', padding: '24px' }}>
              No products match your search.
            </p>
          ) : null}
        </div>

        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid #eef2f7',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            flexShrink: 0,
            flexWrap: 'wrap',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            style={{
              padding: '12px 20px',
              borderRadius: '10px',
              border: '2px solid #e2e8f0',
              background: '#fff',
              fontWeight: '600',
              cursor: saving ? 'wait' : 'pointer',
              color: '#475569',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading}
            style={{
              padding: '12px 22px',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              fontWeight: '700',
              cursor: saving || loading ? 'wait' : 'pointer',
              boxShadow: '0 8px 22px rgba(102, 126, 234, 0.35)',
            }}
          >
            {saving ? 'Saving…' : 'Save trending'}
          </button>
        </div>
      </div>
    </div>
  );
}
