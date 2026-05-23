import { sql } from '@/lib/db';

const ORDER_ID_PREFIX = '#QE';

/** Next sequential StylesNest order id (#QE0001, …) based on max existing number — not row count. */
export async function nextOrderId(): Promise<string> {
  const rows = await sql`
    SELECT id FROM orders WHERE id LIKE ${`${ORDER_ID_PREFIX}%`}
  `;

  let maxNum = 0;
  for (const row of rows) {
    const raw = String((row as { id: string }).id ?? '');
    const match = raw.match(/^#QE(\d+)$/i);
    if (match) {
      maxNum = Math.max(maxNum, parseInt(match[1], 10));
    }
  }

  return `${ORDER_ID_PREFIX}${String(maxNum + 1).padStart(4, '0')}`;
}
