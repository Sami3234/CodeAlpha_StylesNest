'use client';

import { useState, useRef, useEffect, type CSSProperties } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, MotionStyle } from 'framer-motion';
import { WORDMARK_GRADIENT } from '@/lib/brand-wordmark';
import TopAnnouncementBar from '@/components/TopAnnouncementBar';
import { IoBagOutline } from 'react-icons/io5';
import { useCart } from '@/context/CartContext';

const LOGO_MARK = '/StylesNest_Transparent.png';

function BrandMark() {
  return (
    <span className="inline-flex min-w-0 flex-row items-center gap-2 overflow-visible sm:gap-3 md:gap-4">
      <span className="inline-flex h-[48px] max-h-[48px] shrink-0 items-center justify-center leading-none sm:h-[56px] sm:max-h-[56px] md:h-[66px] md:max-h-[66px]">
        <Image
          src={LOGO_MARK}
          alt=""
          width={508}
          height={390}
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
  const isAdminPanel = pathname?.startsWith('/admin') || false;
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

  // Disable animations for admin panel
  const headerAnimationProps = isAdminPanel ? {
    initial: false,
    animate: false,
    transition: { duration: 0 }
  } : {
    initial: { y: -100, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: { duration: 0.5, ease: 'easeOut' }
  };

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
            justifyContent: isAdminPanel ? 'center' : 'space-between'
          }}
        >
          {/* Logo - Centered in Admin, Left in Regular */}
          {isAdminPanel ? (
            <div
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'center'
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
                  zIndex: 10
                }}
              >
                <BrandMark />
              </Link>
            </div>
          ) : (
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
              style={{
                width: 'auto',
                minWidth: 0,
                display: 'flex',
                justifyContent: 'center'
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
            </motion.div>
          )}

          {/* Navigation Buttons - Hidden in Admin Panel */}
          {!isAdminPanel && (
            <motion.nav 
              className="hidden md:flex items-center gap-3"
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
            >
              <Link href="/">
                <motion.button
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
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
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.5 }}
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
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.55 }}
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

              <Link
                href="/cart"
                aria-label={`Shopping cart${cartHydrated && totalQuantity > 0 ? `, ${totalQuantity} items` : ''}`}
                style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <motion.span
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.6 }}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    border: isActive('/cart') ? 'none' : '2px solid rgba(255, 107, 53, 0.45)',
                    background: isActive('/cart')
                      ? 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ff8c42 100%)'
                      : 'rgba(255, 255, 255, 0.95)',
                    boxShadow: isActive('/cart')
                      ? '0px 8px 22px rgba(255, 107, 53, 0.45)'
                      : '0px 4px 12px rgba(0,0,0,0.08)',
                    cursor: 'pointer',
                    color: isActive('/cart') ? '#fff' : '#4a5568',
                  }}
                >
                  <IoBagOutline size={22} aria-hidden />
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
                </motion.span>
              </Link>
            </motion.nav>
          )}

          {/* Mobile Menu Toggle - Hidden in Admin Panel */}
          {!isAdminPanel && (
            <button 
              type="button"
              className="md:hidden flex flex-col p-2"
              style={{ gap: '4px', zIndex: 10 }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <span className={`bg-gray-600 block ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} style={{ width: '20px', height: '2px', transition: 'all 0.2s' }}></span>
              <span className={`bg-gray-600 block ${mobileMenuOpen ? 'opacity-0' : ''}`} style={{ width: '20px', height: '2px', transition: 'all 0.2s' }}></span>
              <span className={`bg-gray-600 block ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} style={{ width: '20px', height: '2px', transition: 'all 0.2s' }}></span>
            </button>
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

            <Link href="/cart" onClick={() => setMobileMenuOpen(false)}>
              <motion.button
                whileTap={{ scale: 0.95 }}
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  fontSize: '15px',
                  fontWeight: isActive('/cart') ? '600' : '500',
                  color: isActive('/cart') ? '#ffffff' : '#4a5568',
                  background: isActive('/cart')
                    ? 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ff8c42 100%)'
                    : 'rgba(255, 107, 53, 0.1)',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  boxShadow: isActive('/cart')
                    ? '0px 6px 20px rgba(255, 107, 53, 0.4), 0px 3px 10px rgba(247, 147, 30, 0.3)'
                    : 'none'
                }}
              >
                <IoBagOutline size={20} aria-hidden />
                Cart
                {cartHydrated && totalQuantity > 0 ? (
                  <span
                    style={{
                      marginLeft: 'auto',
                      minWidth: '24px',
                      height: '22px',
                      padding: '0 6px',
                      borderRadius: '999px',
                      background: '#e53e3e',
                      color: '#fff',
                      fontSize: '12px',
                      fontWeight: 800,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {totalQuantity > 99 ? '99+' : totalQuantity}
                  </span>
                ) : null}
              </motion.button>
            </Link>
          </motion.div>
        )}
      </div>
      </div>
      {!isAdminPanel ? <TopAnnouncementBar /> : null}
    </motion.header>
  );
}
