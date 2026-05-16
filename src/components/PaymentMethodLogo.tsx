'use client';

import Image from 'next/image';
import type { PaymentMethodType } from '@/lib/payment-methods';

/** Brand logos in public/Payment_images — logo only, no text overlay */
const LOGO_PATHS: Record<PaymentMethodType, string> = {
  jazzcash: '/Payment_images/Jazzcash.png',
  easypaisa: '/Payment_images/Easypaisa-logo.png',
  bank: '/Payment_images/meezan-bank-logo.png',
  cod: '/Payment_images/COD.png',
  other: '/Payment_images/nayapay-logo.png',
};

type Props = {
  type: PaymentMethodType;
  size?: number;
};

export default function PaymentMethodLogo({ type, size = 48 }: Props) {
  const src = LOGO_PATHS[type] ?? LOGO_PATHS.other;
  const h = size;

  return (
    <Image
      src={src}
      alt=""
      width={120}
      height={h}
      className="order-payment-logo-img"
      unoptimized
      style={{ objectFit: 'contain', width: 'auto', height: h, maxWidth: '100%' }}
    />
  );
}
