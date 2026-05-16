import { sql } from '@/lib/db';

export type ShopAuthProvider = 'google' | 'apple' | 'credentials';

export type ShopUserRow = {
  id: number;
  email: string | null;
  name: string | null;
  image: string | null;
  phone: string | null;
  city: string | null;
  address: string | null;
  provider: ShopAuthProvider;
  provider_account_id: string | null;
  created_at: string | Date;
  last_login_at: string | Date;
};

export type ShopUserProfile = {
  fullName: string;
  phone: string;
  city: string;
  address: string;
  email: string | null;
};

export async function ensureShopUsersTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS shop_users (
      id SERIAL PRIMARY KEY,
      email TEXT,
      name TEXT,
      image TEXT,
      provider TEXT NOT NULL,
      provider_account_id TEXT,
      password_hash TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_login_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await sql`ALTER TABLE shop_users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`;

  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS shop_users_oauth_unique
    ON shop_users (provider, provider_account_id)
    WHERE provider_account_id IS NOT NULL
  `;

  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS shop_users_email_credentials_unique
    ON shop_users (LOWER(email))
    WHERE provider = 'credentials' AND email IS NOT NULL
  `;

  await sql`CREATE INDEX IF NOT EXISTS shop_users_provider_idx ON shop_users (provider)`;
  await sql`CREATE INDEX IF NOT EXISTS shop_users_last_login_idx ON shop_users (last_login_at DESC)`;

  await sql`ALTER TABLE shop_users ADD COLUMN IF NOT EXISTS phone TEXT`;
  await sql`ALTER TABLE shop_users ADD COLUMN IF NOT EXISTS city TEXT`;
  await sql`ALTER TABLE shop_users ADD COLUMN IF NOT EXISTS address TEXT`;
}
