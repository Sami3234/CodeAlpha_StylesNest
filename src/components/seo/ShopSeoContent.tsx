import Link from 'next/link';
import type { CrawlProduct } from '@/lib/seo/products-for-crawl';
import { shopCategories } from '@/lib/seo/site';
import './seo-crawl.css';

type Props = {
  products: CrawlProduct[];
};

/** Server-rendered shop catalog for crawlers — UI unchanged; client grid still hydrates. */
export default function ShopSeoContent({ products }: Props) {
  return (
    <section className="seo-crawl-only" aria-label="Shop catalog">
      <h1>Shop All Products — StylesNest Pakistan</h1>
      <p>
        Browse cosmetics, electronics, clothes, jewelry, watches, bags, men fashion, and general
        store items at StylesNest. Free delivery and cash on delivery across Pakistan. Prices
        shown in PKR.
      </p>
      <nav aria-label="Product categories">
        <h2>Categories</h2>
        <ul>
          {shopCategories.map((cat) => (
            <li key={cat.slug}>
              <Link href={cat.slug === 'all' ? '/shop' : `/shop?category=${cat.slug}`}>
                {cat.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <h2>Product listings</h2>
      {products.length === 0 ? (
        <p>Product catalog loads when the store database is available.</p>
      ) : (
        <ul>
          {products.map((p) => (
            <li key={p.id}>
              <Link href={`/product/${p.id}`}>
                {p.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image} alt={p.name} width={80} height={80} loading="lazy" />
                ) : null}
                <span>
                  {p.name} — {p.price.toLocaleString('en-PK')} PKR ({p.category})
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <p>
        <Link href="/">Home</Link> · <Link href="/about">About &amp; contact</Link>
      </p>
    </section>
  );
}
