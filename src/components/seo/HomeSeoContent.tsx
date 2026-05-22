'use client';

import Link from 'next/link';
import { shopCategories } from '@/lib/seo/site';
import './seo-crawl.css';

/** Server-rendered homepage copy for crawlers — not shown in the UI. */
export default function HomeSeoContent() {
  return (
    <section className="seo-crawl-only" aria-label="About StylesNest">
      <p>
        <strong>StylesNest — Online Shopping in Pakistan with Free Delivery</strong>
      </p>
      <p>
        StylesNest is your trusted online store in Pakistan for cosmetics, electronics, clothes,
        jewelry, watches, bags, men&apos;s fashion, and general store essentials. We deliver
        nationwide with free delivery and cash on delivery (COD) so you can shop safely from
        Vehari and every major city.
      </p>
      <h2>Why shop at StylesNest</h2>
      <ul>
        <li>Genuine products sourced from reliable suppliers and manufacturers</li>
        <li>Competitive prices with seasonal deals on fashion and beauty</li>
        <li>Free delivery across Pakistan on eligible orders</li>
        <li>Cash on delivery — pay when your parcel arrives</li>
        <li>Customer support via WhatsApp, phone, and email</li>
      </ul>
      <h2>Shop by category</h2>
      <p>
        Browse our full catalog on the shop page or jump into a category: imported cosmetics,
        ladies and gents garments, jewelry, watches, makeup, clothes, shoes, electronics,
        bags, men fashion, and general store items.
      </p>
      <ul>
        {shopCategories.map((cat) => (
          <li key={cat.slug}>
            <Link href={cat.slug === 'all' ? '/shop' : `/shop?category=${cat.slug}`}>
              {cat.label}
            </Link>
          </li>
        ))}
      </ul>
      <h2>Delivery and payment in Pakistan</h2>
      <p>
        We ship orders across Pakistan including Punjab, Sindh, KPK, Balochistan, and Islamabad.
        Standard delivery timelines depend on your city; contact us for urgent orders. Payment
        options include cash on delivery and guidance for bank transfer where applicable.
      </p>
      <h2>Returns and authenticity</h2>
      <p>
        We stand behind product authenticity. If you receive an item that does not match the
        listing, reach out within the stated return window on our about page. Our team in
        Vehari, Pakistan reviews every complaint and works with you for exchange or refund
        according to store policy.
      </p>
      <h2>Frequently asked questions</h2>
      <dl>
        <dt>Does StylesNest offer free delivery?</dt>
        <dd>Yes, free delivery is available on eligible products across Pakistan.</dd>
        <dt>Can I pay with cash on delivery?</dt>
        <dd>Yes, COD is supported for most service areas.</dd>
        <dt>What categories do you sell?</dt>
        <dd>
          Cosmetics, electronics, clothes, jewelry, watches, bags, shoes, men fashion, and
          general store products.
        </dd>
        <dt>How do I contact StylesNest?</dt>
        <dd>
          Visit our <Link href="/about#contact">about and contact page</Link> for phone, email,
          and WhatsApp.
        </dd>
        <dt>Where is StylesNest based?</dt>
        <dd>Vehari, Pakistan — serving customers nationwide online.</dd>
      </dl>
      <p>
        <Link href="/shop">Shop all products</Link> · <Link href="/about">About StylesNest</Link>
      </p>
    </section>
  );
}
