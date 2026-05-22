import {
  REVIEW_IMAGE_MAX,
  REVIEW_IMAGE_MIN,
} from '@/lib/product-reviews-schema';

const ALLOWED_HOST_SUFFIXES = ['cloudinary.com', 'res.cloudinary.com'];

export function parseReviewImageUrls(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((u): u is string => typeof u === 'string')
    .map((u) => u.trim())
    .filter(Boolean)
    .slice(0, REVIEW_IMAGE_MAX);
}

export function isAllowedReviewImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    const host = parsed.hostname.toLowerCase();
    return ALLOWED_HOST_SUFFIXES.some((s) => host === s || host.endsWith(`.${s}`));
  } catch {
    return false;
  }
}

export function validateReviewImages(
  images: string[],
): { ok: true; urls: string[] } | { ok: false; error: string } {
  const urls = images.map((u) => u.trim()).filter(Boolean);
  if (urls.length < REVIEW_IMAGE_MIN) {
    return { ok: false, error: 'Add at least 1 photo (up to 3).' };
  }
  if (urls.length > REVIEW_IMAGE_MAX) {
    return { ok: false, error: `Maximum ${REVIEW_IMAGE_MAX} photos allowed` };
  }
  for (const url of urls) {
    if (!isAllowedReviewImageUrl(url)) {
      return { ok: false, error: 'Invalid review image URL' };
    }
  }
  return { ok: true, urls };
}
