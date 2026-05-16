import fs from 'fs';

const pagePath = 'src/app/admin/products/page.tsx';
const outPath = 'src/components/admin/ProductForm.tsx';
const lines = fs.readFileSync(pagePath, 'utf8').split(/\r?\n/);
const body = lines.slice(129, 1763).join('\n');

const header = `'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { categories, Product } from '@/data/products';
import { useToast } from '@/components/Toast';
import { getProductTitle, getProductDescription } from '@/utils/getProductText';
import {
  CLOTHES_SIZE_OPTIONS,
  DEFAULT_CLOTHES_OPTIONS,
  isClothesCategory,
  isClothesSizeRequired,
  validateClothesOptions,
  type ClothesOptions,
} from '@/lib/clothes-options';
import { adminProductT, type AdminProductTFunction, isValidProductImageUrl } from '@/lib/admin/product-form-shared';

export interface ProductFormProps {
  product: Product | null;
  onSave: (product: Product | Partial<Product>) => void | Promise<void>;
  onCancel: () => void;
  t?: AdminProductTFunction;
}

`;

let transformed = body
  .replace(
    'function ProductModal({ isOpen, onClose, product, onSave, t }: ProductModalProps) {',
    'export default function ProductForm({ product, onSave, onCancel, t: tProp }: ProductFormProps) {'
  )
  .replace('  if (!isOpen) return null;\n\n  const steps', '  const t = tProp ?? adminProductT;\n\n  const steps')
  .replaceAll('onClose', 'onCancel')
  .replaceAll('isValidUrl', 'isValidProductImageUrl')
  .replace("maxHeight: '400px', overflowY: 'auto'", "minHeight: '480px', padding: '32px 28px'");

const pageWrapperStart = `  return (
    <motion.div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
      onClick={onCancel}
    >
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '600px',
          maxHeight: '90vh',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >`;

const pageWrapperNew = `  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', width: '100%', paddingBottom: '32px' }}>
      <div style={{ marginBottom: '20px' }}>
        <Link
          href="/admin/products"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: '#64748b',
            fontSize: '14px',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to products
        </Link>
      </div>
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '16px',
          width: '100%',
          overflow: 'hidden',
          boxShadow: '0 4px 24px rgba(15, 23, 42, 0.08)',
          border: '1px solid #e2e8f0',
        }}
      >`;

if (!transformed.includes('export default function ProductForm')) {
  console.error('Failed to transform ProductModal header');
  process.exit(1);
}

transformed = transformed.replace(pageWrapperStart, pageWrapperNew);

// Fix header close button - use Link instead of onCancel for X? Keep onCancel button
transformed = transformed.replace(
  `          maxWidth: '600px',
          maxHeight: '90vh',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',`,
  ''
);

fs.writeFileSync(outPath, header + transformed);
console.log('Wrote', outPath, 'lines:', (header + transformed).split('\n').length);
