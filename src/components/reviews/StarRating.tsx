'use client';

import { IoStar, IoStarHalf, IoStarOutline } from 'react-icons/io5';

type Props = {
  value: number;
  max?: number;
  size?: number;
  showValue?: boolean;
};

export default function StarRating({ value, max = 5, size = 18, showValue }: Props) {
  const stars = [];
  for (let i = 1; i <= max; i++) {
    if (value >= i) {
      stars.push(<IoStar key={i} size={size} className="pr-star" aria-hidden />);
    } else if (value >= i - 0.5) {
      stars.push(<IoStarHalf key={i} size={size} className="pr-star" aria-hidden />);
    } else {
      stars.push(<IoStarOutline key={i} size={size} className="pr-star--empty" aria-hidden />);
    }
  }

  return (
    <span
      className="pr-summary__stars"
      role="img"
      aria-label={`${value} out of ${max} stars`}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}
    >
      {stars}
      {showValue ? (
        <span style={{ marginLeft: 6, fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
          {value.toFixed(1)}
        </span>
      ) : null}
    </span>
  );
}
