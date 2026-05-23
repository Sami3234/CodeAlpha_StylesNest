'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Product } from '@/data/products';
import { clientMessageFromApi, GENERIC_CLIENT_ERROR, sanitizeClientMessage } from '@/lib/safe-errors';
import { clientFetch, NetworkError } from '@/lib/client-fetch';
import type { FetchErrorKind } from '@/lib/is-network-error';
import { isProtectedAdminPanelPath } from '@/lib/admin-path';
import { ADMIN_LIVE_POLL_MS } from '@/lib/admin-live-sync';
import { getProductTitle } from '@/utils/getProductText';
import { dedupeByProductTitle } from '@/lib/seo/dedupe-products';

interface ProductContextType {
  products: Product[];
  addProduct: (product: Partial<Product>) => Promise<{ success: boolean; error?: string }>;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: number) => void;
  toggleProductStatus: (id: number) => void;
  getActiveProducts: () => Product[];
  reloadProducts: () => Promise<void>;
  loading: boolean;
  fetchError: FetchErrorKind | null;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export function ProductProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const adminPanel = isProtectedAdminPanelPath(pathname);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<FetchErrorKind | null>(null);

  const fetchProducts = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;
    try {
      if (!silent) setFetchError(null);
      const response = await clientFetch('/api/products', {
        cache: 'no-store',
        credentials: 'same-origin',
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(Array.isArray(data.products) ? data.products : []);
        setFetchError(null);
      } else {
        const errBody = await response.json().catch(() => ({}));
        console.error('Failed to fetch products from API:', errBody);
        setProducts((prev) => (prev.length > 0 ? prev : []));
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      if (error instanceof NetworkError) {
        setFetchError(error.kind);
        setProducts((prev) => prev);
      } else {
        setProducts((prev) => (prev.length > 0 ? prev : []));
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (!adminPanel) return;

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void fetchProducts({ silent: true });
      }
    }, ADMIN_LIVE_POLL_MS);

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void fetchProducts({ silent: true });
      }
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [adminPanel, fetchProducts]);

  const addProduct = async (productData: Partial<Product>) => {
    // Extract text - English only
    const titleText = typeof productData.title === 'string' 
      ? productData.title 
      : productData.title?.en || '';
    
    const descriptionText = typeof productData.description === 'string'
      ? productData.description
      : productData.description?.en || '';

    const featuresText = Array.isArray(productData.features)
      ? productData.features
      : productData.features?.en || [];

    // English only format
    const newProduct = {
      title: { 
        en: titleText, 
        ar: titleText // Keep same for database compatibility
      },
      description: { 
        en: descriptionText, 
        ar: descriptionText // Keep same for database compatibility
      },
      currentPrice: productData.currentPrice || 0,
      originalPrice: productData.originalPrice || 0,
      discount: productData.discount || 0,
      image: productData.image || '',
      images: productData.images || [productData.image || ''],
      freeDelivery: productData.freeDelivery || false,
      soldCount: productData.soldCount ?? 0,
      category: productData.category || 'other',
      features: featuresText.length > 0 
        ? { 
            en: featuresText, 
            ar: featuresText // Keep same for database compatibility
          } 
        : undefined,
      pricingTiers: productData.pricingTiers || [],
      status: productData.status || 'active',
      clothesOptions: productData.clothesOptions,
      shoesOptions: productData.shoesOptions,
      productMeta: productData.productMeta,
    };
    
    console.log('🔄 ProductContext - Adding product with pricingTiers:', newProduct.pricingTiers);
    
    try {
      const response = await clientFetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct),
      });

      if (response.ok) {
        const data = await response.json();
        setProducts([data.product, ...products]);
        return { success: true };
      } else {
        let errorData: Record<string, unknown> = {};
        try {
          const text = await response.text();
          errorData = text ? (JSON.parse(text) as Record<string, unknown>) : {};
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
        
        console.error('Failed to add product:', errorData);
        
        const rawDetail =
          typeof errorData.details === 'string' ? errorData.details : '';
        if (rawDetail.includes('duplicate key')) {
          return {
            success: false,
            error: sanitizeClientMessage('Failed to add product', GENERIC_CLIENT_ERROR),
          };
        }

        return {
          success: false,
          error: clientMessageFromApi(
            errorData as { error?: string; message?: string },
            'Failed to add product'
          ),
        };
      }
    } catch (error) {
      console.error('Error adding product:', error);
      return { success: false, error: GENERIC_CLIENT_ERROR };
    }
  };

  const updateProduct = async (updatedProduct: Product) => {
    try {
      const response = await clientFetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProduct),
      });

      if (response.ok) {
        const data = await response.json();
    setProducts(products.map(p => 
          p.id === data.product.id ? data.product : p
    ));
      } else {
        console.error('Failed to update product');
      }
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  const deleteProduct = async (id: number) => {
    try {
      const response = await clientFetch(`/api/products?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
    setProducts(products.filter(p => p.id !== id));
      } else {
        console.error('Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const toggleProductStatus = async (id: number) => {
    const product = products.find(p => p.id === id);
    if (product) {
      const updatedProduct = {
        ...product,
        status: (product.status === 'active' || !product.status) ? 'inactive' as const : 'active' as const,
      };
      await updateProduct(updatedProduct);
    }
  };

  // Get only active products for the main store
  const getActiveProducts = () => {
    const active = products.filter((p) => p.status === 'active' || !p.status);
    return dedupeByProductTitle(
      active.map((product) => ({
        product,
        id: Number(product.id),
        name: getProductTitle(product),
      })),
    ).map((row) => row.product);
  };

  return (
    <ProductContext.Provider value={{
      products,
      addProduct,
      updateProduct,
      deleteProduct,
      toggleProductStatus,
      getActiveProducts,
      reloadProducts: () => fetchProducts({ silent: true }),
      loading,
      fetchError,
    }}>
      {children}
    </ProductContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
}
