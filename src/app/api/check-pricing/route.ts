import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const products = await sql`
      SELECT id, title_en, current_price, pricing_tiers
      FROM products
      LIMIT 3
    `;

    const analysis = products.map(p => ({
      id: p.id,
      title: p.title_en.substring(0, 30),
      price: p.current_price,
      pricingTiers: p.pricing_tiers,
      isArray: Array.isArray(p.pricing_tiers),
      length: Array.isArray(p.pricing_tiers) ? p.pricing_tiers.length : 'N/A',
      type: typeof p.pricing_tiers,
    }));

    return NextResponse.json({ products: analysis });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

