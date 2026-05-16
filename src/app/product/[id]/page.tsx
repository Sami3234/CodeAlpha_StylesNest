'use client';

import { useState, use, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useLoginModal } from '@/context/LoginModalContext';
import { useSavedCustomerDetails } from '@/hooks/useSavedCustomerDetails';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WhatsAppFab from '@/components/WhatsAppFab';
import { cities, getCityName } from '@/data/products';
import { notFound } from 'next/navigation';
import { useProducts } from '@/context/ProductContext';
import { useOrders } from '@/context/OrderContext';
import { saveAbandonedOrder, removeAbandonedOrderOnSubmit, AbandonedOrder } from '@/utils/abandonedOrders';
import { getProductTitle, getProductDescription, getProductFeatures } from '@/utils/getProductText';
import { getSoldCount } from '@/utils/getSoldCount';
import { formatPrice } from '@/utils/formatPrice';
import ClothesStitchBadge, {
  ClothesGenderNearPrice,
  ClothesSizeSelector,
  ClothesSizesLine,
} from '@/components/ClothesImageBadges';
import ProductMetaDisplay from '@/components/ProductMetaDisplay';
import { clothesOrderProductNameWithSize, isClothesCategory, isClothesSizeRequired } from '@/lib/clothes-options';
import OrderPaymentMethods from '@/components/OrderPaymentMethods';
import {
  buildOrderWhatsAppMessage,
  buildWhatsAppLink,
  formatPaymentMethodForOrder,
  type PaymentMethod,
} from '@/lib/payment-methods';
import '@/components/product-page.css';

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export default function ProductPage({ params }: ProductPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const pathname = usePathname();
  const { status: authStatus } = useSession();
  const { openLogin } = useLoginModal();
  const { products, loading } = useProducts();
  const { addOrder, orders } = useOrders();
  // Handle both integer IDs (from initial data) and decimal IDs (from new products)
  const product = products.find(p => {
    // Convert both to numbers and compare
    const productId = Number(p.id);
    const searchId = Number(id);
    // Use strict equality for exact match (works for both integers and decimals)
    return productId === searchId;
  });
  const isArabic = false;
  
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  
  // Type for recent orders
  type RecentOrder = {
    id: string;
    product: {
      name: string;
      image: string;
      quantity: number;
      price: number;
    };
    date: string;
    time: string;
    total: number;
  };
  
  // Initialize with empty values to prevent hydration mismatch
  // Load from sessionStorage only on client side after mount using lazy initialization
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = sessionStorage.getItem('stylesnest_recent_orders');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Ignore errors
    }
    return [];
  });
  
  const [formData, setFormData] = useState(() => {
    if (typeof window === 'undefined') {
      return {
        fullName: '',
        mobile: '',
        quantity: '1',
        city: '',
        address: '',
        selectedSize: '',
      };
    }
    try {
      const saved = sessionStorage.getItem('stylesnest_customer_details');
      if (saved) {
        const savedDetails = JSON.parse(saved);
        return {
          fullName: '',
          mobile: '',
          quantity: '1',
          city: '',
          address: '',
          ...savedDetails
        };
      }
    } catch {
      // Ignore errors
    }
    return {
      fullName: '',
      mobile: '',
      quantity: '1',
      city: '',
      address: '',
      selectedSize: '',
    };
  });
  const [orderSubmitted, setOrderSubmitted] = useState(false);
  const [orderRestored, setOrderRestored] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentId, setSelectedPaymentId] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [storeWhatsApp, setStoreWhatsApp] = useState('');
  const [whatsappConfirmUrl, setWhatsappConfirmUrl] = useState('');
  const [lastOrderId, setLastOrderId] = useState('');
  useSavedCustomerDetails(setFormData, authStatus === 'authenticated');

  const hasSubmittedRef = useRef(false); // Track if form was submitted
  const formDataRef = useRef(formData); // Keep ref for cleanup handlers
  const savedDetailsRef = useRef<{ fullName?: string; mobile?: string; city?: string; address?: string; quantity?: string } | null>(null);
  
  // Restore abandoned order when product page loads
  useEffect(() => {
    if (!product || typeof window === 'undefined') return;
    
    const restoreAbandonedOrder = async () => {
      try {
        // Get customer details from sessionStorage first
        let sessionData: { fullName?: string; mobile?: string } | null = null;
        try {
          const saved = sessionStorage.getItem('stylesnest_customer_details');
          if (saved) {
            sessionData = JSON.parse(saved);
          }
        } catch {
          // Ignore errors
        }
        
        // If we have name and phone in sessionStorage, check for abandoned order
        if (sessionData?.fullName && sessionData?.mobile) {
          const response = await fetch(`/api/abandoned?phone=${encodeURIComponent(sessionData.mobile)}&name=${encodeURIComponent(sessionData.fullName)}`, {
            cache: 'no-store'
          });
          
          if (response.ok) {
            const data = await response.json();
            const abandonedOrders = data.abandonedOrders || [];
            
            // Find order for current product
            const matchingOrder = abandonedOrders.find((order: AbandonedOrder) => 
              order.product_id === product.id.toString()
            );
            
            if (matchingOrder) {
              // Restore form data from abandoned order
              setFormData((prev: typeof formData) => ({
                fullName: matchingOrder.name || prev.fullName,
                mobile: matchingOrder.phone || prev.mobile,
                city: matchingOrder.city || prev.city,
                address: matchingOrder.address || prev.address,
                quantity: matchingOrder.quantity || prev.quantity
              }));
              
              // Update sessionStorage
              try {
                sessionStorage.setItem('stylesnest_customer_details', JSON.stringify({
                  fullName: matchingOrder.name,
                  mobile: matchingOrder.phone,
                  city: matchingOrder.city,
                  address: matchingOrder.address,
                  quantity: matchingOrder.quantity || '1'
                }));
              } catch {
                // Ignore errors
              }
              
              setOrderRestored(true);
              
              // Hide notification after 5 seconds
              setTimeout(() => setOrderRestored(false), 5000);
            }
          }
        }
      } catch (error) {
        console.error('Error restoring abandoned order:', error);
      }
    };
    
    restoreAbandonedOrder();
  }, [product]);
  
  // Update savedDetailsRef after formData is loaded from sessionStorage
  useEffect(() => {
    if (formData.fullName || formData.mobile) {
      savedDetailsRef.current = {
        fullName: formData.fullName,
        mobile: formData.mobile,
        city: formData.city,
        address: formData.address
      };
    }
  }, [formData]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/payment-methods', { cache: 'no-store' });
        const data = await res.json();
        if (cancelled || !data.success) return;
        const methods = (data.methods ?? []) as PaymentMethod[];
        setPaymentMethods(methods);
        setStoreWhatsApp(data.storeWhatsApp ?? '');
        if (methods.length) {
          setSelectedPaymentId(methods[0].id);
        }
      } catch {
        // Payment methods are optional on the form
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Get all available images (before early returns)
  // Filter out empty strings and undefined values
  const allImages = product ? (
    product.images && Array.isArray(product.images) && product.images.length > 0
      ? product.images.filter(img => img && img.trim() !== '')
      : (product.image && product.image.trim() !== '' ? [product.image] : [])
  ) : [];
  const totalImages = allImages.length;
  
  // Ensure selectedImage is within valid range (derived state)
  const selectedImage = totalImages > 0 && selectedImageIndex < totalImages 
    ? selectedImageIndex 
    : 0;

  // Update formDataRef when formData changes (MUST be before early returns)
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  // Auto-slide images every 3 seconds (MUST be before early returns)
  useEffect(() => {
    if (!product || totalImages <= 1) return;

    const interval = setInterval(() => {
      setSelectedImageIndex(prev => (prev + 1) % totalImages);
    }, 3000);

    return () => clearInterval(interval);
  }, [totalImages, product]);

  // Function to save abandoned order
  const handleSaveAbandonedOrder = useCallback(async () => {
    if (!product) return;
    // Don't save if order was already submitted - check both ref and state
    if (hasSubmittedRef.current) {
      console.log('⏭️ Skipping save: Order already submitted (ref check)');
      return;
    }
    if (!formDataRef.current.fullName || !formDataRef.current.mobile) return;
    
    const saved = savedDetailsRef.current;
    let shouldSave = false;
    
    if (saved) {
      const hasChanges = 
        formDataRef.current.fullName !== saved.fullName ||
        formDataRef.current.mobile !== saved.mobile ||
        formDataRef.current.city !== saved.city ||
        formDataRef.current.address !== saved.address ||
        formDataRef.current.quantity !== saved.quantity;
      shouldSave = hasChanges;
    } else {
      shouldSave = true;
    }
    
    if (shouldSave) {
      // Final check before saving - don't save if order was submitted
      if (hasSubmittedRef.current) {
        console.log('⏭️ Skipping save: Order was submitted before save');
        return;
      }
      
      console.log('💾 Saving abandoned order:', {
        name: formDataRef.current.fullName,
        phone: formDataRef.current.mobile,
        city: formDataRef.current.city,
        address: formDataRef.current.address,
        quantity: formDataRef.current.quantity,
        product_id: product.id.toString(),
      });
      
      const saved = await saveAbandonedOrder({
        name: formDataRef.current.fullName,
        phone: formDataRef.current.mobile,
        city: formDataRef.current.city,
        address: formDataRef.current.address,
        quantity: formDataRef.current.quantity,
        product_id: product.id.toString(),
      });
      
      if (saved) {
        console.log('✅ Abandoned order saved successfully');
      } else {
        console.log('❌ Failed to save abandoned order');
      }
    }
  }, [product]);

  // Auto-save abandoned order periodically while user is filling form
  useEffect(() => {
    if (!product) return;
    // Don't auto-save if order was submitted
    if (hasSubmittedRef.current) return;
    
    // Auto-save every 30 seconds if form has data
    const autoSaveInterval = setInterval(() => {
      // Double check before saving - don't save if order was submitted
      if (!hasSubmittedRef.current) {
        if (formDataRef.current.fullName && formDataRef.current.mobile) {
          handleSaveAbandonedOrder();
        }
      }
    }, 30000); // Save every 30 seconds
    
    return () => clearInterval(autoSaveInterval);
  }, [product, handleSaveAbandonedOrder]);

  // Save abandoned order when user leaves page (MUST be before early returns)
  useEffect(() => {
    if (!product) return;
    
    const handleBeforeUnload = () => {
      // Don't save if order was submitted
      if (!hasSubmittedRef.current) {
        handleSaveAbandonedOrder();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Don't save if order was submitted
        if (!hasSubmittedRef.current) {
          handleSaveAbandonedOrder();
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // Don't save on cleanup if order was submitted
      if (!hasSubmittedRef.current) {
        handleSaveAbandonedOrder();
      }
    };
  }, [product, handleSaveAbandonedOrder]);

  // Show loading state while products are being fetched
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(180deg, #f5f7fa 0%, #eef2f6 50%, #f5f7fa 100%)' }}>
        <Header />
        <main className="flex-1 flex items-center justify-center" style={{ paddingTop: 'var(--site-header-h, 90px)' }}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            style={{ textAlign: 'center', padding: '40px' }}
          >
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{
                width: '60px',
                height: '60px',
                border: '4px solid rgba(255, 107, 53, 0.2)',
                borderTop: '4px solid #ff6b35',
                borderRadius: '50%',
                margin: '0 auto 20px'
              }} 
            />
            <p style={{ color: '#4a5568', fontSize: '16px', fontWeight: '500' }}>Loading product...</p>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  // After loading, if product not found, show 404
  if (!product) {
    notFound();
  }

  // Handle manual image selection
  const handleImageSelect = (index: number) => {
    if (index >= 0 && index < totalImages) {
      setSelectedImageIndex(index);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData((prev: typeof formData) => {
      const updated = { ...prev, [name]: value };
      formDataRef.current = updated; // Update ref
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (authStatus !== 'authenticated') {
      const returnTo = pathname || `/product/${id}`;
      openLogin(returnTo);
      return;
    }
    
    // Validate form
    if (!formData.fullName || !formData.mobile || !formData.city || !formData.address) {
      alert('Please fill all required fields');
      return;
    }

    const selectedPayment = paymentMethods.find((m) => m.id === selectedPaymentId);
    if (paymentMethods.length && !selectedPayment) {
      setPaymentError('Please select a payment method');
      return;
    }
    setPaymentError('');

    const isClothes = isClothesCategory(product.category) && product.clothesOptions;
    const clothesOpts = product.clothesOptions;
    const selectedSize = formData.selectedSize?.trim() ?? '';

    if (isClothes && isClothesSizeRequired(clothesOpts?.stitch) && !selectedSize) {
      alert('Please select a size (required for stitched items)');
      return;
    }
    if (
      isClothes &&
      clothesOpts &&
      selectedSize &&
      !clothesOpts.sizes.includes(selectedSize)
    ) {
      alert('Please select a valid size');
      return;
    }

    const orderProductName = isClothes
      ? clothesOrderProductNameWithSize(
          getProductTitle(product),
          clothesOpts,
          selectedSize || undefined
        )
      : getProductTitle(product);

    // Mark as submitted to prevent saving as abandoned
    hasSubmittedRef.current = true;

    const quantity = parseInt(formData.quantity);
    
    // Calculate price based on pricing tiers or default
    const totalPrice = product.pricingTiers && product.pricingTiers.length > 0
      ? (product.pricingTiers.find(t => t.quantity === quantity)?.price || product.currentPrice * quantity)
      : product.currentPrice * quantity;

    // Remove abandoned order if exists (user successfully submitted)
    await removeAbandonedOrderOnSubmit(formData.mobile, formData.fullName);

    // Check if customer details were edited (new customer)
    const saved = savedDetailsRef.current;
    const isNewCustomer = saved ? (
      formData.fullName !== saved.fullName ||
      formData.mobile !== saved.mobile ||
      formData.city !== saved.city ||
      formData.address !== saved.address
    ) : false;

    // If details changed, clear old orders (new customer)
    if (isNewCustomer) {
      try {
        sessionStorage.removeItem('stylesnest_recent_orders');
        setRecentOrders([]);
      } catch (error) {
        console.error('Error clearing old orders:', error);
      }
    }

    // Save customer details to sessionStorage (clears on page refresh/close)
    try {
      sessionStorage.setItem('stylesnest_customer_details', JSON.stringify({
        fullName: formData.fullName,
        mobile: formData.mobile,
        city: formData.city,
        address: formData.address,
        quantity: '1', // Always reset quantity
      }));
      // Update saved ref for next comparison
      savedDetailsRef.current = {
        fullName: formData.fullName,
        mobile: formData.mobile,
        city: formData.city,
        address: formData.address,
        quantity: '1',
      };
    } catch (error) {
      console.error('Error saving customer details:', error);
    }

    // Create order object
    const newOrder = {
      id: `ORD-${Date.now()}`,
      customer: formData.fullName,
      phone: formData.mobile,
      city: formData.city,
      address: formData.address,
      product: {
        name: orderProductName,
        image: product.image,
        quantity: quantity,
        price: product.currentPrice,
      },
      total: totalPrice,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const paymentLabel = selectedPayment
      ? formatPaymentMethodForOrder(selectedPayment)
      : 'Cash on Delivery';

    // Add order to context / API
    const placedOrder = await addOrder({
      customer: formData.fullName,
      phone: formData.mobile,
      city: formData.city,
      address: formData.address,
      products: [{
        name: orderProductName,
        quantity: quantity,
        price: product.currentPrice,
        paymentMethod: paymentLabel,
      }],
      total: totalPrice,
      status: 'pending',
    });

    if (!placedOrder) {
      alert('Could not place order. Please try again or contact support.');
      return;
    }

    setLastOrderId(placedOrder.id);
    const waPhone = storeWhatsApp.replace(/\D/g, '') || formData.mobile.replace(/\D/g, '');
    const waMessage = buildOrderWhatsAppMessage({
      orderId: placedOrder.id,
      customerName: formData.fullName,
      customerWhatsApp: formData.mobile,
      productName: orderProductName,
      quantity,
      total: totalPrice,
      city: formData.city,
      address: formData.address,
      paymentLabel,
      size: selectedSize || undefined,
    });
    setWhatsappConfirmUrl(buildWhatsAppLink(waPhone, waMessage));

    // Save to recent orders (keep last 5 orders) in sessionStorage
    try {
      const existingOrders = isNewCustomer ? [] : recentOrders;
      const updatedOrders = [newOrder, ...existingOrders].slice(0, 5);
      sessionStorage.setItem('stylesnest_recent_orders', JSON.stringify(updatedOrders));
      setRecentOrders(updatedOrders);
    } catch (error) {
      console.error('Error saving recent orders:', error);
    }

    // Show success message and scroll to top
    setOrderSubmitted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Reset only quantity, keep customer details for next order        
    setFormData((prev: typeof formData) => ({
      ...prev,
      quantity: '1'
    }));
    formDataRef.current = {
      ...formDataRef.current,
      quantity: '1'
    };
  };

  // Get product title, description, and features (English only)
  const productTitle = getProductTitle(product);
  const productDescription = getProductDescription(product);
  const productFeatures = getProductFeatures(product);

  // Get recommended products (same category, different product)
  const getRecommendedProducts = () => {
    return products
      .filter(p => p.category === product.category && p.id !== product.id && p.status !== 'inactive')
      .slice(0, 4);
  };
  
  // Calculate actual sold count from orders
  const actualSoldCount = getSoldCount(product, orders);

  // Generate quantity options from pricing tiers or default
  // Debug: Log pricing tiers
  console.log('Product ID:', product.id);
  console.log('Product pricingTiers:', product.pricingTiers);
  console.log('Tiers length:', product.pricingTiers?.length || 0);
  
  const quantityOptions = product.pricingTiers && product.pricingTiers.length > 0
    ? product.pricingTiers.map(tier => ({
        value: tier.quantity.toString(),
        label: `${tier.quantity} ${tier.quantity === 1 ? 'Piece' : 'Pieces'} - ${formatPrice(tier.price)} PKR${tier.discount ? ` (${tier.discount}% OFF)` : ''}`
      }))
    : [
        { value: '1', label: `1 Piece - ${formatPrice(product.currentPrice)} PKR` },
        { value: '2', label: `2 Pieces - ${formatPrice(product.currentPrice * 2)} PKR` },
        { value: '3', label: `3 Pieces - ${formatPrice(product.currentPrice * 3)} PKR` },
      ];
  
  console.log('Generated quantityOptions:', quantityOptions);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(180deg, #f5f7fa 0%, #eef2f6 50%, #f5f7fa 100%)' }}>
      <Header />
      
      <main className="flex-1 min-w-0" style={{ paddingTop: 'calc(var(--site-header-h, 90px) + 20px)', paddingBottom: '50px' }}>
        <div className="product-page-main">
          {/* Order Restored Notification */}
          {orderRestored && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              style={{
                background: 'linear-gradient(135deg, #38a169 0%, #48bb78 100%)',
                color: '#fff',
                padding: '16px 20px',
                borderRadius: '12px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: '0px 4px 12px rgba(56, 161, 105, 0.3)'
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span style={{ fontSize: '15px', fontWeight: '600' }}>
                Your previous order details have been restored!
              </span>
            </motion.div>
          )}

          {/* Product Title */}
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ 
              fontSize: isArabic ? '28px' : '32px', 
              fontWeight: '700', 
              background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ff8c42 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '8px',
              lineHeight: '1.3'
            }}
          >
            {productTitle}
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="product-top-badges"
          >
            {product.freeDelivery ? (
              <span style={{ 
                display: 'inline-block',
                background: 'linear-gradient(135deg, #38a169 0%, #48bb78 100%)',
                color: '#fff',
                fontSize: '14px',
                fontWeight: '600',
                padding: '6px 16px',
                borderRadius: '20px',
                boxShadow: '0px 4px 12px rgba(56, 161, 105, 0.3)'
              }}>
                ✓ Free Delivery
              </span>
            ) : null}
            {product.productMeta?.stockQuantity != null ? (
              <span
                className={`product-stock-badge${
                  product.productMeta.stockQuantity <= 0
                    ? ' product-stock-badge--out'
                    : product.productMeta.stockQuantity <= 5
                      ? ' product-stock-badge--low'
                      : ''
                }`}
              >
                {product.productMeta.stockQuantity <= 0
                  ? 'Out of stock'
                  : `Total stock: ${product.productMeta.stockQuantity}`}
              </span>
            ) : null}
          </motion.div>
          {/* Order Confirmation Success */}
          {orderSubmitted && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              style={{ marginBottom: '40px' }}
            >
              {/* Success Card - Modern */}
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6 }}
                style={{
                  background: 'linear-gradient(145deg, #ffffff 0%, #f7fafc 100%)',
                  borderRadius: '24px',
                  padding: '40px 30px',
                  textAlign: 'center',
                  boxShadow: '0px 20px 60px rgba(102, 126, 234, 0.15), 0px 10px 25px rgba(79, 172, 254, 0.1)',
                  marginBottom: '30px',
                  border: '2px solid rgba(102, 126, 234, 0.1)',
                }}>
                {/* Success Icon - Modern */}
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, type: 'spring', stiffness: 200 }}
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #38a169 0%, #48bb78 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                    boxShadow: '0px 10px 30px rgba(56, 161, 105, 0.4)',
                  }}
                >
                  <motion.svg 
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </motion.svg>
                </motion.div>

                {/* Success Message - Modern */}
                <motion.h2 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  style={{
                    fontSize: isArabic ? '28px' : '32px',
                    fontWeight: '700',
                    background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ff8c42 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    marginBottom: '12px',
                  }}
                >
                  {isArabic ? 'تم إرسال طلبك بنجاح!' : 'Order Placed Successfully!'}
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  style={{
                    fontSize: isArabic ? '16px' : '16px',
                    color: '#4a5568',
                    marginBottom: '24px',
                    lineHeight: '1.6',
                    fontWeight: '500',
                  }}
                >
                  {isArabic 
                    ? 'شكراً لك! سنتواصل معك قريباً للتوصيل خلال 2-4 أيام عمل.'
                    : 'Thank you! We will contact you for delivery within 2-4 working days.'}
                </motion.p>

                <div className="order-success-whatsapp">
                  <h3>Confirm on WhatsApp</h3>
                  <p>
                    Order submit karne ke baad bara-e-meherbani WhatsApp par confirm kar dein taake hum
                    aap ka order jaldi process kar saken.
                    {lastOrderId ? ` (Order ID: ${lastOrderId})` : ''}
                  </p>
                  {whatsappConfirmUrl ? (
                    <a href={whatsappConfirmUrl} target="_blank" rel="noopener noreferrer">
                      WhatsApp par confirm karein
                    </a>
                  ) : (
                    <p style={{ fontSize: 13, color: '#718096', margin: 0 }}>
                      Admin panel se store WhatsApp number set karein, phir yahan direct link show hogi.
                    </p>
                  )}
                </div>

                {/* Order Summary - Modern */}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  style={{
                    background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.05) 0%, rgba(247, 147, 30, 0.05) 100%)',
                    borderRadius: '16px',
                    padding: '20px 24px',
                    marginTop: '20px',
                    textAlign: 'left',
                    border: '1px solid rgba(255, 107, 53, 0.1)',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#666' }}>{isArabic ? 'المنتج:' : 'Product:'}</span>
                      <span style={{ fontWeight: '500', color: '#1a1a2e', fontSize: '12px', maxWidth: '60%', textAlign: 'right' }}>
                        {productTitle.length > 40 ? productTitle.substring(0, 40) + '...' : productTitle}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#666' }}>{isArabic ? 'الكمية:' : 'Qty:'}</span>
                      <span style={{ fontWeight: '500', color: '#1a1a2e' }}>{formData.quantity || '1'}</span>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      paddingTop: '12px',
                      borderTop: '2px solid rgba(255, 107, 53, 0.2)',
                      marginTop: '8px',
                    }}>
                      <span style={{ fontWeight: '700', fontSize: '16px', color: '#2d3748' }}>{isArabic ? 'الإجمالي:' : 'Total:'}</span>
                      <span style={{ 
                        fontSize: '24px', 
                        fontWeight: '700', 
                        background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                      }}>
                        {formatPrice(product.currentPrice * parseInt(formData.quantity || '1'))} PKR
                      </span>
                    </div>
                  </div>
                </motion.div>

                {/* Action Buttons - Modern */}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                  style={{ 
                    display: 'flex', 
                    gap: '15px', 
                    marginTop: '24px',
                    flexWrap: 'wrap',
                    justifyContent: 'center' 
                  }}
                >
                  <motion.button
                    onClick={async () => {
                      // Only save if order wasn't submitted
                      if (!hasSubmittedRef.current) {
                        await handleSaveAbandonedOrder();
                      }
                      router.push('/');
                    }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      flex: '1',
                      minWidth: '160px',
                      padding: '14px 28px',
                      borderRadius: '16px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ff8c42 100%)',
                      color: '#fff',
                      fontSize: '15px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0px 8px 25px rgba(255, 107, 53, 0.4)',
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                    {isArabic ? 'العودة للرئيسية' : 'Back to Home'}
                  </motion.button>
                  <motion.button
                    onClick={async () => {
                      // Only save if order wasn't submitted
                      if (!hasSubmittedRef.current) {
                        await handleSaveAbandonedOrder();
                      }
                      router.push('/shop');
                    }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      flex: '1',
                      minWidth: '160px',
                      padding: '14px 28px',
                      borderRadius: '16px',
                      border: '2px solid #ff6b35',
                      background: 'transparent',
                      color: '#ff6b35',
                      fontSize: '15px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                    </svg>
                    {isArabic ? 'تسوق منتجات أخرى' : 'Shop More Products'}
                  </motion.button>
                </motion.div>
              </motion.div>

              {/* Recent Orders Section - Only show if 2 or more orders (not first order) */}
              {recentOrders.length > 1 && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.7 }}
                  style={{ marginBottom: '40px' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{
                      fontSize: isArabic ? '26px' : '24px',
                      fontWeight: '700',
                      background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ff8c42 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      margin: 0,
                    }}>
                      {isArabic ? 'طلباتك الأخيرة' : 'Your Recent Orders'}
                    </h3>
                    <motion.button
                      onClick={() => {
                        if (window.confirm(isArabic ? 'هل تريد حذف سجل الطلبات؟' : 'Clear order history?')) {
                          sessionStorage.removeItem('stylesnest_recent_orders');
                          sessionStorage.removeItem('stylesnest_customer_details');
                          setRecentOrders([]);
                        }
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '12px',
                        border: '2px solid rgba(229, 62, 62, 0.3)',
                        background: 'transparent',
                        color: '#e53e3e',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                      }}
                    >
                      {isArabic ? 'حذف السجل' : 'Clear History'}
                    </motion.button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {recentOrders.slice(0, 3).map((order: RecentOrder, index: number) => (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                        whileHover={{ x: 5 }}
                        style={{
                          background: index === 0 
                            ? 'linear-gradient(135deg, rgba(56, 161, 105, 0.1) 0%, rgba(72, 187, 120, 0.1) 100%)'
                            : 'linear-gradient(145deg, #ffffff 0%, #f7fafc 100%)',
                          border: index === 0 ? '2px solid #38a169' : '2px solid rgba(102, 126, 234, 0.1)',
                          borderRadius: '16px',
                          padding: 'clamp(12px, 3vw, 18px) clamp(14px, 4vw, 20px)',
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '16px',
                          alignItems: 'center',
                          boxShadow: index === 0 
                            ? '0px 8px 25px rgba(56, 161, 105, 0.2)' 
                            : '0px 4px 15px rgba(102, 126, 234, 0.1)',
                        }}
                      >
                        {/* Order Number Badge */}
                        <div style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '50%',
                          background: index === 0 
                            ? 'linear-gradient(135deg, #38a169 0%, #48bb78 100%)'
                            : 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                          color: index === 0 ? '#fff' : '#667eea',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '16px',
                          fontWeight: '700',
                          flexShrink: 0,
                          boxShadow: index === 0 
                            ? '0px 4px 12px rgba(56, 161, 105, 0.3)'
                            : 'none'
                        }}>
                          {index + 1}
                        </div>

                        {/* Product Image */}
                        <div style={{
                          width: '60px',
                          height: '60px',
                          borderRadius: '12px',
                          overflow: 'hidden',
                          position: 'relative',
                          flexShrink: 0,
                          boxShadow: '0px 4px 12px rgba(0,0,0,0.1)'
                        }}>
                          <Image
                            src={order.product.image}
                            alt={order.product.name}
                            fill
                            className="object-cover"
                            sizes="60px"
                          />
                        </div>

                        {/* Order Details */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{
                            fontSize: '15px',
                            fontWeight: '600',
                            color: '#2d3748',
                            marginBottom: '6px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>
                            {order.product.name}
                          </p>
                          <p style={{ fontSize: '13px', color: '#4a5568', fontWeight: '500' }}>
                            {isArabic ? 'الكمية:' : 'Qty:'} {order.product.quantity} • {formatPrice(order.product.price)} PKR
                          </p>
                        </div>

                        {/* Total */}
                        <div style={{
                          textAlign: 'right',
                          flexShrink: 0,
                        }}>
                          <p style={{ 
                            fontSize: '20px', 
                            fontWeight: '700', 
                            background: index === 0
                              ? 'linear-gradient(135deg, #38a169 0%, #48bb78 100%)'
                              : 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                          }}>
                            {formatPrice(order.total)} PKR
                          </p>
                          <p style={{ fontSize: '12px', color: '#718096', fontWeight: '500', marginTop: '4px' }}>
                            {order.time}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Recommended Products Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
              >
                <motion.h3 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.9 }}
                  style={{
                    fontSize: isArabic ? '26px' : '28px',
                    fontWeight: '700',
                    background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ff8c42 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    marginBottom: '24px',
                    textAlign: 'center',
                  }}
                >
                  {isArabic ? 'منتجات قد تعجبك' : 'You May Also Like'}
                </motion.h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4" style={{ gap: '20px' }}>
                  {getRecommendedProducts().map((recommendedProduct, index) => {
                    const recTitle = getProductTitle(recommendedProduct);
                    return (
                      <motion.a
                        key={recommendedProduct.id}
                        href={`/product/${recommendedProduct.id}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 1 + index * 0.1 }}
                        whileHover={{ y: -5, scale: 1.02 }}
                        style={{
                          background: 'linear-gradient(145deg, #ffffff 0%, #f7fafc 100%)',
                          borderRadius: '20px',
                          padding: '16px',
                          boxShadow: '0px 12px 35px rgba(102, 126, 234, 0.15), 0px 5px 15px rgba(79, 172, 254, 0.1)',
                          textDecoration: 'none',
                          border: '2px solid rgba(102, 126, 234, 0.1)',
                          transition: 'all 0.3s ease',
                        }}
                      >
                        {/* Product Image */}
                        <div style={{
                          position: 'relative',
                          paddingBottom: '100%',
                          borderRadius: '16px',
                          overflow: 'hidden',
                          marginBottom: '12px',
                          background: 'linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%)',
                        }}>
                          <span style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            zIndex: 10,
                            background: 'linear-gradient(135deg, #e53e3e 0%, #fc8181 100%)',
                            color: '#fff',
                            fontSize: '12px',
                            fontWeight: '700',
                            padding: '6px 10px',
                            borderRadius: '10px',
                            boxShadow: '0px 4px 12px rgba(229, 62, 62, 0.4)',
                            letterSpacing: '0.3px'
                          }}>
                            {recommendedProduct.discount}% OFF
                          </span>
                          <Image
                            src={recommendedProduct.image}
                            alt={recTitle}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 50vw, 25vw"
                          />
                          {recommendedProduct.freeDelivery && (
                            <span style={{
                              position: 'absolute',
                              bottom: '10px',
                              left: '10px',
                              zIndex: 10,
                              background: 'linear-gradient(135deg, #38a169 0%, #48bb78 100%)',
                              color: '#fff',
                              fontSize: '10px',
                              fontWeight: '600',
                              padding: '4px 10px',
                              borderRadius: '20px',
                              boxShadow: '0px 4px 12px rgba(56, 161, 105, 0.4)',
                            }}>
                              ✓ Free Delivery
                            </span>
                          )}
                        </div>

                        {/* Product Info */}
                        <div>
                          <h4 style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#2d3748',
                            marginBottom: '10px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            minHeight: '40px',
                            lineHeight: '1.4'
                          }}>
                            {recTitle}
                          </h4>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{
                              background: 'linear-gradient(135deg, #e53e3e 0%, #fc8181 100%)',
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                              backgroundClip: 'text',
                              fontSize: '18px',
                              fontWeight: '700',
                            }}>
                              {formatPrice(recommendedProduct.currentPrice)} PKR
                            </span>
                            <span style={{
                              color: '#a0aec0',
                              fontSize: '13px',
                              textDecoration: 'line-through',
                              fontWeight: '500'
                            }}>
                              {formatPrice(recommendedProduct.originalPrice)} PKR
                            </span>
                          </div>
                        </div>
                      </motion.a>
                    );
                  })}
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Main Content Grid */}
          {!orderSubmitted && (
          <div className="product-page-grid">
            
            {/* Left Column - Product Images & Info */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              style={{
                background: 'linear-gradient(145deg, #ffffff 0%, #f7fafc 100%)',
                borderRadius: '24px',
                padding: 'clamp(14px, 4vw, 24px)',
                boxShadow: '0px 20px 60px rgba(102, 126, 234, 0.15), 0px 10px 25px rgba(79, 172, 254, 0.1)',
                border: '2px solid rgba(102, 126, 234, 0.1)',
              }}
            >
              {/* Main Image */}
              <div 
                className="relative"
                style={{ 
                  borderRadius: '20px', 
                  overflow: 'hidden',
                  position: 'relative',
                  width: '100%',
                  paddingBottom: '100%', // Creates 1:1 aspect ratio
                  background: 'linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%)',
                  boxShadow: 'inset 0px 2px 8px rgba(0,0,0,0.05)'
                }}
              >
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    zIndex: 10,
                    background: 'linear-gradient(135deg, #e53e3e 0%, #fc8181 100%)',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: '700',
                    padding: '8px 14px',
                    borderRadius: '12px',
                    boxShadow: '0px 6px 20px rgba(229, 62, 62, 0.4)',
                    letterSpacing: '0.5px'
                  }}
                >
                  {product.discount}% OFF
                </motion.span>
                <motion.div
                  key={selectedImage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                  style={{ 
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%'
                  }}
                >
                  {allImages.length > 0 && allImages[selectedImage] && !imageErrors.has(selectedImage) ? (
                    <Image
                      src={allImages[selectedImage]}
                      alt={productTitle}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      unoptimized
                      onError={() => setImageErrors(prev => new Set(prev).add(selectedImage))}
                    />
                  ) : (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#f5f5f5',
                      color: '#999',
                      fontSize: '16px'
                    }}>
                      Image not available
                    </div>
                  )}
                </motion.div>

                {/* Navigation Arrows - only show if multiple images */}
                {totalImages > 1 && (
                  <>
                    <motion.button
                      onClick={() => handleImageSelect((selectedImage - 1 + totalImages) % totalImages)}
                      whileHover={{ scale: 1.1, x: -2 }}
                      whileTap={{ scale: 0.9 }}
                      style={{
                        position: 'absolute',
                        left: '16px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 10,
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(247,250,252,0.95) 100%)',
                        border: '2px solid rgba(102, 126, 234, 0.2)',
                        borderRadius: '50%',
                        width: '44px',
                        height: '44px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0px 6px 20px rgba(0,0,0,0.15)',
                        backdropFilter: 'blur(10px)'
                      }}
                    >
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="2.5">
                        <polyline points="15 18 9 12 15 6" />
                      </svg>
                    </motion.button>
                    <motion.button
                      onClick={() => handleImageSelect((selectedImage + 1) % totalImages)}
                      whileHover={{ scale: 1.1, x: 2 }}
                      whileTap={{ scale: 0.9 }}
                      style={{
                        position: 'absolute',
                        right: '16px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 10,
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(247,250,252,0.95) 100%)',
                        border: '2px solid rgba(102, 126, 234, 0.2)',
                        borderRadius: '50%',
                        width: '44px',
                        height: '44px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0px 6px 20px rgba(0,0,0,0.15)',
                        backdropFilter: 'blur(10px)'
                      }}
                    >
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="2.5">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </motion.button>
                  </>
                )}

                <ClothesStitchBadge product={product} animated />

                {product.freeDelivery && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    style={{
                      position: 'absolute',
                      bottom: '16px',
                      left: '16px',
                      zIndex: 10,
                      background: 'linear-gradient(135deg, #38a169 0%, #48bb78 100%)',
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: '600',
                      padding: '6px 14px',
                      borderRadius: '20px',
                      boxShadow: '0px 4px 12px rgba(56, 161, 105, 0.4)',
                      letterSpacing: '0.3px'
                    }}
                  >
                    ✓ Free Delivery
                  </motion.span>
                )}
              </div>

              {/* Thumbnail Gallery */}
              <div className="flex justify-center" style={{ gap: '10px', marginTop: '20px' }}>
                {allImages.map((img, index) => (
                  <motion.button
                    key={index}
                    onClick={() => handleImageSelect(index)}
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      width: '70px',
                      height: '70px',
                      borderRadius: '12px',
                      border: selectedImage === index 
                        ? '3px solid #ff6b35' 
                        : '2px solid rgba(102, 126, 234, 0.2)',
                      overflow: 'hidden',
                      position: 'relative',
                      transition: 'all 0.3s ease',
                      background: selectedImage === index 
                        ? 'linear-gradient(135deg, rgba(255, 107, 53, 0.1) 0%, rgba(247, 147, 30, 0.1) 100%)'
                        : 'transparent',
                      boxShadow: selectedImage === index 
                        ? '0px 6px 20px rgba(255, 107, 53, 0.3)'
                        : '0px 2px 8px rgba(0,0,0,0.1)'
                    }}
                  >
                    {!imageErrors.has(index) ? (
                      <Image
                        src={img}
                        alt={`${productTitle} ${index + 1}`}
                        fill
                        className="object-cover"
                        unoptimized
                        onError={() => setImageErrors(prev => new Set(prev).add(index))}
                      />
                    ) : (
                      <div style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#f5f5f5',
                        color: '#999',
                        fontSize: '10px'
                      }}>
                        N/A
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>

              {/* Slider Indicators */}
              {totalImages > 1 && (
                <div className="flex justify-center" style={{ gap: '8px', marginTop: '12px' }}>
                  {allImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => handleImageSelect(index)}
                      style={{
                        width: selectedImage === index ? '24px' : '8px',
                        height: '8px',
                        borderRadius: '4px',
                        backgroundColor: selectedImage === index ? '#009688' : '#e0e0e0',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                      aria-label={`Go to image ${index + 1}`}
                    />
                  ))}
                </div>
              )}

              {/* Price, sizes, gender, sold */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="product-price-block"
              >
                <ClothesSizesLine product={product} />
                <div className="product-price-row" style={{ marginTop: isClothesCategory(product.category) ? 10 : 0 }}>
                  <div className="product-price-left">
                    <div className="flex items-baseline" style={{ gap: '12px', flexWrap: 'wrap' }}>
                      <span style={{ 
                        background: 'linear-gradient(135deg, #e53e3e 0%, #fc8181 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        fontSize: '32px', 
                        fontWeight: '700' 
                      }}>
                        {formatPrice(product.currentPrice)} PKR
                      </span>
                      <span style={{ color: '#a0aec0', fontSize: '16px', textDecoration: 'line-through', fontWeight: '500' }}>
                        {formatPrice(product.originalPrice)} PKR
                      </span>
                    </div>
                  </div>
                  <div className="product-price-right">
                    <ClothesGenderNearPrice product={product} />
                    <span className="product-sold-badge">🔥 {actualSoldCount} Sold</span>
                  </div>
                </div>
              </motion.div>

              <div className="product-details-card">
                <h3 className="product-details-card__title">Product details</h3>
                <ProductMetaDisplay product={product} variant="full" hideTitle />
              </div>

            </motion.div>

            {/* Right Column - Order Form */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="product-order-card"
            >
              <motion.h2 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                style={{ 
                  fontSize: isArabic ? '32px' : '28px', 
                  fontWeight: '700', 
                  background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ff8c42 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  marginBottom: '8px' 
                }}
              >
                Order Now
              </motion.h2>
              <p className="order-form-intro">
                Kindly fill the form &amp; we will deliver within 2-4 working days.
              </p>

              {authStatus === 'authenticated' ? (
                <p className="order-form-intro" style={{ marginBottom: 12, fontSize: 13, color: '#64748b' }}>
                  Delivery details are filled from your{' '}
                  <Link href="/profile" style={{ color: '#ff6b35', fontWeight: 600 }}>
                    profile
                  </Link>
                  . Update them anytime there.
                </p>
              ) : null}

              {authStatus !== 'authenticated' ? (
                <div className="order-login-banner">
                  <p>
                    <strong>Sign in required</strong> — create an account or sign in to place your order.
                  </p>
                  <button
                    type="button"
                    className="order-login-banner__btn"
                    onClick={() => openLogin(pathname || `/product/${id}`)}
                  >
                    Sign in / Register
                  </button>
                </div>
              ) : null}

              <form onSubmit={handleSubmit} className="order-form-compact">
                {/* Full Name */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  <label style={{ 
                    display: 'block', 
                    fontSize: isArabic ? '17px' : '15px', 
                    fontWeight: '600', 
                    color: '#2d3748', 
                    marginBottom: '8px' 
                  }}>
                    Full Name<span style={{ color: '#e53e3e', marginLeft: '4px' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    required
                    style={{
                      width: '100%',
                      padding: '14px 18px',
                      border: '2px solid rgba(102, 126, 234, 0.2)',
                      borderRadius: '12px',
                      fontSize: isArabic ? '17px' : '15px',
                      color: '#2d3748',
                      outline: 'none',
                      background: '#ffffff',
                      transition: 'all 0.3s ease'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#ff6b35';
                      e.currentTarget.style.boxShadow = '0px 0px 0px 3px rgba(255, 107, 53, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.2)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </motion.div>

                {/* WhatsApp Number */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  <label className="order-form-label">
                    WhatsApp Number<span className="order-form-required">*</span>
                  </label>
                  <input
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleInputChange}
                    placeholder="0300 1234567"
                    inputMode="tel"
                    autoComplete="tel"
                    required
                    style={{
                      width: '100%',
                      padding: '14px 18px',
                      border: '2px solid rgba(102, 126, 234, 0.2)',
                      borderRadius: '12px',
                      fontSize: isArabic ? '17px' : '15px',
                      color: '#2d3748',
                      outline: 'none',
                      background: '#ffffff',
                      transition: 'all 0.3s ease'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#ff6b35';
                      e.currentTarget.style.boxShadow = '0px 0px 0px 3px rgba(255, 107, 53, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.2)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </motion.div>

                {isClothesCategory(product.category) && product.clothesOptions ? (
                  <ClothesSizeSelector
                    product={product}
                    value={formData.selectedSize}
                    onChange={(size) => {
                      setFormData((prev: typeof formData) => {
                        const updated = { ...prev, selectedSize: size };
                        formDataRef.current = updated;
                        return updated;
                      });
                    }}
                  />
                ) : null}

                {/* Quantity */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                >
                  <label className="order-form-label">
                    Quantity<span className="order-form-required">*</span>
                  </label>
                  <select
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '14px 18px',
                      border: '2px solid rgba(102, 126, 234, 0.2)',
                      borderRadius: '12px',
                      fontSize: isArabic ? '17px' : '15px',
                      color: '#2d3748',
                      outline: 'none',
                      backgroundColor: '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#ff6b35';
                      e.currentTarget.style.boxShadow = '0px 0px 0px 3px rgba(255, 107, 53, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.2)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {quantityOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </motion.div>

                {/* City */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                >
                  <label style={{ 
                    display: 'block', 
                    fontSize: isArabic ? '17px' : '15px', 
                    fontWeight: '600', 
                    color: '#2d3748', 
                    marginBottom: '8px' 
                  }}>
                    City<span style={{ color: '#e53e3e', marginLeft: '4px' }}>*</span>
                  </label>
                  <select
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '14px 18px',
                      border: '2px solid rgba(102, 126, 234, 0.2)',
                      borderRadius: '12px',
                      fontSize: isArabic ? '17px' : '15px',
                      color: '#2d3748',
                      outline: 'none',
                      backgroundColor: '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#ff6b35';
                      e.currentTarget.style.boxShadow = '0px 0px 0px 3px rgba(255, 107, 53, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.2)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <option value="">Select City*</option>
                    {cities.map((city, idx) => {
                      const cityName = getCityName(city);
                      return (
                        <option key={idx} value={cityName}>
                          {cityName}
                        </option>
                      );
                    })}
                  </select>
                </motion.div>

                {/* Delivery Address */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.9 }}
                >
                  <label style={{ 
                    display: 'block', 
                    fontSize: isArabic ? '17px' : '15px', 
                    fontWeight: '600', 
                    color: '#2d3748', 
                    marginBottom: '8px' 
                  }}>
                    Delivery Address<span style={{ color: '#e53e3e', marginLeft: '4px' }}>*</span>
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Building No, Street name, Area"
                    required
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '14px 18px',
                      border: '2px solid rgba(102, 126, 234, 0.2)',
                      borderRadius: '12px',
                      fontSize: isArabic ? '17px' : '15px',
                      color: '#2d3748',
                      outline: 'none',
                      resize: 'none',
                      background: '#ffffff',
                      transition: 'all 0.3s ease',
                      fontFamily: 'inherit'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#ff6b35';
                      e.currentTarget.style.boxShadow = '0px 0px 0px 3px rgba(255, 107, 53, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.2)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </motion.div>

                <div className="order-payment-block--compact">
                  <OrderPaymentMethods
                    methods={paymentMethods}
                    selectedId={selectedPaymentId || paymentMethods[0]?.id || ''}
                    onSelect={(id) => {
                      setSelectedPaymentId(id);
                      setPaymentError('');
                    }}
                    error={paymentError}
                  />
                </div>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 1 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ff8c42 100%)',
                    color: 'white',
                    fontWeight: '700',
                    padding: '16px 24px',
                    borderRadius: '16px',
                    border: 'none',
                    fontSize: isArabic ? '17px' : '16px',
                    letterSpacing: '0.5px',
                    cursor: 'pointer',
                    boxShadow: '0px 8px 25px rgba(255, 107, 53, 0.4)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  SUBMIT ORDER
                </motion.button>
              </form>
            </motion.div>
          </div>
          )}

          {/* Description Section */}
          {!orderSubmitted && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            style={{
              background: 'linear-gradient(145deg, #ffffff 0%, #f7fafc 100%)',
              borderRadius: '24px',
              marginTop: '30px',
              boxShadow: '0px 20px 60px rgba(102, 126, 234, 0.15), 0px 10px 25px rgba(79, 172, 254, 0.1)',
              border: '2px solid rgba(102, 126, 234, 0.1)',
              overflow: 'hidden'
            }}
          >
            <div style={{ 
              borderBottom: '2px solid rgba(102, 126, 234, 0.1)', 
              padding: '20px 28px',
              background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.05) 0%, rgba(247, 147, 30, 0.05) 100%)'
            }}>
              <h3 style={{ 
                fontSize: '22px', 
                fontWeight: '700', 
                background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ff8c42 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>Description</h3>
            </div>
            <div style={{ padding: '28px' }}>
              <p style={{ 
                fontWeight: '500', 
                color: '#2d3748', 
                marginBottom: '20px', 
                fontSize: isArabic ? '18px' : '16px',
                lineHeight: '1.7'
              }}>{productDescription}</p>
              <ol style={{ 
                listStyleType: 'decimal', 
                paddingLeft: isArabic ? '0' : '24px', 
                paddingRight: isArabic ? '24px' : '0', 
                color: '#4a5568', 
                lineHeight: isArabic ? '2.2' : '2', 
                fontSize: isArabic ? '17px' : '15px' 
              }}>
                {productFeatures.map((feature, index) => (
                  <motion.li 
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                    style={{ 
                      marginBottom: isArabic ? '12px' : '8px', 
                      paddingRight: isArabic ? '8px' : '0',
                      fontWeight: '500'
                    }}
                  >
                    {feature}
                  </motion.li>
                ))}
              </ol>
            </div>
          </motion.div>
          )}
        </div>
      </main>

      <Footer />
      <WhatsAppFab />
    </div>
  );
}
