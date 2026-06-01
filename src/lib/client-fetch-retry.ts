import { clientFetch, isGatewayTimeoutStatus, type ClientFetchInit } from '@/lib/client-fetch';

const defer = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function isRetriableResponse(status: number, code?: string): boolean {
  if (code === 'db_unavailable') return true;
  return isGatewayTimeoutStatus(status);
}

/**
 * Fetch with retries for Neon cold start (db_unavailable) and gateway timeouts (502–504).
 */
export async function clientFetchWithDbRetry(
  input: RequestInfo | URL,
  init?: ClientFetchInit,
  attempts = 3,
): Promise<Response> {
  for (let i = 0; i < attempts; i++) {
    const response = await clientFetch(input, init);
    if (response.ok) return response;

    const text = await response.text();
    let body: { code?: string } = {};
    try {
      body = text ? (JSON.parse(text) as { code?: string }) : {};
    } catch {
      body = {};
    }

    const shouldRetry =
      isRetriableResponse(response.status, body.code) && i < attempts - 1;

    if (!shouldRetry) {
      return new Response(text, {
        status: response.status,
        statusText: response.statusText,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await defer(1200 * (i + 1));
  }

  return clientFetch(input, init);
}
