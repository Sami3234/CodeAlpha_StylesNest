import { neon } from '@neondatabase/serverless';

// Get DATABASE_URL from environment
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL environment variable is not set');
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create a SQL client with proper configuration for serverless
// Using fetchOptions to ensure fresh connections in serverless environments
export const sql = neon(databaseUrl, {
  fetchOptions: {
    cache: 'no-store',
  },
});
