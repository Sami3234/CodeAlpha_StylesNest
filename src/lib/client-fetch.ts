'use client';

import { classifyFetchError, isLikelyNetworkError } from '@/lib/is-network-error';

export const NETWORK_FAILURE_EVENT = 'stylesnest:network-failure';

export class NetworkError extends Error {
  readonly kind: 'offline' | 'network';

  constructor(kind: 'offline' | 'network', message?: string) {
    super(message ?? (kind === 'offline' ? 'Offline' : 'Network error'));
    this.name = 'NetworkError';
    this.kind = kind;
  }
}

function notifyNetworkFailure(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(NETWORK_FAILURE_EVENT));
}

/**
 * fetch wrapper — throws NetworkError on connectivity failures and notifies global listeners.
 */
export async function clientFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  try {
    return await fetch(input, {
      credentials: 'same-origin',
      ...init,
    });
  } catch (error) {
    if (isLikelyNetworkError(error)) {
      notifyNetworkFailure();
      throw new NetworkError(classifyFetchError());
    }
    throw error;
  }
}

export { isLikelyNetworkError };
