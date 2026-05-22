import Link from 'next/link';
import { siteConfig } from '@/lib/seo/site';
import './seo-crawl.css';

type Props = {
  phone: string;
  email: string;
  address: string;
};

/** Extra about-page copy for crawlers — hidden from layout; no visual change. */
export default function AboutSeoContent({ phone, email, address }: Props) {
  return (
    <section className="seo-crawl-only" aria-label="About StylesNest extended">
      <h2>Our story and mission</h2>
      <p>
        {siteConfig.name} was built to make quality shopping accessible across Pakistan. From our
        base in {address}, we curate fashion, beauty, electronics, and daily essentials with a
        focus on trust, fair pricing, and reliable delivery.
      </p>
      <h2>Fulfillment and delivery</h2>
      <p>
        Orders are packed and dispatched after confirmation. We coordinate with courier partners
        for nationwide coverage. Delivery times vary by city; customers in major urban centers
        typically receive parcels faster than remote areas. Free delivery applies on eligible
        products as shown on each listing.
      </p>
      <h2>Returns, refunds, and support</h2>
      <p>
        If an item arrives damaged or not as described, contact us with your order details and
        photos. Our team reviews each case and offers replacement, exchange, or refund according
        to published store policy. For order tracking and product questions, use WhatsApp, phone,
        or email.
      </p>
      <h2>Contact information</h2>
      <p>
        Phone: <a href={`tel:${phone.replace(/\s+/g, '')}`}>{phone}</a>
        <br />
        Email: <a href={`mailto:${email}`}>{email}</a>
        <br />
        Address: {address}
      </p>
      <p>
        <Link href="/shop">Shop now</Link> · <Link href="/">Homepage</Link>
      </p>
    </section>
  );
}
