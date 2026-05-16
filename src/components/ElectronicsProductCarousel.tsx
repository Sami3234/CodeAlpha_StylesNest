'use client';

import LandingStripCarousel from '@/components/LandingStripCarousel';

type ElectronicsProductCarouselProps = {
  images: string[];
};

export default function ElectronicsProductCarousel({ images }: ElectronicsProductCarouselProps) {
  return (
    <LandingStripCarousel
      images={images}
      variant="electronics"
      scrollDirection="rtl"
      maxSlots={4}
    />
  );
}
