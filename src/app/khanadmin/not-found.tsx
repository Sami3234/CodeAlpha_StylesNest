import ConnectionProblem from '@/components/network/ConnectionProblem';
import ErrorPageShell from '@/components/network/ErrorPageShell';
import { adminPath } from '@/lib/admin-path';

export default function KhanAdminNotFound() {
  return (
    <ErrorPageShell>
      <ConnectionProblem
        variant="fullscreen"
        theme="admin"
        kind="not-found"
        homeHref={adminPath()}
        homeLabel="Admin dashboard"
      />
    </ErrorPageShell>
  );
}
