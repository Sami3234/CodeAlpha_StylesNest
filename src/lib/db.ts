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
  : (async (_strings: TemplateStringsArray, ..._values: unknown[]) =>
      [] as Record<string, unknown>[]);

/** Tagged-template SQL client; returns [] when DATABASE_URL is missing (sitemap-safe). */
export const sql = sqlClient as NeonQueryFunction<false, false>;
