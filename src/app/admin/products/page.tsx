'use client';

import { useState, Suspense } from 'react';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { categories, Product } from '@/data/products';
import { useProducts } from '@/context/ProductContext';
import { useToast } from '@/components/Toast';
import TrendingProductsPicker from '@/components/admin/TrendingProductsPicker';
import { getProductTitle, getProductDescription } from '@/utils/getProductText';

// Translation function type
type TFunction = (key: string, options?: { defaultValue?: string }) => string;

// Translation map for admin panel
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
  'admin.form.title': 'Title',
  'admin.form.category': 'Category',
  'admin.form.status': 'Status',
  'admin.form.originalPrice': 'Original Price',
  'admin.form.currentPrice': 'Current Price',
  'admin.form.discount': 'Discount',
  'admin.form.description': 'Description',
  'admin.form.freeDelivery': 'Free Delivery',
  'admin.form.freeDeliveryDesc': 'Enable free delivery for this product',
  'admin.form.featuresOptional': 'Add product features (optional). You can skip this step.',
  'admin.form.mainImage': 'Main Image',
  'admin.form.additionalImages': 'Additional Images',
  'admin.form.optional': 'Optional',
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
  'categories.electronics': 'Electronics',
  'categories.general': 'General',
  /** Legacy DB category strings → readable labels */
  'categories.ladiesbag': 'Jewelry',
  'categories.wallets': 'Watches',
  'categories.lace': 'Clothes',
};

// Helper function to validate URL or local path
const isValidUrl = (url: string): boolean => {
  if (!url || !url.trim()) return false;
  
  // Check if it's a local path (starts with /)
  if (url.startsWith('/')) return true;
  
  // Check if it's a valid URL
  try {
    new URL(url);
    return url.startsWith('http://') || url.startsWith('https://');
  } catch {
    return false;
  }
};

// Product Modal Component - Step-by-Step Wizard
interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onSave: (product: Product) => void;
  t: TFunction;
}

function ProductModal({ isOpen, onClose, product, onSave, t }: ProductModalProps) {
  const { showToast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(1);
  
    // Initialize formData based on product (English only)
    const [formData, setFormData] = useState(() => {
      if (product) {
        const title = getProductTitle(product);
        const description = getProductDescription(product);
        
        return {
          title,
          currentPrice: product.currentPrice,
          originalPrice: product.originalPrice,
          discount: product.discount,
          category: product.category,
          description,
          freeDelivery: product.freeDelivery,
          status: product.status || 'active' as 'active' | 'inactive',
        };
      }
      return {
        title: '',
        currentPrice: 0,
        originalPrice: 0,
        discount: 0,
        category: 'electronics',
        description: '',
        freeDelivery: true,
        status: 'active' as 'active' | 'inactive',
      };
    });
  
  // Initialize features (English only)
  const [features, setFeatures] = useState<string[]>(() => {
    if (product?.features) {
      if (typeof product.features === 'object' && 'en' in product.features) {
        return product.features.en || [];
      }
      return Array.isArray(product.features) ? product.features : [];
    }
    return [];
  });
  const [newFeature, setNewFeature] = useState('');
  
  // Initialize pricing tiers
  const [pricingTiers, setPricingTiers] = useState<Array<{quantity: number; price: number; discount?: number}>>(() => {
    return product?.pricingTiers || [];
  });
  
  const [images, setImages] = useState(() => product ? {
    main: product.images?.[0] || product.image || '',
    image2: product.images?.[1] || '',
    image3: product.images?.[2] || '',
    image4: product.images?.[3] || '',
  } : {
    main: '',
    image2: '',
    image3: '',
    image4: '',
  });
  
  // Store files temporarily (not uploaded yet)
  const [imageFiles, setImageFiles] = useState<{
    main?: File;
    image2?: File;
    image3?: File;
    image4?: File;
  }>({});
  
  const [errors, setErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateStep1 = () => {
    const newErrors: string[] = [];
    const newFieldErrors: Record<string, string> = {};
    
    // Title validation
    if (!formData.title || !formData.title.trim()) {
      const errorMsg = 'Title is required';
      newErrors.push(errorMsg);
      newFieldErrors.title = errorMsg;
    }
    
    // Original Price validation
    if (formData.originalPrice <= 0) {
      const errorMsg = 'Must be greater than 0';
      newErrors.push('Original price must be greater than 0');
      newFieldErrors.originalPrice = errorMsg;
    }
    
    // Current Price validation
    if (formData.currentPrice <= 0) {
      const errorMsg = 'Must be greater than 0';
      newErrors.push('Current price must be greater than 0');
      newFieldErrors.currentPrice = errorMsg;
    }
    
    // Logical validation - Current price should be less than or equal to original price
    if (formData.currentPrice > formData.originalPrice && formData.originalPrice > 0) {
      const errorMsg = 'Cannot exceed original price';
      newErrors.push('Current price cannot be greater than original price');
      newFieldErrors.currentPrice = errorMsg;
    }
    
    // Discount validation
    if (formData.discount < 0 || formData.discount > 100) {
      const errorMsg = 'Must be 0-100%';
      newErrors.push('Discount must be between 0% and 100%');
      newFieldErrors.discount = errorMsg;
    }
    
    setErrors(newErrors);
    setFieldErrors(newFieldErrors);
    
    // Show first error in toast
    if (newErrors.length > 0) {
      showToast(newErrors[0], 'error');
    }
    
    return newErrors.length === 0;
  };

  const validateStep3 = () => {
    const newErrors: string[] = [];
    // Check if main image exists (either URL or file)
    if (!images.main && !imageFiles.main) {
      newErrors.push(t('admin.form.errors.mainImageRequired'));
    }
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (validateStep1()) setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    setErrors([]);
    setFieldErrors({});
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setFeatures([...features, newFeature.trim()]);
      setNewFeature('');
    }
  };

  const handleRemoveFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  // Handle file selection (preview only, don't upload yet)
  const handleFileUpload = async (file: File, imageKey: 'main' | 'image2' | 'image3' | 'image4') => {
    if (!file) return;
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid image file (JPG, PNG, WEBP, or GIF)');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }
    
    // Store file for later upload
    setImageFiles(prev => ({
      ...prev,
      [imageKey]: file
    }));
    
    // Create local preview URL
    const previewUrl = URL.createObjectURL(file);
    setImages(prev => ({
      ...prev,
      [imageKey]: previewUrl
    }));
  };

  const handleSubmit = async () => {
    if (!validateStep3()) return;
    
    setIsSubmitting(true);
    
    try {
      // Upload files to Cloudinary first
      const uploadedImages = { ...images };
      
      for (const key of ['main', 'image2', 'image3', 'image4'] as const) {
        const file = imageFiles[key];
        if (file) {
          // Upload this file to Cloudinary
          const uploadFormData = new FormData();
          uploadFormData.append('file', file);
          uploadFormData.append('category', formData.category);
          uploadFormData.append('productName', formData.title || 'product');
          
          const response = await fetch('/api/upload', {
            method: 'POST',
            body: uploadFormData,
          });
          
          if (!response.ok) {
            throw new Error(`Failed to upload ${key} image`);
          }
          
          const data = await response.json();
          uploadedImages[key] = data.url;
        }
      }
      
      const allImages = [uploadedImages.main, uploadedImages.image2, uploadedImages.image3, uploadedImages.image4].filter(img => img.trim());
      
      // Create product data in new format - will be auto-translated in addProduct
      const productData: Partial<Product> = {
        currentPrice: formData.currentPrice,
        originalPrice: formData.originalPrice,
        discount: formData.discount,
        category: formData.category,
        freeDelivery: formData.freeDelivery,
        status: formData.status,
        image: uploadedImages.main,
        images: allImages,
        soldCount: product?.soldCount || 0,
      };
      
      // Add title and description (English only)
      if (product) {
        // Editing: Keep existing title/description
        productData.title = product.title;
        productData.description = product.description;
      } else {
        // New product: Format as {en, ar} for database compatibility
        productData.title = { en: formData.title, ar: formData.title };
        productData.description = { en: formData.description, ar: formData.description };
      }
      
      // Add features (English only)
      if (features.length > 0) {
        productData.features = { en: features, ar: features };
      }
      
      // Add pricing tiers
      if (pricingTiers && pricingTiers.length > 0) {
        productData.pricingTiers = pricingTiers;
        console.log('✅ Saving pricingTiers:', JSON.stringify(pricingTiers, null, 2));
      } else {
        console.log('⚠️ No pricing tiers to save');
      }
      
      // If editing, preserve ID
      if (product?.id) {
        productData.id = product.id;
      }
      
      console.log('📦 Final productData:', JSON.stringify(productData, null, 2));
      onSave(productData as Product);
      onClose();
      
    } catch (error) {
      console.error('Submit error:', error);
      showToast(error instanceof Error ? error.message : 'Failed to upload images', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const steps = [
    { num: 1, icon: '📝', label: t('admin.form.tab.basic') },
    { num: 2, icon: '✨', label: t('admin.form.tab.features') },
    { num: 3, icon: '🖼️', label: t('admin.form.tab.images') },
  ];

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
          maxWidth: '600px',
          maxHeight: '90vh',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '24px',
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#fff', marginBottom: '4px' }}>
              {product ? t('admin.editProduct') : t('admin.addProduct')}
            </h2>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
              {t('admin.form.step')} {currentStep} {t('admin.form.of')} 3
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              color: '#fff',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Step Indicator */}
        <div style={{ padding: '24px', backgroundColor: '#fafafa', borderBottom: '1px solid #eee' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {steps.map((step, index) => (
              <div key={step.num} style={{ display: 'flex', alignItems: 'center', flex: index < steps.length - 1 ? 1 : 'none' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      backgroundColor: currentStep === step.num ? '#4CAF50' : currentStep > step.num ? '#4CAF50' : '#e0e0e0',
                      color: currentStep >= step.num ? '#fff' : '#999',
                      transition: 'all 0.3s ease',
                      boxShadow: currentStep === step.num ? '0 4px 12px rgba(76, 175, 80, 0.4)' : 'none',
                      border: currentStep === step.num ? '2px solid #4CAF50' : '2px solid transparent',
                    }}
                  >
                    {currentStep > step.num ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    ) : (
                      <span>{step.icon}</span>
                    )}
                  </div>
                  <span style={{ 
                    fontSize: '12px', 
                    marginTop: '10px', 
                    color: currentStep >= step.num ? '#1a1a2e' : '#999',
                    fontWeight: currentStep === step.num ? '600' : '400',
                    textAlign: 'center',
                  }}>
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    style={{
                      flex: 1,
                      height: '2px',
                      backgroundColor: currentStep > step.num ? '#4CAF50' : '#e0e0e0',
                      margin: '0 16px',
                      marginBottom: '34px',
                      borderRadius: '1px',
                      transition: 'background-color 0.3s ease',
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error Messages */}
        {errors.length > 0 && (
          <div style={{ padding: '12px 24px', backgroundColor: '#ffebee' }}>
            {errors.map((error, index) => (
              <p key={index} style={{ color: '#e53935', fontSize: '13px', margin: '4px 0' }}>⚠️ {error}</p>
            ))}
          </div>
        )}

        {/* Step Content */}
        <div style={{ padding: '24px', maxHeight: '400px', overflowY: 'auto' }}>
          
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Title - Based on current UI language */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1a1a2e', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {t('admin.form.title')} <span style={{ color: '#e53935' }}>*</span>
                </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => {
                      setFormData({ ...formData, title: e.target.value });
                      // Clear error when user types
                      if (fieldErrors.title) {
                        setFieldErrors(prev => ({ ...prev, title: '' }));
                      }
                    }}
                    placeholder="Enter product title..."
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: fieldErrors.title ? '2px solid #e53935' : '2px solid #e8e8e8',
                      borderRadius: '10px',
                      fontSize: '14px',
                      color: '#000',
                      outline: 'none',
                      textAlign: 'left',
                      transition: 'border-color 0.2s ease',
                    }}
                    onFocus={(e) => {
                      if (!fieldErrors.title) {
                        e.target.style.borderColor = '#4CAF50';
                      }
                    }}
                    onBlur={(e) => {
                      if (!fieldErrors.title) {
                        e.target.style.borderColor = '#e8e8e8';
                      }
                    }}
                  />
                  {fieldErrors.title && (
                    <p style={{ color: '#e53935', fontSize: '12px', marginTop: '4px', fontWeight: '500' }}>
                      ⚠️ {fieldErrors.title}
                    </p>
                  )}
                </div>

              {/* Category & Status Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1a1a2e', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {t('admin.form.category')} <span style={{ color: '#e53935' }}>*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: '2px solid #e8e8e8',
                      borderRadius: '10px',
                      fontSize: '14px',
                      color: '#000',
                      backgroundColor: '#fff',
                      cursor: 'pointer',
                      outline: 'none',
                      transition: 'border-color 0.2s ease',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#4CAF50';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e8e8e8';
                    }}
                  >
                    {categories.filter(c => c.id !== 'all').map((cat) => (
                      <option key={cat.id} value={cat.id}>{t(`categories.${cat.id}`)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1a1a2e', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {t('admin.form.status')}
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: '2px solid #e8e8e8',
                      borderRadius: '10px',
                      fontSize: '14px',
                      color: '#000',
                      backgroundColor: '#fff',
                      cursor: 'pointer',
                      outline: 'none',
                      transition: 'border-color 0.2s ease',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#4CAF50';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e8e8e8';
                    }}
                  >
                    <option value="active">{t('admin.active')}</option>
                    <option value="inactive">{t('admin.inactive')}</option>
                  </select>
                </div>
              </div>

              {/* Prices Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1a1a2e', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {t('admin.form.originalPrice')} <span style={{ color: '#e53935' }}>*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.originalPrice || ''}
                    onChange={(e) => {
                      const newOriginalPrice = parseFloat(e.target.value) || 0;
                      
                      // Auto-calculate current price based on discount (if discount is set)
                      const autoCurrentPrice = formData.discount > 0
                        ? newOriginalPrice * (1 - formData.discount / 100)
                        : formData.currentPrice;
                      
                      setFormData({ 
                        ...formData, 
                        originalPrice: newOriginalPrice,
                        currentPrice: formData.discount > 0 ? parseFloat(autoCurrentPrice.toFixed(2)) : formData.currentPrice
                      });
                      
                      // Auto-update all tier prices based on their discounts
                      if (newOriginalPrice > 0) {
                        const updatedTiers = pricingTiers.map(tier => {
                          if ((tier.discount || 0) > 0) {
                            const normalPrice = newOriginalPrice * tier.quantity;
                            const autoTierPrice = normalPrice * (1 - (tier.discount || 0) / 100);
                            return {
                              ...tier,
                              price: parseFloat(autoTierPrice.toFixed(2))
                            };
                          }
                          return tier;
                        });
                        setPricingTiers(updatedTiers);
                      }
                      
                      // Clear error when user types
                      if (fieldErrors.originalPrice) {
                        setFieldErrors(prev => ({ ...prev, originalPrice: '' }));
                      }
                    }}
                    placeholder="Enter price"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: fieldErrors.originalPrice ? '2px solid #e53935' : '2px solid #e8e8e8',
                      borderRadius: '10px',
                      fontSize: '14px',
                      color: '#000',
                      outline: 'none',
                      transition: 'border-color 0.2s ease',
                    }}
                    onFocus={(e) => {
                      if (!fieldErrors.originalPrice) {
                        e.target.style.borderColor = '#4CAF50';
                      }
                    }}
                    onBlur={(e) => {
                      if (!fieldErrors.originalPrice) {
                        e.target.style.borderColor = '#e8e8e8';
                      }
                    }}
                  />
                  {fieldErrors.originalPrice && (
                    <p style={{ color: '#e53935', fontSize: '12px', marginTop: '4px', fontWeight: '500' }}>
                      ⚠️ {fieldErrors.originalPrice}
                    </p>
                  )}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1a1a2e', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {t('admin.form.currentPrice')} <span style={{ color: '#e53935' }}>*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.currentPrice || ''}
                    onChange={(e) => {
                      const newCurrentPrice = parseFloat(e.target.value) || 0;
                      
                      // Auto-calculate discount based on current price
                      const autoDiscount = formData.originalPrice > 0
                        ? Math.round(((formData.originalPrice - newCurrentPrice) / formData.originalPrice) * 100)
                        : 0;
                      
                      setFormData({ 
                        ...formData, 
                        currentPrice: newCurrentPrice,
                        discount: autoDiscount >= 0 ? autoDiscount : 0
                      });
                      
                      // Clear error when user types
                      if (fieldErrors.currentPrice) {
                        setFieldErrors(prev => ({ ...prev, currentPrice: '' }));
                      }
                    }}
                    placeholder="Enter price"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: fieldErrors.currentPrice ? '2px solid #e53935' : '2px solid #e8e8e8',
                      borderRadius: '10px',
                      fontSize: '14px',
                      color: '#000',
                      outline: 'none',
                      transition: 'border-color 0.2s ease',
                    }}
                    onFocus={(e) => {
                      if (!fieldErrors.currentPrice) {
                        e.target.style.borderColor = '#4CAF50';
                      }
                    }}
                    onBlur={(e) => {
                      if (!fieldErrors.currentPrice) {
                        e.target.style.borderColor = '#e8e8e8';
                      }
                    }}
                  />
                  {fieldErrors.currentPrice && (
                    <p style={{ color: '#e53935', fontSize: '12px', marginTop: '4px', fontWeight: '500' }}>
                      ⚠️ {fieldErrors.currentPrice}
                    </p>
                  )}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1a1a2e', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {t('admin.form.discount')} (%) <span style={{ color: '#e53935' }}>*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={formData.discount || ''}
                    onChange={(e) => {
                      const newDiscount = parseInt(e.target.value) || 0;
                      
                      // Auto-calculate current price based on discount
                      const autoCurrentPrice = formData.originalPrice > 0
                        ? formData.originalPrice * (1 - newDiscount / 100)
                        : 0;
                      
                      setFormData({ 
                        ...formData, 
                        discount: newDiscount,
                        currentPrice: parseFloat(autoCurrentPrice.toFixed(2))
                      });
                      
                      // Clear error when user types
                      if (fieldErrors.discount) {
                        setFieldErrors(prev => ({ ...prev, discount: '' }));
                      }
                    }}
                    placeholder="Enter discount %"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: fieldErrors.discount ? '2px solid #e53935' : '2px solid #e8e8e8',
                      borderRadius: '10px',
                      fontSize: '14px',
                      color: '#000',
                      outline: 'none',
                      transition: 'border-color 0.2s ease',
                    }}
                    onFocus={(e) => {
                      if (!fieldErrors.discount) {
                        e.target.style.borderColor = '#4CAF50';
                      }
                    }}
                    onBlur={(e) => {
                      if (!fieldErrors.discount) {
                        e.target.style.borderColor = '#e8e8e8';
                      }
                    }}
                  />
                  {fieldErrors.discount && (
                    <p style={{ color: '#e53935', fontSize: '12px', marginTop: '4px', fontWeight: '500' }}>
                      ⚠️ {fieldErrors.discount}
                    </p>
                  )}
                </div>
              </div>

              {/* Pricing Tiers (Quantity-based pricing) */}
              <div style={{ 
                padding: '16px', 
                backgroundColor: '#f8f9fa', 
                borderRadius: '12px',
                border: '2px dashed #ddd'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a2e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    💰 {t('admin.form.pricingTiers', { defaultValue: 'Quantity Pricing' })}
                  </label>
                  <button
                    type="button"
                    onClick={() => setPricingTiers([...pricingTiers, { quantity: pricingTiers.length + 1, price: 0, discount: 0 }])}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#4CAF50',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    + Add Tier
                  </button>
                </div>
                <p style={{ fontSize: '11px', color: '#666', marginBottom: '12px' }}>
                  {t('admin.form.pricingTiersDesc', { defaultValue: 'Set different prices for different quantities' })}
                </p>
                
                {/* Column Headers */}
                {pricingTiers.length > 0 && (
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '80px 1fr 80px 40px', 
                    gap: '8px', 
                    marginBottom: '8px',
                    paddingLeft: '8px'
                  }}>
                    <span style={{ fontSize: '11px', fontWeight: '600', color: '#666', textTransform: 'uppercase' }}>Qty</span>
                    <span style={{ fontSize: '11px', fontWeight: '600', color: '#666', textTransform: 'uppercase' }}>Price (PKR)</span>
                    <span style={{ fontSize: '11px', fontWeight: '600', color: '#666', textTransform: 'uppercase' }}>Disc %</span>
                    <span></span>
                  </div>
                )}
                
                {pricingTiers.map((tier, index) => {
                  return (
                    <div key={index} style={{ 
                      display: 'grid', 
                      gridTemplateColumns: '80px 1fr 80px 40px', 
                      gap: '8px', 
                      marginBottom: '8px',
                      padding: '8px',
                      backgroundColor: '#fff',
                      borderRadius: '8px',
                      border: '1px solid #e0e0e0'
                    }}>
                      <input
                        type="number"
                        min="1"
                        value={tier.quantity}
                        onChange={(e) => {
                          const updated = [...pricingTiers];
                          const newQuantity = parseInt(e.target.value) || 1;
                          updated[index].quantity = newQuantity;
                          
                          // Auto-calculate price based on discount (if discount is set)
                          if (formData.originalPrice > 0 && (updated[index].discount || 0) > 0) {
                            const normalPrice = formData.originalPrice * newQuantity;
                            const autoTierPrice = normalPrice * (1 - (updated[index].discount || 0) / 100);
                            updated[index].price = parseFloat(autoTierPrice.toFixed(2));
                          }
                          
                          setPricingTiers(updated);
                        }}
                        placeholder="Qty"
                        style={{
                          padding: '8px',
                          border: '2px solid #ddd',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#000',
                          backgroundColor: '#fff',
                        }}
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={tier.price}
                        onChange={(e) => {
                          const updated = [...pricingTiers];
                          const newTierPrice = parseFloat(e.target.value) || 0;
                          updated[index].price = newTierPrice;
                          
                          // Auto-calculate discount based on tier price
                          if (formData.originalPrice > 0 && updated[index].quantity > 0) {
                            const normalPrice = formData.originalPrice * updated[index].quantity;
                            const autoDiscount = normalPrice > 0
                              ? Math.round(((normalPrice - newTierPrice) / normalPrice) * 100)
                              : 0;
                            updated[index].discount = autoDiscount >= 0 ? autoDiscount : 0;
                          }
                          
                          setPricingTiers(updated);
                        }}
                        placeholder="Total Price"
                        style={{
                          padding: '8px',
                          border: '2px solid #ddd',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#000',
                          backgroundColor: '#fff',
                        }}
                      />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={tier.discount || 0}
                        onChange={(e) => {
                          const updated = [...pricingTiers];
                          const newDiscount = parseInt(e.target.value) || 0;
                          updated[index].discount = newDiscount;
                          
                          // Auto-calculate tier price based on discount
                          if (formData.originalPrice > 0 && updated[index].quantity > 0) {
                            const normalPrice = formData.originalPrice * updated[index].quantity;
                            const autoTierPrice = normalPrice * (1 - newDiscount / 100);
                            updated[index].price = parseFloat(autoTierPrice.toFixed(2));
                          }
                          
                          setPricingTiers(updated);
                        }}
                        placeholder="%"
                        style={{
                          padding: '8px',
                          border: '2px solid #ddd',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#000',
                          backgroundColor: '#fff',
                          textAlign: 'center',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setPricingTiers(pricingTiers.filter((_, i) => i !== index))}
                        style={{
                          padding: '8px',
                          backgroundColor: '#ffebee',
                          color: '#e53935',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '18px',
                          fontWeight: '700',
                        }}
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
                {pricingTiers.length === 0 && (
                  <p style={{ fontSize: '12px', color: '#999', textAlign: 'center', padding: '12px' }}>
                    {t('admin.form.noPricingTiers', { defaultValue: 'No quantity pricing set - Click "Add Tier" to add' })}
                  </p>
                )}
              </div>

              {/* Description - Based on current UI language */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1a1a2e', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {t('admin.form.description')} <span style={{ color: '#e53935' }}>*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter product description..."
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '2px solid #e8e8e8',
                    borderRadius: '10px',
                    fontSize: '14px',
                    color: '#000',
                    resize: 'none',
                    textAlign: 'left',
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#4CAF50';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e8e8e8';
                  }}
                />
              </div>

              {/* Free Delivery Toggle */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '10px',
                }}
              >
                <div>
                  <p style={{ fontSize: '14px', fontWeight: '500', color: '#1a1a2e' }}>{t('admin.form.freeDelivery')}</p>
                  <p style={{ fontSize: '12px', color: '#666' }}>{t('admin.form.freeDeliveryDesc')}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, freeDelivery: !formData.freeDelivery })}
                  style={{
                    width: '50px',
                    height: '28px',
                    borderRadius: '14px',
                    border: 'none',
                    backgroundColor: formData.freeDelivery ? '#4CAF50' : '#ddd',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'background-color 0.2s',
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      top: '3px',
                      left: formData.freeDelivery ? '25px' : '3px',
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      backgroundColor: '#fff',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      transition: 'left 0.2s',
                    }}
                  />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Features */}
          {currentStep === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
                {t('admin.form.featuresOptional')}
              </p>
              <p style={{ fontSize: '12px', color: '#999', marginBottom: '8px' }}>
                Features are saved as English text
              </p>

              {/* Features Input - Based on current UI language */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  placeholder="Enter feature..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFeature())}
                  style={{
                    flex: 1,
                    padding: '12px 14px',
                    border: '2px solid #e8e8e8',
                    borderRadius: '10px',
                    fontSize: '14px',
                    color: '#000',
                    textAlign: 'left',
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddFeature}
                  style={{
                    padding: '12px 20px',
                    backgroundColor: '#4CAF50',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontWeight: '500',
                  }}
                >
                  + Add
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                {features.length === 0 ? (
                  <p style={{ color: '#999', fontSize: '13px', textAlign: 'center', padding: '20px' }}>
                    No features added yet
                  </p>
                ) : features.map((feature, index) => (
                  <div 
                    key={index} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '10px', 
                      padding: '10px 14px', 
                      backgroundColor: '#f8f9fa', 
                      borderRadius: '8px', 
                      border: '1px solid #eee' 
                    }} 
                  >
                    <span style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#4CAF50', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '600' }}>{index + 1}</span>
                    <span style={{ flex: 1, fontSize: '13px', color: '#333', textAlign: 'left' }}>{feature}</span>
                    <button type="button" onClick={() => handleRemoveFeature(index)} style={{ padding: '4px', backgroundColor: '#ffebee', color: '#e53935', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}


          {/* Step 3: Images */}
          {currentStep === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Main Image - Required */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1a1a2e', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {t('admin.form.mainImage')} <span style={{ color: '#e53935' }}>*</span>
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                  <input
                    type="url"
                    value={images.main}
                    onChange={(e) => setImages({ ...images, main: e.target.value })}
                    placeholder="https://example.com/image.jpg or upload file"
                    style={{
                      flex: 1,
                      padding: '12px 14px',
                      border: '2px solid #e8e8e8',
                      borderRadius: '10px',
                      fontSize: '14px',
                      color: '#000',
                    }}
                  />
                  <label style={{ 
                    padding: '12px 16px',
                    backgroundColor: '#2196F3',
                    color: '#fff',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap',
                  }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, 'main');
                      }}
                      style={{ display: 'none' }}
                    />
                    📁 Upload
                  </label>
                  {isValidUrl(images.main) && (
                    <div style={{ width: '50px', height: '50px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, border: '2px solid #4CAF50', position: 'relative' }}>
                      <Image src={images.main} alt="Main" fill sizes="40px" style={{ objectFit: 'cover' }} unoptimized />
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Images - Optional */}
              <div style={{ backgroundColor: '#f8f9fa', borderRadius: '12px', padding: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1a1a2e', marginBottom: '12px' }}>
                  {t('admin.form.additionalImages')} <span style={{ color: '#999', fontWeight: '400' }}>({t('admin.form.optional')})</span>
                </label>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {/* Image 2 */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ width: '24px', color: '#999', fontSize: '13px', flexShrink: 0 }}>2.</span>
                    <input
                      type="url"
                      value={images.image2}
                      onChange={(e) => setImages({ ...images, image2: e.target.value })}
                      placeholder={t('admin.form.imageUrlPlaceholder')}
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '13px',
                        color: '#000',
                        backgroundColor: '#fff',
                      }}
                    />
                    <label style={{ 
                      padding: '8px 12px',
                      backgroundColor: '#2196F3',
                      color: '#fff',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, 'image2');
                        }}
                        style={{ display: 'none' }}
                      />
                      📁
                    </label>
                    {isValidUrl(images.image2) && (
                      <div style={{ width: '40px', height: '40px', borderRadius: '6px', overflow: 'hidden', flexShrink: 0, border: '1px solid #ddd', position: 'relative' }}>
                        <Image src={images.image2} alt="2" fill sizes="40px" style={{ objectFit: 'cover' }} unoptimized />
                      </div>
                    )}
                  </div>

                  {/* Image 3 */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ width: '24px', color: '#999', fontSize: '13px', flexShrink: 0 }}>3.</span>
                    <input
                      type="url"
                      value={images.image3}
                      onChange={(e) => setImages({ ...images, image3: e.target.value })}
                      placeholder={t('admin.form.imageUrlPlaceholder')}
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '13px',
                        color: '#000',
                        backgroundColor: '#fff',
                      }}
                    />
                    <label style={{ 
                      padding: '8px 12px',
                      backgroundColor: '#2196F3',
                      color: '#fff',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, 'image3');
                        }}
                        style={{ display: 'none' }}
                      />
                      📁
                    </label>
                    {isValidUrl(images.image3) && (
                      <div style={{ width: '40px', height: '40px', borderRadius: '6px', overflow: 'hidden', flexShrink: 0, border: '1px solid #ddd', position: 'relative' }}>
                        <Image src={images.image3} alt="3" fill sizes="40px" style={{ objectFit: 'cover' }} unoptimized />
                      </div>
                    )}
                  </div>

                  {/* Image 4 */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ width: '24px', color: '#999', fontSize: '13px', flexShrink: 0 }}>4.</span>
                    <input
                      type="url"
                      value={images.image4}
                      onChange={(e) => setImages({ ...images, image4: e.target.value })}
                      placeholder={t('admin.form.imageUrlPlaceholder')}
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '13px',
                        color: '#000',
                        backgroundColor: '#fff',
                      }}
                    />
                    <label style={{ 
                      padding: '8px 12px',
                      backgroundColor: '#2196F3',
                      color: '#fff',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, 'image4');
                        }}
                        style={{ display: 'none' }}
                      />
                      📁
                    </label>
                    {isValidUrl(images.image4) && (
                      <div style={{ width: '40px', height: '40px', borderRadius: '6px', overflow: 'hidden', flexShrink: 0, border: '1px solid #ddd', position: 'relative' }}>
                        <Image src={images.image4} alt="4" fill sizes="40px" style={{ objectFit: 'cover' }} unoptimized />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Image Preview Gallery */}
              {[images.main, images.image2, images.image3, images.image4].some(isValidUrl) && (
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1a1a2e', marginBottom: '12px' }}>
                    {t('admin.form.preview')}
                  </label>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {[images.main, images.image2, images.image3, images.image4].filter(isValidUrl).map((img, index) => (
                      <div
                        key={index}
                        style={{
                          width: '80px',
                          height: '80px',
                          borderRadius: '10px',
                          overflow: 'hidden',
                          position: 'relative',
                          border: index === 0 ? '3px solid #4CAF50' : '2px solid #eee',
                        }}
                      >
                        <Image src={img} alt={`Preview ${index + 1}`} fill sizes="80px" style={{ objectFit: 'cover' }} unoptimized />
                        {index === 0 && (
                          <span style={{
                            position: 'absolute',
                            bottom: '4px',
                            left: '4px',
                            backgroundColor: '#4CAF50',
                            color: '#fff',
                            fontSize: '9px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontWeight: '600',
                          }}>
                            MAIN
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div
          style={{
            padding: '20px 24px',
            borderTop: '1px solid #eee',
            display: 'flex',
            gap: '12px',
            backgroundColor: '#fafafa',
          }}
        >
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handleBack}
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
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f5f5f5';
                e.currentTarget.style.borderColor = '#d0d0d0';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#fff';
                e.currentTarget.style.borderColor = '#e0e0e0';
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              {t('admin.back')}
            </button>
          ) : (
            <button
              type="button"
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
          )}
          
          {currentStep < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              style={{
                flex: 1,
                padding: '14px',
                border: 'none',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
                color: '#fff',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #45a049 0%, #3d8b40 100%)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(76, 175, 80, 0.4)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(76, 175, 80, 0.3)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {t('admin.next')}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              style={{
                flex: 1,
                padding: '14px',
                border: 'none',
                borderRadius: '10px',
                background: isSubmitting ? '#ccc' : 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
                color: '#fff',
                fontSize: '14px',
                fontWeight: '600',
                cursor: isSubmitting ? 'wait' : 'pointer',
                boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: isSubmitting ? 0.7 : 1,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #45a049 0%, #3d8b40 100%)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(76, 175, 80, 0.4)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(76, 175, 80, 0.3)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              {isSubmitting ? (
                <>⏳ Uploading...</>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  {product ? t('admin.save') : t('admin.addProduct')}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Delete Confirmation Modal
interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  productTitle: string;
  t: TFunction;
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
  const t: TFunction = (key: string, options?: { defaultValue?: string }) => {
    return translations[key] || options?.defaultValue || key;
  };
  
  // Use global product context
  const { products, addProduct, updateProduct, deleteProduct, toggleProductStatus } = useProducts();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
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
    router.push(`/admin/products?${params.toString()}`);
  };

  const filteredProducts = products.filter((product) => {
    const productTitle = getProductTitle(product);
    const matchesSearch = productTitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const endIndex = startIndex + productsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  const handleSaveProduct = async (productData: Product | Partial<Product>) => {
    if (editingProduct) {
      // For editing, ensure title and description are in proper format
      const updatedProduct: Product = {
        ...editingProduct,
        ...productData,
        id: editingProduct.id,
        // Preserve title format if title is already object
        title: productData.title || editingProduct.title,
        description: productData.description || editingProduct.description,
        features: productData.features || editingProduct.features,
      } as Product;
      updateProduct(updatedProduct);
      showToast('Changes Saved', 'success');
      setEditingProduct(null);
    } else {
      // For new product, use addProduct (English only)
      const result = await addProduct(productData as Partial<Product>);
      
      if (result.success) {
        showToast('✅ Product Added Successfully!', 'success');
        setEditingProduct(null);
      } else {
        // Show error in toast
        showToast(result.error || 'Failed to add product', 'error');
        
        // If duplicate key error, show helpful message
        if (result.error?.includes('duplicate key') || result.error?.includes('reset the database sequence')) {
          showToast('🔧 Fix: Visit /api/reset-sequence to fix this issue', 'error');
        }
        // Don't close modal so user can fix the issue
      }
    }
  };

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

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const openAddModal = async () => {
    // Automatically reset sequence before opening add modal
    try {
      showToast('🔧 Preparing database...', 'info');
      const response = await fetch('/api/reset-sequence');
      const data = await response.json();
      if (data.success) {
        console.log('✅ Database sequence reset:', data.message);
      }
    } catch (error) {
      console.error('Failed to reset sequence:', error);
      // Continue anyway - let user try
    }
    
    setEditingProduct(null);
    setIsModalOpen(true);
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
          <button
            type="button"
            onClick={openAddModal}
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
        </div>
      </div>

      {/* Products - Mobile Cards */}
      <div className="block lg:hidden">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {paginatedProducts.map((product) => (
            <div key={product.id} style={{ backgroundColor: '#fff', borderRadius: '14px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', opacity: product.status === 'inactive' ? 0.6 : 1 }}>
              <div style={{ display: 'flex', gap: '14px' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '10px', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                  <Image 
                    src={product.image} 
                    alt={getProductTitle(product)} 
                    fill 
                    style={{ objectFit: 'cover' }} 
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
                  <span style={{ color: '#4CAF50', fontSize: '18px', fontWeight: '700' }}>{product.currentPrice.toFixed(2)} PKR</span>
                  <span style={{ color: '#999', fontSize: '14px', textDecoration: 'line-through' }}>{product.originalPrice.toFixed(2)} PKR</span>
                  <span style={{ backgroundColor: '#ffebee', color: '#e53935', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>-{product.discount}%</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => openEditModal(product)} style={{ padding: '10px', border: 'none', borderRadius: '8px', backgroundColor: '#e3f2fd', cursor: 'pointer', color: '#2196F3' }}>
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
                        <Image 
                    src={product.image} 
                    alt={getProductTitle(product)} 
                    fill 
                    style={{ objectFit: 'cover' }} 
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
                      <span style={{ fontSize: '16px', color: '#4CAF50', fontWeight: '700' }}>{product.currentPrice.toFixed(2)} PKR</span>
                      <span style={{ fontSize: '13px', color: '#999', textDecoration: 'line-through' }}>{product.originalPrice.toFixed(2)} PKR</span>
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
                      <button onClick={() => openEditModal(product)} style={{ padding: '10px', border: 'none', borderRadius: '8px', backgroundColor: '#e3f2fd', cursor: 'pointer', color: '#2196F3' }} title={t('admin.edit')}>
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

      <ProductModal key={editingProduct?.id || 'new'} isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingProduct(null); }} product={editingProduct} onSave={handleSaveProduct} t={t} />
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
    <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>}>
      <AdminProductsContent />
    </Suspense>
  );
}
