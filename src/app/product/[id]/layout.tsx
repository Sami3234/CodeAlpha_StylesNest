import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { breadcrumbJsonLd, productJsonLd } from '@/lib/seo/json-ld-builders';
import { getProductReviewSummary } from '@/lib/product-reviews';
import { truncate } from '@/lib/seo/site';
import { sql } from '@/lib/db';
import { ensureProductSchema } from '@/lib/ensure-product-schema';
import { mapProductRow } from '@/lib/product-mapper';

type Props = {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
};

async function getProduct(id: string) {
  const numId = Number(id);
  if (!Number.isFinite(numId)) return null;

  try {
    await ensureProductSchema();
    const rows = await sql`
      SELECT
        id, title_en, title_ar, description_en, description_ar,
        current_price, image, category, status
      FROM products
      WHERE id = ${numId}
      LIMIT 1
    `;
    if (!rows.length) return null;
    const product = mapProductRow(rows[0] as Record<string, unknown>);
    if (product.status === 'inactive') return null;
    return product;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return buildPageMetadata({
      title: 'Product Not Found',
      description: 'This product is not available.',
      path: `/product/${id}`,
      noIndex: true,
    });
  }

  const title = product.title.en || 'Product';
  const description =
    product.description.en ||
    `Buy ${title} at StylesNest with free delivery in Pakistan.`;

  return buildPageMetadata({
    title,
    description: truncate(description, 155),
    path: `/product/${id}`,
    image: product.image,
    keywords: [product.category, title, 'buy online Pakistan', 'COD'],
  });
}

export default async function ProductLayout({ params, children }: Props) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return children;
  }

  const name = product.title.en || 'Product';
  const description =
    product.description.en ||
    `Buy ${name} at StylesNest with free delivery in Pakistan.`;

  let reviewSummary = { averageRating: 0, totalCount: 0 };
  try {
    reviewSummary = await getProductReviewSummary(product.id);
  } catch {
    /* reviews optional for schema */
  }

  const jsonLd = [
    productJsonLd({
      id: product.id,
      name,
      description: truncate(description, 300),
      image: product.image,
      price: product.currentPrice,
      category: product.category,
      averageRating: reviewSummary.averageRating,
      reviewCount: reviewSummary.totalCount,
    }),
    breadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Shop', path: '/shop' },
      { name, path: `/product/${id}` },
    ]),
  ];

  return (
    <>
      <JsonLd data={jsonLd} />
      {children}
    </>
  );
}
