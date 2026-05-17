import { absoluteUrl, getSiteUrl, siteConfig } from '@/lib/seo/site';

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.name,
    url: getSiteUrl(),
    logo: absoluteUrl(siteConfig.defaultOgImagePath),
    email: siteConfig.contactEmail,
    areaServed: {
      '@type': 'Country',
      name: siteConfig.country,
    },
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
