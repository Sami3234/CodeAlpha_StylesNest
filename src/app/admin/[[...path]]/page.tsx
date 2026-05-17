import { notFound } from 'next/navigation';

/** Legacy /admin URLs — show the same styled 404 as the rest of the site (panel moved to /khanadmin). */
export default function LegacyAdminPathPage() {
  notFound();
}
