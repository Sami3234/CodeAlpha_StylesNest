/** Pakistan-local dates for orders (store + dashboard "Today"). */
export const ORDER_TIMEZONE = 'Asia/Karachi';

/** YYYY-MM-DD in local business timezone (not UTC). */
export function getTodayDateInTimezone(timeZone = ORDER_TIMEZONE): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date());
}

/** HH:MM:SS 24h in local timezone. */
export function getCurrentTimeInTimezone(timeZone = ORDER_TIMEZONE): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(new Date());

  const hour = parts.find((p) => p.type === 'hour')?.value ?? '00';
  const minute = parts.find((p) => p.type === 'minute')?.value ?? '00';
  const second = parts.find((p) => p.type === 'second')?.value ?? '00';
  return `${hour}:${minute}:${second}`;
}

/** Normalize any order date value to YYYY-MM-DD (Karachi calendar day). */
export function normalizeOrderDateKey(raw: unknown, timeZone = ORDER_TIMEZONE): string {
  if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
    return new Intl.DateTimeFormat('en-CA', { timeZone }).format(raw);
  }
  const s = String(raw ?? '').trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const parsed = new Date(s);
  if (!Number.isNaN(parsed.getTime())) {
    return new Intl.DateTimeFormat('en-CA', { timeZone }).format(parsed);
  }
  return '';
}

export function isOrderToday(orderDate: unknown, today?: string): boolean {
  const key = normalizeOrderDateKey(orderDate);
  if (!key) return false;
  return key === (today ?? getTodayDateInTimezone());
}
