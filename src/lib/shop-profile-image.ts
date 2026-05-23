/** True only for avatars uploaded via profile (Cloudinary), not Google/Apple OAuth URLs. */
export function isShopUploadedProfileImage(url: string | null | undefined): boolean {
  if (!url?.trim()) return false;
  try {
    return new URL(url.trim()).hostname.toLowerCase().endsWith('cloudinary.com');
  } catch {
    return false;
  }
}

export function emailInitials(email: string | null | undefined): string {
  const local = (email ?? '').trim().split('@')[0] || '';
  if (!local) return '?';
  if (local.length === 1) return local.toUpperCase();
  return local.slice(0, 2).toUpperCase();
}

export function emailLocalPart(email: string | null | undefined): string {
  const local = (email ?? '').trim().split('@')[0];
  return local || 'Profile';
}
