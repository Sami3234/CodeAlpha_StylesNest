'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';
import LoginModal from '@/components/auth/LoginModal';

type LoginModalContextValue = {
  isOpen: boolean;
  callbackUrl: string;
  openLogin: (callbackUrl?: string) => void;
  closeLogin: () => void;
};

const LoginModalContext = createContext<LoginModalContextValue | null>(null);

export function LoginModalProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [callbackUrl, setCallbackUrl] = useState('/');

  const openLogin = useCallback((url?: string) => {
    const target = url || pathname || '/';
    setCallbackUrl(target);
    setIsOpen(true);
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden';
    }
  }, [pathname]);

  const closeLogin = useCallback(() => {
    setIsOpen(false);
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
  }, []);

  const value = useMemo(
    () => ({ isOpen, callbackUrl, openLogin, closeLogin }),
    [isOpen, callbackUrl, openLogin, closeLogin]
  );

  return (
    <LoginModalContext.Provider value={value}>
      {children}
      <LoginModal />
    </LoginModalContext.Provider>
  );
}

export function useLoginModal() {
  const ctx = useContext(LoginModalContext);
  if (!ctx) {
    throw new Error('useLoginModal must be used within LoginModalProvider');
  }
  return ctx;
}
