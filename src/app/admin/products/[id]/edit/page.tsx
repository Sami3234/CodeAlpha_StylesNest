'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import ProductForm from '@/components/admin/ProductForm';
import { useProducts } from '@/context/ProductContext';
import { useToast } from '@/components/Toast';
import type { Product } from '@/data/products';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function AdminEditProductPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { products, updateProduct, loading } = useProducts();
  const { showToast } = useToast();

  const product = products.find((p) => String(p.id) === String(id));

  const handleSave = async (productData: Product | Partial<Product>) => {
    if (!product) return;
    const updated: Product = {
      ...product,
      ...productData,
      id: product.id,
      title: productData.title || product.title,
      description: productData.description || product.description,
      features: productData.features || product.features,
    } as Product;
    updateProduct(updated);
    showToast('Changes saved', 'success');
    router.push('/admin/products');
  };

  if (loading) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
        Loading product…
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '48px 20px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1e293b', marginBottom: '12px' }}>
          Product not found
        </h1>
        <p style={{ color: '#64748b', marginBottom: '24px' }}>This product may have been removed.</p>
        <button
          type="button"
          onClick={() => router.push('/admin/products')}
          style={{
            padding: '12px 24px',
            borderRadius: '10px',
            border: 'none',
            background: '#1a1a2e',
            color: '#fff',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Back to products
        </button>
      </div>
    );
  }

  return (
    <ProductForm
      product={product}
      onSave={handleSave}
      onCancel={() => router.push('/admin/products')}
    />
  );
}
