'use client';

import LandingStripCarousel from '@/components/LandingStripCarousel';

type CosmeticsProductCarouselProps = {
  images: string[];
};

export default function CosmeticsProductCarousel({ images }: CosmeticsProductCarouselProps) {
  return <LandingStripCarousel images={images} variant="cosmetics" scrollDirection="ltr" />;
}
