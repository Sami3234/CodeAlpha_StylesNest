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

/** Navbar avatar: session first, DB upload fetched in background (never blocks the bar). */
export function useNavbarProfile(): NavbarProfileDisplay {
  const { data: session, status } = useSession();
  const email = session?.user?.email ?? '';
  const sessionAvatar = isShopUploadedProfileImage(session?.user?.image)
    ? session!.user!.image!.trim()
    : null;

  const [dbAvatar, setDbAvatar] = useState<string | null>(null);

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.id || sessionAvatar) return;

    let cancelled = false;

    fetch('/api/account/profile')
      .then(async (res) => {
        const data = await res.json();
        if (cancelled) return;
        const img = data.profile?.image as string | undefined;
        setDbAvatar(isShopUploadedProfileImage(img) ? img!.trim() : null);
      })
      .catch(() => {
        if (!cancelled) setDbAvatar(null);
      });

    return () => {
      cancelled = true;
    };
  }, [status, session?.user?.id, sessionAvatar]);

  const avatarUrl =
    sessionAvatar ?? (status === 'authenticated' && session?.user?.id ? dbAvatar : null);
  const initials = emailInitials(email);
  const namePart = session?.user?.name?.trim().split(/\s+/)[0];
  const emailLocal = emailLocalPart(email);
  const isRealName =
    Boolean(namePart && namePart.length >= 2 && namePart.toLowerCase() !== emailLocal.toLowerCase());

  const label = isRealName ? namePart! : 'Profile';
  const ready = status !== 'loading';

  return {
    avatarUrl,
    initials,
    label: status === 'authenticated' ? label : '',
    ready,
  };
}
