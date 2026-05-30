'use client';

import { useState, useRef, useEffect, type CSSProperties } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, MotionStyle } from 'framer-motion';
import { WORDMARK_GRADIENT } from '@/lib/brand-wordmark';
import TopAnnouncementBar from '@/components/TopAnnouncementBar';
import { IoCartOutline } from 'react-icons/io5';
import { useCart } from '@/context/CartContext';
import HeaderProfile, { HeaderProfileMobile } from '@/components/HeaderProfile';
import AdminNotificationBell from '@/components/admin/AdminNotificationBell';

/** Navbar only — transparent PNG; other surfaces use StylesNest_Nest via site config */
const NAVBAR_LOGO = '/StylesNest_Transparent.png';

function BrandMark() {
  return (
    <span className="inline-flex min-w-0 flex-row items-center gap-2 overflow-visible sm:gap-3 md:gap-4">
      <span className="inline-flex h-[48px] max-h-[48px] shrink-0 items-center justify-center leading-none sm:h-[56px] sm:max-h-[56px] md:h-[66px] md:max-h-[66px]">
        <Image
          src={NAVBAR_LOGO}
          alt="StylesNest logo"
          width={508}
          height={390}
          sizes="(max-width: 768px) 120px, 160px"
          className="block h-full w-auto max-h-full object-contain object-center"
          priority
        />
      </span>
      <span
        className="overflow-visible pb-[0.12em] leading-[1.28] tracking-[0.03em]"
        style={{
          fontFamily: 'var(--font-brand-mark), Georgia, "Times New Roman", serif',
          fontSize: 'clamp(1.15rem, 4.2vw, 2.05rem)',
          fontWeight: 700,
          fontStyle: 'italic',
          background: WORDMARK_GRADIENT,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        StylesNest
      </span>
    </span>
  );
}

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const isAdminPanel =
    pathname?.startsWith('/khanadmin') ||
    pathname?.startsWith('/admin') ||
    false;
  const shellRef = useRef<HTMLElement>(null);
  const { totalQuantity, hydrated: cartHydrated } = useCart();

  const isActive = (path: string) => pathname === path;

  useEffect(() => {
    const el = shellRef.current;
    if (!el) return;
    const apply = () => {
      document.documentElement.style.setProperty('--site-header-h', `${el.offsetHeight}px`);
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    window.addEventListener('resize', apply);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', apply);
    };
  }, [pathname, isAdminPanel, mobileMenuOpen]);

  // Storefront: show navbar instantly (entrance animations felt like slow loading)
  const headerAnimationProps = isAdminPanel
    ? { initial: false as const, animate: false as const, transition: { duration: 0 } }
    : { initial: false as const };

  const outerHeaderStyle: MotionStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    overflow: 'visible',
  };

  const navShellStyle: CSSProperties = {
    borderBottom: '1px solid rgba(0,0,0,0.08)',
    backdropFilter: 'blur(15px)',
    background: 'rgba(255, 255, 255, 0.98)',
    boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.05)',
  };

  return (
    <motion.header
      ref={shellRef}
      className="bg-transparent"
      {...headerAnimationProps}
      style={outerHeaderStyle}
      dir="ltr"
    >
      <div style={navShellStyle}>
      {/* Centered Container */}
      <div 
        style={{
          maxWidth: '1300px',
          margin: '0 auto',
          paddingLeft: 'clamp(10px, 3vw, 15px)',
          paddingRight: 'clamp(10px, 3vw, 15px)'
        }}
      >
        <div 
          className="flex min-w-0 items-center overflow-visible"
          style={{ 
            height: '90px',
            justifyContent: isAdminPanel ? 'space-between' : 'space-between',
            position: 'relative',
          }}
        >
          {/* Logo - Centered in Admin, Left in Regular */}
          {isAdminPanel ? (
            <>
              <div style={{ width: '44px', flexShrink: 0 }} aria-hidden />
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  justifyContent: 'center',
                  minWidth: 0,
                }}
              >
                <Link 
                  href="/" 
                  style={{
                    textDecoration: 'none',
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 0,
                    cursor: 'pointer',
                    zIndex: 10,
                  }}
                >
                  <BrandMark />
                </Link>
              </div>
              <div style={{ flexShrink: 0 }}>
                <AdminNotificationBell />
              </div>
            </>
          ) : (
            <div
              style={{
                width: 'auto',
                minWidth: 0,
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <Link
                href="/"
                style={{
                  textDecoration: 'none',
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  gap: 0,
                  cursor: 'pointer',
                  zIndex: 10,
                  minWidth: 0,
                  maxWidth: '100%',
                }}
              >
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 0,
                  }}
                >
                  <BrandMark />
                </motion.div>
              </Link>
            </div>
          )}

          {/* Navigation Buttons - Hidden in Admin Panel */}
          {!isAdminPanel && (
            <nav className="hidden md:flex items-center gap-3">
              <Link href="/">
                <motion.button
                  whileHover={{
                    scale: 1.08,
                    y: -2,
                    background: isActive('/')
                      ? 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ff8c42 100%)'
                      : 'rgba(255, 107, 53, 0.15)',
                    boxShadow: isActive('/')
                      ? '0px 10px 30px rgba(255, 107, 53, 0.5), 0px 5px 15px rgba(247, 147, 30, 0.4)'
                      : '0px 6px 18px rgba(255, 107, 53, 0.25)'
                  }}
                  whileTap={{ scale: 0.92 }}
                  style={{
                    padding: '10px 24px',
                    fontSize: '15px',
                    fontWeight: isActive('/') ? '600' : '500',
                    color: isActive('/') ? '#ffffff' : '#4a5568',
                    background: isActive('/')
                      ? 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ff8c42 100%)'
                      : 'transparent',
                    border: isActive('/') 
                      ? 'none' 
                      : '2px solid rgba(255, 107, 53, 0.4)',
                    borderRadius: '25px',
                    cursor: 'pointer',
                    outline: 'none',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: isActive('/')
                      ? '0px 8px 25px rgba(255, 107, 53, 0.45), 0px 4px 12px rgba(247, 147, 30, 0.35)'
                      : 'none'
                  }}
                >
                  Home
                </motion.button>
              </Link>

              <Link href="/shop">
                <motion.button
                  whileHover={{
                    scale: 1.08,
                    y: -2,
                    background: isActive('/shop')
                      ? 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ff8c42 100%)'
                      : 'rgba(255, 107, 53, 0.15)',
                    boxShadow: isActive('/shop')
                      ? '0px 10px 30px rgba(255, 107, 53, 0.5), 0px 5px 15px rgba(247, 147, 30, 0.4)'
                      : '0px 6px 18px rgba(255, 107, 53, 0.25)'
                  }}
                  whileTap={{ scale: 0.92 }}
                  style={{
                    padding: '10px 24px',
                    fontSize: '15px',
                    fontWeight: isActive('/shop') ? '600' : '500',
                    color: isActive('/shop') ? '#ffffff' : '#4a5568',
                    background: isActive('/shop')
                      ? 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ff8c42 100%)'
                      : 'transparent',
                    border: isActive('/shop') 
                      ? 'none' 
                      : '2px solid rgba(255, 107, 53, 0.4)',
                    borderRadius: '25px',
                    cursor: 'pointer',
                    outline: 'none',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: isActive('/shop')
                      ? '0px 8px 25px rgba(255, 107, 53, 0.45), 0px 4px 12px rgba(247, 147, 30, 0.35)'
                      : 'none'
                  }}
                >
                  Shop
                </motion.button>
              </Link>

              <Link href="/about">
                <motion.button
                  whileHover={{
                    scale: 1.08,
                    y: -2,
                    background: isActive('/about')
                      ? 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ff8c42 100%)'
                      : 'rgba(255, 107, 53, 0.15)',
                    boxShadow: isActive('/about')
                      ? '0px 10px 30px rgba(255, 107, 53, 0.5), 0px 5px 15px rgba(247, 147, 30, 0.4)'
                      : '0px 6px 18px rgba(255, 107, 53, 0.25)'
                  }}
                  whileTap={{ scale: 0.92 }}
                  style={{
                    padding: '10px 24px',
                    fontSize: '15px',
                    fontWeight: isActive('/about') ? '600' : '500',
                    color: isActive('/about') ? '#ffffff' : '#4a5568',
                    background: isActive('/about')
                      ? 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ff8c42 100%)'
                      : 'transparent',
                    border: isActive('/about') 
                      ? 'none' 
                      : '2px solid rgba(255, 107, 53, 0.4)',
                    borderRadius: '25px',
                    cursor: 'pointer',
                    outline: 'none',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: isActive('/about')
                      ? '0px 8px 25px rgba(255, 107, 53, 0.45), 0px 4px 12px rgba(247, 147, 30, 0.35)'
                      : 'none'
                  }}
                >
                  About
                </motion.button>
              </Link>

              <HeaderProfile />

              <Link
                href="/cart"
                aria-label={`Shopping cart${cartHydrated && totalQuantity > 0 ? `, ${totalQuantity} items` : ''}`}
                className={`sn-cart-circle-btn sn-cart-circle-btn--nav${isActive('/cart') ? ' sn-cart-circle-btn--active' : ''}`}
                style={{ position: 'relative' }}
              >
                <IoCartOutline className="sn-cart-circle-btn__icon" aria-hidden />
                {cartHydrated && totalQuantity > 0 ? (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-2px',
                      right: '-2px',
                      minWidth: '20px',
                      height: '20px',
                      padding: '0 5px',
                      borderRadius: '999px',
                      background: '#e53e3e',
                      color: '#fff',
                      fontSize: '11px',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(229,62,62,0.45)',
                    }}
                  >
                    {totalQuantity > 99 ? '99+' : totalQuantity}
                  </span>
                ) : null}
              </Link>
            </nav>
          )}

          {/* Mobile: profile + cart on bar; hamburger for nav links */}
          {!isAdminPanel && (
            <div
              className="flex md:hidden items-center shrink-0"
              style={{ gap: '8px', zIndex: 10 }}
            >
              <HeaderProfile compact />

              <Link
                href="/cart"
                aria-label={`Shopping cart${cartHydrated && totalQuantity > 0 ? `, ${totalQuantity} items` : ''}`}
                className={`sn-cart-circle-btn sn-cart-circle-btn--nav sn-cart-circle-btn--compact${isActive('/cart') ? ' sn-cart-circle-btn--active' : ''}`}
                style={{ position: 'relative' }}
              >
                <IoCartOutline className="sn-cart-circle-btn__icon" aria-hidden />
                {cartHydrated && totalQuantity > 0 ? (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-2px',
                      right: '-2px',
                      minWidth: '18px',
                      height: '18px',
                      padding: '0 4px',
                      borderRadius: '999px',
                      background: '#e53e3e',
                      color: '#fff',
                      fontSize: '10px',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {totalQuantity > 99 ? '99+' : totalQuantity}
                  </span>
                ) : null}
              </Link>

              <button
                type="button"
                className="flex flex-col p-2"
                style={{ gap: '4px' }}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
                aria-expanded={mobileMenuOpen}
              >
                <span className={`bg-gray-600 block ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} style={{ width: '20px', height: '2px', transition: 'all 0.2s' }} />
                <span className={`bg-gray-600 block ${mobileMenuOpen ? 'opacity-0' : ''}`} style={{ width: '20px', height: '2px', transition: 'all 0.2s' }} />
                <span className={`bg-gray-600 block ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} style={{ width: '20px', height: '2px', transition: 'all 0.2s' }} />
              </button>
            </div>
          )}
        </div>

        {/* Mobile Menu - Hidden in Admin Panel */}
        {!isAdminPanel && mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden pb-4"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <Link href="/" onClick={() => setMobileMenuOpen(false)}>
              <motion.button
                whileTap={{ scale: 0.95 }}
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  fontSize: '15px',
                  fontWeight: isActive('/') ? '600' : '500',
                  color: isActive('/') ? '#ffffff' : '#4a5568',
                  background: isActive('/')
                    ? 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ff8c42 100%)'
                    : 'rgba(255, 107, 53, 0.1)',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.3s ease',
                  boxShadow: isActive('/')
                    ? '0px 6px 20px rgba(255, 107, 53, 0.4), 0px 3px 10px rgba(247, 147, 30, 0.3)'
                    : 'none'
                }}
              >
                Home
              </motion.button>
            </Link>

            <Link href="/shop" onClick={() => setMobileMenuOpen(false)}>
              <motion.button
                whileTap={{ scale: 0.95 }}
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  fontSize: '15px',
                  fontWeight: isActive('/shop') ? '600' : '500',
                  color: isActive('/shop') ? '#ffffff' : '#4a5568',
                  background: isActive('/shop')
                    ? 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ff8c42 100%)'
                    : 'rgba(255, 107, 53, 0.1)',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.3s ease',
                  boxShadow: isActive('/shop')
                    ? '0px 6px 20px rgba(255, 107, 53, 0.4), 0px 3px 10px rgba(247, 147, 30, 0.3)'
                    : 'none'
                }}
              >
                Shop
              </motion.button>
            </Link>

            <Link href="/about" onClick={() => setMobileMenuOpen(false)}>
              <motion.button
                whileTap={{ scale: 0.95 }}
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  fontSize: '15px',
                  fontWeight: isActive('/about') ? '600' : '500',
                  color: isActive('/about') ? '#ffffff' : '#4a5568',
                  background: isActive('/about')
                    ? 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ff8c42 100%)'
                    : 'rgba(255, 107, 53, 0.1)',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.3s ease',
                  boxShadow: isActive('/about')
                    ? '0px 6px 20px rgba(255, 107, 53, 0.4), 0px 3px 10px rgba(247, 147, 30, 0.3)'
                    : 'none'
                }}
              >
                About
              </motion.button>
            </Link>

            <HeaderProfileMobile onNavigate={() => setMobileMenuOpen(false)} />
          </motion.div>
        )}
      </div>
      </div>
      {!isAdminPanel ? <TopAnnouncementBar /> : null}
    </motion.header>
  );
}
