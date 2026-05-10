'use client';

import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#eeeeee' }}>
      {/* Header */}
      <Header />
      
      {/* Hero Banner Section */}
      <div 
        style={{ 
          width: '100%',
          backgroundColor: '#eeeeee',
          paddingTop: 'calc(var(--site-header-h, 90px) + clamp(15px, 3vw, 20px))',
          paddingBottom: 'clamp(15px, 3vw, 20px)'
        }}
        className="landing-banner-section"
      >
        <div
          style={{
            maxWidth: '1300px',
            margin: '0 auto',
            paddingLeft: 'clamp(10px, 2vw, 15px)',
            paddingRight: 'clamp(10px, 2vw, 15px)'
          }}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
          >
            <Image
              src="/StylesNest-banner.png"
              alt="StylesNest Banner"
              width={1300}
              height={400}
              style={{
                width: '100%',
                height: 'auto',
                minHeight: 'clamp(200px, 40vw, 400px)',
                maxHeight: '400px',
                objectFit: 'cover',
                display: 'block'
              }}
              priority
              className="landing-banner-image"
            />
          </div>
        </div>
      </div>

      {/* Call to Action Section */}
      <div
        style={{
          maxWidth: '1300px',
          margin: 'clamp(20px, 4vw, 40px) auto',
          paddingLeft: 'clamp(10px, 2vw, 15px)',
          paddingRight: 'clamp(10px, 2vw, 15px)',
          textAlign: 'center'
        }}
        className="landing-cta-section"
      >
        <Link
          href="/"
          style={{
            display: 'inline-block',
            padding: 'clamp(12px, 2.5vw, 16px) clamp(24px, 5vw, 32px)',
            backgroundColor: '#1a1a2e',
            color: '#fff',
            fontSize: 'clamp(14px, 3vw, 18px)',
            fontWeight: '600',
            borderRadius: '10px',
            textDecoration: 'none',
            boxShadow: '0 4px 12px rgba(26, 26, 46, 0.3)',
            transition: 'all 0.3s ease',
            width: '100%',
            maxWidth: '300px'
          }}
          className="landing-cta-button"
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#4CAF50';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#1a1a2e';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          Shop Now →
        </Link>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}

