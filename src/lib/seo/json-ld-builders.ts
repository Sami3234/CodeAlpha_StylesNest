import { absoluteUrl, getSiteUrl, siteConfig } from '@/lib/seo/site';

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.name,
    url: getSiteUrl(),
    logo: absoluteUrl(siteConfig.defaultOgImagePath),
    email: siteConfig.contactEmail,
    areaServed: { '@type': 'Country', name: siteConfig.country },
  };
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    url: getSiteUrl(),
    description: siteConfig.description,
    inLanguage: siteConfig.language,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${getSiteUrl()}/shop?search={search_term_string}`,
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
  category?: string;
};

export function productJsonLd(input: ProductJsonLdInput) {
  const url = absoluteUrl(`/product/${input.id}`);
  const imageUrl = input.image.startsWith('http') ? input.image : absoluteUrl(input.image);

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: input.name,
    description: input.description,
    image: imageUrl,
    sku: String(input.id),
    category: input.category,
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'PKR',
      price: String(Math.round(input.price)),
      availability: 'https://schema.org/InStock',
      seller: { '@type': 'Organization', name: siteConfig.name },
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
