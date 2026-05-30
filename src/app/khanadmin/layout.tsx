'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Header from '@/components/Header';
import AdminSidebar from '@/components/AdminSidebar';
import { ToastProvider } from '@/components/Toast';
import AppToaster from '@/components/ui/AppToaster';
import AdminLoading from '@/components/admin/AdminLoading';
import ConnectionProblem from '@/components/network/ConnectionProblem';
import { isLikelyNetworkError, NetworkError } from '@/lib/client-fetch';
import {
  canTrustAdminSessionLocally,
  clearAdminAuthCache,
  ensureAdminAuthenticated,
  writeAdminAuthCache,
} from '@/lib/admin-auth-client';
import { adminPath, isPublicAdminPath } from '@/lib/admin-path';
import { useOrders } from '@/context/OrderContext';
import { useProducts } from '@/context/ProductContext';
import { DB_UNAVAILABLE_MESSAGE } from '@/lib/db-errors';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const isPublicRoute = isPublicAdminPath(pathname);
  const verifyStartedRef = useRef(false);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  /** Same on server + client first paint — cookie/cache only read after mount (avoids hydration mismatch). */
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(!isPublicRoute);
  const [authNetworkError, setAuthNetworkError] = useState(false);
  const { fetchError: ordersFetchError, reloadOrders, loading: ordersLoading } = useOrders();
  const { fetchError: productsFetchError, reloadProducts, loading: productsLoading } =
    useProducts();

  const adminDataLoading = ordersLoading || productsLoading;
  const adminDataError = ordersFetchError || productsFetchError;

  const retryAdminData = useCallback(() => {
    void reloadOrders();
    void reloadProducts();
  }, [reloadOrders, reloadProducts]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const runAuthCheck = useCallback(async (): Promise<boolean> => {
    setAuthNetworkError(false);
    try {
      const ok = await ensureAdminAuthenticated();
      if (ok) {
        setIsAuthenticated(true);
        writeAdminAuthCache(true);
        return true;
      }
      setIsAuthenticated(false);
      clearAdminAuthCache();
      router.replace(adminPath('/login'));
      return false;
    } catch (error) {
      setIsAuthenticated(false);
      clearAdminAuthCache();
      if (error instanceof NetworkError || isLikelyNetworkError(error)) {
        setAuthNetworkError(true);
      } else {
        router.replace(adminPath('/login'));
      }
      return false;
    }
  }, [router]);

  useEffect(() => {
    if (isPublicRoute) {
      verifyStartedRef.current = false;
      setIsCheckingAuth(false);
      setIsAuthenticated(false);
      return;
    }

    if (verifyStartedRef.current) {
      return;
    }
    verifyStartedRef.current = true;

    if (canTrustAdminSessionLocally()) {
      setIsAuthenticated(true);
      setIsCheckingAuth(false);
    } else {
      setIsCheckingAuth(true);
    }

    let cancelled = false;

    void (async () => {
      const ok = await runAuthCheck();
      if (cancelled) return;
      setIsAuthenticated(ok);
      setIsCheckingAuth(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [isPublicRoute, runAuthCheck]);

  const retryAuthCheck = useCallback(async () => {
    setIsCheckingAuth(true);
    setAuthNetworkError(false);
    const ok = await runAuthCheck();
    setIsAuthenticated(ok);
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

  if (isPublicRoute) {
    return <>{children}</>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <ToastProvider>
      <AppToaster variant="admin" />
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
              backgroundColor: '#0f172a',
              color: '#fff',
              border: '1px solid rgba(255, 107, 53, 0.35)',
              boxShadow: '0 8px 24px rgba(255, 107, 53, 0.25)',
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
              marginLeft: isMobile ? '0' : '268px',
              transition: 'margin-left 0.3s ease',
            }}
          >
            {adminDataError && !adminDataLoading ? (
              <ConnectionProblem
                variant="overlay"
                theme="admin"
                kind={adminDataError}
                title="Connection problem"
                message={DB_UNAVAILABLE_MESSAGE}
                onRetry={retryAdminData}
                retryLabel="Try again"
                homeHref={adminPath('/')}
                homeLabel="Dashboard"
              />
            ) : (
              children
            )}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
