'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/data/products';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { getProductTitle } from '@/utils/getProductText';
import { IoCartOutline } from 'react-icons/io5';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/utils/formatPrice';
import AddToCartOptionsModal from '@/components/AddToCartOptionsModal';
import { ClothesMetaRow } from '@/components/ClothesImageBadges';
import ProductCardImageOverlays from '@/components/ProductCardImageOverlays';
import ProductCardTags from '@/components/ProductCardTags';
import { ProductShortSummary } from '@/components/ProductMetaDisplay';
import { productNeedsCartOptions } from '@/lib/cart-line-options';
import { isOutOfStock, validateStockForAdd } from '@/lib/product-stock';
import { notifyError, notifySuccess } from '@/lib/notify';

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
            <div
              className="product-image-frame relative"
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

              <ProductCardImageOverlays product={product} />
            </div>
          </div>
        </Link>

        <ProductCardTags product={product} />

        <div style={{ paddingTop: '12px', paddingBottom: '6px' }}>
          <h3
            className="product-title line-clamp-2"
            style={{
              marginTop: '0px',
              fontSize: '17px',
              color: '#1e293b',
              lineHeight: '1.45',
              minHeight: '48px',
              fontWeight: '700',
              transition: 'color 0.3s ease',
              letterSpacing: '-0.01em',
            }}
            suppressHydrationWarning
          >
            {getProductTitle(product) ||
              (typeof product.title === 'object' ? product.title.en : String(product.title || 'Product'))}
          </h3>

          <ProductShortSummary product={product} compact />

          <ClothesMetaRow product={product} />

          <div className="product-card-pricing">
            <span className="product-card-price">
              {formatPrice(product.currentPrice)}
              <span className="product-card-price__currency">PKR</span>
            </span>
            {product.originalPrice > product.currentPrice ? (
              <span className="product-card-price--old">{formatPrice(product.originalPrice)}</span>
            ) : null}
          </div>
        </div>

        <div className="product-card-actions">
          <Link href={`/product/${product.id}`} className="product-card-view-btn">
            View
          </Link>
          <motion.button
            type="button"
            className="sn-cart-circle-btn product-card-add-btn"
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
                notifyError(check.error ?? 'Could not add to cart.');
                return;
              }
              addToCart(product.id, check.quantity);
              notifySuccess('Added to cart');
            }}
            whileTap={addDisabled ? undefined : { scale: 0.94 }}
          >
            <IoCartOutline className="sn-cart-circle-btn__icon" aria-hidden />
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
            notifyError(check.error ?? 'Could not add to cart.');
            return;
          }
          addToCart(product.id, check.quantity, options);
          notifySuccess('Added to cart');
          setOptionsModalOpen(false);
        }}
      />
    </motion.div>
  );
}
