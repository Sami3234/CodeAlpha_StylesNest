import Link from 'next/link';
import { shopCategories, siteConfig } from '@/lib/seo/site';
import './seo-crawl.css';

/** Server-rendered homepage copy for crawlers — visually hidden, full word count for SEO. */
export default function HomeSeoContent() {
  return (
    <section className="seo-crawl-only" aria-label="About StylesNest">
      <h1>StylesNest — Online Shopping in Pakistan with Free Delivery</h1>
      <p>
        <strong>{siteConfig.name}</strong> is a Pakistan-based online store offering cosmetics,
        electronics, clothes, jewelry, watches, bags, men&apos;s fashion, shoes, and general store
        essentials. We serve customers nationwide from {siteConfig.address} with free delivery on
        eligible orders and cash on delivery (COD) for a safe, convenient checkout experience.
      </p>
      <h2>Why shop at StylesNest</h2>
      <p>
        We focus on genuine products, competitive PKR pricing, and reliable courier partners across
        Punjab, Sindh, KPK, Balochistan, and Islamabad. Every listing includes clear product
        details, images, and category navigation so you can compare options before you order.
        Our team responds on WhatsApp, phone ({siteConfig.phone}), and email ({siteConfig.contactEmail})
        for order updates and product questions.
      </p>
      <ul>
        <li>Genuine products sourced from reliable suppliers and manufacturers</li>
        <li>Competitive prices with seasonal deals on fashion and beauty</li>
        <li>Free delivery across Pakistan on eligible orders</li>
        <li>Cash on delivery — pay when your parcel arrives</li>
        <li>Customer support via WhatsApp, phone, and email</li>
      </ul>
      <h2>Shop by category</h2>
      <p>
        Browse our full catalog on the shop page or jump into a category. Imported cosmetics and
        makeup include international brands with authentic quality. Our garments and clothes
        collections cover lawn suits, casual wear, and seasonal fashion. Jewelry and watches add
        finishing touches for everyday and occasion wear. Electronics bring useful gadgets for home
        and mobile. Bags and men fashion round out your wardrobe, while the general store section
        covers daily essentials and household items.
      </p>
      <ul>
        {shopCategories.map((cat) => (
          <li key={cat.slug}>
            <Link href={cat.slug === 'all' ? '/shop' : `/shop?category=${cat.slug}`}>
              {cat.label}
            </Link>
            {' — '}
            {cat.slug === 'cosmetics' &&
              'Skincare, serums, and imported beauty products delivered to your door.'}
            {cat.slug === 'jewelry' &&
              'Rings, necklaces, bracelets, and fashion jewelry for every look.'}
            {cat.slug === 'electronics' &&
              'Mobile accessories, gadgets, and tech for modern lifestyle.'}
            {cat.slug === 'clothes' &&
              'Trendy outfits, lawn, and unstitched fabrics for men and women.'}
            {cat.slug === 'general' &&
              'Daily essentials, household items, and multipurpose store picks.'}
          </li>
        ))}
      </ul>
      <h2>Delivery and payment in Pakistan</h2>
      <p>
        We ship orders across Pakistan including major cities and smaller towns. Standard delivery
        timelines depend on your city and courier load; contact us for urgent orders. Payment
        options include cash on delivery and guidance for bank transfer where applicable. Prices on
        the website are shown in Pakistani Rupees (PKR) unless stated otherwise.
      </p>
      <h2>Returns, authenticity, and trust</h2>
      <p>
        We stand behind product authenticity. If you receive an item that does not match the
        listing or arrives damaged, reach out within the return window described on our about page.
        Our team in Vehari reviews each case and works with you for exchange or refund according to
        store policy. Customer reviews on product pages reflect real delivered orders after
        moderation.
      </p>
      <h2>Frequently asked questions</h2>
      <dl>
        <dt>Does StylesNest offer free delivery?</dt>
        <dd>Yes, free delivery is available on eligible products across Pakistan.</dd>
        <dt>Can I pay with cash on delivery?</dt>
        <dd>Yes, COD is supported for most service areas.</dd>
        <dt>What categories do you sell?</dt>
        <dd>
          Cosmetics, electronics, clothes, jewelry, watches, bags, shoes, men fashion, and general
          store products.
        </dd>
        <dt>How do I contact StylesNest?</dt>
        <dd>
          Visit our <Link href="/about#contact">about and contact page</Link> for phone, email,
          and WhatsApp.
        </dd>
        <dt>Where is StylesNest based?</dt>
        <dd>Vehari, Pakistan — serving customers nationwide online.</dd>
        <dt>How long does delivery take?</dt>
        <dd>
          Most orders arrive within a few business days depending on your city; remote areas may
          take longer.
        </dd>
        <dt>Are products original?</dt>
        <dd>
          We source from trusted suppliers and describe each item accurately on its product page.
        </dd>
      </dl>
      <p>
        <Link href="/shop">Shop all products</Link> · <Link href="/about">About StylesNest</Link>
      </p>
    </section>
  );
}
