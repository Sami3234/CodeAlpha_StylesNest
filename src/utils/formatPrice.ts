/**
 * Display PKR amounts without decimal fractions (e.g. 1500 not 1500.00).
 */
export function formatPrice(price: number): string {
  const value = Number(price);
  if (!Number.isFinite(value)) return '0';
  return Math.round(value).toLocaleString('en-US');
}
