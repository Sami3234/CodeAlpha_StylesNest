// ========================================
// PRODUCT DATA WITH REAL PRODUCT IMAGES
// Categories: cosmetics, electronics, watches, jewelry, clothes, ...
// ========================================

import type { ClothesOptions } from '@/lib/clothes-options';
import type { ProductMeta } from '@/lib/product-meta';

export interface PricingTier {
  quantity: number;
  price: number;
  discount?: number;
}

export interface Product {
  id: number;
  title: { en: string; ar: string };
  currentPrice: number;
  originalPrice: number;
  discount: number;
  image: string;
  images?: string[];
  freeDelivery: boolean;
  soldCount: number;
  category: string;
  description: { en: string; ar: string };
  features?: { en: string[]; ar: string[] };
  pricingTiers?: PricingTier[];
  status?: 'active' | 'inactive';
  /** Set when category is clothes */
  clothesOptions?: ClothesOptions;
  /** SKU, stock, SEO, brand, etc. */
  productMeta?: ProductMeta;
}

// Import cleaning function
import { cleanTranslatedText, autoTranslate, translateArray } from '@/utils/translation';

// Type for products that support both old and new formats
interface OldProductFormat {
  id?: number;
  title?: string | { en: string; ar: string };
  titleAr?: string;
  description?: string | { en: string; ar: string };
  descriptionAr?: string;
  features?: string[] | { en: string[]; ar: string[] };
  featuresAr?: string[];
  currentPrice?: number;
  originalPrice?: number;
  discount?: number;
  image?: string;
  images?: string[];
  freeDelivery?: boolean;
  soldCount?: number;
  category?: string;
  pricingTiers?: PricingTier[];
  status?: 'active' | 'inactive';
  clothesOptions?: ClothesOptions;
}

// Helper function to migrate old product format
function migrateProductData(oldProduct: OldProductFormat): Product {
  // If already in new format, clean existing data
  if (oldProduct.title && typeof oldProduct.title === 'object' && 'en' in oldProduct.title) {
    const description = oldProduct.description && typeof oldProduct.description === 'object' && 'en' in oldProduct.description
      ? oldProduct.description
      : { en: '', ar: '' };
    
    const features = oldProduct.features && typeof oldProduct.features === 'object' && 'en' in oldProduct.features
      ? {
          en: oldProduct.features.en.map((f: string) => cleanTranslatedText(f)),
          ar: oldProduct.features.ar.map((f: string) => cleanTranslatedText(f)),
        }
      : undefined;

    return {
      id: oldProduct.id || 0,
      title: {
        en: cleanTranslatedText(oldProduct.title.en),
        ar: cleanTranslatedText(oldProduct.title.ar),
      },
      description: {
        en: cleanTranslatedText(description.en),
        ar: cleanTranslatedText(description.ar),
      },
      features,
      currentPrice: oldProduct.currentPrice || 0,
      originalPrice: oldProduct.originalPrice || 0,
      discount: oldProduct.discount || 0,
      image: oldProduct.image || '',
      images: oldProduct.images || [oldProduct.image || ''],
      freeDelivery: oldProduct.freeDelivery || false,
      soldCount: oldProduct.soldCount || 0,
      category: oldProduct.category || 'other',
      pricingTiers: oldProduct.pricingTiers,
      status: oldProduct.status || 'active',
      clothesOptions: oldProduct.clothesOptions,
    };
  }

  // Migrate from old format (when title is a string)
  const titleEn = typeof oldProduct.title === 'string' ? cleanTranslatedText(oldProduct.title) : '';
  const titleAr = cleanTranslatedText(oldProduct.titleAr || autoTranslate(titleEn, 'ar'));
  
  const descriptionEn = typeof oldProduct.description === 'string' ? cleanTranslatedText(oldProduct.description) : '';
  const descriptionAr = cleanTranslatedText(oldProduct.descriptionAr || autoTranslate(descriptionEn, 'ar'));

  const featuresEn = Array.isArray(oldProduct.features) ? oldProduct.features : [];
  const featuresAr = oldProduct.featuresAr || (featuresEn.length > 0 ? translateArray(featuresEn, 'ar') : []);

  return {
    id: oldProduct.id || 0,
    title: { 
      en: titleEn, 
      ar: titleAr 
    },
    description: { 
      en: descriptionEn, 
      ar: descriptionAr 
    },
    features: featuresEn.length > 0 
      ? { 
          en: featuresEn.map((f: string) => cleanTranslatedText(f)), 
          ar: featuresAr.map((f: string) => cleanTranslatedText(f)) 
        } 
      : undefined,
    currentPrice: oldProduct.currentPrice || 0,
    originalPrice: oldProduct.originalPrice || 0,
    discount: oldProduct.discount || 0,
    image: oldProduct.image || '',
    images: oldProduct.images || (oldProduct.image ? [oldProduct.image] : []),
    freeDelivery: oldProduct.freeDelivery || false,
    soldCount: oldProduct.soldCount || 0,
    category: oldProduct.category || 'other',
    pricingTiers: oldProduct.pricingTiers,
    status: oldProduct.status || 'active',
    clothesOptions: oldProduct.clothesOptions,
  };
}

// Raw products data in old format (will be migrated automatically)
const rawProducts = [
  // ELECTRONICS - Shaver
  {
    id: 1,
    title: "Original Waterproof Turbo Shaver 60 days of Use - Buy 1 Get 1 Free",
    currentPrice: 4.9,
    originalPrice: 12,
    discount: 59,
    image: "https://images.unsplash.com/photo-1621607512022-6aecc4fed814?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1621607512022-6aecc4fed814?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1585751119414-ef2636f8aede?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1517941823-815bea90d291?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1493689485253-f07fcbfc731b?w=400&h=400&fit=crop"
    ],
    freeDelivery: true,
    soldCount: 2831,
    category: "electronics",
    description: "Premium Quality Turbo Shaver",
    features: [
      "Waterproof design for wet and dry use",
      "60 days battery life on single charge",
      "Sharp stainless steel blades for smooth shave",
      "Ergonomic grip for comfortable handling",
      "USB rechargeable - no need for batteries",
      "Travel lock feature for safety",
      "Buy 1 Get 1 Free offer included"
    ]
  },
  // ELECTRONICS - Drone
  {
    id: 2,
    title: "Jet Mavic Camera HD 4k Drone",
    currentPrice: 7.9,
    originalPrice: 18,
    discount: 56,
    image: "https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1507582020474-9a35b7d455d9?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1579829366248-204fe8413f31?w=400&h=400&fit=crop"
    ],
    freeDelivery: true,
    soldCount: 0,
    category: "electronics",
    description: "Professional 4K Camera Drone",
    features: [
      "4K HD camera for stunning aerial photography",
      "Stable flight with 6-axis gyroscope",
      "One key takeoff and landing",
      "Headless mode for easy control",
      "360° flip stunts capability",
      "15 minutes flight time",
      "2.4GHz remote control with 100m range"
    ]
  },
  // LADIES BAG - Designer Handbag
  {
    id: 3,
    title: "Premium Designer Ladies Handbag - Leather Material",
    currentPrice: 25.9,
    originalPrice: 49.9,
    discount: 48,
    image: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=400&fit=crop"
    ],
    freeDelivery: true,
    soldCount: 5234,
    category: "jewelry",
    description: "Stylish Premium Designer Handbag made from genuine leather material",
    features: [
      "Genuine leather material",
      "Multiple compartments for organization",
      "Adjustable shoulder strap",
      "Spacious interior with zipper closure",
      "Trendy design for all occasions",
      "Durable construction",
      "Perfect for office and casual wear"
    ]
  },
  // COSMETICS - Shampoo
  {
    id: 4,
    title: "Anti-Itching & Dandruff Removing Scalp Care Shampoo",
    currentPrice: 4.9,
    originalPrice: 9,
    discount: 46,
    image: "https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=400&h=400&fit=crop"
    ],
    freeDelivery: true,
    soldCount: 7283,
    category: "cosmetics",
    description: "Natural Anti-Dandruff Treatment Shampoo",
    features: [
      "Removes dandruff effectively from first wash",
      "Soothes itchy and irritated scalp",
      "Natural herbal ingredients",
      "Strengthens hair roots",
      "Suitable for all hair types",
      "Gentle formula for daily use",
      "Fresh mint fragrance"
    ]
  },
  // ELECTRONICS - Spray Gun
  {
    id: 5,
    title: "48V Electric Paint Spray Gun",
    currentPrice: 12,
    originalPrice: 18,
    discount: 33,
    image: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop"
    ],
    freeDelivery: true,
    soldCount: 7832,
    category: "electronics",
    description: "Professional Electric Paint Sprayer",
    features: [
      "48V powerful motor for smooth spraying",
      "Adjustable spray patterns",
      "800ml large capacity container",
      "Suitable for walls, furniture, and cars",
      "Easy to clean and maintain",
      "Lightweight ergonomic design",
      "Includes multiple nozzle sizes"
    ]
  },
  // MOBILE - Phone
  {
    id: 6,
    title: "Latest Dual Sim i17 Pro with HD Camera",
    currentPrice: 7.9,
    originalPrice: 16,
    discount: 51,
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=400&h=400&fit=crop"
    ],
    freeDelivery: true,
    soldCount: 8922,
    category: "mobile",
    description: "Compact Dual SIM Feature Phone",
    features: [
      "Dual SIM dual standby support",
      "HD camera for photos and videos",
      "Long lasting battery life",
      "Compact flip design",
      "Large buttons for easy dialing",
      "FM Radio and MP3 player",
      "Bluetooth connectivity"
    ]
  },
  // COSMETICS - Oil
  {
    id: 7,
    title: "Men Therm Bee Venom Gynecomastia Heating Oil",
    currentPrice: 4.9,
    originalPrice: 8,
    discount: 39,
    image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1600428877878-1a0ff561571c?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1597854710550-0a0b0b0b0b0b?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&h=400&fit=crop"
    ],
    freeDelivery: true,
    soldCount: 8932,
    category: "cosmetics",
    description: "Natural Heating Massage Oil for Men",
    features: [
      "Natural bee venom extract formula",
      "Heating effect for better absorption",
      "Helps reduce chest fat",
      "Improves skin firmness",
      "Easy to apply and fast absorbing",
      "No artificial chemicals",
      "Visible results in weeks"
    ]
  },
  // ELECTRONICS - Massager
  {
    id: 8,
    title: "Neck Shoulder & Back Massager with Heat",
    currentPrice: 7.9,
    originalPrice: 15,
    discount: 47,
    image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=400&h=400&fit=crop"
    ],
    freeDelivery: true,
    soldCount: 6823,
    category: "electronics",
    description: "Electric Shiatsu Massage Pillow",
    features: [
      "Deep kneading shiatsu massage",
      "Built-in heating function",
      "8 massage nodes for full coverage",
      "Bi-directional rotation",
      "Auto shut-off for safety",
      "Portable design - use anywhere",
      "Rechargeable battery included"
    ]
  },
  // WATCHES - Watch 1
  {
    id: 9,
    title: "USB Rechargeable Lighter Watch",
    currentPrice: 5.9,
    originalPrice: 12,
    discount: 51,
    image: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1533139502658-0198f920d8e8?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1509048191080-d2984bad6ae5?w=400&h=400&fit=crop"
    ],
    freeDelivery: true,
    soldCount: 2831,
    category: "watches",
    description: "2-in-1 Watch with Built-in Lighter",
    features: [
      "Stylish analog watch design",
      "Built-in flameless USB lighter",
      "USB rechargeable - no fuel needed",
      "Windproof electronic ignition",
      "Durable metal construction",
      "Water resistant watch face",
      "Perfect gift for smokers"
    ]
  },
  // WATCHES - Smart Watch
  {
    id: 10,
    title: "G9 Ultra Max Gold Smart Watch",
    currentPrice: 7.5,
    originalPrice: 12,
    discount: 38,
    image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1617043786394-f977fa12eddf?w=400&h=400&fit=crop"
    ],
    freeDelivery: true,
    soldCount: 0,
    category: "watches",
    description: "Premium Smart Watch with Health Features",
    features: [
      "Large HD touch display",
      "Heart rate and SpO2 monitoring",
      "Sleep tracking and analysis",
      "Multiple sport modes",
      "Call and message notifications",
      "7 days battery life",
      "IP68 waterproof rating"
    ]
  },
  // WATCHES - Steel Watch
  {
    id: 11,
    title: "Classic Style Unisex Alloy Stainless Steel Wrist Watch R1",
    currentPrice: 5.9,
    originalPrice: 11,
    discount: 46,
    image: "https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1548169874-53e85f753f1e?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop"
    ],
    freeDelivery: true,
    soldCount: 2983,
    category: "watches",
    description: "Elegant Stainless Steel Quartz Watch",
    features: [
      "Premium stainless steel construction",
      "Japanese quartz movement",
      "Scratch resistant mineral glass",
      "Unisex design for all",
      "Water resistant to 30m",
      "Luminous hands for night reading",
      "Adjustable steel bracelet"
    ]
  },
  // WATCHES - Luxury Watch
  {
    id: 12,
    title: "Luxury IIK Men's Stainless Steel Watch R3",
    currentPrice: 6.5,
    originalPrice: 11,
    discount: 41,
    image: "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1539874754764-5a96559165b0?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1518131672697-613becd4fab5?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1619134778706-7015533a6150?w=400&h=400&fit=crop"
    ],
    freeDelivery: true,
    soldCount: 4288,
    category: "watches",
    description: "Luxury Business Watch for Men",
    features: [
      "Elegant business style design",
      "High quality stainless steel band",
      "Precise quartz movement",
      "Date display function",
      "30M water resistance",
      "Fold-over clasp with safety",
      "Perfect for formal occasions"
    ]
  },
  // KITCHEN - Juicer
  {
    id: 13,
    title: "Portable USB Charging Powerful Electric Citrus Juicer",
    currentPrice: 6.9,
    originalPrice: 12,
    discount: 43,
    image: "https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=400&h=400&fit=crop"
    ],
    freeDelivery: true,
    soldCount: 8374,
    category: "kitchen",
    description: "Portable Electric Citrus Juicer",
    features: [
      "USB rechargeable for portability",
      "Powerful motor for quick juicing",
      "400ml large capacity",
      "One button operation",
      "Easy to clean - detachable parts",
      "BPA-free food grade materials",
      "Perfect for oranges, lemons, limes"
    ]
  },
  // KITCHEN - Rack
  {
    id: 14,
    title: "High Quality 3 Tier Metal Sink Rack With Lid For Kitchen",
    currentPrice: 20,
    originalPrice: 35,
    discount: 43,
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=400&h=400&fit=crop"
    ],
    freeDelivery: true,
    soldCount: 6329,
    category: "kitchen",
    description: "3-Tier Kitchen Sink Organizer Rack",
    features: [
      "3-tier design for maximum storage",
      "Premium metal construction",
      "Rust-proof coating",
      "Includes lid for top shelf",
      "Adjustable height shelves",
      "Easy assembly - no tools needed",
      "Space saving design"
    ]
  },
  // LADIES BAG - Tote Bag
  {
    id: 15,
    title: "Fashion Tote Bag for Women - Large Capacity",
    currentPrice: 12.9,
    originalPrice: 24.9,
    discount: 48,
    image: "https://images.unsplash.com/photo-1564422167308-5c4fd6c2e473?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1564422167308-5c4fd6c2e473?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1594633313593-bab3825d0caf?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=400&h=400&fit=crop"
    ],
    freeDelivery: true,
    soldCount: 7821,
    category: "jewelry",
    description: "Spacious Fashion Tote Bag with Large Capacity - Perfect for Shopping and Daily Use",
    features: [
      "Large capacity for all your essentials",
      "Reinforced handles for durability",
      "Water-resistant material",
      "Multiple interior pockets",
      "Trendy design and colors",
      "Lightweight and comfortable",
      "Perfect for shopping and travel"
    ]
  },
  // OTHER - RC Airplane
  {
    id: 16,
    title: "RC Airplane, 2.4GHz Remote Controlled",
    currentPrice: 8.5,
    originalPrice: 16,
    discount: 47,
    image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1474302770737-173ee21bab63?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=400&h=400&fit=crop"
    ],
    freeDelivery: true,
    soldCount: 7366,
    category: "other",
    description: "Remote Control Glider Airplane",
    features: [
      "2.4GHz remote for stable control",
      "Lightweight foam construction",
      "Easy to fly for beginners",
      "150m control range",
      "USB rechargeable battery",
      "Crash resistant material",
      "Ready to fly out of box"
    ]
  },
  // ELECTRONICS - Air Conditioner
  {
    id: 17,
    title: "Wall Mounted Smart Air Conditioner & Heater",
    currentPrice: 11.9,
    originalPrice: 25,
    discount: 52,
    image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1631545806609-3e1b9d4dc21d?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1558089687-f282ffcbc126?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400&h=400&fit=crop"
    ],
    freeDelivery: true,
    soldCount: 8735,
    category: "electronics",
    description: "Portable Wall Mount AC & Heater",
    features: [
      "Dual function - cooling and heating",
      "Wall mounted space-saving design",
      "Remote control included",
      "Timer function up to 12 hours",
      "Adjustable temperature settings",
      "Low noise operation",
      "Energy efficient"
    ]
  },
  // COSMETICS - Hair Styler
  {
    id: 18,
    title: "New 5 In 1 Hair Air Wrap Styler",
    currentPrice: 5.9,
    originalPrice: 16,
    discount: 63,
    image: "https://images.unsplash.com/photo-1522338140262-f46f5913618a?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1522338140262-f46f5913618a?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=400&fit=crop"
    ],
    freeDelivery: true,
    soldCount: 8926,
    category: "cosmetics",
    description: "Professional 5-in-1 Hair Styling Set",
    features: [
      "5 interchangeable styling heads",
      "Automatic curling technology",
      "Multiple heat settings",
      "Ionic technology for shine",
      "Suitable for all hair types",
      "Cool tip for safe handling",
      "Storage case included"
    ]
  },
  // WATCHES - Smart Watch
  {
    id: 19,
    title: "Smart Watch Pro with Fitness Tracker",
    currentPrice: 12.9,
    originalPrice: 25,
    discount: 48,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1544117519-31a4b719223c?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=400&h=400&fit=crop"
    ],
    freeDelivery: true,
    soldCount: 5234,
    category: "watches",
    description: "Advanced Smart Watch with Health Monitoring",
    features: [
      "Heart rate and blood pressure monitoring",
      "Step counter and calorie tracker",
      "Sleep quality analysis",
      "Water resistant up to 50m",
      "7 days battery life",
      "Bluetooth connectivity",
      "Multiple sport modes"
    ]
  },
  // KITCHEN - Blender
  {
    id: 20,
    title: "Professional Kitchen Blender 1500W",
    currentPrice: 15.9,
    originalPrice: 28,
    discount: 43,
    image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1556911220-e15b29be4c4b?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=400&h=400&fit=crop"
    ],
    freeDelivery: true,
    soldCount: 6789,
    category: "kitchen",
    description: "High Power Kitchen Blender for Smoothies",
    features: [
      "1500W powerful motor",
      "Stainless steel blades",
      "2L large capacity jug",
      "Multiple speed settings",
      "Pulse function",
      "Easy to clean design",
      "Safety lock mechanism"
    ]
  },
  // LADIES BAG - Crossbody Bag
  {
    id: 21,
    title: "Elegant Crossbody Bag for Women - Stylish Design",
    currentPrice: 18.9,
    originalPrice: 34.9,
    discount: 46,
    image: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1564422167308-5c4fd6c2e473?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=400&fit=crop"
    ],
    freeDelivery: true,
    soldCount: 6453,
    category: "jewelry",
    description: "Elegant Crossbody Bag with Adjustable Strap - Perfect for Parties and Events",
    features: [
      "Adjustable crossbody strap",
      "Compact yet spacious design",
      "Premium quality material",
      "Secure zipper closure",
      "Elegant and stylish appearance",
      "Multiple card slots inside",
      "Perfect for parties and special occasions"
    ]
  },
  // LADIES BAG - Shoulder Bag
  {
    id: 22,
    title: "Classic Shoulder Bag for Ladies - Office & Casual",
    currentPrice: 22.9,
    originalPrice: 42.9,
    discount: 47,
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1594633313593-bab3825d0caf?w=400&h=400&fit=crop"
    ],
    freeDelivery: true,
    soldCount: 3892,
    category: "jewelry",
    description: "Classic Shoulder Bag - Versatile Design for Office and Casual Use",
    features: [
      "Comfortable shoulder strap",
      "Professional and elegant design",
      "Multiple compartments",
      "Main zipper closure",
      "Durable construction",
      "Suitable for office and casual wear",
      "Fits laptop and documents"
    ]
  }
];

// Migrate all products to new multilingual format
export const products: Product[] = rawProducts.map(migrateProductData);

// Category list
export const categories = [
  { id: 'all', name: 'All' },
  { id: 'cosmetics', name: 'Cosmetics' },
  { id: 'jewelry', name: 'Jewelry' },
  { id: 'watches', name: 'Watches' },
  { id: 'makeup', name: 'Makeup' },
  { id: 'clothes', name: 'Clothes' },
  { id: 'electronics', name: 'Electronics' },
  { id: 'bags', name: 'Bags' },
  { id: 'menfashion', name: 'Men Fashion' },
  { id: 'general', name: 'General' },
];

// Cities for order form (English only)
export const cities = [
  "Karachi",
  "Lahore",
  "Islamabad",
  "Rawalpindi",
  "Faisalabad",
  "Multan",
  "Peshawar",
  "Quetta",
  "Gujranwala",
  "Sialkot",
  "Sargodha",
  "Bahawalpur",
  "Sukkur",
  "Larkana",
  "Hyderabad",
  "Gujrat",
  "Kasur",
  "Sheikhupura",
  "Rahim Yar Khan",
  "Jhang",
  "Mardan",
  "Mingora",
  "Nawabshah",
  "Chiniot",
  "Kotri",
  "Khanpur",
  "Hafizabad",
  "Kohat",
  "Jacobabad",
  "Shikarpur",
  "Muzaffargarh",
  "Khanewal",
  "Vehari",
  "Others"
];

// Helper to get city name (returns city as-is for backward compatibility)
export const getCityName = (city: string | { en: string; ar: string }) => {
  if (typeof city === 'string') {
    return city;
  }
  // Backward compatibility with old format
  return city.en;
};

// Get product by ID
export const getProductById = (id: number): Product | undefined => {
  return products.find(product => product.id === id);
};

