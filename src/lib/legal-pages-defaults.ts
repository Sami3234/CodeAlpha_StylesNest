import type { LegalPageSlug, LegalPagesStore } from '@/lib/legal-pages-types';

/** Simple, customer-friendly defaults — no technical storage/cookie details. */
export function getDefaultLegalPages(): LegalPagesStore {
  return {
    'privacy-policy': {
      title: 'Privacy Policy',
      intro:
        'We respect your privacy. This page explains in simple words what information we need to serve you and how we keep it safe.',
      sections: [
        {
          id: 'intro',
          title: 'Who we are',
          paragraphs: [
            'StylesNest is an online store in Pakistan. When you shop with us or contact support, we handle your details carefully and only for genuine business reasons.',
          ],
        },
        {
          id: 'collect',
          title: 'What we ask from you',
          paragraphs: ['When you order or contact us, we may need:'],
          bullets: [
            'Your name, phone number, and delivery address',
            'Your email if you share it with us',
            'Order details such as products, size, colour, and payment choice (for example cash on delivery)',
            'Messages you send through our contact or support form',
          ],
        },
        {
          id: 'use',
          title: 'How we use it',
          paragraphs: ['We use your information only to:'],
          bullets: [
            'Deliver your order and share order updates',
            'Answer your questions and solve problems',
            'Improve our products and service',
            'Follow the law when required',
          ],
        },
        {
          id: 'sharing',
          title: 'Sharing with others',
          paragraphs: [
            'We do not sell your personal information. We only share what is needed with courier companies to deliver your parcel, or when the law requires it.',
          ],
        },
        {
          id: 'security',
          title: 'Keeping information safe',
          paragraphs: [
            'We take reasonable steps to protect your data. Please keep your account password private if you create an account.',
          ],
        },
        {
          id: 'changes',
          title: 'Updates',
          paragraphs: [
            'We may update this page from time to time. The latest version will always be published here.',
          ],
        },
      ],
    },
    terms: {
      title: 'Terms & Conditions',
      intro: 'Please read these points before placing an order on StylesNest.',
      sections: [
        {
          id: 'agreement',
          title: 'Using our website',
          paragraphs: [
            'By browsing or ordering on StylesNest, you agree to these terms. If you do not agree, please do not use the site.',
          ],
        },
        {
          id: 'orders',
          title: 'Orders',
          paragraphs: [
            'When you place an order, you confirm that your contact and address details are correct. We may call or message you to confirm the order before dispatch.',
            'We can cancel an order if an item is out of stock, if details are wrong, or if we suspect fraud.',
          ],
        },
        {
          id: 'pricing',
          title: 'Prices & products',
          paragraphs: [
            'Prices are shown in Pakistani Rupees (PKR). Product photos and descriptions are kept as accurate as possible; small differences in colour or packaging can happen.',
          ],
        },
        {
          id: 'payment',
          title: 'Payment',
          paragraphs: [
            'Payment options shown at checkout apply to your order (including cash on delivery where available). You agree to pay the total amount shown before delivery.',
          ],
        },
        {
          id: 'conduct',
          title: 'Fair use',
          paragraphs: [
            'Do not misuse the website, post false reviews, or try to access areas meant for staff only.',
          ],
        },
      ],
    },
    'shipping-delivery': {
      title: 'Shipping & Delivery',
      intro: 'How we send your order across Pakistan.',
      sections: [
        {
          id: 'coverage',
          title: 'Where we deliver',
          paragraphs: [
            'We deliver to cities and towns across Pakistan through trusted courier partners. Some remote areas may take longer.',
          ],
        },
        {
          id: 'time',
          title: 'Delivery time',
          paragraphs: [
            'Most orders arrive within a few business days depending on your city. Busy seasons or weather can cause delays — we will inform you if there is a major delay.',
          ],
        },
        {
          id: 'charges',
          title: 'Delivery charges',
          paragraphs: [
            'Free delivery may apply on selected products or offers as shown on the product or checkout page. Any delivery fee is shown clearly before you confirm the order.',
          ],
        },
        {
          id: 'updates',
          title: 'Stay reachable',
          paragraphs: [
            'Please keep your phone on after ordering. Our team may call or WhatsApp you to confirm address and delivery timing.',
          ],
        },
      ],
    },
    'returns-refunds': {
      title: 'Returns & Refunds',
      intro: 'We want you to be happy with your purchase. Here is how we handle problems.',
      sections: [
        {
          id: 'eligible',
          title: 'When we can help',
          paragraphs: ['Contact us if:'],
          bullets: [
            'The item is damaged, defective, or not what you ordered',
            'The wrong size or product was sent (where applicable)',
            'The product is unused and in original packaging within the time limit below',
          ],
        },
        {
          id: 'window',
          title: 'Time limit',
          paragraphs: [
            'Please contact us within 7 days of receiving your order. Share your order details and clear photos if something is wrong.',
          ],
        },
        {
          id: 'process',
          title: 'What to do',
          paragraphs: [
            'Reach us using the contact details at the bottom of this page or the form on our About page. We will guide you on return, exchange, or refund.',
          ],
        },
        {
          id: 'refunds',
          title: 'Refunds',
          paragraphs: [
            'Approved refunds are processed after we receive and check the returned item. For cash on delivery orders, refund method will be agreed with you (for example bank transfer). This can take 7–14 business days.',
          ],
        },
      ],
    },
  };
}

export function getDefaultLegalPage(slug: LegalPageSlug) {
  return getDefaultLegalPages()[slug];
}
