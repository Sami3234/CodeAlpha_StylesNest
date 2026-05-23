'use client';

import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { useLoginModal } from '@/context/LoginModalContext';
import { usePendingReviews } from '@/context/PendingReviewsContext';
import { useNavbarProfile } from '@/hooks/useNavbarProfile';
import { motion } from 'framer-motion';
import { IoPersonCircleOutline } from 'react-icons/io5';
import './header-profile.css';

function ProfileBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      className="header-profile-badge"
      aria-label={`${count} review${count === 1 ? '' : 's'} pending`}
    >
      {count > 9 ? '9+' : count}
    </span>
  );
}

export default function HeaderProfile({ compact }: { compact?: boolean }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const { openLogin } = useLoginModal();
  const isActive = pathname === '/profile';
  const { pendingCount } = usePendingReviews();
  const { avatarUrl, initials, label, ready: profileReady } = useNavbarProfile();
  const profileHref = '/profile';

  if (status === 'loading') {
    return (
      <span
        className="header-profile-pill header-profile-pill--idle"
        style={{
          width: compact ? 40 : 120,
          minHeight: compact ? 40 : 44,
          background: 'rgba(0,0,0,0.06)',
          border: 'none',
        }}
        aria-hidden
      />
    );
  }

  if (!session?.user) {
    return (
      <button
        type="button"
        className="header-profile-signin-btn"
        onClick={() => openLogin(pathname || '/')}
        aria-label="Sign in"
      >
        <motion.span
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          className={`header-profile-signin-pill${compact ? ' header-profile-signin-pill--compact' : ''}`}
        >
          <IoPersonCircleOutline size={compact ? 20 : 22} aria-hidden />
          {!compact ? <span className="header-profile-signin-text">Sign in</span> : null}
        </motion.span>
      </button>
    );
  }

  return (
    <Link
      href={profileHref}
      aria-label={
        pendingCount > 0
          ? `Your profile, ${pendingCount} review${pendingCount === 1 ? '' : 's'} pending`
          : 'Your profile'
      }
      title={session.user.email ?? label}
      className="header-profile-link"
    >
      <motion.span
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className={`header-profile-pill${compact ? ' header-profile-pill--compact' : ''}${
          isActive ? ' header-profile-pill--active' : ' header-profile-pill--idle'
        }`}
      >
        <span className="header-profile-icon">
          <span className="header-profile-avatar">
            {avatarUrl ? (
              <Image src={avatarUrl} alt="" fill sizes="32px" unoptimized />
            ) : profileReady ? (
              <span className="header-profile-initials" aria-hidden>
                {initials}
              </span>
            ) : (
              <IoPersonCircleOutline size={compact ? 20 : 20} aria-hidden />
            )}
          </span>
          <ProfileBadge count={pendingCount} />
        </span>
        {!compact && profileReady && label ? (
          <span className="header-profile-label">{label}</span>
        ) : !compact && !profileReady ? (
          <span className="header-profile-label header-profile-label--placeholder" aria-hidden />
        ) : null}
      </motion.span>
    </Link>
  );
}

/** Sign out only — profile / sign-in live on the mobile navbar bar. */
export function HeaderProfileMobile({ onNavigate }: { onNavigate?: () => void }) {
  const { data: session, status } = useSession();

  if (status !== 'authenticated' || !session?.user) return null;

  return (
    <button
      type="button"
      onClick={() => {
        onNavigate?.();
        void signOut({ callbackUrl: '/' });
      }}
      style={{
        width: '100%',
        padding: '10px 20px',
        fontSize: '14px',
        fontWeight: 500,
        color: '#718096',
        background: 'transparent',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        cursor: 'pointer',
      }}
    >
      Sign out
    </button>
  );
}