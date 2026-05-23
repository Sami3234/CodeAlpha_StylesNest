'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  emailInitials,
  emailLocalPart,
  isShopUploadedProfileImage,
} from '@/lib/shop-profile-image';

export type NavbarProfileDisplay = {
  avatarUrl: string | null;
  initials: string;
  label: string;
  ready: boolean;
};

/** Navbar avatar: DB upload only; otherwise email initials + local part label. */
export function useNavbarProfile(): NavbarProfileDisplay {
  const { data: session, status } = useSession();
  const email = session?.user?.email ?? '';
  const sessionAvatar = isShopUploadedProfileImage(session?.user?.image)
    ? session!.user!.image!.trim()
    : null;

  const [dbAvatar, setDbAvatar] = useState<string | null>(null);
  const [ready, setReady] = useState(status !== 'authenticated');

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.id) {
      setDbAvatar(null);
      setReady(status !== 'loading');
      return;
    }

    let cancelled = false;
    setReady(false);

    fetch('/api/account/profile', { cache: 'no-store' })
      .then(async (res) => {
        const data = await res.json();
        if (cancelled) return;
        const img = data.profile?.image as string | undefined;
        setDbAvatar(isShopUploadedProfileImage(img) ? img!.trim() : null);
      })
      .catch(() => {
        if (!cancelled) setDbAvatar(null);
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [status, session?.user?.id, session?.user?.image]);

  const avatarUrl = sessionAvatar ?? dbAvatar;
  const initials = emailInitials(email);
  const namePart = session?.user?.name?.trim().split(/\s+/)[0];
  const emailLocal = emailLocalPart(email);
  const isRealName =
    Boolean(namePart && namePart.length >= 2 && namePart.toLowerCase() !== emailLocal.toLowerCase());

  /** Never show raw email in navbar — use display name or generic "Profile". */
  const label = isRealName ? namePart! : 'Profile';

  const profileReady = ready || Boolean(sessionAvatar);

  return {
    avatarUrl,
    initials,
    label: profileReady ? label : '',
    ready: profileReady,
  };
}
