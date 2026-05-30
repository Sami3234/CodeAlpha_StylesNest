'use client';

import { Fragment, useState } from 'react';
import Link from 'next/link';
import { categories, Product } from '@/data/products';
import { useToast } from '@/components/Toast';
import { getProductTitle, getProductDescription } from '@/utils/getProductText';
import {
  DEFAULT_CLOTHES_OPTIONS,
  isClothesCategory,
  type ClothesOptions,
} from '@/lib/clothes-options';
import {
  categoryShowsGender,
  validateCategoryOptions,
} from '@/lib/category-form-fields';
import { isShoesCategory } from '@/lib/shoes-options';
import { DEFAULT_SHOES_OPTIONS, type ShoesOptions } from '@/lib/shoes-options';
import { adminProductT, type AdminProductTFunction, isValidProductImageUrl } from '@/lib/admin/product-form-shared';
import ProductFormMetaFields from '@/components/admin/ProductFormMetaFields';
import ProductFormCategoryPanel from '@/components/admin/ProductFormCategoryPanel';
import ProductFormImages, {
  type ProductImageEntry,
  MAX_PRODUCT_IMAGES,
} from '@/components/admin/ProductFormImages';
import {
  EMPTY_PRODUCT_META,
  normalizeProductMetaForSave,
  parseTagsInput,
  tagsToInput,
  type ProductMeta,
} from '@/lib/product-meta';
import {
  aggregateImageColors,
  getInitialProductColors,
  normalizeColorList,
  validateProductImageColors,
} from '@/lib/product-colors';
import './product-form.css';

export interface ProductFormProps {
  product: Product | null;
  onSave: (
    product: Product | Partial<Product>,
  ) => void | Promise<void> | Promise<{ success?: boolean; error?: string }>;
  onCancel: () => void;
  t?: AdminProductTFunction;
}

export default function ProductForm({ product, onSave, onCancel, t: tProp }: ProductFormProps) {
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
          deliveryCharge: product.deliveryCharge ?? 0,
          status: product.status || 'active' as 'active' | 'inactive',
        };
      }
      return {
        title: '',
        currentPrice: 0,
        originalPrice: 0,
        discount: 0,
        category: 'clothes',
        description: '',
        freeDelivery: true,
        deliveryCharge: 0,
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
  
  const [productImages, setProductImages] = useState<ProductImageEntry[]>(() => {
    const urls = product?.images?.length
      ? product.images.filter(Boolean)
      : product?.image
        ? [product.image]
        : [];
    const metaImageColors = product?.productMeta?.imageColors;
    const initialColors = getInitialProductColors(product);
    return urls.map((url, i) => ({
      id: `existing-${i}-${url.slice(-8)}`,
      url,
      colors:
        metaImageColors?.[i]?.length
          ? [...metaImageColors[i]]
          : i === 0 && initialColors.length
            ? [...initialColors]
            : [],
    }));
  });
  const [imageColorErrors, setImageColorErrors] = useState<Record<string, string>>({});
  
  const [errors, setErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [clothesOptions, setClothesOptions] = useState<ClothesOptions>(() =>
    product?.clothesOptions
      ? {
          ...product.clothesOptions,
          sizes: [...(product.clothesOptions.sizes ?? [])],
          colors: [...(product.clothesOptions.colors ?? [])],
        }
      : {
          ...DEFAULT_CLOTHES_OPTIONS,
          sizes: [...DEFAULT_CLOTHES_OPTIONS.sizes],
          colors: [],
        }
  );

  const [shoesOptions, setShoesOptions] = useState<ShoesOptions>(() =>
    product?.shoesOptions
      ? {
          ...product.shoesOptions,
          sizes: [...(product.shoesOptions.sizes ?? [])],
          colors: [...(product.shoesOptions.colors ?? [])],
        }
      : {
          ...DEFAULT_SHOES_OPTIONS,
          sizes: [...DEFAULT_SHOES_OPTIONS.sizes],
          colors: [],
        }
  );

  const [productMeta, setProductMeta] = useState<ProductMeta>(() => ({
    ...EMPTY_PRODUCT_META,
    ...product?.productMeta,
  }));
  const [tagsInput, setTagsInput] = useState(() => tagsToInput(product?.productMeta?.tags));
  const t = tProp ?? adminProductT;

  const toggleClothesSize = (size: string) => {
    setClothesOptions((prev) => {
      const has = prev.sizes.includes(size);
      const sizes = has ? prev.sizes.filter((s) => s !== size) : [...prev.sizes, size];
      return { ...prev, sizes };
    });
  };

  const toggleShoeSize = (size: string) => {
    setShoesOptions((prev) => {
      const has = prev.sizes.includes(size);
      const sizes = has ? prev.sizes.filter((s) => s !== size) : [...prev.sizes, size];
      return { ...prev, sizes };
    });
  };

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

    if (!formData.description?.trim()) {
      const errorMsg = 'Description is required';
      newErrors.push(errorMsg);
      newFieldErrors.description = errorMsg;
    }

    if (!formData.freeDelivery && (!formData.deliveryCharge || formData.deliveryCharge <= 0)) {
      const errorMsg = t('admin.form.deliveryChargeRequired');
      newErrors.push(errorMsg);
      newFieldErrors.deliveryCharge = errorMsg;
    }

    if (
      categoryShowsGender(formData.category) ||
      isClothesCategory(formData.category) ||
      isShoesCategory(formData.category)
    ) {
      const catCheck = validateCategoryOptions(formData.category, clothesOptions, shoesOptions);
      if (!catCheck.valid) {
        newErrors.push(catCheck.error || 'Complete category options');
        newFieldErrors.clothesOptions = catCheck.error || 'Required';
      }
    }

    setErrors(newErrors);
    setFieldErrors(newFieldErrors);
    if (newErrors.length > 0) {
      showToast(newErrors[0], 'error');
    }
    return newErrors.length === 0;
  };

  const validateStep3 = () => {
    const newErrors: string[] = [];
    const newFieldErrors: Record<string, string> = {};
    const mainUrl = productImages[0]?.url?.trim() ?? '';
    if (!mainUrl || !isValidProductImageUrl(mainUrl)) {
      newErrors.push(t('admin.form.errors.mainImageRequired'));
    }
    const colorCheck = validateProductImageColors(productImages, formData.category);
    if (!colorCheck.valid) {
      if (colorCheck.error) newErrors.push(colorCheck.error);
      setImageColorErrors(colorCheck.imageErrors);
    } else {
      setImageColorErrors({});
    }
    setErrors(newErrors);
    setFieldErrors(newFieldErrors);
    if (newErrors.length > 0) {
      showToast(newErrors[0], 'error');
    }
    return newErrors.length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) setCurrentStep(2);
    else if (currentStep === 2) setCurrentStep(3);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleAddFeature = () => {
    const trimmed = newFeature.trim();
    if (!trimmed) return;
    setFeatures([...features, trimmed]);
    setNewFeature('');
  };

  const handleRemoveFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!validateStep3()) return;
    setIsSubmitting(true);
    try {
      const imageList = productImages
        .map((entry) => entry.url.trim())
        .filter((url) => url && isValidProductImageUrl(url))
        .slice(0, MAX_PRODUCT_IMAGES);
      const savedColors = aggregateImageColors(productImages);
      const savedImageColors = productImages
        .filter((entry) => {
          const url = entry.url.trim();
          return url && isValidProductImageUrl(url);
        })
        .slice(0, MAX_PRODUCT_IMAGES)
        .map((entry) => normalizeColorList(entry.colors));

      const productData: Partial<Product> = {
        currentPrice: formData.currentPrice,
        originalPrice: formData.originalPrice,
        discount: formData.discount,
        category: formData.category,
        freeDelivery: formData.freeDelivery,
        deliveryCharge: formData.freeDelivery ? 0 : Math.max(0, formData.deliveryCharge || 0),
        status: formData.status,
        image: imageList[0] ?? '',
        images: imageList,
        pricingTiers,
        productMeta: normalizeProductMetaForSave({
          ...productMeta,
          tags: parseTagsInput(tagsInput),
          availableColors: savedColors.length ? savedColors : undefined,
          imageColors: savedImageColors.some((list) => list.length > 0) ? savedImageColors : undefined,
        }),
      };
      if (isShoesCategory(formData.category)) {
        productData.shoesOptions = {
          ...shoesOptions,
          sizes: [...shoesOptions.sizes],
          colors: savedColors,
        };
        productData.clothesOptions = undefined;
      } else if (categoryShowsGender(formData.category) || isClothesCategory(formData.category)) {
        productData.clothesOptions = {
          ...clothesOptions,
          sizes: (clothesOptions.sizes ?? []).map((s) => s.toUpperCase()),
          colors: isClothesCategory(formData.category) ? savedColors : clothesOptions.colors ?? [],
        };
        productData.shoesOptions = undefined;
      } else {
        productData.clothesOptions = undefined;
        productData.shoesOptions = undefined;
      }

      productData.title = { en: formData.title.trim(), ar: formData.title.trim() };
      productData.description = {
        en: formData.description.trim(),
        ar: formData.description.trim(),
      };
      productData.features = { en: features, ar: features };
      if (product?.id) productData.id = product.id;
      const result = await onSave(productData);
      if (
        result &&
        typeof result === 'object' &&
        'success' in result &&
        result.success === false
      ) {
        showToast(result.error ?? 'Failed to save product', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { num: 1, label: t('admin.form.tab.basic') },
    { num: 2, label: t('admin.form.tab.features') },
    { num: 3, label: t('admin.form.tab.images') },
  ];

  return (
    <div className="product-form-root">
      <div className="product-form-back">
        <Link href="/khanadmin/products" className="product-form-back__link">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to products
        </Link>
      </div>
      <div className="product-form-card">
        <div className="product-form-header">
          <div className="product-form-header__text">
            <h1>{product ? t('admin.editProduct') : t('admin.addProduct')}</h1>
            <p>
              {t('admin.form.step')} {currentStep} {t('admin.form.of')} 3 —{' '}
              <span className="product-form-header__step-name">
                {steps.find((s) => s.num === currentStep)?.label}
              </span>
            </p>
          </div>
          <button type="button" onClick={onCancel} className="product-form-header__cancel">
            {t('admin.cancel')}
          </button>
        </div>
        <div className="product-form-steps">
          <div className="pf-stepper" role="navigation" aria-label="Form progress">
            {steps.map((step, idx) => (
              <Fragment key={step.num}>
                <div
                  className={`pf-stepper__step${currentStep === step.num ? ' pf-stepper__step--active' : ''}${currentStep > step.num ? ' pf-stepper__step--done' : ''}`}
                >
                  <div className="pf-stepper__circle" aria-hidden>
                    {currentStep > step.num ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    ) : (
                      step.num
                    )}
                  </div>
                  <span className="pf-stepper__label">{step.label}</span>
                </div>
                {idx < steps.length - 1 ? (
                  <div
                    className={`pf-stepper__line${currentStep > step.num ? ' pf-stepper__line--done' : ''}`}
                    aria-hidden
                  />
                ) : null}
              </Fragment>
            ))}
          </div>
        </div>
        {errors.length > 0 && (
          <div style={{ padding: '12px 24px', background: '#ffebee' }}>
            {errors.map((error, index) => (
              <p key={index} style={{ color: '#e53935', fontSize: 13, margin: '4px 0' }}>⚠️ {error}</p>
            ))}
          </div>
        )}
        <div className="product-form-content">

          {currentStep === 1 && (
            <div className="pf-step1">
              <div className="pf-category-first">
                <p className="pf-category-first__title">{t('admin.form.startWithCategory')}</p>
                <p className="pf-category-first__desc">{t('admin.form.startWithCategoryDesc')}</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="pf-form-block">
                    <label className="pf-form-label">{t('admin.form.category')}<span className="pf-label-required">*</span></label>
                    <select className="pf-form-select" value={formData.category} onChange={(e) => { setFormData({ ...formData, category: e.target.value }); if (fieldErrors.clothesOptions) setFieldErrors((p) => ({ ...p, clothesOptions: '' })); }}>
                      {categories.filter((c) => c.id !== 'all').map((cat) => (
                        <option key={cat.id} value={cat.id}>{t(`categories.${cat.id}`)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="pf-form-block">
                    <label className="pf-form-label">{t('admin.form.status')}</label>
                    <select className="pf-form-select" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}>
                      <option value="active">{t('admin.active')}</option>
                      <option value="inactive">{t('admin.inactive')}</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="pf-form-block">
                <label className="pf-form-label">{t('admin.form.title')}<span className="pf-label-required">*</span></label>
                <input type="text" className={`pf-form-input${fieldErrors.title ? ' pf-form-input--error' : ''}`} value={formData.title} onChange={(e) => { setFormData({ ...formData, title: e.target.value }); if (fieldErrors.title) setFieldErrors((p) => ({ ...p, title: '' })); }} placeholder="Enter product title..." />
                {fieldErrors.title ? <p className="pf-field-error">⚠️ {fieldErrors.title}</p> : null}
              </div>
              <ProductFormCategoryPanel
                category={formData.category}
                clothesOptions={clothesOptions}
                setClothesOptions={setClothesOptions}
                shoesOptions={shoesOptions}
                setShoesOptions={setShoesOptions}
                toggleClothesSize={toggleClothesSize}
                toggleShoeSize={toggleShoeSize}
                fieldError={fieldErrors.clothesOptions}
                onClearError={() =>
                  setFieldErrors((prev) => ({ ...prev, clothesOptions: '' }))
                }
                t={t}
              />

              {/* Prices Row */}
              <div className="pf-grid-3">
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
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      freeDelivery: !prev.freeDelivery,
                      deliveryCharge: !prev.freeDelivery ? 0 : prev.deliveryCharge,
                    }))
                  }
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

              {!formData.freeDelivery ? (
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#1a1a2e', marginBottom: '6px' }}>
                    {t('admin.form.deliveryCharge')}<span style={{ color: '#e53e3e', marginLeft: '4px' }}>*</span>
                  </label>
                  <p style={{ fontSize: '12px', color: '#666', margin: '0 0 8px' }}>{t('admin.form.deliveryChargeDesc')}</p>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={formData.deliveryCharge || ''}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      setFormData({ ...formData, deliveryCharge: Number.isFinite(value) ? value : 0 });
                      if (fieldErrors.deliveryCharge) {
                        setFieldErrors((prev) => {
                          const next = { ...prev };
                          delete next.deliveryCharge;
                          return next;
                        });
                      }
                    }}
                    placeholder="e.g. 200"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: fieldErrors.deliveryCharge ? '2px solid #e53e3e' : '2px solid #e8e8e8',
                      borderRadius: '10px',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#667eea';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = fieldErrors.deliveryCharge ? '#e53e3e' : '#e8e8e8';
                    }}
                  />
                  {fieldErrors.deliveryCharge ? (
                    <p style={{ fontSize: '12px', color: '#e53e3e', marginTop: '6px' }}>{fieldErrors.deliveryCharge}</p>
                  ) : null}
                </div>
              ) : null}

              <div className="pf-section-divider" />
              <ProductFormMetaFields meta={productMeta} onChange={setProductMeta} tagsInput={tagsInput} onTagsInputChange={setTagsInput} category={formData.category} t={t} fieldErrors={fieldErrors} />
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
            <ProductFormImages
              images={productImages}
              onChange={setProductImages}
              category={formData.category}
              productTitle={
                formData.title.trim() ||
                (product ? getProductTitle(product) : '') ||
                'product'
              }
              t={t}
              imageColorErrors={imageColorErrors}
              onClearImageColorError={(imageId) =>
                setImageColorErrors((prev) => {
                  if (!prev[imageId]) return prev;
                  const next = { ...prev };
                  delete next[imageId];
                  return next;
                })
              }
            />
          )}

        </div>

        {/* Footer Buttons */}
        <div className="product-form-footer">
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
              onClick={onCancel}
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
