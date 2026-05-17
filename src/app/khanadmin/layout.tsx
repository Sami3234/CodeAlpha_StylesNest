'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Header from '@/components/Header';
import AdminSidebar from '@/components/AdminSidebar';
import { ToastProvider } from '@/components/Toast';
import AdminLoading from '@/components/admin/AdminLoading';
import ConnectionProblem from '@/components/network/ConnectionProblem';
import { clientFetch, isLikelyNetworkError, NetworkError } from '@/lib/client-fetch';
import { adminPath, isPublicAdminPath } from '@/lib/admin-path';

async function fetchAdminAuth(): Promise<boolean> {
  const response = await clientFetch('/api/admin/auth', { cache: 'no-store' });
  if (!response.ok) return false;
  const data = (await response.json()) as { authenticated?: boolean };
  return Boolean(data.authenticated);
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [authNetworkError, setAuthNetworkError] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const runAuthCheck = useCallback(async (): Promise<boolean> => {
    setAuthNetworkError(false);
    try {
      const ok = await fetchAdminAuth();
      if (ok) {
        setIsAuthenticated(true);
        return true;
      }
      setIsAuthenticated(false);
      router.replace(adminPath('/login'));
      return false;
    } catch (error) {
      setIsAuthenticated(false);
      if (error instanceof NetworkError || isLikelyNetworkError(error)) {
        setAuthNetworkError(true);
      } else {
        router.replace(adminPath('/login'));
      }
      return false;
    }
  }, [router]);

  useEffect(() => {
    if (isPublicAdminPath(pathname)) {
      setIsCheckingAuth(false);
      setIsAuthenticated(false);
      return;
    }

    let cancelled = false;
    setIsCheckingAuth(true);

    void (async () => {
      await runAuthCheck();
      if (!cancelled) setIsCheckingAuth(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname, runAuthCheck]);

  const retryAuthCheck = useCallback(async () => {
    setIsCheckingAuth(true);
    await runAuthCheck();
    setIsCheckingAuth(false);
  }, [runAuthCheck]);

  if (authNetworkError) {
    return (
      <ConnectionProblem
        variant="fullscreen"
        theme="admin"
        kind="offline"
        onRetry={() => void retryAuthCheck()}
        homeHref={adminPath('/login')}
        homeLabel="Sign in"
        retryLabel="Retry connection"
      />
    );
  }

  if (isCheckingAuth) {
    return (
      <AdminLoading
        variant="fullscreen"
        message="Checking authentication"
        subMessage="Please wait while we verify your admin session"
      />
    );
  }

  if (isPublicAdminPath(pathname)) {
    return <>{children}</>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <ToastProvider>
      <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
        <div style={{ position: 'sticky', top: 0, zIndex: 100 }}>
          <Header />
        </div>

        {isMobile ? (
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            style={{
              position: 'fixed',
              bottom: '20px',
              right: '20px',
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#2c3e50',
              color: '#fff',
              border: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              cursor: 'pointer',
              zIndex: 30,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Open admin menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        ) : null}

        <div style={{ display: 'flex' }}>
          <AdminSidebar
            isOpen={isMobile ? sidebarOpen : true}
            onClose={() => setSidebarOpen(false)}
            isMobile={isMobile}
          />
          <main
            style={{
              flex: 1,
              padding: '20px',
              minHeight: '100vh',
              marginTop: '90px',
              marginLeft: isMobile ? '0' : '260px',
              transition: 'margin-left 0.3s ease',
            }}
          >
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
