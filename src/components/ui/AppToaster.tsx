'use client';

import { Toaster } from 'sonner';
import './sonner-toast.css';

type AppToasterProps = {
  /** Storefront: below main site header. Admin: below admin sticky header. */
  variant?: 'store' | 'admin';
};

/**
 * Site-wide toast host — top-right, below header (never over navbar center).
 */
export default function AppToaster({ variant = 'store' }: AppToasterProps) {
  return (
    <Toaster
      className={variant === 'admin' ? 'stylesnest-sonner stylesnest-sonner--admin' : 'stylesnest-sonner'}
      position="top-right"
      richColors
      closeButton
      duration={5000}
      gap={10}
      offset={12}
      toastOptions={{
        className: 'stylesnest-toast',
      }}
    />
  );
}
