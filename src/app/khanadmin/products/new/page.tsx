'use client';

import { useEffect } from 'react';
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

  // Prepare DB in background — do not block the form (reset-sequence can be slow/hang).
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 8000);

    (async () => {
      try {
        if (!dbPrepToastShown) {
          dbPrepToastShown = true;
          showToast('Preparing database…', 'info');
        }
        await fetch('/api/reset-sequence', { signal: controller.signal });
      } catch {
        if (!cancelled) {
          showToast('Could not prepare product ID sequence. You can still try to save.', 'info');
        }
      } finally {
        window.clearTimeout(timeoutId);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [showToast]);

  const handleSave = async (
    productData: Product | Partial<Product>,
  ): Promise<{ success: boolean; error?: string }> => {
    const result = await addProduct(productData as Partial<Product>);
    if (result.success) {
      showToast('Product added successfully', 'success');
      router.push('/khanadmin/products');
      return { success: true };
    }
    const error = sanitizeClientMessage(result.error, 'Failed to add product');
    showToast(error, 'error');
    return { success: false, error };
  };

  return (
    <ProductForm
      product={null}
      onSave={handleSave}
      onCancel={() => router.push('/khanadmin/products')}
    />
  );
}
