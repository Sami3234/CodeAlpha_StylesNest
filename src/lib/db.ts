import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn(
    'DATABASE_URL environment variable is not set — database queries return empty results.',
  );
}

const sqlClient = databaseUrl
  ? neon(databaseUrl, {
      fetchOptions: {
        cache: 'no-store',
      },
    })
  : (async () => [] as Record<string, unknown>[]) as unknown as NeonQueryFunction<
      false,
      false
    >;

/** Tagged-template SQL client; returns [] when DATABASE_URL is missing (sitemap-safe). */
export const sql = sqlClient;
