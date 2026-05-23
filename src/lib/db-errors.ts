/** True when a DB driver error is likely transient (Neon cold start, timeout, network). */
export function isDbConnectionFailure(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const err = error as {
    name?: string;
    message?: string;
    code?: string;
    sourceError?: { message?: string; code?: string; cause?: { code?: string } };
  };
  const parts = [
    err.message,
    err.code,
    err.sourceError?.message,
    err.sourceError?.code,
    err.sourceError?.cause?.code,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return (
    err.name === 'NeonDbError' ||
    parts.includes('connect timeout') ||
    parts.includes('fetch failed') ||
    parts.includes('econnrefused') ||
    parts.includes('etimedout') ||
    parts.includes('und_err_connect_timeout') ||
    parts.includes('error connecting to database') ||
    parts.includes('aborted due to timeout') ||
    parts.includes('timeouterror') ||
    parts.includes('operation was aborted') ||
    err.name === 'TimeoutError' ||
    err.name === 'AbortError'
  );
}

export const DB_UNAVAILABLE_MESSAGE =
  'Database connection timed out. Wait a few seconds and try again.';
