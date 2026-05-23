import { NextResponse } from 'next/server';
import { DB_UNAVAILABLE_MESSAGE, isDbConnectionFailure } from '@/lib/db-errors';

/** Shown to users when something fails and we must not leak internals. */
export const GENERIC_CLIENT_ERROR = 'Something went wrong. Please try again.';

const SENSITIVE_PATTERN =
  /password|secret|token|api[_-]?key|authorization|bearer|credential|DATABASE|postgres|neon|sql|ECONNREFUSED|ETIMEDOUT|stack|at\s+\w+\(|\/Users\/|\/home\/|\.ts:\d+|\.js:\d+|duplicate\s+key|relation\s+"|column\s+"|syntax\s+error|internal\s+server|connection\s+refused|reset-sequence|init-db|migrate/i;

/** Messages we intentionally return from our own validation (safe in production). */
const ALLOWED_PUBLIC_PREFIXES = [
  'Please ',
  'Valid ',
  'Name ',
  'Email ',
  'Password ',
  'City ',
  'Address ',
  'Phone ',
  'WhatsApp ',
  'Invalid email',
  'Incorrect ',
  'Try again',
  'New passwords',
  'Current password',
  'Login required',
  'Unauthorized',
  'Forbidden',
  'Not found',
  'Required',
  'Maximum ',
  'Minimum ',
  'An account with',
  'Account created',
  'Passwords do not',
  'Registration failed',
  'Failed to load',
  'Failed to save',
  'Failed to update',
  'Failed to add',
  'Failed to delete',
  'Failed to create',
  'Failed to upload',
  'Failed to import',
  'Item Deleted',
  'Changes Saved',
  'Product added',
  'No changes',
  'Image must',
  'Please select',
  'Enter a valid',
  'No valid',
  'Order could not',
  'We could not',
  'Could not place',
  'Connection problem',
  'Database connection',
  'Delivery details',
  'Trending',
  'Payment',
];

export function isProductionEnv(): boolean {
  return process.env.NODE_ENV === 'production';
}

function isAllowedPublicMessage(message: string): boolean {
  const t = message.trim();
  if (!t || t.length > 240) return false;
  if (SENSITIVE_PATTERN.test(t)) return false;
  return ALLOWED_PUBLIC_PREFIXES.some((prefix) => t.startsWith(prefix) || t.includes(prefix));
}

/**
 * Sanitize text before showing in UI or API JSON (production-safe).
 */
export function sanitizeClientMessage(message: string | undefined | null, fallback = GENERIC_CLIENT_ERROR): string {
  if (!message || typeof message !== 'string') return fallback;
  const trimmed = message.trim();
  if (!trimmed) return fallback;

  if (isProductionEnv()) {
    return isAllowedPublicMessage(trimmed) ? trimmed : fallback;
  }

  if (SENSITIVE_PATTERN.test(trimmed)) {
    return fallback;
  }

  return trimmed.length > 400 ? `${trimmed.slice(0, 400)}…` : trimmed;
}

/**
 * Log server-side; return a safe string for clients.
 */
export function safeErrorFromUnknown(error: unknown, fallback = GENERIC_CLIENT_ERROR): string {
  if (error instanceof Error) {
    console.error(error.message, error.stack);
  } else if (error !== undefined) {
    console.error(error);
  }
  if (isProductionEnv()) return fallback;
  if (error instanceof Error) {
    return sanitizeClientMessage(error.message, fallback);
  }
  return fallback;
}

export function logApiError(context: string, error: unknown): void {
  console.error(`[${context}]`, error);
}

type ApiErrorOptions = {
  message: string;
  status: number;
  cause?: unknown;
  /** Validation messages from our code — allowed in production when true (default). */
  trusted?: boolean;
};

/**
 * JSON error response — never includes stack/SQL/connection details in production.
 */
export function apiErrorResponse({ message, status, cause, trusted = true }: ApiErrorOptions): NextResponse {
  if (cause) logApiError(`API ${status}`, cause);

  if (cause && isDbConnectionFailure(cause)) {
    return NextResponse.json(
      { error: DB_UNAVAILABLE_MESSAGE, code: 'db_unavailable' },
      { status },
    );
  }

  let clientMessage = message;
  if (isProductionEnv()) {
    clientMessage =
      trusted && isAllowedPublicMessage(clientMessage) ? clientMessage : GENERIC_CLIENT_ERROR;
  } else {
    clientMessage = sanitizeClientMessage(clientMessage, GENERIC_CLIENT_ERROR);
  }

  return NextResponse.json({ error: clientMessage }, { status });
}

/** Parse JSON error bodies from failed fetch responses (avoids silent `{}`). */
export async function readApiErrorBody(
  response: Response,
): Promise<{ error?: string; message?: string; code?: string }> {
  const text = await response.text();
  if (!text.trim()) {
    return { error: `Request failed (${response.status})` };
  }
  try {
    const data = JSON.parse(text) as { error?: string; message?: string; code?: string };
    if (data && typeof data === 'object') return data;
    return { error: `Request failed (${response.status})` };
  } catch {
    return { error: `Request failed (${response.status})` };
  }
}

/**
 * For client-side fetch handlers: prefer API `error` field, sanitized.
 */
export function clientMessageFromApi(
  data: { error?: string; message?: string; code?: string } | null | undefined,
  fallback = GENERIC_CLIENT_ERROR
): string {
  if (data?.code === 'db_unavailable') {
    return DB_UNAVAILABLE_MESSAGE;
  }
  const raw = data?.error ?? data?.message;
  return sanitizeClientMessage(raw, fallback);
}
