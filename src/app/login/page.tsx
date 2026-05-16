'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLoginModal } from '@/context/LoginModalContext';

/** Legacy /login URL — opens modal on top of callback page (or home). */
function LoginRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { openLogin } = useLoginModal();

  useEffect(() => {
    const raw = searchParams.get('callbackUrl') || '/';
    const safe = raw.startsWith('/') && !raw.startsWith('/admin') ? raw : '/';
    openLogin(safe);
    router.replace(safe === '/login' ? '/' : safe);
  }, [searchParams, openLogin, router]);

  return null;
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginRedirect />
    </Suspense>
  );
}
