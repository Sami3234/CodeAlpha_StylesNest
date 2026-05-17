'use client';

import { Suspense, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useLoginModal } from '@/context/LoginModalContext';
import LoginFormContent from '@/components/auth/LoginFormContent';
import '@/app/login/login.css';

export default function LoginModal() {
  const { isOpen, callbackUrl, closeLogin } = useLoginModal();
  const { status, update } = useSession();
  const router = useRouter();

  const handleSuccess = useCallback(async () => {
    await update();
    closeLogin();
    router.refresh();
  }, [closeLogin, router, update]);

  useEffect(() => {
    if (status === 'authenticated' && isOpen) {
      closeLogin();
    }
  }, [status, isOpen, closeLogin]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLogin();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, closeLogin]);

  if (!isOpen) return null;

  return (
    <div
      className="login-modal-overlay"
      role="presentation"
      onClick={closeLogin}
    >
      <div
        className="login-modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <Suspense fallback={<p className="login-card__sub">Loading sign-in…</p>}>
          <LoginFormContent callbackUrl={callbackUrl} onSuccess={handleSuccess} onClose={closeLogin} />
        </Suspense>
      </div>
    </div>
  );
}
