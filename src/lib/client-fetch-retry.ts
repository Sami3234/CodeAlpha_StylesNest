import { clientFetch } from '@/lib/client-fetch';

const defer = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Fetch with automatic retries when the API reports db_unavailable (Neon cold start).
 */
export async function clientFetchWithDbRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
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
    if (body.code !== 'db_unavailable' || i >= attempts - 1) {
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
