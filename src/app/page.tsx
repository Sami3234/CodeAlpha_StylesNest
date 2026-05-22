import HomePageClient from '@/components/HomePageClient';
import HomeSeoContent from '@/components/seo/HomeSeoContent';
import { getHomeFallbackImages } from '@/lib/seo/home-fallback-images';

export default async function HomePage() {
  const fallbackImages = await getHomeFallbackImages();

  return (
    <>
      <HomePageClient fallbackImages={fallbackImages} />
      <HomeSeoContent />
    </>
  );
}
