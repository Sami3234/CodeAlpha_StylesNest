'use client';

import ConnectionProblem from '@/components/network/ConnectionProblem';
import ErrorPageShell from '@/components/network/ErrorPageShell';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>
        <ErrorPageShell>
          <ConnectionProblem
            variant="fullscreen"
            kind="generic"
            onRetry={reset}
            homeHref="/shop"
            homeLabel="Back to shop"
          />
        </ErrorPageShell>
      </body>
    </html>
  );
}
