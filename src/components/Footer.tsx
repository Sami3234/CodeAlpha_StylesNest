'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { FOOTER_WORDMARK_GRADIENT } from '@/lib/brand-wordmark';
import { FooterSocialLinks } from '@/components/FooterSocialLinks';
import { useContactSettings } from '@/context/ContactSettingsContext';
import { DEFAULT_FOOTER_SERVICES } from '@/lib/sanitize-contact-extras';

export default function Footer() {
  const { settings: contactInfo } = useContactSettings();

  return (
    <footer 
      className="site-footer"
      style={{ 
        background: 'linear-gradient(180deg, #2d3748 0%, #1a202c 100%)',
        color: '#fff',
        borderTop: '4px solid transparent',
        borderImage: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ff8c42 100%) 1',
        marginTop: 'clamp(40px, 10vw, 80px)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background Pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.05,
        backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)',
        backgroundSize: '40px 40px'
      }} />
      
      {/* Centered Container */}
      <div 
        style={{ 
          maxWidth: '1400px',
          margin: '0 auto',
          padding: 'clamp(48px, 10vw, 80px) clamp(16px, 4vw, 30px) clamp(28px, 5vw, 40px)',
          position: 'relative',
          zIndex: 1
        }}
      >
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
            gap: 'clamp(28px, 6vw, 50px)',
            marginBottom: 'clamp(28px, 6vw, 50px)'
          }}
        >
          
          {/* Company Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h3
              className="overflow-visible pb-[0.08em] leading-[1.28] tracking-[0.03em]"
              style={{
                fontFamily:
                  'var(--font-brand-mark), Georgia, "Times New Roman", serif',
                fontSize: 'clamp(1.45rem, 2.8vw, 1.95rem)',
                fontWeight: 700,
                fontStyle: 'italic',
                marginBottom: '25px',
                background: FOOTER_WORDMARK_GRADIENT,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              StylesNest
            </h3>
            <p style={{ 
              color: '#cbd5e0', 
              fontSize: '15px', 
              lineHeight: '1.8', 
              marginBottom: '30px' 
            }}>
              Your trusted destination for premium products with unbeatable deals and free delivery across Pakistan.
            </p>
            <div style={{ display: 'flex', gap: '15px', marginTop: '25px' }}>
              <FooterSocialLinks settings={contactInfo} />
            </div>
          </motion.div>

          {/* Useful Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h4 
              style={{
                color: '#fff',
                fontWeight: '700',
                fontSize: '20px',
                marginBottom: '25px',
                fontFamily: 'var(--font-poppins), Arial, sans-serif',
                letterSpacing: '0.5px'
              }}
            >
              Quick Links
            </h4>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '15px', listStyle: 'none', padding: 0, margin: 0 }}>
              {[
                { href: '/shop', label: 'Home' },
                { href: '/shop', label: 'Shop' },
                { href: '/about', label: 'About Us' },
                { href: '/about#contact', label: 'Contact Us' },
                { href: '/privacy-policy', label: 'Privacy Policy' },
                { href: '/terms', label: 'Terms & Conditions' },
                { href: '/shipping-delivery', label: 'Shipping & Delivery' },
                { href: '/returns-refunds', label: 'Returns & Refunds' },
              ].map((link, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
                >
                  <Link 
                    href={link.href}
                    style={{ 
                      color: '#cbd5e0', 
                      fontSize: '15px',
                      textDecoration: 'none',
                      transition: 'all 0.3s ease',
                      display: 'inline-block',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#ff6b35';
                      e.currentTarget.style.transform = 'translateX(5px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#cbd5e0';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    {link.label}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h4 
              style={{
                color: '#fff',
                fontWeight: '700',
                fontSize: '20px',
                marginBottom: '25px',
                fontFamily: 'var(--font-poppins), Arial, sans-serif',
                letterSpacing: '0.5px'
              }}
            >
              Contact Info
            </h4>
            <div style={{ color: '#cbd5e0', fontSize: '15px', lineHeight: '2.2' }}>
              {contactInfo.address?.trim() ? (
                <motion.p
                  whileHover={{ x: 5 }}
                  style={{ margin: '12px 0', display: 'flex', alignItems: 'center', gap: '12px' }}
                >
                  <span style={{ fontSize: '18px' }}>📍</span>
                  <span>{contactInfo.address}</span>
                </motion.p>
              ) : null}
              {contactInfo.phone?.trim() ? (
                <motion.p
                  whileHover={{ x: 5 }}
                  style={{ margin: '12px 0', display: 'flex', alignItems: 'center', gap: '12px' }}
                >
                  <span style={{ fontSize: '18px' }}>📞</span>
                  <a
                    href={`tel:${contactInfo.phone.replace(/\s+/g, '')}`}
                    style={{
                      color: '#ff6b35',
                      textDecoration: 'none',
                      fontWeight: '500',
                      transition: 'color 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#f7931e';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#ff6b35';
                    }}
                  >
                    {contactInfo.phone}
                  </a>
                </motion.p>
              ) : null}
              {contactInfo.email?.trim() ? (
                <motion.p
                  whileHover={{ x: 5 }}
                  style={{ margin: '12px 0', display: 'flex', alignItems: 'center', gap: '12px' }}
                >
                  <span style={{ fontSize: '18px' }}>✉️</span>
                  <a
                    href={`mailto:${contactInfo.email}`}
                    style={{
                      color: '#ff6b35',
                      textDecoration: 'none',
                      fontWeight: '500',
                      transition: 'color 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#f7931e';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#ff6b35';
                    }}
                  >
                    {contactInfo.email}
                  </a>
                </motion.p>
              ) : null}
            </div>
          </motion.div>

          {/* Payment & Services */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h4 
              style={{
                color: '#fff',
                fontWeight: '700',
                fontSize: '20px',
                marginBottom: '25px',
                fontFamily: 'var(--font-poppins), Arial, sans-serif',
                letterSpacing: '0.5px'
              }}
            >
              Services
            </h4>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '15px', listStyle: 'none', padding: 0, margin: 0 }}>
              {(contactInfo.footer_services?.length
                ? contactInfo.footer_services
                : [...DEFAULT_FOOTER_SERVICES]
              ).map((service, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                  whileHover={{ x: 5 }}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px',
                    color: '#cbd5e0',
                    fontSize: '15px'
                  }}
                >
                  <span style={{ 
                    color: '#ff6b35',
                    fontSize: '18px',
                    fontWeight: '700'
                  }}>✓</span>
                  <span>{service}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

        </div>

        {/* Bottom Bar */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{
            borderTop: '2px solid rgba(255, 107, 53, 0.2)',
            paddingTop: '35px',
            marginTop: '50px',
            textAlign: 'center'
          }}
        >
          <p style={{ 
            color: '#cbd5e0', 
            fontSize: '15px', 
            margin: 0,
            fontWeight: '500'
          }}>
            © {new Date().getFullYear()} StylesNest. All rights reserved.
          </p>
        </motion.div>
      </div>
    </footer>
  );
}
