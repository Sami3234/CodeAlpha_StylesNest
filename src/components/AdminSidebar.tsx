'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { 
  BiSpa,
  BiChip,
  BiTime,
  BiPhone,
  BiDish,
  BiShoppingBag,
  BiBox,
  BiTimeFive,
  BiCog,
  BiPackage,
  BiCheckCircle,
  BiXCircle
} from 'react-icons/bi';

// Categories for dropdown (excluding 'all')
const categoryItems = [
  { id: 'cosmetics', icon: BiSpa },
  { id: 'jewelry', icon: BiShoppingBag },
  { id: 'watches', icon: BiTime },
  { id: 'makeup', icon: BiSpa },
  { id: 'clothes', icon: BiSpa },
  { id: 'electronics', icon: BiChip },
  { id: 'bags', icon: BiShoppingBag },
  { id: 'menfashion', icon: BiShoppingBag },
  { id: 'general', icon: BiBox },
];

// Order statuses for dropdown
const orderStatusItems = [
  { id: 'pending', icon: BiTimeFive },
  { id: 'processing', icon: BiCog },
  { id: 'shipped', icon: BiPackage },
  { id: 'delivered', icon: BiCheckCircle },
  { id: 'cancelled', icon: BiXCircle },
];

const menuItems = [
  {
    id: 'dashboard',
    href: '/khanadmin',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    id: 'products',
    href: '/khanadmin/products',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
        <line x1="7" y1="7" x2="7.01" y2="7" />
      </svg>
    ),
  },
];

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile?: boolean;
}

const categoryLabels: Record<string, string> = {
  cosmetics: 'Cosmetics',
  electronics: 'Electronics',
  watches: 'Watches',
  jewelry: 'Jewelry',
  clothes: 'Clothes',
  makeup: 'Makeup',
  general: 'General',
  bags: 'Bags',
  menfashion: 'Men Fashion',
  mobile: 'Mobile',
  kitchen: 'Kitchen',
  other: 'Other',
};

const statusLabels: Record<string, string> = {
  'pending': 'Pending',
  'processing': 'Processing',
  'shipped': 'Shipped',
  'delivered': 'Delivered',
  'cancelled': 'Cancelled'
};

function AdminSidebarContent({ isOpen, onClose, isMobile = false }: AdminSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Get active category and status from URL
  const activeCategory = searchParams.get('category');
  const activeStatus = searchParams.get('status');
  
  // Derive state from URL params
  const shouldCategoriesBeOpen = activeCategory && pathname === '/khanadmin/products';
  const shouldOrdersBeOpen =
    (activeStatus && pathname === '/khanadmin/orders') || pathname === '/khanadmin/cart-orders';
  const shouldLandingBeOpen =
    pathname === '/khanadmin/landing-images' || pathname.startsWith('/khanadmin/landing/');

  const [categoriesOpen, setCategoriesOpen] = useState(shouldCategoriesBeOpen);
  const [ordersOpen, setOrdersOpen] = useState(shouldOrdersBeOpen);
  const [landingOpen, setLandingOpen] = useState(shouldLandingBeOpen);

  // Track previous values to detect changes
  const prevShouldCategoriesBeOpenRef = useRef(shouldCategoriesBeOpen);
  const prevShouldOrdersBeOpenRef = useRef(shouldOrdersBeOpen);
  const prevShouldLandingBeOpenRef = useRef(shouldLandingBeOpen);
  
  // Sync state with URL params when they change
  // This is a valid use case - syncing UI state with URL params
  useEffect(() => {
    if (prevShouldCategoriesBeOpenRef.current !== shouldCategoriesBeOpen) {
      prevShouldCategoriesBeOpenRef.current = shouldCategoriesBeOpen;
      if (categoriesOpen !== shouldCategoriesBeOpen) {
        setCategoriesOpen(shouldCategoriesBeOpen);
      }
    }
    if (prevShouldOrdersBeOpenRef.current !== shouldOrdersBeOpen) {
      prevShouldOrdersBeOpenRef.current = shouldOrdersBeOpen;
      if (ordersOpen !== shouldOrdersBeOpen) {
        setOrdersOpen(shouldOrdersBeOpen);
      }
    }
    if (prevShouldLandingBeOpenRef.current !== shouldLandingBeOpen) {
      prevShouldLandingBeOpenRef.current = shouldLandingBeOpen;
      if (landingOpen !== shouldLandingBeOpen) {
        setLandingOpen(shouldLandingBeOpen);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldCategoriesBeOpen, shouldOrdersBeOpen, shouldLandingBeOpen]);

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && isMobile && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 40,
          }}
        />
      )}

      {/* Sidebar */}
      <aside
        style={{
          width: '260px',
          height: 'calc(100vh - 90px)',
          background: 'linear-gradient(180deg, #2c3e50 0%, #34495e 100%)',
          position: 'fixed',
          top: '90px',
          bottom: 0,
          left: isOpen ? 0 : '-260px',
          zIndex: 50,
          transition: 'left 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '2px 0 20px rgba(0,0,0,0.15)',
          borderRight: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        {/* Admin Title */}
        <div
          style={{
            padding: '24px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
            background: 'rgba(52, 152, 219, 0.1)',
          }}
        >
          <h2 style={{ 
            color: '#fff', 
            fontSize: '20px', 
            fontWeight: '700',
            letterSpacing: '0.5px',
            background: 'linear-gradient(135deg, #ecf0f1 0%, #3498db 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Admin Panel
          </h2>
          {/* Close button for mobile */}
          {isMobile && (
            <button
              onClick={onClose}
              style={{
                color: '#fff',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* Menu Items - Scrollable */}
        <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', paddingTop: '10px' }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {menuItems.map((item) => {
              // Products should not be active if a category is selected
              const isActive = item.id === 'products' 
                ? pathname === item.href && !activeCategory
                : pathname === item.href;
              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    onClick={isMobile ? onClose : undefined}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '16px 20px',
                      color: isActive ? '#fff' : 'rgba(255,255,255,0.7)',
                      textDecoration: 'none',
                      backgroundColor: isActive 
                        ? 'linear-gradient(90deg, rgba(52, 152, 219, 0.2) 0%, rgba(52, 152, 219, 0.1) 100%)'
                        : 'transparent',
                      borderLeft: isActive ? '4px solid #3498db' : '4px solid transparent',
                      borderRadius: isActive ? '0 12px 12px 0' : '0',
                      transition: 'all 0.3s ease',
                      marginRight: '8px',
                      position: 'relative',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                        e.currentTarget.style.transform = 'translateX(4px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.transform = 'translateX(0)';
                      }
                    }}
                  >
                    <span style={{ 
                      opacity: isActive ? 1 : 0.7,
                      color: isActive ? '#3498db' : 'inherit',
                      transition: 'all 0.3s ease'
                    }}>
                      {item.icon}
                    </span>
                    <span style={{ 
                      fontSize: '15px', 
                      fontWeight: isActive ? '600' : '400',
                      letterSpacing: '0.3px'
                    }}>
                      {item.id === 'dashboard' ? 'Dashboard' : 'Products'}
                    </span>
                  </Link>
                </li>
              );
            })}

            {/* Categories Dropdown */}
            <li>
              {(() => {
                const hasCategoryActive = activeCategory && pathname === '/khanadmin/products';
                return (
                  <button
                    onClick={() => setCategoriesOpen(!categoriesOpen)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '16px 20px',
                      color: hasCategoryActive ? '#fff' : 'rgba(255,255,255,0.7)',
                      backgroundColor: hasCategoryActive 
                        ? 'linear-gradient(90deg, rgba(52, 152, 219, 0.2) 0%, rgba(52, 152, 219, 0.1) 100%)'
                        : 'transparent',
                      border: 'none',
                      borderLeft: hasCategoryActive ? '4px solid #3498db' : '4px solid transparent',
                      borderRadius: hasCategoryActive ? '0 12px 0 0' : '0',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      marginRight: '8px',
                    }}
                    onMouseEnter={(e) => {
                      if (!hasCategoryActive) {
                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                        e.currentTarget.style.transform = 'translateX(4px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!hasCategoryActive) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.transform = 'translateX(0)';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: hasCategoryActive ? 1 : 0.7 }}>
                        <line x1="8" y1="6" x2="21" y2="6" />
                        <line x1="8" y1="12" x2="21" y2="12" />
                        <line x1="8" y1="18" x2="21" y2="18" />
                        <line x1="3" y1="6" x2="3.01" y2="6" />
                        <line x1="3" y1="12" x2="3.01" y2="12" />
                        <line x1="3" y1="18" x2="3.01" y2="18" />
                      </svg>
                      <span style={{ fontSize: '14px', fontWeight: hasCategoryActive ? '500' : '400' }}>
                        Categories
                      </span>
                    </div>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      style={{
                        transform: categoriesOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                      }}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                );
              })()}

              {/* Dropdown Items */}
              <div
                style={{
                  maxHeight: categoriesOpen ? '400px' : '0',
                  overflow: 'hidden',
                  transition: 'max-height 0.3s ease',
                  backgroundColor: 'rgba(0,0,0,0.15)',
                }}
              >
                {categoryItems.map((cat) => {
                  const IconComponent = cat.icon;
                  const isActiveCategory = activeCategory === cat.id && pathname === '/khanadmin/products';
                  return (
                    <Link
                      key={cat.id}
                      href={`/khanadmin/products?category=${cat.id}`}
                      onClick={isMobile ? onClose : undefined}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 20px 12px 52px',
                        color: isActiveCategory ? '#3498db' : 'rgba(255,255,255,0.6)',
                        textDecoration: 'none',
                        fontSize: '14px',
                        fontWeight: isActiveCategory ? '600' : '400',
                        transition: 'all 0.3s ease',
                        backgroundColor: isActiveCategory ? 'rgba(52, 152, 219, 0.15)' : 'transparent',
                        borderLeft: isActiveCategory ? '4px solid #3498db' : '4px solid transparent',
                        borderRadius: isActiveCategory ? '0 8px 8px 0' : '0',
                        marginRight: '8px',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActiveCategory) {
                          e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                          e.currentTarget.style.color = 'rgba(255,255,255,0.9)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActiveCategory) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                        }
                      }}
                    >
                      <IconComponent size={16} style={{ color: isActiveCategory ? '#3498db' : 'inherit' }} />
                      <span>{categoryLabels[cat.id] || cat.id}</span>
                    </Link>
                  );
                })}
              </div>
            </li>

            {/* Orders Dropdown */}
            <li>
              {(() => {
                const isOrdersSection =
                  pathname === '/khanadmin/orders' || pathname === '/khanadmin/cart-orders';
                return (
                  <button
                    onClick={() => setOrdersOpen(!ordersOpen)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '16px 20px',
                      color: isOrdersSection ? '#fff' : 'rgba(255,255,255,0.7)',
                      backgroundColor: isOrdersSection 
                        ? 'linear-gradient(90deg, rgba(52, 152, 219, 0.2) 0%, rgba(52, 152, 219, 0.1) 100%)'
                        : 'transparent',
                      border: 'none',
                      borderLeft: isOrdersSection ? '4px solid #3498db' : '4px solid transparent',
                      borderRadius: isOrdersSection ? '0 12px 0 0' : '0',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      marginRight: '8px',
                    }}
                    onMouseEnter={(e) => {
                      if (!isOrdersSection) {
                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                        e.currentTarget.style.transform = 'translateX(4px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isOrdersSection) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.transform = 'translateX(0)';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: isOrdersSection ? 1 : 0.7 }}>
                        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <path d="M16 10a4 4 0 0 1-8 0" />
                      </svg>
                      <span style={{ fontSize: '14px', fontWeight: isOrdersSection ? '500' : '400' }}>
                        Orders
                      </span>
                    </div>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      style={{
                        transform: ordersOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                      }}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                );
              })()}

              {/* Orders Dropdown Items */}
              <div
                style={{
                  maxHeight: ordersOpen ? '400px' : '0',
                  overflow: 'hidden',
                  transition: 'max-height 0.3s ease',
                  backgroundColor: 'rgba(0,0,0,0.15)',
                }}
              >
                {/* All Orders */}
                <Link
                  href="/khanadmin/orders"
                  onClick={isMobile ? onClose : undefined}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 20px 12px 52px',
                    color:
                      pathname === '/khanadmin/orders' && !activeStatus ? '#3498db' : 'rgba(255,255,255,0.6)',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: pathname === '/khanadmin/orders' && !activeStatus ? '600' : '400',
                    transition: 'all 0.3s ease',
                    backgroundColor:
                      pathname === '/khanadmin/orders' && !activeStatus ? 'rgba(52, 152, 219, 0.15)' : 'transparent',
                    borderLeft:
                      pathname === '/khanadmin/orders' && !activeStatus ? '4px solid #3498db' : '4px solid transparent',
                    borderRadius: pathname === '/khanadmin/orders' && !activeStatus ? '0 8px 8px 0' : '0',
                    marginRight: '8px',
                  }}
                  onMouseEnter={(e) => {
                    if (pathname !== '/khanadmin/orders' || activeStatus) {
                      e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                      e.currentTarget.style.color = 'rgba(255,255,255,0.9)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (pathname !== '/khanadmin/orders' || activeStatus) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                    }
                  }}
                >
                  <BiBox size={16} style={{ color: pathname === '/khanadmin/orders' && !activeStatus ? '#3498db' : 'inherit' }} />
                  <span>All</span>
                </Link>

                <Link
                  href="/khanadmin/cart-orders"
                  onClick={isMobile ? onClose : undefined}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 20px 12px 52px',
                    color: pathname === '/khanadmin/cart-orders' ? '#3498db' : 'rgba(255,255,255,0.6)',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: pathname === '/khanadmin/cart-orders' ? '600' : '400',
                    transition: 'all 0.3s ease',
                    backgroundColor:
                      pathname === '/khanadmin/cart-orders' ? 'rgba(52, 152, 219, 0.15)' : 'transparent',
                    borderLeft: pathname === '/khanadmin/cart-orders' ? '4px solid #3498db' : '4px solid transparent',
                    borderRadius: pathname === '/khanadmin/cart-orders' ? '0 8px 8px 0' : '0',
                    marginRight: '8px',
                  }}
                  onMouseEnter={(e) => {
                    if (pathname !== '/khanadmin/cart-orders') {
                      e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                      e.currentTarget.style.color = 'rgba(255,255,255,0.9)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (pathname !== '/khanadmin/cart-orders') {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                    }
                  }}
                >
                  <BiShoppingBag size={16} style={{ color: pathname === '/khanadmin/cart-orders' ? '#3498db' : 'inherit' }} />
                  <span>Multi-item (cart)</span>
                </Link>
                
                {orderStatusItems.map((status) => {
                  const IconComponent = status.icon;
                  const isActiveStatus = activeStatus === status.id && pathname === '/khanadmin/orders';
                  return (
                    <Link
                      key={status.id}
                      href={`/khanadmin/orders?status=${status.id}`}
                      onClick={isMobile ? onClose : undefined}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 20px 12px 52px',
                        color: isActiveStatus ? '#3498db' : 'rgba(255,255,255,0.6)',
                        textDecoration: 'none',
                        fontSize: '14px',
                        fontWeight: isActiveStatus ? '600' : '400',
                        transition: 'all 0.3s ease',
                        backgroundColor: isActiveStatus ? 'rgba(52, 152, 219, 0.15)' : 'transparent',
                        borderLeft: isActiveStatus ? '4px solid #3498db' : '4px solid transparent',
                        borderRadius: isActiveStatus ? '0 8px 8px 0' : '0',
                        marginRight: '8px',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActiveStatus) {
                          e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                          e.currentTarget.style.color = 'rgba(255,255,255,0.9)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActiveStatus) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                        }
                      }}
                    >
                      <IconComponent size={16} style={{ color: isActiveStatus ? '#3498db' : 'inherit' }} />
                      <span>{statusLabels[status.id] || status.id}</span>
                    </Link>
                  );
                })}
              </div>
            </li>

            {/* Unsubmitted Orders */}
            <li>
              <Link
                href="/khanadmin/unsubmitted"
                onClick={isMobile ? onClose : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '16px 20px',
                  color: pathname === '/khanadmin/unsubmitted' ? '#fff' : 'rgba(255,255,255,0.7)',
                  backgroundColor: pathname === '/khanadmin/unsubmitted' 
                    ? 'linear-gradient(90deg, rgba(255, 152, 0, 0.15) 0%, rgba(255, 152, 0, 0.05) 100%)'
                    : 'transparent',
                  border: 'none',
                  borderLeft: pathname === '/khanadmin/unsubmitted' ? '4px solid #FF9800' : '4px solid transparent',
                  borderRadius: pathname === '/khanadmin/unsubmitted' ? '0 12px 12px 0' : '0',
                  textDecoration: 'none',
                  fontSize: '15px',
                  fontWeight: pathname === '/khanadmin/unsubmitted' ? '600' : '400',
                  transition: 'all 0.3s ease',
                  marginRight: '8px',
                }}
                onMouseEnter={(e) => {
                  if (pathname !== '/khanadmin/unsubmitted') {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (pathname !== '/khanadmin/unsubmitted') {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: pathname === '/khanadmin/unsubmitted' ? 1 : 0.7 }}>
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
                <span>Unsubmitted Orders</span>
              </Link>
            </li>

            {/* Landing (images, top bar, footer) */}
            <li>
              {(() => {
                const isLandingSection = shouldLandingBeOpen;
                return (
                  <button
                    type="button"
                    onClick={() => setLandingOpen(!landingOpen)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '16px 20px',
                      color: isLandingSection ? '#fff' : 'rgba(255,255,255,0.7)',
                      backgroundColor: isLandingSection
                        ? 'linear-gradient(90deg, rgba(52, 152, 219, 0.2) 0%, rgba(52, 152, 219, 0.1) 100%)'
                        : 'transparent',
                      border: 'none',
                      borderLeft: isLandingSection ? '4px solid #3498db' : '4px solid transparent',
                      borderRadius: isLandingSection ? '0 12px 0 0' : '0',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      marginRight: '8px',
                    }}
                    onMouseEnter={(e) => {
                      if (!isLandingSection) {
                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                        e.currentTarget.style.transform = 'translateX(4px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isLandingSection) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.transform = 'translateX(0)';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        style={{ opacity: isLandingSection ? 1 : 0.7 }}
                      >
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                      <span style={{ fontSize: '14px', fontWeight: isLandingSection ? '500' : '400' }}>
                        Landing
                      </span>
                    </div>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      style={{
                        transform: landingOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                      }}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                );
              })()}

              <div
                style={{
                  maxHeight: landingOpen ? '280px' : '0',
                  overflow: 'hidden',
                  transition: 'max-height 0.3s ease',
                  backgroundColor: 'rgba(0,0,0,0.15)',
                }}
              >
                <Link
                  href="/khanadmin/landing-images"
                  onClick={isMobile ? onClose : undefined}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 20px 12px 52px',
                    color:
                      pathname === '/khanadmin/landing-images'
                        ? '#3498db'
                        : 'rgba(255,255,255,0.6)',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: pathname === '/khanadmin/landing-images' ? '600' : '400',
                    transition: 'all 0.3s ease',
                    backgroundColor:
                      pathname === '/khanadmin/landing-images'
                        ? 'rgba(52, 152, 219, 0.15)'
                        : 'transparent',
                    borderLeft:
                      pathname === '/khanadmin/landing-images'
                        ? '4px solid #3498db'
                        : '4px solid transparent',
                    borderRadius: pathname === '/khanadmin/landing-images' ? '0 8px 8px 0' : '0',
                    marginRight: '8px',
                  }}
                  onMouseEnter={(e) => {
                    if (pathname !== '/khanadmin/landing-images') {
                      e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                      e.currentTarget.style.color = 'rgba(255,255,255,0.9)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (pathname !== '/khanadmin/landing-images') {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                    }
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  <span>Landing images</span>
                </Link>

                <Link
                  href="/khanadmin/landing/top-bar"
                  onClick={isMobile ? onClose : undefined}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 20px 12px 52px',
                    color:
                      pathname === '/khanadmin/landing/top-bar'
                        ? '#3498db'
                        : 'rgba(255,255,255,0.6)',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: pathname === '/khanadmin/landing/top-bar' ? '600' : '400',
                    transition: 'all 0.3s ease',
                    backgroundColor:
                      pathname === '/khanadmin/landing/top-bar'
                        ? 'rgba(52, 152, 219, 0.15)'
                        : 'transparent',
                    borderLeft:
                      pathname === '/khanadmin/landing/top-bar'
                        ? '4px solid #3498db'
                        : '4px solid transparent',
                    borderRadius: pathname === '/khanadmin/landing/top-bar' ? '0 8px 8px 0' : '0',
                    marginRight: '8px',
                  }}
                  onMouseEnter={(e) => {
                    if (pathname !== '/khanadmin/landing/top-bar') {
                      e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                      e.currentTarget.style.color = 'rgba(255,255,255,0.9)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (pathname !== '/khanadmin/landing/top-bar') {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                    }
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 11h16v9H4zM9 11V7h6v4M12 2v3" />
                  </svg>
                  <span>Top bar</span>
                </Link>

                <Link
                  href="/khanadmin/landing/footer"
                  onClick={isMobile ? onClose : undefined}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 20px 12px 52px',
                    color:
                      pathname === '/khanadmin/landing/footer'
                        ? '#3498db'
                        : 'rgba(255,255,255,0.6)',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: pathname === '/khanadmin/landing/footer' ? '600' : '400',
                    transition: 'all 0.3s ease',
                    backgroundColor:
                      pathname === '/khanadmin/landing/footer'
                        ? 'rgba(52, 152, 219, 0.15)'
                        : 'transparent',
                    borderLeft:
                      pathname === '/khanadmin/landing/footer'
                        ? '4px solid #3498db'
                        : '4px solid transparent',
                    borderRadius: pathname === '/khanadmin/landing/footer' ? '0 8px 8px 0' : '0',
                    marginRight: '8px',
                  }}
                  onMouseEnter={(e) => {
                    if (pathname !== '/khanadmin/landing/footer') {
                      e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                      e.currentTarget.style.color = 'rgba(255,255,255,0.9)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (pathname !== '/khanadmin/landing/footer') {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                    }
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  <span>Footer &amp; links</span>
                </Link>
              </div>
            </li>

            {/* Shop customers (login) */}
            <li>
              <Link
                href="/khanadmin/users"
                onClick={isMobile ? onClose : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '16px 20px',
                  color: pathname === '/khanadmin/users' ? '#fff' : 'rgba(255,255,255,0.7)',
                  textDecoration: 'none',
                  backgroundColor: pathname === '/khanadmin/users'
                    ? 'linear-gradient(90deg, rgba(52, 152, 219, 0.2) 0%, rgba(52, 152, 219, 0.1) 100%)'
                    : 'transparent',
                  borderLeft: pathname === '/khanadmin/users' ? '4px solid #3498db' : '4px solid transparent',
                  borderRadius: pathname === '/khanadmin/users' ? '0 12px 12px 0' : '0',
                  transition: 'all 0.3s ease',
                  marginRight: '8px',
                }}
                onMouseEnter={(e) => {
                  if (pathname !== '/khanadmin/users') {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (pathname !== '/khanadmin/users') {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }
                }}
              >
                <span
                  style={{
                    opacity: pathname === '/khanadmin/users' ? 1 : 0.7,
                    color: pathname === '/khanadmin/users' ? '#3498db' : 'inherit',
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </span>
                <span
                  style={{
                    fontSize: '15px',
                    fontWeight: pathname === '/khanadmin/users' ? '600' : '400',
                    letterSpacing: '0.3px',
                  }}
                >
                  Customers
                </span>
              </Link>
            </li>

            {/* Payment methods */}
            <li>
              <Link
                href="/khanadmin/payment-methods"
                onClick={isMobile ? onClose : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '16px 20px',
                  color: pathname === '/khanadmin/payment-methods' ? '#fff' : 'rgba(255,255,255,0.7)',
                  textDecoration: 'none',
                  backgroundColor: pathname === '/khanadmin/payment-methods'
                    ? 'linear-gradient(90deg, rgba(52, 152, 219, 0.2) 0%, rgba(52, 152, 219, 0.1) 100%)'
                    : 'transparent',
                  borderLeft: pathname === '/khanadmin/payment-methods' ? '4px solid #3498db' : '4px solid transparent',
                  borderRadius: pathname === '/khanadmin/payment-methods' ? '0 12px 12px 0' : '0',
                  transition: 'all 0.3s ease',
                  marginRight: '8px',
                }}
                onMouseEnter={(e) => {
                  if (pathname !== '/khanadmin/payment-methods') {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (pathname !== '/khanadmin/payment-methods') {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }
                }}
              >
                <span style={{
                  opacity: pathname === '/khanadmin/payment-methods' ? 1 : 0.7,
                  color: pathname === '/khanadmin/payment-methods' ? '#3498db' : 'inherit',
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                </span>
                <span style={{
                  fontSize: '15px',
                  fontWeight: pathname === '/khanadmin/payment-methods' ? '600' : '400',
                  letterSpacing: '0.3px',
                }}>
                  Payment methods
                </span>
              </Link>
            </li>

            {/* Profile - End */}
            <li>
              <Link
                href="/khanadmin/profile"
                onClick={isMobile ? onClose : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '16px 20px',
                  color: pathname === '/khanadmin/profile' ? '#fff' : 'rgba(255,255,255,0.7)',
                  textDecoration: 'none',
                  backgroundColor: pathname === '/khanadmin/profile' 
                    ? 'linear-gradient(90deg, rgba(52, 152, 219, 0.2) 0%, rgba(52, 152, 219, 0.1) 100%)'
                    : 'transparent',
                  borderLeft: pathname === '/khanadmin/profile' ? '4px solid #3498db' : '4px solid transparent',
                  borderRadius: pathname === '/khanadmin/profile' ? '0 12px 12px 0' : '0',
                  transition: 'all 0.3s ease',
                  marginRight: '8px',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  if (pathname !== '/khanadmin/profile') {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (pathname !== '/khanadmin/profile') {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }
                }}
              >
                <span style={{ 
                  opacity: pathname === '/khanadmin/profile' ? 1 : 0.7,
                  color: pathname === '/khanadmin/profile' ? '#3498db' : 'inherit',
                  transition: 'all 0.3s ease'
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <span style={{ 
                  fontSize: '15px', 
                  fontWeight: pathname === '/khanadmin/profile' ? '600' : '400',
                  letterSpacing: '0.3px'
                }}>
                  Profile
                </span>
              </Link>
            </li>
          </ul>
        </nav>

        {/* Logout Button - Fixed at Bottom */}
        <div
          style={{
            padding: '16px',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            backgroundColor: '#2c3e50',
            flexShrink: 0,
          }}
        >
          <button
            onClick={async () => {
              try {
                await fetch('/api/admin/logout', { method: 'POST' });
                router.push('/khanadmin/login');
                router.refresh();
              } catch (error) {
                console.error('Logout error:', error);
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              backgroundColor: 'transparent',
              color: 'rgba(255,255,255,0.8)',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '400',
              border: '1px solid rgba(255,255,255,0.2)',
              transition: 'all 0.2s ease',
              cursor: 'pointer',
              width: '100%',
              textAlign: 'left',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(231, 76, 60, 0.2)';
              e.currentTarget.style.borderColor = 'rgba(231, 76, 60, 0.5)';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.8)';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}

export default function AdminSidebar(props: AdminSidebarProps) {
  return (
    <Suspense fallback={null}>
      <AdminSidebarContent {...props} />
    </Suspense>
  );
}
