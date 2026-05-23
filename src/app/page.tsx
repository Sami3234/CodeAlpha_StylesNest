import HomePageClient from '@/components/HomePageClient';
import HomeSeoContent from '@/components/seo/HomeSeoContent';
import { getHeroBannerUrls } from '@/lib/landing-images-query';
import { getHomeFallbackImages } from '@/lib/seo/home-fallback-images';

export default async function HomePage() {
  const [fallbackImages, initialHeroSlides] = await Promise.all([
    getHomeFallbackImages(),
    getHeroBannerUrls(4),
  ]);

  return (
    <>
      <HomePageClient
        fallbackImages={fallbackImages}
        initialHeroSlides={initialHeroSlides}
      />
      <HomeSeoContent />
    </>
  );
}
