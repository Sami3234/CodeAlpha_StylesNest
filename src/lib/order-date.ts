/** Pakistan-local dates for orders (store + dashboard "Today"). */
export const ORDER_TIMEZONE = 'Asia/Karachi';

/** YYYY-MM-DD in local business timezone (not UTC). */
export function getTodayDateInTimezone(timeZone = ORDER_TIMEZONE): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date());
}

/** Shift a YYYY-MM-DD key by calendar days (negative = past). */
export function shiftDateKey(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map((n) => Number(n));
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

export function firstDayOfMonthKey(isoDate: string): string {
  return `${isoDate.slice(0, 7)}-01`;
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
