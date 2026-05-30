import { formatPrice } from '@/utils/formatPrice';

type Props = {
  subtotal: number;
  deliveryFee?: number;
  codFee?: number;
  total: number;
  className?: string;
};

export default function OrderTotalSummary({
  subtotal,
  deliveryFee = 0,
  codFee = 0,
  total,
  className,
}: Props) {
  const showDelivery = deliveryFee > 0;
  const showCodFee = codFee > 0;

  return (
    <div className={className ?? 'order-total-summary'}>
      <div className="order-total-summary__row">
        <span>Subtotal</span>
        <span>{formatPrice(subtotal)} PKR</span>
      </div>
      {showDelivery ? (
        <div className="order-total-summary__row">
          <span>Delivery</span>
          <span>{formatPrice(deliveryFee)} PKR</span>
        </div>
      ) : (
        <div className="order-total-summary__row order-total-summary__row--free">
          <span>Delivery</span>
          <span>Free</span>
        </div>
      )}
      {showCodFee ? (
        <div className="order-total-summary__row">
          <span>COD fee</span>
          <span>{formatPrice(codFee)} PKR</span>
        </div>
      ) : null}
      <div className="order-total-summary__row order-total-summary__row--total">
        <span>Total</span>
        <span>{formatPrice(total)} PKR</span>
      </div>
    </div>
  );
}
