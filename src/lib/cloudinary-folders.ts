/**
 * Cloudinary folder paths — category / section wise under one root for Media Library clarity.
 * Override root with env: CLOUDINARY_UPLOAD_PREFIX (default: stylesnest)
 */

const DEFAULT_ROOT = 'stylesnest';

export function cloudinaryUploadRoot(): string {
  const raw = process.env.CLOUDINARY_UPLOAD_PREFIX?.trim();
  if (!raw) return DEFAULT_ROOT;
  return sanitizePathSegment(raw.replace(/^\/+|\/+$/g, '')) || DEFAULT_ROOT;
}

/** Safe single path segment for folders / public_id prefix (no slashes). */
export function sanitizePathSegment(raw: string): string {
  const s = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  return (s || 'misc').slice(0, 80);
}

/** Product images: stylesnest/products/{category}/ */
export function productImageFolder(category: string): string {
  const root = cloudinaryUploadRoot();
  const cat = sanitizePathSegment(category);
  return `${root}/products/${cat}`;
}

/** Landing / homepage sections: stylesnest/landing/{section}/ */
export function landingImageFolder(section: string): string {
  const root = cloudinaryUploadRoot();
  const sec = sanitizePathSegment(section || 'general');
  return `${root}/landing/${sec}`;
}

/** Legacy homepage bulk script: stylesnest/homepage/ */
export function homepageBulkFolder(): string {
  return `${cloudinaryUploadRoot()}/homepage`;
}

/** Customer review photos: stylesnest/reviews/{userId}/ */
export function reviewImageFolder(userId: number): string {
  const root = cloudinaryUploadRoot();
  return `${root}/reviews/user_${userId}`;
}

/** Shop customer profile avatars: stylesnest/profiles/user_{userId}/ */
export function profileImageFolder(userId: number): string {
  const root = cloudinaryUploadRoot();
  return `${root}/profiles/user_${userId}`;
}
