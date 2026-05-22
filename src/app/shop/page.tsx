'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import SearchBar from '@/components/SearchBar';
import CategoryNav from '@/components/CategoryNav';
import ProductGrid from '@/components/ProductGrid';
import Footer from '@/components/Footer';
import WhatsAppFab from '@/components/WhatsAppFab';
import { useProducts } from '@/context/ProductContext';
import ConnectionProblem from '@/components/network/ConnectionProblem';
import { getProductDescription, getProductTitle } from '@/utils/getProductText';
import { dedupeByProductTitle } from '@/lib/seo/dedupe-products';

const LEGACY_CATEGORY_MAP: Record<string, string> = {
  ladiesbag: 'jewelry',
  wallets: 'watches',
  lace: 'clothes',
};

function ShopPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawCategory = searchParams.get('category') || 'all';
  const categoryFromUrl =
    LEGACY_CATEGORY_MAP[rawCategory] ?? rawCategory;
  const [activeCategory, setActiveCategory] = useState(categoryFromUrl);
  const [searchQuery, setSearchQuery] = useState('');

  // Update active category when URL changes
  useEffect(() => {
    const raw = searchParams.get('category') || 'all';
    setActiveCategory(LEGACY_CATEGORY_MAP[raw] ?? raw);
  }, [searchParams]);

  // Get only active products from context
  const { getActiveProducts, loading, fetchError, reloadProducts } = useProducts();
  const activeProducts = getActiveProducts();
  const showConnectionIssue = !loading && fetchError !== null && activeProducts.length === 0;

  // Filter products based on category and search query
  const filteredProducts = useMemo(() => {
    let filtered = activeProducts;

    if (activeCategory !== 'all') {
      filtered = filtered.filter((product) => product.category === activeCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((product) => {
        const blob = `${getProductTitle(product)} ${getProductDescription(product)}`.toLowerCase();
        return blob.includes(query);
      });
    }

    const deduped = dedupeByProductTitle(
      filtered.map((product) => ({
        product,
        id: Number(product.id),
        name: getProductTitle(product),
      })),
    ).map((row) => row.product);

    return deduped;
  }, [activeCategory, searchQuery, activeProducts]);

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    const params = new URLSearchParams(searchParams.toString());
    params.delete('skin');
    if (category === 'all') {
      params.delete('category');
    } else {
      params.set('category', category);
    }
    const qs = params.toString();
    router.replace(qs ? `/shop?${qs}` : '/shop', { scroll: false });
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <motion.div
      className="min-h-screen flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{
        background: 'linear-gradient(180deg, #f5f7fa 0%, #eef2f6 50%, #f5f7fa 100%)',
        minHeight: '100vh',
        position: 'relative',
        paddingTop: 'var(--site-header-h, 90px)',
      }}
    >
      <Header />

      <SearchBar onSearch={handleSearch} searchQuery={searchQuery} />

      <CategoryNav activeCategory={activeCategory} onCategoryChange={handleCategoryChange} />

      <main className="flex-1 min-w-0">
        <h1 className="sr-only">Shop All Products — StylesNest Pakistan</h1>
        {showConnectionIssue ? (
          <ConnectionProblem
            kind={fetchError ?? 'network'}
            onRetry={() => void reloadProducts()}
            retryLabel="Reload products"
          />
        ) : (
          <ProductGrid products={filteredProducts} />
        )}
      </main>

      <Footer />

      <WhatsAppFab />
    </motion.div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #f5f7fa 0%, #eef2f6 50%, #f5f7fa 100%)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e0e0e0',
            borderTop: '4px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px',
          }} />
          <p style={{ color: '#666' }}>Loading...</p>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    }>
      <ShopPageContent />
    </Suspense>
  );
}
