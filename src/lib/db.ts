import { neon, type NeonQueryFunction } from '@neondatabase/serverless';
import { isDbConnectionFailure } from '@/lib/db-errors';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn(
    'DATABASE_URL environment variable is not set — database queries return empty results.',
  );
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Retry transient Neon / network failures (cold start, connect timeout). */
export async function withDbRetry<T>(run: () => Promise<T>, attempts = 3): Promise<T> {
  let last: unknown;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await run();
    } catch (error) {
      last = error;
      if (!isDbConnectionFailure(error) || attempt >= attempts - 1) {
        throw error;
      }
      await sleep(800 * (attempt + 1));
    }
  }
  throw last;
}

type SqlClient = NeonQueryFunction<false, false>;

const rawSql: SqlClient | null = databaseUrl
  ? neon(databaseUrl, {
      fetchOptions: {
        cache: 'no-store',
      },
    })
  : null;

const emptySql = (async () => [] as Record<string, unknown>[]) as unknown as SqlClient;

/** Tagged-template SQL client with retry; returns [] when DATABASE_URL is missing. */
export const sql: SqlClient = rawSql
  ? (((strings: TemplateStringsArray, ...values: unknown[]) =>
      withDbRetry(() => rawSql(strings, ...values))) as SqlClient)
  : emptySql;
