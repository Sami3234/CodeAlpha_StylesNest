'use client';

import { toast } from 'sonner';
import {
  clientMessageFromApi,
  GENERIC_CLIENT_ERROR,
  sanitizeClientMessage,
} from '@/lib/safe-errors';

/** Map technical API / dev messages to clear, helpful copy for shoppers. */
const FRIENDLY_OVERRIDES: Record<string, string> = {
  'Failed to create order':
    'We could not place your order right now. Please check your details and try again, or message us on WhatsApp.',
  'We could not place your order. Please try again or contact support.':
    'We could not place your order right now. Please check your details and try again, or message us on WhatsApp.',
  'Failed to place order':
    'We could not place your order. Please try again in a moment.',
  'Failed to update order':
    'We could not update your order. Please try again.',
  'Network error while placing order':
    'Connection problem. Check your internet and try again.',
  'Something went wrong. Please try again.':
    'Something went wrong. Please try again or contact us on WhatsApp.',
};

export function friendlyErrorMessage(
  raw: string | undefined | null,
  fallback = GENERIC_CLIENT_ERROR,
): string {
  const sanitized = sanitizeClientMessage(raw ?? undefined, fallback);
  return FRIENDLY_OVERRIDES[sanitized] ?? sanitized;
}

export function notifyError(message: string, options?: { description?: string }) {
  toast.error(friendlyErrorMessage(message), {
    duration: 5500,
    description: options?.description,
  });
}

export function notifySuccess(message: string, options?: { description?: string }) {
  toast.success(message, {
    duration: 4000,
    description: options?.description,
  });
}

export function notifyInfo(message: string) {
  toast.info(message, { duration: 4000 });
}

export function notifyWarning(message: string) {
  toast.warning(message, { duration: 4500 });
}

export function notifyFromApi(
  data: { error?: string; message?: string } | null | undefined,
  fallback = GENERIC_CLIENT_ERROR,
) {
  notifyError(clientMessageFromApi(data, fallback));
}
