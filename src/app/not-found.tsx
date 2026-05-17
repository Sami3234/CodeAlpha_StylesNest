import ConnectionProblem from '@/components/network/ConnectionProblem';
import ErrorPageShell from '@/components/network/ErrorPageShell';

export default function NotFound() {
  return (
    <ErrorPageShell>
      <ConnectionProblem
        variant="fullscreen"
        kind="not-found"
        homeHref="/shop"
        homeLabel="Back to shop"
      />
    </ErrorPageShell>
  );
}
