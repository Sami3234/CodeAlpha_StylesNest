/** CSS class helpers for product badges and tags */

export function saleTagClass(): string {
  return 'pc-tag pc-tag--sale';
}

export function deliveryTagClass(): string {
  return 'pc-tag pc-tag--delivery';
}

export function stitchTagClass(stitch: 'stitched' | 'unstitched'): string {
  return stitch === 'stitched' ? 'pc-tag pc-tag--stitched' : 'pc-tag pc-tag--unstitched';
}

export function saleOverlayClass(): string {
  return 'pc-tag pc-tag--sale pc-tag--overlay pc-tag--overlay-sale';
}

export function stitchOverlayClass(stitch: 'stitched' | 'unstitched'): string {
  return `${stitchTagClass(stitch)} pc-tag--overlay pc-tag--overlay-stitch`;
}

export function genderTagClass(gender: 'men' | 'women' | string | undefined): string {
  if (gender === 'men') return 'pc-tag pc-tag--men';
  if (gender === 'women') return 'pc-tag pc-tag--women';
  return 'pc-tag';
}

/** @deprecated Use genderTagClass on product cards */
export function genderBadgeClass(gender: 'men' | 'women' | string | undefined): string {
  return genderTagClass(gender);
}

export function genderImageBadgeClass(gender: 'men' | 'women' | string | undefined): string {
  const base = 'pc-badge pc-badge--on-image';
  if (gender === 'men') return `${base} pc-badge--gender-men`;
  if (gender === 'women') return `${base} pc-badge--gender-women`;
  return base;
}

export function stitchImageBadgeClass(stitch: 'stitched' | 'unstitched'): string {
  const base = 'pc-badge pc-badge--on-image';
  return stitch === 'stitched' ? `${base} pc-badge--stitched` : `${base} pc-badge--unstitched`;
}
