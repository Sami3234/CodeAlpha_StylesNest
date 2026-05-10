/**
 * Simple translation utility for auto-translating between English and Arabic
 * Uses basic word mapping and fallback logic
 */

// Common word/phrase mappings for basic translation
const translationMap: Record<string, { en: string; ar: string }> = {
  // Common e-commerce terms
  'product': { en: 'Product', ar: 'منتج' },
  'price': { en: 'Price', ar: 'السعر' },
  'discount': { en: 'Discount', ar: 'خصم' },
  'free delivery': { en: 'Free Delivery', ar: 'توصيل مجاني' },
  'waterproof': { en: 'Waterproof', ar: 'مقاوم للماء' },
  'battery': { en: 'Battery', ar: 'بطارية' },
  'wireless': { en: 'Wireless', ar: 'لاسلكي' },
  'premium': { en: 'Premium', ar: 'مميز' },
  'quality': { en: 'Quality', ar: 'جودة' },
  'original': { en: 'Original', ar: 'أصلي' },
  'new': { en: 'New', ar: 'جديد' },
  'best': { en: 'Best', ar: 'أفضل' },
  'sale': { en: 'Sale', ar: 'تخفيض' },
  // Product-related terms
  'shaver': { en: 'Shaver', ar: 'ماكينة حلاقة' },
  'drone': { en: 'Drone', ar: 'طائرة بدون طيار' },
  'camera': { en: 'Camera', ar: 'كاميرا' },
  'phone': { en: 'Phone', ar: 'هاتف' },
  'watch': { en: 'Watch', ar: 'ساعة' },
  'lighter': { en: 'Lighter', ar: 'ولاعة' },
  'massager': { en: 'Massager', ar: 'مدلك' },
  'jump starter': { en: 'Jump Starter', ar: 'شاحن بطارية السيارة' },
  'air pump': { en: 'Air Pump', ar: 'مضخة هواء' },
  'hd': { en: 'HD', ar: 'عالية الدقة' },
  '4k': { en: '4K', ar: '4K' },
  'turbo': { en: 'Turbo', ar: 'توربو' },
  'days': { en: 'days', ar: 'أيام' },
  'use': { en: 'Use', ar: 'استخدام' },
  'buy': { en: 'Buy', ar: 'اشتري' },
  'get': { en: 'Get', ar: 'احصل على' },
  'free': { en: 'Free', ar: 'مجاني' },
  'portable': { en: 'Portable', ar: 'محمول' },
  'rechargeable': { en: 'Rechargeable', ar: 'قابل للشحن' },
  'dual sim': { en: 'Dual SIM', ar: 'شريحتين' },
  'professional': { en: 'Professional', ar: 'احترافي' },
  'stainless steel': { en: 'Stainless Steel', ar: 'فولاذ مقاوم للصدأ' },
  'ergonomic': { en: 'Ergonomic', ar: 'مريح' },
  'usb': { en: 'USB', ar: 'يو إس بي' },
  'bluetooth': { en: 'Bluetooth', ar: 'بلوتوث' },
  'fm radio': { en: 'FM Radio', ar: 'راديو إف إم' },
  'mp3 player': { en: 'MP3 Player', ar: 'مشغل MP3' },
};

/**
 * Clean translated text by removing prefixes and brackets
 */
export function cleanTranslatedText(text: string): string {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .replace(/^ترجمة[:：]?\s*/i, '')
    .replace(/^translation[:：]?\s*/i, '')
    .replace(/^\[|\]$/g, '')
    .trim();
}

/**
 * Detect if text is Arabic
 */
function isArabic(text: string): boolean {
  const arabicPattern = /[\u0600-\u06FF]/;
  return arabicPattern.test(text);
}

/**
 * Simple English to Arabic translation using mapping
 * Tries to translate common words and phrases
 * For better results, use translateWithAPI
 */
function translateEnToAr(text: string): string {
  if (!text || text.trim() === '') return '';
  
  const lowerText = text.toLowerCase().trim();
  
  // Check if entire text is in map
  if (translationMap[lowerText]) {
    return translationMap[lowerText].ar;
  }
  
  // Try to translate common phrases and words
  let translated = text;
  let hasTranslation = false;
  
  // Sort by length (longest first) to match phrases before words
  const sortedEntries = Object.entries(translationMap).sort((a, b) => b[0].length - a[0].length);
  
  // Replace common words/phrases
  for (const [key, value] of sortedEntries) {
    const regex = new RegExp(`\\b${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    if (regex.test(lowerText)) {
      hasTranslation = true;
      translated = translated.replace(regex, (match) => {
        // Preserve case
        if (match === match.toUpperCase()) {
          return value.ar.toUpperCase();
        } else if (match[0] === match[0].toUpperCase()) {
          return value.ar.charAt(0).toUpperCase() + value.ar.slice(1);
        }
        return value.ar;
      });
    }
  }
  
  // If partial translation happened, return it
  // Otherwise return original (will be translated by API if needed)
  return hasTranslation ? translated : text;
}

/**
 * Simple Arabic to English translation
 * Returns original text if no translation available (no placeholder)
 */
function translateArToEn(text: string): string {
  if (!text || text.trim() === '') return '';
  
  // Check reverse mapping
  for (const [, value] of Object.entries(translationMap)) {
    if (value.ar === text) {
      return value.en;
    }
  }
  
  // For Arabic text, return original if no translation available
  // In production, use translation API
  return text;
}

/**
 * Auto-translate text based on detected language
 * Returns cleaned translated text (no prefixes or brackets)
 */
export function autoTranslate(text: string, targetLang: 'en' | 'ar'): string {
  if (!text || text.trim() === '') return '';
  
  // First clean any existing translation artifacts
  const cleanedText = cleanTranslatedText(text);
  
  const isTextArabic = isArabic(cleanedText);
  
  let translated: string;
  
  if (targetLang === 'ar') {
    // Target is Arabic
    if (isTextArabic) {
      // Already Arabic, return as is (cleaned)
      translated = cleanedText;
    } else {
      // Translate English to Arabic
      translated = translateEnToAr(cleanedText);
    }
  } else {
    // Target is English
    if (isTextArabic) {
      // Translate Arabic to English
      translated = translateArToEn(cleanedText);
    } else {
      // Already English, return as is (cleaned)
      translated = cleanedText;
    }
  }
  
  // Clean the result again to ensure no artifacts
  return cleanTranslatedText(translated);
}

/**
 * Translate an array of strings
 * Returns cleaned translated strings (no prefixes or brackets)
 */
export function translateArray(items: string[], targetLang: 'en' | 'ar'): string[] {
  return items.map(item => {
    // Clean before and after translation
    const cleaned = cleanTranslatedText(item);
    return autoTranslate(cleaned, targetLang);
  });
}

/**
 * Translate using free MyMemory Translation API
 * Works client-side without API key
 */
async function translateWithMyMemory(text: string, targetLang: 'en' | 'ar'): Promise<string> {
  try {
    const langCode = targetLang === 'ar' ? 'ar' : 'en';
    const sourceLang = targetLang === 'ar' ? 'en' : 'ar';
    
    // MyMemory Translation API (free, no key required for limited use)
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${langCode}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Translation API failed');
    }
    
    const data = await response.json();
    if (data.responseData && data.responseData.translatedText) {
      return cleanTranslatedText(data.responseData.translatedText);
    }
    
    throw new Error('No translation received');
  } catch (error) {
    console.warn('Translation API error, using fallback:', error);
    // Fallback to basic translation
    return autoTranslate(text, targetLang);
  }
}

/**
 * For production: Use Google Translate API or similar
 * The result will be automatically cleaned
 */
export async function translateWithAPI(text: string, targetLang: 'en' | 'ar'): Promise<string> {
  // Use MyMemory API for free translation
  return translateWithMyMemory(text, targetLang);
}

