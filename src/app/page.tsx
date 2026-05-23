import HomePageClient from '@/components/HomePageClient';
import HomeSeoContent from '@/components/seo/HomeSeoContent';
import { getLandingImagesBySection } from '@/lib/landing-images-query';

export default async function HomePage() {
  const initialLandingImages = await getLandingImagesBySection();
  const initialHeroSlides = (initialLandingImages.hero || [])
    .map((u) => u.trim())
    .filter(Boolean)
    .slice(0, 4);

  return (
    <>
      <HomePageClient
        initialLandingImages={initialLandingImages}
        initialHeroSlides={initialHeroSlides}
      />
      <HomeSeoContent />
    </>
  );
}
