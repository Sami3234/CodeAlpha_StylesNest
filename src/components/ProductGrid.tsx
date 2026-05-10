import ProductCard from './ProductCard';
import { Product } from '@/data/products';

interface ProductGridProps {
  products: Product[];
}

export default function ProductGrid({ products = [] }: ProductGridProps) {
  return (
    <section 
      className="product-grid"
      style={{ 
        paddingTop: '28px',
        paddingBottom: '48px'
      }}
    >
      {/* Container with more width for bigger cards */}
      <div 
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          paddingLeft: 'clamp(12px, 4vw, 20px)',
          paddingRight: 'clamp(12px, 4vw, 20px)'
        }}
      >
        {/* 
          Responsive Grid:
          - Desktop: 4 columns with 24px gap
          - Tablet (640px+): 2 columns
          - Mobile: 1 column
          - Row gap: 28px
        */}
        <div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
          style={{
            columnGap: '12px',
            rowGap: '24px'
          }}
        >
          {products && products.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
        
        {/* Empty State */}
        {(!products || products.length === 0) && (
          <div className="text-center py-16">
            <div style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(240,244,255,0.9) 100%)',
              backdropFilter: 'blur(15px)',
              borderRadius: '28px',
              padding: '50px 30px',
              boxShadow: '0px 12px 35px rgba(102,126,234,0.2), 0px 6px 18px rgba(79,172,254,0.15)',
              border: '2px solid rgba(102,126,234,0.25)',
              maxWidth: '400px',
              margin: '0 auto'
            }}>
              <p style={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #4facfe 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontSize: '20px',
                fontWeight: '600',
                margin: 0
              }}>
                No products found.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

