'use client';

import { useState, useEffect, useRef, Suspense, type ReactNode } from 'react';
import './admin/admin-sidebar.css';
import { clearAdminAuthCache } from '@/lib/admin-auth-client';
import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import {
  BiSpa,
  BiChip,
  BiTime,
  BiShoppingBag,
  BiBox,
  BiTimeFive,
  BiCog,
  BiPackage,
  BiCheckCircle,
  BiXCircle,
} from 'react-icons/bi';

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

const orderStatusItems = [
  { id: 'pending', icon: BiTimeFive },
  { id: 'processing', icon: BiCog },
  { id: 'shipped', icon: BiPackage },
  { id: 'delivered', icon: BiCheckCircle },
  { id: 'cancelled', icon: BiXCircle },
];

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
};

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`admin-sidebar__chevron${open ? ' admin-sidebar__chevron--open' : ''}`}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function SidebarSection({ label }: { label: string }) {
  return <li className="admin-sidebar__section" aria-hidden>{label}</li>;
}

function SidebarLink({
  href,
  active,
  onNavigate,
  icon,
  children,
  warn,
}: {
  href: string;
  active: boolean;
  onNavigate?: () => void;
  icon: ReactNode;
  children: ReactNode;
  warn?: boolean;
}) {
  return (
    <li>
      <Link
        href={href}
        onClick={onNavigate}
        className={`admin-sidebar__link${active ? ' admin-sidebar__link--active' : ''}${warn ? ' admin-sidebar__link--warn' : ''}`}
      >
        <span className="admin-sidebar__link-icon">{icon}</span>
        <span className="admin-sidebar__link-label">{children}</span>
      </Link>
    </li>
  );
}

function SidebarSubLink({
  href,
  active,
  onNavigate,
  icon,
  children,
}: {
  href: string;
  active: boolean;
  onNavigate?: () => void;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`admin-sidebar__sublink${active ? ' admin-sidebar__sublink--active' : ''}`}
    >
      <span className="admin-sidebar__sublink-icon">{icon}</span>
      <span>{children}</span>
    </Link>
  );
}

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile?: boolean;
}

function AdminSidebarContent({ isOpen, onClose, isMobile = false }: AdminSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const activeCategory = searchParams.get('category');
  const activeStatus = searchParams.get('status');

  const shouldCategoriesBeOpen = Boolean(activeCategory && pathname === '/khanadmin/products');
  const shouldOrdersBeOpen =
    Boolean(activeStatus && pathname === '/khanadmin/orders') || pathname === '/khanadmin/cart-orders';
  const shouldLandingBeOpen =
    pathname === '/khanadmin/landing-images' || pathname.startsWith('/khanadmin/landing/');

  const [categoriesOpen, setCategoriesOpen] = useState(shouldCategoriesBeOpen);
  const [ordersOpen, setOrdersOpen] = useState(shouldOrdersBeOpen);
  const [landingOpen, setLandingOpen] = useState(shouldLandingBeOpen);

  const prevShouldCategoriesBeOpenRef = useRef(shouldCategoriesBeOpen);
  const prevShouldOrdersBeOpenRef = useRef(shouldOrdersBeOpen);
  const prevShouldLandingBeOpenRef = useRef(shouldLandingBeOpen);

  useEffect(() => {
    if (prevShouldCategoriesBeOpenRef.current !== shouldCategoriesBeOpen) {
      prevShouldCategoriesBeOpenRef.current = shouldCategoriesBeOpen;
      if (categoriesOpen !== shouldCategoriesBeOpen) setCategoriesOpen(shouldCategoriesBeOpen);
    }
    if (prevShouldOrdersBeOpenRef.current !== shouldOrdersBeOpen) {
      prevShouldOrdersBeOpenRef.current = shouldOrdersBeOpen;
      if (ordersOpen !== shouldOrdersBeOpen) setOrdersOpen(shouldOrdersBeOpen);
    }
    if (prevShouldLandingBeOpenRef.current !== shouldLandingBeOpen) {
      prevShouldLandingBeOpenRef.current = shouldLandingBeOpen;
      if (landingOpen !== shouldLandingBeOpen) setLandingOpen(shouldLandingBeOpen);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldCategoriesBeOpen, shouldOrdersBeOpen, shouldLandingBeOpen]);

  const onNav = isMobile ? onClose : undefined;
  const isProductsActive = pathname === '/khanadmin/products' && !activeCategory;
  const isOrdersSection = pathname === '/khanadmin/orders' || pathname === '/khanadmin/cart-orders';
  const hasCategoryActive = Boolean(activeCategory && pathname === '/khanadmin/products');

  return (
    <>
      {isOpen && isMobile ? (
        <div className="admin-sidebar-overlay" onClick={onClose} role="presentation" />
      ) : null}

      <aside className={`admin-sidebar${isOpen ? ' admin-sidebar--open' : ' admin-sidebar--closed'}`}>
        <div className="admin-sidebar__head">
          <div className="admin-sidebar__brand">
            <div className="admin-sidebar__brand-mark" aria-hidden>
              SN
            </div>
            <div className="admin-sidebar__brand-text">
              <p className="admin-sidebar__brand-name">StylesNest</p>
              <p className="admin-sidebar__brand-sub">Admin Panel</p>
            </div>
          </div>
          {isMobile ? (
            <button type="button" className="admin-sidebar__close" onClick={onClose} aria-label="Close menu">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          ) : null}
        </div>

        <nav className="admin-sidebar__nav" aria-label="Admin navigation">
          <ul>
            <SidebarSection label="Overview" />
            <SidebarLink
              href="/khanadmin"
              active={pathname === '/khanadmin'}
              onNavigate={onNav}
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
              }
            >
              Dashboard
            </SidebarLink>

            <SidebarSection label="Catalog" />
            <SidebarLink
              href="/khanadmin/products"
              active={isProductsActive}
              onNavigate={onNav}
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                  <line x1="7" y1="7" x2="7.01" y2="7" />
                </svg>
              }
            >
              Products
            </SidebarLink>

            <li>
              <button
                type="button"
                className={`admin-sidebar__toggle${hasCategoryActive ? ' admin-sidebar__toggle--active' : ''}`}
                onClick={() => setCategoriesOpen(!categoriesOpen)}
                aria-expanded={categoriesOpen}
              >
                <span className="admin-sidebar__toggle-inner">
                  <span className="admin-sidebar__toggle-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="8" y1="6" x2="21" y2="6" />
                      <line x1="8" y1="12" x2="21" y2="12" />
                      <line x1="8" y1="18" x2="21" y2="18" />
                      <line x1="3" y1="6" x2="3.01" y2="6" />
                      <line x1="3" y1="12" x2="3.01" y2="12" />
                      <line x1="3" y1="18" x2="3.01" y2="18" />
                    </svg>
                  </span>
                  <span className="admin-sidebar__toggle-label">Categories</span>
                </span>
                <Chevron open={categoriesOpen} />
              </button>
              <div
                className={`admin-sidebar__sub${categoriesOpen ? '' : ' admin-sidebar__sub--closed'}`}
                style={{ maxHeight: categoriesOpen ? '420px' : 0 }}
              >
                {categoryItems.map((cat) => {
                  const Icon = cat.icon;
                  const active = activeCategory === cat.id && pathname === '/khanadmin/products';
                  return (
                    <SidebarSubLink
                      key={cat.id}
                      href={`/khanadmin/products?category=${cat.id}`}
                      active={active}
                      onNavigate={onNav}
                      icon={<Icon size={15} />}
                    >
                      {categoryLabels[cat.id] || cat.id}
                    </SidebarSubLink>
                  );
                })}
              </div>
            </li>

            <SidebarSection label="Sales" />
            <li>
              <button
                type="button"
                className={`admin-sidebar__toggle${isOrdersSection ? ' admin-sidebar__toggle--active' : ''}`}
                onClick={() => setOrdersOpen(!ordersOpen)}
                aria-expanded={ordersOpen}
              >
                <span className="admin-sidebar__toggle-inner">
                  <span className="admin-sidebar__toggle-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <path d="M16 10a4 4 0 0 1-8 0" />
                    </svg>
                  </span>
                  <span className="admin-sidebar__toggle-label">Orders</span>
                </span>
                <Chevron open={ordersOpen} />
              </button>
              <div
                className={`admin-sidebar__sub${ordersOpen ? '' : ' admin-sidebar__sub--closed'}`}
                style={{ maxHeight: ordersOpen ? '480px' : 0 }}
              >
                <SidebarSubLink
                  href="/khanadmin/orders"
                  active={pathname === '/khanadmin/orders' && !activeStatus}
                  onNavigate={onNav}
                  icon={<BiBox size={15} />}
                >
                  All orders
                </SidebarSubLink>
                <SidebarSubLink
                  href="/khanadmin/cart-orders"
                  active={pathname === '/khanadmin/cart-orders'}
                  onNavigate={onNav}
                  icon={<BiShoppingBag size={15} />}
                >
                  Multi-item (cart)
                </SidebarSubLink>
                {orderStatusItems.map((status) => {
                  const Icon = status.icon;
                  const active = activeStatus === status.id && pathname === '/khanadmin/orders';
                  return (
                    <SidebarSubLink
                      key={status.id}
                      href={`/khanadmin/orders?status=${status.id}`}
                      active={active}
                      onNavigate={onNav}
                      icon={<Icon size={15} />}
                    >
                      {statusLabels[status.id]}
                    </SidebarSubLink>
                  );
                })}
              </div>
            </li>

            <SidebarLink
              href="/khanadmin/unsubmitted"
              active={pathname === '/khanadmin/unsubmitted'}
              onNavigate={onNav}
              warn
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
              }
            >
              Unsubmitted
            </SidebarLink>

            <SidebarSection label="Content" />
            <li>
              <button
                type="button"
                className={`admin-sidebar__toggle${shouldLandingBeOpen ? ' admin-sidebar__toggle--active' : ''}`}
                onClick={() => setLandingOpen(!landingOpen)}
                aria-expanded={landingOpen}
              >
                <span className="admin-sidebar__toggle-inner">
                  <span className="admin-sidebar__toggle-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  </span>
                  <span className="admin-sidebar__toggle-label">Landing</span>
                </span>
                <Chevron open={landingOpen} />
              </button>
              <div
                className={`admin-sidebar__sub${landingOpen ? '' : ' admin-sidebar__sub--closed'}`}
                style={{ maxHeight: landingOpen ? '280px' : 0 }}
              >
                <SidebarSubLink
                  href="/khanadmin/landing-images"
                  active={pathname === '/khanadmin/landing-images'}
                  onNavigate={onNav}
                  icon={
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  }
                >
                  Landing images
                </SidebarSubLink>
                <SidebarSubLink
                  href="/khanadmin/landing/top-bar"
                  active={pathname === '/khanadmin/landing/top-bar'}
                  onNavigate={onNav}
                  icon={
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 11h16v9H4zM9 11V7h6v4M12 2v3" />
                    </svg>
                  }
                >
                  Top bar
                </SidebarSubLink>
                <SidebarSubLink
                  href="/khanadmin/landing/footer"
                  active={pathname === '/khanadmin/landing/footer'}
                  onNavigate={onNav}
                  icon={
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  }
                >
                  Footer &amp; links
                </SidebarSubLink>
                <SidebarSubLink
                  href="/khanadmin/landing/legal-pages"
                  active={pathname === '/khanadmin/landing/legal-pages'}
                  onNavigate={onNav}
                  icon={
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  }
                >
                  Policies &amp; legal
                </SidebarSubLink>
              </div>
            </li>

            <SidebarSection label="Store" />
            <SidebarLink
              href="/khanadmin/users"
              active={pathname === '/khanadmin/users'}
              onNavigate={onNav}
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              }
            >
              Users
            </SidebarLink>
            <SidebarLink
              href="/khanadmin/support"
              active={pathname === '/khanadmin/support'}
              onNavigate={onNav}
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              }
            >
              Support
            </SidebarLink>
            <SidebarLink
              href="/khanadmin/reviews"
              active={pathname === '/khanadmin/reviews'}
              onNavigate={onNav}
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              }
            >
              Reviews
            </SidebarLink>
            <SidebarLink
              href="/khanadmin/payment-methods"
              active={pathname === '/khanadmin/payment-methods'}
              onNavigate={onNav}
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <line x1="2" y1="10" x2="22" y2="10" />
                </svg>
              }
            >
              Payment methods
            </SidebarLink>

            <SidebarSection label="Account" />
            <SidebarLink
              href="/khanadmin/profile"
              active={pathname === '/khanadmin/profile'}
              onNavigate={onNav}
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              }
            >
              Profile
            </SidebarLink>
          </ul>
        </nav>

        <div className="admin-sidebar__foot">
          <button
            type="button"
            className="admin-sidebar__logout"
            onClick={async () => {
              try {
                clearAdminAuthCache();
                await fetch('/api/admin/logout', { method: 'POST' });
                router.push('/khanadmin/login');
                router.refresh();
              } catch (error) {
                console.error('Logout error:', error);
              }
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
