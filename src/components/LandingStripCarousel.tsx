'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';

type DisplayItem = { image: string; index: number };

export type LandingStripVariant = 'cosmetics' | 'electronics';

type LandingStripCarouselProps = {
  images: string[];
  variant: LandingStripVariant;
  /** ltr = scroll left→right; rtl = scroll right→left */
  scrollDirection: 'ltr' | 'rtl';
  maxSlots?: number;
};

function buildItems(images: string[], maxSlots: number): DisplayItem[] {
  const valid = images.filter((img) => img && img.trim() !== '');
  return valid.slice(0, maxSlots).map((image, index) => ({ image, index }));
}

const CONFIG: Record<
  LandingStripVariant,
  { gridClass: string; cardClass: string; emptyClass: string; label: string; width: number; height: number }
> = {
  cosmetics: {
    gridClass: 'cosmetics-grid cosmetics-grid--carousel',
    cardClass: 'landing-strip-card landing-strip-card--cosmetics',
    emptyClass: 'cosmetics-grid__empty',
    label: 'Cosmetics',
    width: 400,
    height: 300,
  },
  electronics: {
    gridClass: 'electronics-showcase electronics-showcase--carousel',
    cardClass: 'landing-strip-card landing-strip-card--electronics',
    emptyClass: 'electronics-showcase__empty',
    label: 'Electronics',
    width: 450,
    height: 400,
  },
};

export default function LandingStripCarousel({
  images,
  variant,
  scrollDirection,
  maxSlots = variant === 'electronics' ? 4 : 5,
}: LandingStripCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const cfg = CONFIG[variant];

  const baseItems = useMemo(() => buildItems(images, maxSlots), [images, maxSlots]);

  const items = useMemo(() => {
    const hasImages = baseItems.some((item) => item.image);
    if (!isMobile || !hasImages) return baseItems;
    return [...baseItems, ...baseItems];
  }, [baseItems, isMobile]);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !isMobile) return;

    const half = el.scrollWidth / 2;
    if (half > el.clientWidth + 2 && scrollDirection === 'rtl') {
      el.scrollLeft = half;
    }
  }, [items, isMobile, scrollDirection]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const mq = window.matchMedia('(max-width: 767px)');

    const step = () => {
      if (!mq.matches) return;

      const half = el.scrollWidth / 2;
      if (half <= el.clientWidth + 2) return;

      if (scrollDirection === 'ltr') {
        el.scrollLeft += 0.7;
        if (el.scrollLeft >= half - 1) {
          el.scrollLeft = 0;
        }
      } else {
        el.scrollLeft -= 0.7;
        if (el.scrollLeft <= 1) {
          el.scrollLeft = half;
        }
      }
    };

    const id = window.setInterval(step, 22);
    return () => window.clearInterval(id);
  }, [items, scrollDirection]);

  if (items.length === 0) {
    return (
      <div className={`${cfg.gridClass} landing-strip-empty`} data-scroll={scrollDirection}>
        <p className="landing-strip-empty__text">
          New {cfg.label.toLowerCase()} arrivals —{' '}
          <a href={`/shop?category=${variant === 'cosmetics' ? 'cosmetics' : 'electronics'}`}>
            browse the shop
          </a>
        </p>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className={cfg.gridClass} data-scroll={scrollDirection}>
      {items.map(({ image, index }, i) => (
        <div key={`${index}-${i}`} className={cfg.cardClass}>
          {image ? (
            <Image
              src={image}
              alt={`${cfg.label} ${(index % maxSlots) + 1}`}
              width={cfg.width}
              height={cfg.height}
              sizes="(max-width: 767px) 72vw, 280px"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          ) : (
            <div className={cfg.emptyClass}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <p>Empty</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
