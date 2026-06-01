'use client';

import { classifyFetchError, isLikelyNetworkError } from '@/lib/is-network-error';

export const NETWORK_FAILURE_EVENT = 'stylesnest:network-failure';

/** Default client timeout — avoids hung UI on slow networks / Vercel 504. */
export const DEFAULT_CLIENT_FETCH_TIMEOUT_MS = 28_000;

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

export type ClientFetchInit = RequestInit & {
  /** Abort after this many ms (default 28s). Pass 0 to disable. */
  timeoutMs?: number;
};

function mergeAbortSignals(
  userSignal: AbortSignal | null | undefined,
  timeoutSignal: AbortSignal,
): AbortSignal {
  if (!userSignal) return timeoutSignal;
  if (typeof AbortSignal.any === 'function') {
    return AbortSignal.any([userSignal, timeoutSignal]);
  }
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (userSignal.aborted) {
    controller.abort();
    return controller.signal;
  }
  userSignal.addEventListener('abort', abort, { once: true });
  timeoutSignal.addEventListener('abort', abort, { once: true });
  return controller.signal;
}

/**
 * fetch wrapper — timeout, credentials, NetworkError on failure.
 */
export async function clientFetch(
  input: RequestInfo | URL,
  init?: ClientFetchInit,
): Promise<Response> {
  const { timeoutMs = DEFAULT_CLIENT_FETCH_TIMEOUT_MS, ...rest } = init ?? {};

  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let timeoutController: AbortController | undefined;

  const fetchInit: RequestInit = {
    credentials: 'same-origin',
    ...rest,
  };

  if (timeoutMs > 0) {
    timeoutController = new AbortController();
    timeoutId = setTimeout(() => timeoutController?.abort(), timeoutMs);
    fetchInit.signal = mergeAbortSignals(rest.signal, timeoutController.signal);
  }

  try {
    return await fetch(input, fetchInit);
  } catch (error) {
    if (isLikelyNetworkError(error)) {
      notifyNetworkFailure();
      throw new NetworkError(classifyFetchError());
    }
    throw error;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export function isGatewayTimeoutStatus(status: number): boolean {
  return status === 408 || status === 502 || status === 503 || status === 504;
}

export { isLikelyNetworkError };
