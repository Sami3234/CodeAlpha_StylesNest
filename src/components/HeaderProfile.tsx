'use client';

import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { useLoginModal } from '@/context/LoginModalContext';
import { motion } from 'framer-motion';
import { IoPersonCircleOutline } from 'react-icons/io5';

export default function HeaderProfile({ compact }: { compact?: boolean }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const { openLogin } = useLoginModal();
  const isActive = pathname === '/profile';

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

  return (
    <Link href="/profile" aria-label="Your profile" title={session.user.email ?? label}>
      <motion.span
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: compact ? 0 : 8,
          padding: compact ? 0 : '4px 12px 4px 4px',
          borderRadius: '999px',
          border: isActive ? 'none' : '2px solid rgba(255, 107, 53, 0.45)',
          background: isActive
            ? 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ff8c42 100%)'
            : 'rgba(255, 255, 255, 0.95)',
          boxShadow: isActive ? '0px 8px 22px rgba(255, 107, 53, 0.45)' : '0px 4px 12px rgba(0,0,0,0.08)',
          color: isActive ? '#fff' : '#4a5568',
          maxWidth: compact ? 48 : 160,
        }}
      >
        <span
          style={{
            width: compact ? 40 : 36,
            height: compact ? 40 : 36,
            borderRadius: '50%',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IoPersonCircleOutline size={compact ? 20 : 22} aria-hidden />
        </span>
        {!compact ? (
          <span style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {label}
          </span>
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
