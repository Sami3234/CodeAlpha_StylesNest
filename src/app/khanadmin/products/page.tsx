'use client';

import { useState, Suspense } from 'react';
import AdminThumbImage from '@/components/admin/AdminThumbImage';
import { useSearchParams, useRouter } from 'next/navigation';
import { categories, Product } from '@/data/products';
import { useProducts } from '@/context/ProductContext';
import { useToast } from '@/components/Toast';
import TrendingProductsPicker from '@/components/admin/TrendingProductsPicker';
import { getProductTitle, getProductDescription } from '@/utils/getProductText';
import { formatPrice } from '@/utils/formatPrice';

import { adminProductT, type AdminProductTFunction } from '@/lib/admin/product-form-shared';
import AdminLoading from '@/components/admin/AdminLoading';

// Legacy alias for list page
const translations: Record<string, string> = {
  'admin.products': 'Products',
  'admin.manageProducts': 'Manage all products',
  'admin.addProduct': 'Add Product',
  'admin.editProduct': 'Edit Product',
  'admin.searchProducts': 'Search products...',
  'admin.active': 'Active',
  'admin.inactive': 'Inactive',
  'admin.edit': 'Edit',
  'admin.delete': 'Delete',
  'admin.cancel': 'Cancel',
  'admin.save': 'Save',
  'admin.back': 'Back',
  'admin.next': 'Next',
  'admin.deleteConfirm': 'Delete this product?',
  'admin.noProducts': 'No products found',
  'admin.activateAllInactive': 'Activate all inactive',
  'admin.statusFilterAll': 'All statuses',
  'admin.statusFilterActive': 'Active only',
  'admin.statusFilterInactive': 'Inactive only',
  'admin.totalProducts': 'Total',
  'admin.form.title': 'Title',
  'admin.form.category': 'Category',
  'admin.form.status': 'Status',
  'admin.form.originalPrice': 'Original Price',
  'admin.form.currentPrice': 'Current Price',
  'admin.form.discount': 'Discount',
  'admin.form.description': 'Description',
  'admin.form.freeDelivery': 'Free Delivery',
  'admin.form.freeDeliveryDesc': 'Enable free delivery for this product',
  'admin.form.clothesOptions': 'Clothes options',
  'admin.form.clothesGender': 'For',
  'admin.form.clothesMen': 'Men',
  'admin.form.clothesWomen': 'Women',
  'admin.form.clothesStitch': 'Stitch type',
  'admin.form.clothesStitched': 'Stitched',
  'admin.form.clothesUnstitched': 'Unstitched',
  'admin.form.clothesSizes': 'Available sizes',
  'admin.form.clothesSizesHint': 'Select all sizes you sell for this item',
  'admin.form.clothesSizesHintStitched': 'Required — select all sizes you sell for this stitched item',
  'admin.form.clothesSizesHintUnstitched': 'Optional — add sizes if customers may choose one when ordering',
  'admin.form.optional': '(optional)',
  'admin.form.featuresOptional': 'Add product features (optional). You can skip this step.',
  'admin.form.mainImage': 'Main Image',
  'admin.form.additionalImages': 'Additional Images',
  'admin.form.imageUrlPlaceholder': 'Enter image URL...',
  'admin.form.preview': 'Preview',
  'admin.form.step': 'Step',
  'admin.form.of': 'of',
  'admin.form.tab.basic': 'Basic Info',
  'admin.form.tab.features': 'Features',
  'admin.form.tab.images': 'Images',
  'admin.form.errors.mainImageRequired': 'Main image URL is required',
  'admin.form.pricingTiers': 'Quantity Pricing',
  'admin.form.pricingTiersDesc': 'Set different prices for different quantities',
  'admin.form.noPricingTiers': 'No quantity pricing set - Click "Add Tier" to add',
  'admin.table.product': 'Product',
  'admin.table.category': 'Category',
  'admin.table.price': 'Price',
  'admin.table.status': 'Status',
  'admin.table.actions': 'Actions',
  'admin.trendingProducts': 'Trending products',
  // Category translations
  'categories.all': 'All',
  'categories.cosmetics': 'Cosmetics',
  'categories.jewelry': 'Jewelry',
  'categories.watches': 'Watches',
  'categories.makeup': 'Makeup',
  'categories.clothes': 'Clothes',
  'categories.shoes': 'Shoes',
  'categories.electronics': 'Electronics',
  'categories.general': 'General',
  'categories.bags': 'Bags',
  'categories.menfashion': 'Men Fashion',
  /** Legacy DB category strings → readable labels */
  'categories.ladiesbag': 'Jewelry',
  'categories.wallets': 'Watches',
  'categories.lace': 'Clothes',
};


// Delete Confirmation Modal
interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  productTitle: string;
  t: AdminProductTFunction;
}

function DeleteModal({ isOpen, onClose, onConfirm, productTitle, t }: DeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '400px',
          padding: '32px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '70px',
              height: '70px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#e53935" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#1a1a2e', marginBottom: '8px' }}>
            {t('admin.deleteConfirm')}
          </h3>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '24px', lineHeight: '1.5' }}>
            &quot;{productTitle}&quot;
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: '14px',
                border: '2px solid #e0e0e0',
                borderRadius: '10px',
                backgroundColor: '#fff',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                color: '#666',
              }}
            >
              {t('admin.cancel')}
            </button>
            <button
              onClick={onConfirm}
              style={{
                flex: 1,
                padding: '14px',
                border: 'none',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #e53935 0%, #c62828 100%)',
                color: '#fff',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(229, 57, 53, 0.3)',
              }}
            >
              {t('admin.delete')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const categoryParam = searchParams.get('category');
  const { showToast } = useToast();
  
  // Translation function that returns English text
  const t: AdminProductTFunction = (key, options) =>
    translations[key] || adminProductT(key, options);
  
  // Use global product context
  const { products, deleteProduct, toggleProductStatus, reloadProducts, loading } = useProducts();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [activatingAll, setActivatingAll] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; product: Product | null }>({
    isOpen: false,
    product: null,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [trendingPickerOpen, setTrendingPickerOpen] = useState(false);
  const productsPerPage = 100;

  // Use URL param as source of truth
  const selectedCategory = categoryParam || 'all';
  
  // Update URL when category changes (button click)
  const setSelectedCategory = (category: string) => {
    // Reset to page 1 when changing category
    setCurrentPage(1);
    
    const newCategory = category === 'all' ? null : category;
    const params = new URLSearchParams(searchParams.toString());
    if (newCategory) {
      params.set('category', newCategory);
    } else {
      params.delete('category');
    }
    router.push(`/khanadmin/products?${params.toString()}`);
  };

  const inactiveCount = products.filter((p) => p.status === 'inactive').length;

  const filteredProducts = products.filter((product) => {
    const productTitle = getProductTitle(product);
    const matchesSearch = productTitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const isActive = product.status === 'active' || !product.status;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && isActive) ||
      (statusFilter === 'inactive' && product.status === 'inactive');
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleActivateAllInactive = async () => {
    setActivatingAll(true);
    try {
      const res = await fetch('/api/admin/activate-products', { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.error || 'Failed to activate products', 'error');
        return;
      }
      await reloadProducts();
      showToast(data.message || 'Products activated', 'success');
      setStatusFilter('all');
    } catch {
      showToast('Failed to activate products', 'error');
    } finally {
      setActivatingAll(false);
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const endIndex = startIndex + productsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  const handleDeleteProduct = () => {
    if (deleteModal.product) {
      deleteProduct(deleteModal.product.id);
      setDeleteModal({ isOpen: false, product: null });
      showToast('Item Deleted Successfully', 'success');
    }
  };

  const handleToggleStatus = (productId: number) => {
    toggleProductStatus(productId);
  };

  const openEditPage = (product: Product) => {
    router.push(`/khanadmin/products/${product.id}/edit`);
  };

  const openAddPage = () => {
    router.push('/khanadmin/products/new');
  };

  return (
    <div>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" style={{ marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '600', color: '#1a1a2e' }}>{t('admin.products')}</h1>
          <p style={{ color: '#666', fontSize: '14px', marginTop: '4px' }}>
            {t('admin.manageProducts')} ({filteredProducts.length})
          </p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setTrendingPickerOpen(true)}
            style={{
              backgroundColor: '#fff',
              color: '#4c51bf',
              padding: '12px 20px',
              borderRadius: '10px',
              border: '2px solid rgba(102, 126, 234, 0.45)',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 2px 10px rgba(102, 126, 234, 0.15)',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
            {t('admin.trendingProducts')}
          </button>
          {inactiveCount > 0 ? (
            <button
              type="button"
              disabled={activatingAll}
              onClick={handleActivateAllInactive}
              style={{
                backgroundColor: '#fff',
                color: '#2f855a',
                padding: '12px 16px',
                borderRadius: '10px',
                border: '2px solid #48bb78',
                fontSize: '14px',
                fontWeight: '600',
                cursor: activatingAll ? 'wait' : 'pointer',
                opacity: activatingAll ? 0.7 : 1,
              }}
            >
              {activatingAll ? '…' : `${t('admin.activateAllInactive')} (${inactiveCount})`}
            </button>
          ) : null}
          <button
            type="button"
            onClick={openAddPage}
            style={{
              backgroundColor: '#1a1a2e',
              color: '#fff',
              padding: '12px 20px',
              borderRadius: '10px',
              border: 'none',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(26, 26, 46, 0.2)',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            {t('admin.addProduct')}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ backgroundColor: '#fff', borderRadius: '14px', padding: '14px 16px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#666' }}>
          {t('admin.totalProducts')}: <strong>{products.length}</strong>
          {loading ? ' · Loading…' : ''}
          {inactiveCount > 0 ? (
            <span style={{ color: '#c05621' }}> · {inactiveCount} inactive (hidden on shop)</span>
          ) : null}
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <div style={{ position: 'relative', flex: '1' }}>
            <svg style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: '#999' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1); // Reset to page 1 when searching
              }}
              placeholder={t('admin.searchProducts')}
              style={{ width: '100%', padding: '12px 14px 12px 44px', border: '2px solid #f0f0f0', borderRadius: '10px', fontSize: '14px', outline: 'none', color: '#000' }}
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{ padding: '12px 16px', border: '2px solid #f0f0f0', borderRadius: '10px', fontSize: '14px', outline: 'none', backgroundColor: '#fff', color: '#000', minWidth: '150px', cursor: 'pointer' }}
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{t(`categories.${cat.id}`)}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as 'all' | 'active' | 'inactive');
              setCurrentPage(1);
            }}
            style={{ padding: '12px 16px', border: '2px solid #f0f0f0', borderRadius: '10px', fontSize: '14px', outline: 'none', backgroundColor: '#fff', color: '#000', minWidth: '150px', cursor: 'pointer' }}
          >
            <option value="all">{t('admin.statusFilterAll')}</option>
            <option value="active">{t('admin.statusFilterActive')}</option>
            <option value="inactive">{t('admin.statusFilterInactive')}</option>
          </select>
        </div>
      </div>

      {/* Products - Mobile Cards */}
      <div className="block lg:hidden">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {paginatedProducts.map((product) => (
            <div key={product.id} style={{ backgroundColor: '#fff', borderRadius: '14px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', opacity: product.status === 'inactive' ? 0.6 : 1 }}>
              <div style={{ display: 'flex', gap: '14px' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '10px', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                  <AdminThumbImage
                    src={product.image}
                    alt={getProductTitle(product)}
                    sizes="80px"
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: '8px' }}>
                    <p style={{ fontSize: '14px', color: '#333', fontWeight: '500', marginBottom: '6px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {getProductTitle(product)}
                    </p>
                    <button onClick={() => handleToggleStatus(product.id)} style={{ padding: '4px 10px', borderRadius: '12px', border: 'none', fontSize: '11px', fontWeight: '600', cursor: 'pointer', backgroundColor: (product.status === 'active' || !product.status) ? '#e8f5e9' : '#ffebee', color: (product.status === 'active' || !product.status) ? '#4CAF50' : '#e53935', whiteSpace: 'nowrap' }}>
                      {(product.status === 'active' || !product.status) ? t('admin.active') : t('admin.inactive')}
                    </button>
                  </div>
                  <span style={{ backgroundColor: '#f0f0f0', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', color: '#666' }}>{t(`categories.${product.category}`)}</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #f0f0f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: '#4CAF50', fontSize: '18px', fontWeight: '700' }}>{formatPrice(product.currentPrice)} PKR</span>
                  <span style={{ color: '#999', fontSize: '14px', textDecoration: 'line-through' }}>{formatPrice(product.originalPrice)} PKR</span>
                  <span style={{ backgroundColor: '#ffebee', color: '#e53935', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>-{product.discount}%</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => openEditPage(product)} style={{ padding: '10px', border: 'none', borderRadius: '8px', backgroundColor: '#e3f2fd', cursor: 'pointer', color: '#2196F3' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                  </button>
                  <button onClick={() => setDeleteModal({ isOpen: true, product })} style={{ padding: '10px', border: 'none', borderRadius: '8px', backgroundColor: '#ffebee', cursor: 'pointer', color: '#e53935' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Products Table - Desktop */}
      <div className="hidden lg:block" style={{ backgroundColor: '#fff', borderRadius: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #eee' }}>
                <th style={{ textAlign: 'left', padding: '16px', color: '#666', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>#</th>
                <th style={{ textAlign: 'left', padding: '16px', color: '#666', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>{t('admin.table.product')}</th>
                <th style={{ textAlign: 'left', padding: '16px', color: '#666', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>{t('admin.table.category')}</th>
                <th style={{ textAlign: 'left', padding: '16px', color: '#666', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>{t('admin.table.price')}</th>
                <th style={{ textAlign: 'center', padding: '16px', color: '#666', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>{t('admin.table.status')}</th>
                <th style={{ textAlign: 'center', padding: '16px', color: '#666', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>{t('admin.table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.map((product, index) => (
                <tr key={product.id} style={{ borderBottom: '1px solid #f5f5f5', opacity: product.status === 'inactive' ? 0.6 : 1 }} className="hover:bg-gray-50">
                  <td style={{ padding: '16px', fontSize: '14px', color: '#999', fontWeight: '500' }}>{index + 1}</td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ width: '56px', height: '56px', borderRadius: '10px', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                        <AdminThumbImage
                          src={product.image}
                          alt={getProductTitle(product)}
                          sizes="56px"
                        />
                      </div>
                      <div style={{ maxWidth: '220px' }}>
                        <p style={{ fontSize: '14px', color: '#1a1a2e', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {getProductTitle(product)}
                        </p>
                        <p style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                          ID: {product.id} • {(() => {
                            if (!product.features) return 0;
                            if (typeof product.features === 'object' && 'en' in product.features) {
                              const featuresObj = product.features as { en: string[]; ar: string[] };
                              const langFeatures = featuresObj.en;
                              return langFeatures ? langFeatures.length : 0;
                            }
                            if (Array.isArray(product.features)) {
                              return (product.features as string[]).length;
                            }
                            return 0;
                          })()} features
                        </p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}><span style={{ backgroundColor: '#f0f0f0', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', color: '#666', fontWeight: '500' }}>{t(`categories.${product.category}`)}</span></td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '16px', color: '#4CAF50', fontWeight: '700' }}>{formatPrice(product.currentPrice)} PKR</span>
                      <span style={{ fontSize: '13px', color: '#999', textDecoration: 'line-through' }}>{formatPrice(product.originalPrice)} PKR</span>
                      <span style={{ backgroundColor: '#ffebee', color: '#e53935', padding: '3px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>-{product.discount}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <button onClick={() => handleToggleStatus(product.id)} style={{ padding: '8px 14px', borderRadius: '20px', border: 'none', fontSize: '12px', fontWeight: '600', cursor: 'pointer', backgroundColor: (product.status === 'active' || !product.status) ? '#e8f5e9' : '#ffebee', color: (product.status === 'active' || !product.status) ? '#4CAF50' : '#e53935' }}>
                      {(product.status === 'active' || !product.status) ? t('admin.active') : t('admin.inactive')}
                    </button>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <button onClick={() => openEditPage(product)} style={{ padding: '10px', border: 'none', borderRadius: '8px', backgroundColor: '#e3f2fd', cursor: 'pointer', color: '#2196F3' }} title={t('admin.edit')}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                      </button>
                      <button onClick={() => setDeleteModal({ isOpen: true, product })} style={{ padding: '10px', border: 'none', borderRadius: '8px', backgroundColor: '#ffebee', cursor: 'pointer', color: '#e53935' }} title={t('admin.delete')}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredProducts.length === 0 && <div style={{ padding: '60px 20px', textAlign: 'center' }}><p style={{ color: '#999', fontSize: '16px' }}>{t('admin.noProducts')}</p></div>}
      </div>

      {filteredProducts.length === 0 && <div className="block lg:hidden" style={{ backgroundColor: '#fff', borderRadius: '14px', padding: '40px 20px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}><p style={{ color: '#999', fontSize: '14px' }}>{t('admin.noProducts')}</p></div>}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          marginTop: '24px',
          padding: '20px',
          flexWrap: 'wrap',
        }}>
          {/* Previous Button */}
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            style={{
              padding: '10px 16px',
              borderRadius: '10px',
              border: '2px solid #e0e0e0',
              backgroundColor: currentPage === 1 ? '#f5f5f5' : '#fff',
              color: currentPage === 1 ? '#999' : '#1a1a2e',
              fontSize: '14px',
              fontWeight: '600',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            className={currentPage !== 1 ? 'hover:bg-gray-50' : ''}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            <span className="hidden sm:inline">Previous</span>
          </button>

          {/* Page Numbers */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => {
              // Show first page, last page, current page, and pages around current
              const showPage = pageNum === 1 || 
                              pageNum === totalPages || 
                              (pageNum >= currentPage - 1 && pageNum <= currentPage + 1);
              
              // Show ellipsis
              const showEllipsisBefore = pageNum === currentPage - 2 && currentPage > 3;
              const showEllipsisAfter = pageNum === currentPage + 2 && currentPage < totalPages - 2;

              if (showEllipsisBefore || showEllipsisAfter) {
                return (
                  <span key={`ellipsis-${pageNum}`} style={{ 
                    padding: '10px 8px', 
                    color: '#999',
                    fontSize: '14px',
                    fontWeight: '600',
                  }}>
                    ...
                  </span>
                );
              }

              if (!showPage) return null;

              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '10px',
                    border: currentPage === pageNum ? '2px solid #1a1a2e' : '2px solid #e0e0e0',
                    backgroundColor: currentPage === pageNum ? '#1a1a2e' : '#fff',
                    color: currentPage === pageNum ? '#fff' : '#333',
                    fontSize: '14px',
                    fontWeight: currentPage === pageNum ? '700' : '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    minWidth: '44px',
                    boxShadow: currentPage === pageNum ? '0 4px 12px rgba(26, 26, 46, 0.3)' : 'none',
                    transform: currentPage === pageNum ? 'translateY(-2px)' : 'translateY(0)',
                  }}
                  className="hover:bg-gray-50"
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          {/* Next Button */}
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            style={{
              padding: '10px 16px',
              borderRadius: '10px',
              border: '2px solid #e0e0e0',
              backgroundColor: currentPage === totalPages ? '#f5f5f5' : '#fff',
              color: currentPage === totalPages ? '#999' : '#1a1a2e',
              fontSize: '14px',
              fontWeight: '600',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            className={currentPage !== totalPages ? 'hover:bg-gray-50' : ''}
          >
            <span className="hidden sm:inline">Next</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>

          {/* Page Info */}
          <div style={{
            marginLeft: '12px',
            padding: '10px 16px',
            backgroundColor: '#f8f9fa',
            borderRadius: '10px',
            fontSize: '13px',
            color: '#666',
            fontWeight: '500',
            whiteSpace: 'nowrap',
          }}>
            Page {currentPage} of {totalPages} • {filteredProducts.length} products
          </div>
        </div>
      )}

      <TrendingProductsPicker
        isOpen={trendingPickerOpen}
        onClose={() => setTrendingPickerOpen(false)}
        products={products}
        onToast={(message, type) => showToast(message, type)}
      />

      <DeleteModal 
        isOpen={deleteModal.isOpen} 
        onClose={() => setDeleteModal({ isOpen: false, product: null })} 
        onConfirm={handleDeleteProduct} 
        productTitle={
          deleteModal.product 
            ? getProductTitle(deleteModal.product)
            : ''
        } 
        t={t} 
      />
    </div>
  );
}

export default function AdminProducts() {
  return (
    <Suspense fallback={<AdminLoading message="Loading products" />}>
      <AdminProductsContent />
    </Suspense>
  );
}
