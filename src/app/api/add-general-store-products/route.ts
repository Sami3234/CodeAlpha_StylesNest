import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

const generalStoreProducts = [
  {
    title: {
      en: "Premium Basmati Rice 5kg Bag - Long Grain",
      ar: "أرز بسمتي ممتاز 5 كجم - حبة طويلة"
    },
    description: {
      en: "High quality long grain Basmati rice, perfect for biryani and pulao. Premium quality imported rice.",
      ar: "أرز بسمتي عالي الجودة حبة طويلة، مثالي للبرياني والبولاو. أرز مستورد عالي الجودة."
    },
    currentPrice: 12.9,
    originalPrice: 18.5,
    discount: 30,
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&h=400&fit=crop"
    ],
    category: "other",
    freeDelivery: true,
    soldCount: 0,
    features: {
      en: [
        "Premium long grain Basmati rice",
        "5kg convenient packaging",
        "Perfect for biryani and pulao",
        "Non-sticky texture",
        "Aromatic fragrance",
        "Imported quality",
        "Long shelf life"
      ],
      ar: [
        "أرز بسمتي حبة طويلة ممتاز",
        "عبوة 5 كجم مريحة",
        "مثالي للبرياني والبولاو",
        "قوام غير لزج",
        "رائحة عطرية",
        "جودة مستوردة",
        "عمر تخزين طويل"
      ]
    }
  },
  {
    title: {
      en: "Pure White Sugar 2kg - Premium Quality",
      ar: "سكر أبيض نقي 2 كجم - جودة ممتازة"
    },
    description: {
      en: "Pure white refined sugar, perfect for tea, coffee, and baking. Premium quality sugar.",
      ar: "سكر أبيض مكرر نقي، مثالي للشاي والقهوة والخبز. سكر عالي الجودة."
    },
    currentPrice: 4.5,
    originalPrice: 6.5,
    discount: 31,
    image: "https://images.unsplash.com/photo-1615485925511-ef3c5e5a0c0a?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1615485925511-ef3c5e5a0c0a?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1606312619070-d48b5e083304?w=400&h=400&fit=crop"
    ],
    category: "other",
    freeDelivery: true,
    soldCount: 0,
    features: {
      en: [
        "Pure white refined sugar",
        "2kg convenient size",
        "Perfect for tea and coffee",
        "Ideal for baking",
        "Fine crystal texture",
        "Long shelf life",
        "Premium quality"
      ],
      ar: [
        "سكر أبيض مكرر نقي",
        "حجم 2 كجم مريح",
        "مثالي للشاي والقهوة",
        "مثالي للخبز",
        "قوام بلوري ناعم",
        "عمر تخزين طويل",
        "جودة ممتازة"
      ]
    }
  },
  {
    title: {
      en: "Premium Wheat Flour 5kg - Aata",
      ar: "دقيق قمح ممتاز 5 كجم - عطا"
    },
    description: {
      en: "Fine quality wheat flour for roti, naan, and baking. Freshly milled premium flour.",
      ar: "دقيق قمح عالي الجودة للروتي والنان والخبز. دقيق ممتاز مطحون طازج."
    },
    currentPrice: 8.9,
    originalPrice: 12.5,
    discount: 29,
    image: "https://images.unsplash.com/photo-1628088062854-d1870b490869?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1628088062854-d1870b490869?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1609501676725-7186f1f86aec?w=400&h=400&fit=crop"
    ],
    category: "other",
    freeDelivery: true,
    soldCount: 0,
    features: {
      en: [
        "Fine quality wheat flour",
        "5kg packaging",
        "Perfect for roti and naan",
        "Ideal for baking",
        "Freshly milled",
        "No preservatives",
        "Premium quality"
      ],
      ar: [
        "دقيق قمح عالي الجودة",
        "عبوة 5 كجم",
        "مثالي للروتي والنان",
        "مثالي للخبز",
        "مطحون طازج",
        "بدون مواد حافظة",
        "جودة ممتازة"
      ]
    }
  },
  {
    title: {
      en: "Premium Red Tea 500g - Lipton Quality",
      ar: "شاي أحمر ممتاز 500 جم - جودة ليبتون"
    },
    description: {
      en: "Premium quality red tea leaves, perfect for making strong and flavorful tea. Premium imported tea.",
      ar: "أوراق شاي أحمر عالية الجودة، مثالية لصنع شاي قوي ومذاق. شاي مستورد ممتاز."
    },
    currentPrice: 5.9,
    originalPrice: 8.5,
    discount: 31,
    image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=400&fit=crop"
    ],
    category: "other",
    freeDelivery: true,
    soldCount: 0,
    features: {
      en: [
        "Premium quality tea leaves",
        "500g packaging",
        "Strong and flavorful",
        "Perfect for daily use",
        "Aromatic fragrance",
        "Imported quality",
        "Long lasting flavor"
      ],
      ar: [
        "أوراق شاي عالية الجودة",
        "عبوة 500 جم",
        "قوي ومذاق",
        "مثالي للاستخدام اليومي",
        "رائحة عطرية",
        "جودة مستوردة",
        "نكهة طويلة الأمد"
      ]
    }
  },
  {
    title: {
      en: "Cooking Oil 5 Liters - Sunflower Oil",
      ar: "زيت طبخ 5 لترات - زيت عباد الشمس"
    },
    description: {
      en: "Pure sunflower cooking oil, perfect for frying and cooking. Healthy and cholesterol-free.",
      ar: "زيت عباد الشمس النقي للطبخ، مثالي للقلي والطبخ. صحي وخالي من الكوليسترول."
    },
    currentPrice: 15.9,
    originalPrice: 22.5,
    discount: 29,
    image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1609501676725-7186f1f86aec?w=400&h=400&fit=crop"
    ],
    category: "other",
    freeDelivery: true,
    soldCount: 0,
    features: {
      en: [
        "Pure sunflower oil",
        "5 liters capacity",
        "Perfect for frying",
        "Cholesterol-free",
        "Healthy cooking option",
        "High smoke point",
        "Premium quality"
      ],
      ar: [
        "زيت عباد الشمس النقي",
        "سعة 5 لترات",
        "مثالي للقلي",
        "خالي من الكوليسترول",
        "خيار طبخ صحي",
        "نقطة دخان عالية",
        "جودة ممتازة"
      ]
    }
  },
  {
    title: {
      en: "Red Lentils 1kg - Masoor Daal",
      ar: "عدس أحمر 1 كجم - مسور دال"
    },
    description: {
      en: "Premium quality red lentils, perfect for daal and curry. Rich in protein and nutrients.",
      ar: "عدس أحمر عالي الجودة، مثالي للدال والكاري. غني بالبروتين والعناصر الغذائية."
    },
    currentPrice: 3.9,
    originalPrice: 5.5,
    discount: 29,
    image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1609501676725-7186f1f86aec?w=400&h=400&fit=crop"
    ],
    category: "other",
    freeDelivery: true,
    soldCount: 0,
    features: {
      en: [
        "Premium red lentils",
        "1kg packaging",
        "Rich in protein",
        "Perfect for daal",
        "High nutritional value",
        "Easy to cook",
        "Fresh quality"
      ],
      ar: [
        "عدس أحمر ممتاز",
        "عبوة 1 كجم",
        "غني بالبروتين",
        "مثالي للدال",
        "قيمة غذائية عالية",
        "سهل الطهي",
        "جودة طازجة"
      ]
    }
  },
  {
    title: {
      en: "Black Gram 1kg - Urad Daal",
      ar: "بقول أسود 1 كجم - أوراد دال"
    },
    description: {
      en: "Premium quality black gram, perfect for daal and traditional dishes. High protein content.",
      ar: "بقول أسود عالي الجودة، مثالي للدال والأطباق التقليدية. محتوى بروتين عالي."
    },
    currentPrice: 4.5,
    originalPrice: 6.5,
    discount: 31,
    image: "https://images.unsplash.com/photo-1609501676725-7186f1f86aec?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1609501676725-7186f1f86aec?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&h=400&fit=crop"
    ],
    category: "other",
    freeDelivery: true,
    soldCount: 0,
    features: {
      en: [
        "Premium black gram",
        "1kg packaging",
        "High protein content",
        "Perfect for daal",
        "Traditional quality",
        "Easy to cook",
        "Nutritious"
      ],
      ar: [
        "بقول أسود ممتاز",
        "عبوة 1 كجم",
        "محتوى بروتين عالي",
        "مثالي للدال",
        "جودة تقليدية",
        "سهل الطهي",
        "مغذي"
      ]
    }
  },
  {
    title: {
      en: "Turmeric Powder 200g - Haldi",
      ar: "مسحوق الكركم 200 جم - هالدي"
    },
    description: {
      en: "Pure turmeric powder, essential spice for cooking. Natural and fresh quality.",
      ar: "مسحوق كركم نقي، بهار أساسي للطبخ. جودة طبيعية وطازجة."
    },
    currentPrice: 2.9,
    originalPrice: 4.5,
    discount: 36,
    image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1609501676725-7186f1f86aec?w=400&h=400&fit=crop"
    ],
    category: "other",
    freeDelivery: true,
    soldCount: 0,
    features: {
      en: [
        "Pure turmeric powder",
        "200g packaging",
        "Essential cooking spice",
        "Natural and fresh",
        "Rich color",
        "Aromatic flavor",
        "Premium quality"
      ],
      ar: [
        "مسحوق كركم نقي",
        "عبوة 200 جم",
        "بهار طبخ أساسي",
        "طبيعي وطازج",
        "لون غني",
        "نكهة عطرية",
        "جودة ممتازة"
      ]
    }
  },
  {
    title: {
      en: "Red Chili Powder 200g - Lal Mirch",
      ar: "مسحوق الفلفل الأحمر 200 جم - لال ميرش"
    },
    description: {
      en: "Spicy red chili powder, perfect for adding heat to dishes. Premium quality spice.",
      ar: "مسحوق فلفل أحمر حار، مثالي لإضافة الحرارة للأطباق. بهار عالي الجودة."
    },
    currentPrice: 2.5,
    originalPrice: 3.9,
    discount: 36,
    image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1609501676725-7186f1f86aec?w=400&h=400&fit=crop"
    ],
    category: "other",
    freeDelivery: true,
    soldCount: 0,
    features: {
      en: [
        "Spicy red chili powder",
        "200g packaging",
        "Perfect for spicy dishes",
        "Rich flavor",
        "Natural spice",
        "Long shelf life",
        "Premium quality"
      ],
      ar: [
        "مسحوق فلفل أحمر حار",
        "عبوة 200 جم",
        "مثالي للأطباق الحارة",
        "نكهة غنية",
        "بهار طبيعي",
        "عمر تخزين طويل",
        "جودة ممتازة"
      ]
    }
  },
  {
    title: {
      en: "Cumin Seeds 200g - Zeera",
      ar: "بذور الكمون 200 جم - زيرا"
    },
    description: {
      en: "Premium cumin seeds, essential spice for cooking. Aromatic and flavorful.",
      ar: "بذور كمون ممتازة، بهار أساسي للطبخ. عطري ومذاق."
    },
    currentPrice: 3.5,
    originalPrice: 5.0,
    discount: 30,
    image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1609501676725-7186f1f86aec?w=400&h=400&fit=crop"
    ],
    category: "other",
    freeDelivery: true,
    soldCount: 0,
    features: {
      en: [
        "Premium cumin seeds",
        "200g packaging",
        "Aromatic flavor",
        "Essential cooking spice",
        "Natural quality",
        "Long shelf life",
        "Fresh seeds"
      ],
      ar: [
        "بذور كمون ممتازة",
        "عبوة 200 جم",
        "نكهة عطرية",
        "بهار طبخ أساسي",
        "جودة طبيعية",
        "عمر تخزين طويل",
        "بذور طازجة"
      ]
    }
  },
  {
    title: {
      en: "Washing Powder 2kg - Detergent",
      ar: "مسحوق غسيل 2 كجم - منظف"
    },
    description: {
      en: "Powerful washing powder for clean and fresh clothes. Removes tough stains effectively.",
      ar: "مسحوق غسيل قوي للملابس النظيفة والطازجة. يزيل البقع الصعبة بفعالية."
    },
    currentPrice: 6.9,
    originalPrice: 9.5,
    discount: 27,
    image: "https://images.unsplash.com/photo-1584488639486-b0a4a9bf5c40?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1584488639486-b0a4a9bf5c40?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1609501676725-7186f1f86aec?w=400&h=400&fit=crop"
    ],
    category: "other",
    freeDelivery: true,
    soldCount: 0,
    features: {
      en: [
        "Powerful cleaning formula",
        "2kg packaging",
        "Removes tough stains",
        "Fresh fragrance",
        "Suitable for all fabrics",
        "Economical",
        "Long lasting"
      ],
      ar: [
        "صيغة تنظيف قوية",
        "عبوة 2 كجم",
        "يزيل البقع الصعبة",
        "رائحة منعشة",
        "مناسب لجميع الأقمشة",
        "اقتصادي",
        "طويل الأمد"
      ]
    }
  },
  {
    title: {
      en: "Bath Soap 6 Pieces Pack - Premium Quality",
      ar: "صابون استحمام 6 قطع - جودة ممتازة"
    },
    description: {
      en: "Premium quality bath soap, gentle on skin. Fresh fragrance and moisturizing formula.",
      ar: "صابون استحمام عالي الجودة، لطيف على البشرة. رائحة منعشة وصيغة مرطبة."
    },
    currentPrice: 4.9,
    originalPrice: 7.5,
    discount: 35,
    image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1609501676725-7186f1f86aec?w=400&h=400&fit=crop"
    ],
    category: "other",
    freeDelivery: true,
    soldCount: 0,
    features: {
      en: [
        "Premium quality soap",
        "6 pieces pack",
        "Gentle on skin",
        "Moisturizing formula",
        "Fresh fragrance",
        "Long lasting",
        "Value pack"
      ],
      ar: [
        "صابون عالي الجودة",
        "عبوة 6 قطع",
        "لطيف على البشرة",
        "صيغة مرطبة",
        "رائحة منعشة",
        "طويل الأمد",
        "عبوة قيمة"
      ]
    }
  },
  {
    title: {
      en: "Toothpaste 150g - Fresh Mint",
      ar: "معجون أسنان 150 جم - نعناع طازج"
    },
    description: {
      en: "Fresh mint toothpaste for clean teeth and fresh breath. Fluoride protection included.",
      ar: "معجون أسنان بنعناع طازج لأسنان نظيفة ونفس منعش. حماية بالفلورايد."
    },
    currentPrice: 3.5,
    originalPrice: 5.0,
    discount: 30,
    image: "https://images.unsplash.com/photo-1607613009820-a29f7a9d9f7a?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1607613009820-a29f7a9d9f7a?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1609501676725-7186f1f86aec?w=400&h=400&fit=crop"
    ],
    category: "other",
    freeDelivery: true,
    soldCount: 0,
    features: {
      en: [
        "Fresh mint flavor",
        "150g tube",
        "Fluoride protection",
        "Fights cavities",
        "Fresh breath",
        "Whitening formula",
        "Premium quality"
      ],
      ar: [
        "نكهة نعناع طازجة",
        "أنبوب 150 جم",
        "حماية بالفلورايد",
        "يحارب التسوس",
        "نفس منعش",
        "صيغة تبييض",
        "جودة ممتازة"
      ]
    }
  },
  {
    title: {
      en: "Shampoo 400ml - Anti-Dandruff",
      ar: "شامبو 400 مل - مضاد للقشرة"
    },
    description: {
      en: "Anti-dandruff shampoo for healthy scalp and shiny hair. Removes dandruff effectively.",
      ar: "شامبو مضاد للقشرة لفروة رأس صحية وشعر لامع. يزيل القشرة بفعالية."
    },
    currentPrice: 5.9,
    originalPrice: 8.5,
    discount: 31,
    image: "https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1609501676725-7186f1f86aec?w=400&h=400&fit=crop"
    ],
    category: "other",
    freeDelivery: true,
    soldCount: 0,
    features: {
      en: [
        "Anti-dandruff formula",
        "400ml bottle",
        "Removes dandruff",
        "Healthy scalp",
        "Shiny hair",
        "Fresh fragrance",
        "Premium quality"
      ],
      ar: [
        "صيغة مضادة للقشرة",
        "زجاجة 400 مل",
        "يزيل القشرة",
        "فروة رأس صحية",
        "شعر لامع",
        "رائحة منعشة",
        "جودة ممتازة"
      ]
    }
  },
  {
    title: {
      en: "Biscuits Pack 500g - Assorted Flavors",
      ar: "عبوة بسكويت 500 جم - نكهات متنوعة"
    },
    description: {
      en: "Delicious assorted biscuits pack with multiple flavors. Perfect for tea time snacks.",
      ar: "عبوة بسكويت لذيذة بنكهات متنوعة. مثالية لوجبات الشاي الخفيفة."
    },
    currentPrice: 4.5,
    originalPrice: 6.5,
    discount: 31,
    image: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1609501676725-7186f1f86aec?w=400&h=400&fit=crop"
    ],
    category: "other",
    freeDelivery: true,
    soldCount: 0,
    features: {
      en: [
        "Assorted flavors",
        "500g pack",
        "Perfect for tea time",
        "Crispy and delicious",
        "Multiple varieties",
        "Fresh quality",
        "Value pack"
      ],
      ar: [
        "نكهات متنوعة",
        "عبوة 500 جم",
        "مثالية لوقت الشاي",
        "مقرمش ولذيذ",
        "أصناف متعددة",
        "جودة طازجة",
        "عبوة قيمة"
      ]
    }
  },
  {
    title: {
      en: "Cooking Salt 1kg - Iodized",
      ar: "ملح طبخ 1 كجم - معالج باليود"
    },
    description: {
      en: "Pure iodized cooking salt, essential for all cooking needs. Prevents iodine deficiency.",
      ar: "ملح طبخ نقي معالج باليود، أساسي لجميع احتياجات الطبخ. يمنع نقص اليود."
    },
    currentPrice: 1.9,
    originalPrice: 2.9,
    discount: 34,
    image: "https://images.unsplash.com/photo-1609501676725-7186f1f86aec?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1609501676725-7186f1f86aec?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&h=400&fit=crop"
    ],
    category: "other",
    freeDelivery: true,
    soldCount: 0,
    features: {
      en: [
        "Iodized salt",
        "1kg packaging",
        "Prevents iodine deficiency",
        "Pure quality",
        "Essential for cooking",
        "Long shelf life",
        "Premium quality"
      ],
      ar: [
        "ملح معالج باليود",
        "عبوة 1 كجم",
        "يمنع نقص اليود",
        "جودة نقية",
        "أساسي للطبخ",
        "عمر تخزين طويل",
        "جودة ممتازة"
      ]
    }
  },
  {
    title: {
      en: "Black Pepper Powder 100g - Kali Mirch",
      ar: "مسحوق الفلفل الأسود 100 جم - كالي ميرش"
    },
    description: {
      en: "Premium black pepper powder, essential spice for cooking. Aromatic and flavorful.",
      ar: "مسحوق فلفل أسود ممتاز، بهار أساسي للطبخ. عطري ومذاق."
    },
    currentPrice: 2.9,
    originalPrice: 4.0,
    discount: 28,
    image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1609501676725-7186f1f86aec?w=400&h=400&fit=crop"
    ],
    category: "other",
    freeDelivery: true,
    soldCount: 0,
    features: {
      en: [
        "Premium black pepper",
        "100g packaging",
        "Aromatic flavor",
        "Essential spice",
        "Natural quality",
        "Fresh ground",
        "Premium quality"
      ],
      ar: [
        "فلفل أسود ممتاز",
        "عبوة 100 جم",
        "نكهة عطرية",
        "بهار أساسي",
        "جودة طبيعية",
        "مطحون طازج",
        "جودة ممتازة"
      ]
    }
  },
  {
    title: {
      en: "Coriander Powder 200g - Dhaniya",
      ar: "مسحوق الكزبرة 200 جم - دهانيا"
    },
    description: {
      en: "Fresh coriander powder, essential spice for cooking. Aromatic and flavorful.",
      ar: "مسحوق كزبرة طازج، بهار أساسي للطبخ. عطري ومذاق."
    },
    currentPrice: 2.5,
    originalPrice: 3.5,
    discount: 29,
    image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1609501676725-7186f1f86aec?w=400&h=400&fit=crop"
    ],
    category: "other",
    freeDelivery: true,
    soldCount: 0,
    features: {
      en: [
        "Fresh coriander powder",
        "200g packaging",
        "Aromatic flavor",
        "Essential spice",
        "Natural quality",
        "Fresh ground",
        "Premium quality"
      ],
      ar: [
        "مسحوق كزبرة طازج",
        "عبوة 200 جم",
        "نكهة عطرية",
        "بهار أساسي",
        "جودة طبيعية",
        "مطحون طازج",
        "جودة ممتازة"
      ]
    }
  },
  {
    title: {
      en: "Garam Masala 100g - Mixed Spices",
      ar: "غارام ماسالا 100 جم - بهارات مختلطة"
    },
    description: {
      en: "Premium garam masala blend, perfect spice mix for curries and biryani. Aromatic blend.",
      ar: "مزيج غارام ماسالا ممتاز، مزيج بهارات مثالي للكاري والبرياني. مزيج عطري."
    },
    currentPrice: 3.9,
    originalPrice: 5.5,
    discount: 29,
    image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1609501676725-7186f1f86aec?w=400&h=400&fit=crop"
    ],
    category: "other",
    freeDelivery: true,
    soldCount: 0,
    features: {
      en: [
        "Premium spice blend",
        "100g packaging",
        "Perfect for curries",
        "Aromatic blend",
        "Mixed spices",
        "Traditional recipe",
        "Premium quality"
      ],
      ar: [
        "مزيج بهارات ممتاز",
        "عبوة 100 جم",
        "مثالي للكاري",
        "مزيج عطري",
        "بهارات مختلطة",
        "وصفة تقليدية",
        "جودة ممتازة"
      ]
    }
  }
];

export async function POST() {
  try {
    console.log('🚀 Starting to add general store products...\n');
    
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    
    for (let i = 0; i < generalStoreProducts.length; i++) {
      const product = generalStoreProducts[i];
      
      try {
        console.log(`📦 Adding product ${i + 1}/${generalStoreProducts.length}: ${product.title.en}`);
        
        // Insert into database
        const result = await sql`
          INSERT INTO products (
            title_en,
            title_ar,
            description_en,
            description_ar,
            current_price,
            original_price,
            discount,
            image,
            images,
            free_delivery,
            sold_count,
            category,
            features_en,
            features_ar,
            status
          )
          VALUES (
            ${product.title.en},
            ${product.title.ar},
            ${product.description.en},
            ${product.description.ar},
            ${product.currentPrice},
            ${product.originalPrice},
            ${product.discount},
            ${product.image},
            ${JSON.stringify(product.images || [])},
            ${product.freeDelivery},
            ${product.soldCount || 0},
            ${product.category},
            ${JSON.stringify(product.features?.en || [])},
            ${JSON.stringify(product.features?.ar || [])},
            'active'
          )
          RETURNING *
        `;
        
        const row = result[0];
        console.log(`✅ Successfully added: ${product.title.en} (ID: ${row.id})\n`);
        successCount++;
        
      } catch (error: unknown) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error(`❌ Failed to add: ${product.title.en}`);
        console.error(`   Error: ${errorMsg}\n`);
        errors.push(`${product.title.en}: ${errorMsg}`);
        errorCount++;
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Added ${successCount} products successfully`,
      summary: {
        total: generalStoreProducts.length,
        success: successCount,
        failed: errorCount,
        errors: errors.length > 0 ? errors : undefined
      }
    });
    
  } catch (error: unknown) {
    console.error('Error in add-general-store-products:', error);
    const errorMsg = error instanceof Error ? error.message : 'Failed to add products';
    return NextResponse.json(
      { 
        success: false,
        error: errorMsg
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'POST to this endpoint to add general store products',
    totalProducts: generalStoreProducts.length,
    products: generalStoreProducts.map(p => ({
      title: p.title.en,
      category: p.category,
      price: p.currentPrice
    }))
  });
}

