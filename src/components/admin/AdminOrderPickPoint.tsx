'use client';

import type { Product } from '@/data/products';
import type { OrderProduct } from '@/types/order';
import { resolveOrderLinePickPoint } from '@/lib/order-product-line';

type Props = {
  line: OrderProduct;
  catalog?: Product[];
  compact?: boolean;
};

export default function AdminOrderPickPoint({ line, catalog, compact }: Props) {
  const pickPoint = resolveOrderLinePickPoint(line, catalog);
  if (!pickPoint) return null;

  if (compact) {
    return (
      <span
        style={{
          display: 'inline-block',
          marginTop: '2px',
          fontSize: '11px',
          fontWeight: 600,
          color: '#c2410c',
        }}
        title="Warehouse pick location"
      >
        📍 {pickPoint}
      </span>
    );
  }

  return (
    <p
      style={{
        fontSize: '12px',
        fontWeight: 600,
        color: '#c2410c',
        margin: '0 0 4px',
        lineHeight: 1.4,
      }}
      title="Warehouse pick location"
    >
      📍 Pick: {pickPoint}
    </p>
  );
}
