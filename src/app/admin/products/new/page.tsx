'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProductForm from '@/components/admin/ProductForm';
import { useProducts } from '@/context/ProductContext';
import { useToast } from '@/components/Toast';
import type { Product } from '@/data/products';
import { sanitizeClientMessage } from '@/lib/safe-errors';

/** Avoid duplicate "Preparing database…" toast when React Strict Mode remounts. */
let dbPrepToastShown = false;

export default function AdminNewProductPage() {
  const router = useRouter();
  const { addProduct } = useProducts();
  const { showToast } = useToast();
  const [ready, setReady] = useState(false);
  const prepStarted = useRef(false);

  useEffect(() => {
    if (prepStarted.current) return;
    prepStarted.current = true;

    let cancelled = false;
    (async () => {
      try {
        if (!dbPrepToastShown) {
          dbPrepToastShown = true;
          showToast('Preparing database…', 'info');
        }
        await fetch('/api/reset-sequence');
      } catch {
        // Continue — user can still try to add
      }
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [showToast]);

  const handleSave = async (productData: Product | Partial<Product>) => {
    const result = await addProduct(productData as Partial<Product>);
    if (result.success) {
      showToast('Product added successfully', 'success');
      router.push('/admin/products');
      return;
    }
    showToast(
      sanitizeClientMessage(result.error, 'Failed to add product'),
      'error'
    );
  };

  if (!ready) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
        Loading form…
      </div>
    );
  }

  return (
    <ProductForm
      product={null}
      onSave={handleSave}
      onCancel={() => router.push('/admin/products')}
    />
  );
}
