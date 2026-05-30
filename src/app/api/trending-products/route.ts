import { NextResponse } from 'next/server';
import { fetchPinnedTrendingProductIds } from '@/lib/trending-product-ids';
import { MAX_TRENDING_PRODUCTS } from '@/lib/trending-products';

export const dynamic = 'force-dynamic';

/** Public: ordered trending product ids for home strip */
export async function GET() {
  try {
    const ids = (await fetchPinnedTrendingProductIds()).slice(0, MAX_TRENDING_PRODUCTS);

    return NextResponse.json(
      { success: true, ids },
      {
        headers: { 'Cache-Control': 'no-store, must-revalidate' },
      }
    );
  } catch (error) {
    console.error('trending-products GET:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load trending products', ids: [] },
      { status: 500 }
    );
  }
}
