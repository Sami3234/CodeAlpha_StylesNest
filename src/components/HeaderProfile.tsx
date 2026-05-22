'use client';

import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { useLoginModal } from '@/context/LoginModalContext';
import { usePendingReviews } from '@/context/PendingReviewsContext';
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
  const profileHref = '/profile';

  if (status === 'loading') {
    return (
      <span
        style={{
          width: compact ? 40 : 48,
          height: compact ? 40 : 48,
          borderRadius: '50%',
          background: 'rgba(0,0,0,0.06)',
        }}
        aria-hidden
      />
    );
  }

  if (!session?.user) {
    return (
      <button
        type="button"
        onClick={() => openLogin(pathname || '/')}
        aria-label="Sign in"
        style={{
          border: 'none',
          padding: 0,
          background: 'transparent',
          cursor: 'pointer',
        }}
      >
        <motion.span
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: compact ? 40 : 48,
            height: compact ? 40 : 48,
            borderRadius: '50%',
            border: isActive ? 'none' : '2px solid rgba(255, 107, 53, 0.45)',
            background: isActive
              ? 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ff8c42 100%)'
              : 'rgba(255, 255, 255, 0.95)',
            color: isActive ? '#fff' : '#4a5568',
            boxShadow: isActive ? '0px 8px 22px rgba(255, 107, 53, 0.45)' : '0px 4px 12px rgba(0,0,0,0.08)',
          }}
        >
          <IoPersonCircleOutline size={compact ? 20 : 22} aria-hidden />
        </motion.span>
      </button>
    );
  }

  const label = session.user.name?.split(' ')[0] || 'Profile';
  const avatarUrl = session.user.image?.trim() || null;

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
          {avatarUrl ? (
            <Image src={avatarUrl} alt="" fill sizes="32px" unoptimized />
          ) : (
            <IoPersonCircleOutline size={compact ? 20 : 20} aria-hidden />
          )}
          <ProfileBadge count={pendingCount} />
        </span>
        {!compact ? <span className="header-profile-label">{label}</span> : null}
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