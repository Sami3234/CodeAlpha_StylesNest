'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/data/products';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { getProductTitle } from '@/utils/getProductText';
import { IoBagAddOutline } from 'react-icons/io5';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/utils/formatPrice';
import AddToCartOptionsModal from '@/components/AddToCartOptionsModal';
import ClothesStitchBadge, { ClothesMetaRow, ShoesGenderBadge } from '@/components/ClothesImageBadges';
import { ProductShortSummary } from '@/components/ProductMetaDisplay';
import { productNeedsCartOptions } from '@/lib/cart-line-options';
import { isOutOfStock, validateStockForAdd } from '@/lib/product-stock';

interface ProductCardProps {
  product: Product;
  index?: number;
}

export default function ProductCard({ product, index = 0 }: ProductCardProps) {
  const [imgError, setImgError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [optionsModalOpen, setOptionsModalOpen] = useState(false);
  const { addToCart, lines } = useCart();
  const needsOptions = productNeedsCartOptions(product);
  const outOfStock = isOutOfStock(product);
  const inCart = !needsOptions && lines.some((l) => l.productId === product.id);
  const addDisabled = outOfStock || inCart;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <motion.article
        className="product-card"
        style={{
          background: isHovered
            ? 'linear-gradient(145deg, #ffffff 0%, #f7fafc 50%, #edf2f7 100%)'
            : 'linear-gradient(145deg, #ffffff 0%, #f0f4ff 100%)',
          borderRadius: '28px',
          boxShadow: isHovered
            ? '0px 25px 60px rgba(102, 126, 234, 0.3), 0px 10px 25px rgba(79, 172, 254, 0.25), 0px 0px 0px 1px rgba(102, 126, 234, 0.1), inset 0px 2px 4px rgba(255,255,255,0.9)'
            : '0px 12px 35px rgba(102, 126, 234, 0.15), 0px 5px 15px rgba(79, 172, 254, 0.1), 0px 0px 0px 1px rgba(102, 126, 234, 0.08)',
          padding: 'clamp(14px, 4vw, 28px)',
          overflow: 'hidden',
          position: 'relative',
          border: isHovered ? '2px solid rgba(102, 126, 234, 0.4)' : '1px solid rgba(102, 126, 234, 0.2)',
          backdropFilter: 'blur(15px)',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ y: -10, scale: 1.03 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      >
        <Link href={`/product/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <div
            className="product-image-wrapper relative overflow-hidden"
            style={{
              borderRadius: '16px',
              boxShadow: isHovered
                ? '0px 8px 25px rgba(0,0,0,0.12), inset 0px 1px 0px rgba(255,255,255,0.5)'
                : '0px 4px 15px rgba(0,0,0,0.08)',
              transition: 'all 0.3s ease',
            }}
          >
            <motion.span
              className="badge-discount absolute z-10"
              style={{
                top: '12px',
                right: '12px',
                background: 'linear-gradient(135deg, #e53e3e 0%, #c53030 50%, #fc8181 100%)',
                color: '#fff',
                fontSize: '12px',
                fontWeight: '700',
                padding: '8px 16px',
                borderRadius: '30px',
                boxShadow: '0px 6px 20px rgba(229, 62, 62, 0.6), 0px 3px 10px rgba(197, 48, 48, 0.4)',
                letterSpacing: '0.7px',
                textTransform: 'uppercase',
                border: '1px solid rgba(255,255,255,0.4)',
              }}
              whileHover={{ scale: 1.05 }}
            >
              {product.discount}% OFF
            </motion.span>

            <div
              className="relative"
              style={{
                paddingBottom: '100%',
                overflow: 'hidden',
                borderRadius: '14px',
              }}
            >
              {!imgError ? (
                <Image
                  src={product.image}
                  alt={
                    getProductTitle(product) ||
                    (typeof product.title === 'object' ? product.title.en : String(product.title || 'Product'))
                  }
                  fill
                  className="object-cover"
                  style={{
                    borderRadius: '14px',
                    transform: isHovered ? 'scale(1.08)' : 'scale(1)',
                    transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  onError={() => setImgError(true)}
                  unoptimized
                />
              ) : (
                <div
                  className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400 text-sm"
                  style={{ borderRadius: '14px' }}
                >
                  Image
                </div>
              )}
            </div>

            <ClothesStitchBadge product={product} />
            <ShoesGenderBadge product={product} />

            {product.freeDelivery && (
              <motion.span
                className="badge-delivery absolute z-10"
                style={{
                  bottom: '12px',
                  left: '12px',
                  background: 'linear-gradient(135deg, #38a169 0%, #2f855a 50%, #48bb78 100%)',
                  color: 'white',
                  fontSize: '11px',
                  fontWeight: '600',
                  padding: '7px 14px',
                  borderRadius: '30px',
                  boxShadow: '0px 6px 20px rgba(56, 161, 105, 0.6), 0px 3px 10px rgba(47, 133, 90, 0.4)',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                  border: '1px solid rgba(255,255,255,0.4)',
                }}
                whileHover={{ scale: 1.05 }}
              >
                Free Delivery
              </motion.span>
            )}
          </div>
        </Link>

        <div style={{ paddingTop: '16px', paddingBottom: '6px' }}>
          <h3
            className="product-title line-clamp-2"
            style={{
              marginTop: '0px',
              fontSize: '18px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #4facfe 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              lineHeight: '1.5',
              minHeight: '48px',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              letterSpacing: '0.2px',
            }}
            suppressHydrationWarning
          >
            {getProductTitle(product) ||
              (typeof product.title === 'object' ? product.title.en : String(product.title || 'Product'))}
          </h3>

          <ProductShortSummary product={product} compact />

          <ClothesMetaRow product={product} />

          <div className="product-pricing flex items-baseline" style={{ marginTop: '8px', gap: '12px' }}>
            <motion.span
              className="current-price font-bold"
              style={{
                background: 'linear-gradient(135deg, #ff6b9d 0%, #c44569 50%, #f093fb 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontSize: '22px',
                fontWeight: '800',
                letterSpacing: '0.5px',
              }}
              whileHover={{ scale: 1.05 }}
            >
              {formatPrice(product.currentPrice)} PKR
            </motion.span>
            <span
              className="original-price line-through"
              style={{ color: '#999999', fontSize: '14px', fontWeight: '400' }}
            >
              {formatPrice(product.originalPrice)} PKR
            </span>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '10px',
            marginTop: '8px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(102, 126, 234, 0.15)',
          }}
        >
          <Link
            href={`/product/${product.id}`}
            style={{
              flex: 1,
              textDecoration: 'none',
              display: 'flex',
            }}
          >
            <motion.span
              style={{
                width: '100%',
                textAlign: 'center',
                padding: '12px 16px',
                fontSize: '14px',
                fontWeight: 700,
                borderRadius: '999px',
                border: '2px solid rgba(255, 107, 53, 0.55)',
                color: '#c05621',
                background: 'rgba(255, 107, 53, 0.08)',
                cursor: 'pointer',
              }}
              whileHover={{ scale: 1.02, background: 'rgba(255, 107, 53, 0.14)' }}
              whileTap={{ scale: 0.98 }}
            >
              View
            </motion.span>
          </Link>
          <motion.button
            type="button"
            disabled={addDisabled}
            aria-label={
              outOfStock
                ? `${getProductTitle(product)} is out of stock`
                : inCart
                  ? `${getProductTitle(product) || 'Product'} is already in your cart`
                  : `Add ${getProductTitle(product) || 'product'} to cart`
            }
            aria-disabled={addDisabled}
            onClick={() => {
              if (addDisabled) return;
              if (needsOptions) {
                setOptionsModalOpen(true);
                return;
              }
              const check = validateStockForAdd(product, lines, 1);
              if (!check.ok) {
                alert(check.error);
                return;
              }
              addToCart(product.id, check.quantity);
            }}
            style={{
              flexShrink: 0,
              width: '52px',
              height: '48px',
              borderRadius: '14px',
              border: 'none',
              cursor: addDisabled ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: inCart
                ? 'linear-gradient(145deg, #e2e8f0 0%, #cbd5e1 100%)'
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: inCart ? '#94a3b8' : '#fff',
              boxShadow: inCart ? 'none' : '0 8px 22px rgba(102, 126, 234, 0.35)',
              opacity: inCart ? 0.85 : 1,
            }}
            whileHover={inCart ? undefined : { scale: 1.05 }}
            whileTap={inCart ? undefined : { scale: 0.95 }}
          >
            <IoBagAddOutline size={24} aria-hidden />
          </motion.button>
        </div>
      </motion.article>

      <AddToCartOptionsModal
        product={product}
        open={optionsModalOpen}
        onClose={() => setOptionsModalOpen(false)}
        onConfirm={(options, quantity) => {
          const check = validateStockForAdd(product, lines, quantity, options);
          if (!check.ok) {
            alert(check.error);
            return;
          }
          addToCart(product.id, check.quantity, options);
        }}
      />
    </motion.div>
  );
}
