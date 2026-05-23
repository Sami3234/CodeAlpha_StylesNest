import { safeAmount } from '@/lib/safe-number';
import { formatPrice } from '@/utils/formatPrice';
import './admin-pkr-amount.css';

export type AdminPkrSize = 'hero' | 'summary' | 'stat' | 'inline' | 'compact';

type AdminPkrAmountProps = {
  amount: number;
  size?: AdminPkrSize;
  /** Show 2 decimal places (dashboard totals). Default: whole rupees via formatPrice. */
  decimals?: 0 | 2;
  className?: string;
  style?: React.CSSProperties;
  /** White/semi-transparent cards on dark gradients */
  onDark?: boolean;
};

function formatAmount(amount: number, decimals: 0 | 2): string {
  const value = safeAmount(amount);
  if (decimals === 2) {
    return value.toLocaleString('en-PK', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  return formatPrice(value);
}

function scaleClass(formatted: string): string {
  const digits = formatted.replace(/\D/g, '').length;
  if (digits <= 5) return 'admin-pkr--scale-1';
  if (digits <= 7) return 'admin-pkr--scale-2';
  if (digits <= 9) return 'admin-pkr--scale-3';
  return 'admin-pkr--scale-4';
}

export default function AdminPkrAmount({
  amount,
  size = 'inline',
  decimals = 0,
  className = '',
  style,
  onDark = false,
}: AdminPkrAmountProps) {
  const formatted = formatAmount(safeAmount(amount), decimals);
  const classes = [
    'admin-pkr',
    `admin-pkr--${size}`,
    scaleClass(formatted),
    onDark ? 'admin-pkr--on-dark' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes} style={style}>
      <span className="admin-pkr__amount">{formatted}</span>
      <span className="admin-pkr__currency">PKR</span>
    </span>
  );
}
