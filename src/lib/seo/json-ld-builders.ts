import type { SchemaContact } from '@/lib/seo/contact-for-schema';
import { phoneToE164 } from '@/lib/seo/contact-for-schema';
import { absoluteUrl, getSiteUrl, shopCategories, siteConfig } from '@/lib/seo/site';

export function organizationJsonLd(contact?: SchemaContact) {
  const phone = contact?.phone ?? siteConfig.phone;
  const email = contact?.email ?? siteConfig.contactEmail;
  const addressLine = contact?.address ?? siteConfig.address;

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.name,
    url: getSiteUrl(),
    logo: {
      '@type': 'ImageObject',
      url: absoluteUrl(siteConfig.logoPath),
      width: 512,
      height: 512,
    },
    email,
    telephone: phoneToE164(phone),
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Vehari',
      addressRegion: 'Punjab',
      addressCountry: 'PK',
      streetAddress: addressLine,
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: phoneToE164(phone),
      contactType: 'customer service',
      email,
      availableLanguage: ['en', 'ur'],
      areaServed: siteConfig.country,
    },
    areaServed: {
      '@type': 'Country',
      name: siteConfig.country,
    },
    ...(contact?.sameAs?.length ? { sameAs: contact.sameAs } : {}),
  };
}

/** Helps Google understand main nav / category links (sitelinks hints). */
export function siteNavigationJsonLd() {
  const navItems = [
    { name: 'Shop All Products', path: '/shop' },
    { name: 'About & Contact', path: '/about' },
    ...shopCategories
      .filter((c) => c.slug !== 'all')
      .map((c) => ({
        name: c.label,
        path: `/shop?category=${c.slug}`,
      })),
  ];

  return navItems.map((item, index) => ({
    '@context': 'https://schema.org',
    '@type': 'SiteNavigationElement',
    position: index + 1,
    name: item.name,
    url: absoluteUrl(item.path),
  }));
}

export function websiteJsonLd(contact?: SchemaContact) {
  const navParts = siteNavigationJsonLd();

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    url: getSiteUrl(),
    description: siteConfig.description,
    inLanguage: siteConfig.language,
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
      logo: absoluteUrl(siteConfig.logoPath),
      ...(contact?.sameAs?.length ? { sameAs: contact.sameAs } : {}),
    },
    hasPart: navParts,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${getSiteUrl()}/shop?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function onlineStoreJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'OnlineStore',
    name: siteConfig.name,
    url: getSiteUrl(),
    description: siteConfig.description,
    image: absoluteUrl(siteConfig.defaultOgImagePath),
    priceRange: '$$',
    currenciesAccepted: 'PKR',
    paymentAccepted: 'Cash on Delivery',
    areaServed: siteConfig.country,
  };
}

type ProductJsonLdInput = {
  id: string | number;
  name: string;
  description: string;
  image: string;
  price: number;
  currency?: string;
  category?: string;
  inStock?: boolean;
};

export function productJsonLd({
  id,
  name,
  description,
  image,
  price,
  currency = 'PKR',
  category,
  inStock = true,
}: ProductJsonLdInput) {
  const url = absoluteUrl(`/product/${id}`);
  const imageUrl = image.startsWith('http') ? image : absoluteUrl(image);

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    image: imageUrl,
    sku: String(id),
    category,
    brand: {
      '@type': 'Brand',
      name: siteConfig.name,
    },
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: currency,
      price: price.toFixed(0),
      availability: inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: siteConfig.name,
      },
    },
  };
}

export function itemListJsonLd(
  products: { id: number; name: string; price: number }[],
  listName = 'StylesNest Shop',
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: listName,
    numberOfItems: products.length,
    itemListElement: products.slice(0, 50).map((p, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: absoluteUrl(`/product/${p.id}`),
      name: p.name,
      item: {
        '@type': 'Product',
        name: p.name,
        url: absoluteUrl(`/product/${p.id}`),
        offers: {
          '@type': 'Offer',
          priceCurrency: 'PKR',
          price: p.price.toFixed(0),
        },
      },
    })),
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
