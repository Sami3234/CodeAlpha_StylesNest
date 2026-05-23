'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import ProductForm from '@/components/admin/ProductForm';
import { useProducts } from '@/context/ProductContext';
import { useToast } from '@/components/Toast';
import type { Product } from '@/data/products';
import AdminLoading from '@/components/admin/AdminLoading';
import { sanitizeClientMessage } from '@/lib/safe-errors';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function AdminEditProductPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { products, updateProduct, loading } = useProducts();
  const { showToast } = useToast();

  const product = products.find((p) => String(p.id) === String(id));

  const handleSave = async (
    productData: Product | Partial<Product>,
  ): Promise<{ success: boolean; error?: string }> => {
    if (!product) {
      return { success: false, error: 'Product not found' };
    }

    const updated: Product = {
      ...productData,
      id: product.id,
      title: productData.title!,
      description: productData.description!,
      image: productData.image ?? product.image,
      images: productData.images ?? product.images,
      currentPrice: productData.currentPrice ?? product.currentPrice,
      originalPrice: productData.originalPrice ?? product.originalPrice,
      discount: productData.discount ?? product.discount,
      category: productData.category ?? product.category,
      freeDelivery: productData.freeDelivery ?? product.freeDelivery,
      status: productData.status ?? product.status,
      pricingTiers: productData.pricingTiers ?? product.pricingTiers,
      productMeta: productData.productMeta,
      clothesOptions: productData.clothesOptions,
      shoesOptions: productData.shoesOptions,
      features: productData.features,
      soldCount: product.soldCount,
    };

    const result = await updateProduct(updated);
    if (result.success) {
      showToast('Changes saved', 'success');
      router.push('/khanadmin/products');
      return { success: true };
    }
    const error = sanitizeClientMessage(result.error, 'Failed to save product');
    showToast(error, 'error');
    return { success: false, error };
  };

  if (loading) {
    return (
      <AdminLoading message="Loading product" subMessage="Fetching product details for editing" />
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
          onClick={() => router.push('/khanadmin/products')}
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
      onCancel={() => router.push('/khanadmin/products')}
    />
  );
}
