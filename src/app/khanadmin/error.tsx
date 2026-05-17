'use client';

import { useEffect } from 'react';
import ConnectionProblem from '@/components/network/ConnectionProblem';
import ErrorPageShell from '@/components/network/ErrorPageShell';
import { adminPath } from '@/lib/admin-path';
import { isLikelyNetworkError } from '@/lib/is-network-error';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const offline = isLikelyNetworkError(error);

  return (
    <ErrorPageShell>
      <ConnectionProblem
        variant="fullscreen"
        theme="admin"
        kind={offline ? 'offline' : 'generic'}
        onRetry={reset}
        retryLabel="Try again"
        homeHref={adminPath()}
        homeLabel="Admin dashboard"
      />
    </ErrorPageShell>
  );
}
