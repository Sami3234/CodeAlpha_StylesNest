/** True when the browser reports no connectivity. */
export function isBrowserOffline(): boolean {
  if (typeof navigator === 'undefined') return false;
  return navigator.onLine === false;
}

/** Detect failed fetch / network errors (not HTTP 4xx/5xx). */
export function isLikelyNetworkError(error: unknown): boolean {
  if (isBrowserOffline()) return true;
  if (error instanceof TypeError) {
    const msg = error.message.toLowerCase();
    return (
      msg.includes('failed to fetch') ||
      msg.includes('networkerror') ||
      msg.includes('load failed') ||
      msg.includes('network request failed') ||
      msg.includes('fetch failed')
    );
  }
  if (error instanceof Error && error.name === 'AbortError') {
    return false;
  }
  return false;
}

export type FetchErrorKind = 'offline' | 'network';

export function classifyFetchError(error: unknown): FetchErrorKind {
  return isBrowserOffline() ? 'offline' : 'network';
}
