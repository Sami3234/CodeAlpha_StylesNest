'use client';

import { useEffect } from 'react';
import ConnectionProblem from '@/components/network/ConnectionProblem';
import ErrorPageShell from '@/components/network/ErrorPageShell';
import { isLikelyNetworkError } from '@/lib/is-network-error';

export default function Error({
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
        kind={offline ? 'offline' : 'generic'}
        onRetry={reset}
        retryLabel="Try again"
        homeHref="/shop"
        homeLabel="Back to shop"
      />
    </ErrorPageShell>
  );
}
