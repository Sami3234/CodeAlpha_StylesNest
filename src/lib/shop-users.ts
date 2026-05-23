import crypto from 'crypto';
import { sql } from '@/lib/db';
import { validatePasswordStrength } from '@/lib/password-policy';
import {
  ensureShopUsersTable,
  type ShopAuthProvider,
  type ShopUserProfile,
  type ShopUserRow,
} from '@/lib/shop-users-schema';

export function hashShopPassword(password: string): string {
  const salt = process.env.SHOP_AUTH_SALT || 'stylesnest-shop-v1';
  return crypto.createHash('sha256').update(`${salt}:${password}`).digest('hex');
}

export function verifyShopPassword(password: string, hash: string | null): boolean {
  if (!hash) return false;
  return hashShopPassword(password) === hash;
}

export async function upsertShopUser(input: {
  email?: string | null;
  name?: string | null;
  image?: string | null;
  provider: ShopAuthProvider;
  providerAccountId: string;
  passwordHash?: string | null;
}): Promise<number> {
  await ensureShopUsersTable();

  const email = input.email?.trim().toLowerCase() || null;
  const name = input.name?.trim() || null;
  const image = input.image?.trim() || null;

  const existing = await sql`
    SELECT id FROM shop_users
    WHERE provider = ${input.provider}
      AND provider_account_id = ${input.providerAccountId}
    LIMIT 1
  `;

  if (existing.length > 0) {
    const id = existing[0].id as number;
    await sql`
      UPDATE shop_users
      SET
        email = COALESCE(${email}, email),
        name = COALESCE(${name}, name),
        image = COALESCE(${image}, image),
        last_login_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `;
    return id;
  }

  if (input.provider === 'credentials' && email) {
    const byEmail = await sql`
      SELECT id FROM shop_users
      WHERE provider = 'credentials' AND LOWER(email) = ${email}
      LIMIT 1
    `;
    if (byEmail.length > 0) {
      const id = byEmail[0].id as number;
      await sql`
        UPDATE shop_users
        SET
          name = COALESCE(${name}, name),
          image = COALESCE(${image}, image),
          password_hash = COALESCE(${input.passwordHash ?? null}, password_hash),
          last_login_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
      `;
      return id;
    }
  }

  const inserted = await sql`
    INSERT INTO shop_users (
      email, name, image, provider, provider_account_id, password_hash, last_login_at
    )
    VALUES (
      ${email},
      ${name},
      ${image},
      ${input.provider},
      ${input.providerAccountId},
      ${input.passwordHash ?? null},
      CURRENT_TIMESTAMP
    )
    RETURNING id
  `;

  return inserted[0].id as number;
}

export async function findCredentialsUser(email: string) {
  await ensureShopUsersTable();
  const normalized = email.trim().toLowerCase();
  const rows = await sql`
    SELECT id, email, name, image, provider, password_hash, COALESCE(is_blocked, false) AS is_blocked
    FROM shop_users
    WHERE provider = 'credentials' AND LOWER(email) = ${normalized}
    LIMIT 1
  `;
  return rows[0] as
    | {
        id: number;
        email: string;
        name: string | null;
        image: string | null;
        provider: string;
        password_hash: string | null;
        is_blocked: boolean;
      }
    | undefined;
}

export async function registerCredentialsUser(input: {
  name: string;
  email: string;
  password: string;
}): Promise<{ ok: true; id: number } | { ok: false; error: string }> {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password;

  if (!name || name.length < 2) {
    return { ok: false, error: 'Name is required' };
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: 'Valid email is required' };
  }
  const pwCheck = validatePasswordStrength(password);
  if (!pwCheck.valid) {
    return { ok: false, error: pwCheck.errors[0] ?? 'Password does not meet requirements' };
  }

  await ensureShopUsersTable();

  const existing = await findCredentialsUser(email);
  if (existing) {
    return { ok: false, error: 'An account with this email already exists. Please sign in.' };
  }

  const id = await upsertShopUser({
    email,
    name,
    provider: 'credentials',
    providerAccountId: email,
    passwordHash: hashShopPassword(password),
  });

  return { ok: true, id };
}

export async function listShopUsers(): Promise<ShopUserRow[]> {
  await ensureShopUsersTable();
  const rows = await sql`
    SELECT
      id,
      email,
      name,
      image,
      phone,
      city,
      address,
      provider,
      provider_account_id,
      COALESCE(is_blocked, false) AS is_blocked,
      created_at,
      last_login_at
    FROM shop_users
    ORDER BY last_login_at DESC NULLS LAST, id DESC
  `;
  return rows.map((row) => ({
    ...(row as ShopUserRow),
    is_blocked: Boolean((row as { is_blocked?: boolean }).is_blocked),
  }));
}

export async function getShopUserById(userId: number): Promise<ShopUserRow | null> {
  await ensureShopUsersTable();
  const rows = await sql`
    SELECT
      id,
      email,
      name,
      image,
      phone,
      city,
      address,
      provider,
      provider_account_id,
      COALESCE(is_blocked, false) AS is_blocked,
      created_at,
      last_login_at
    FROM shop_users
    WHERE id = ${userId}
    LIMIT 1
  `;
  if (!rows.length) return null;
  const row = rows[0] as ShopUserRow;
  return { ...row, is_blocked: Boolean(row.is_blocked) };
}

export async function isShopUserBlocked(userId: number): Promise<boolean> {
  await ensureShopUsersTable();
  const rows = await sql`
    SELECT COALESCE(is_blocked, false) AS is_blocked
    FROM shop_users
    WHERE id = ${userId}
    LIMIT 1
  `;
  if (!rows.length) return true;
  return Boolean((rows[0] as { is_blocked: boolean }).is_blocked);
}

export async function setShopUserBlocked(
  userId: number,
  blocked: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await ensureShopUsersTable();
  const existing = await getShopUserById(userId);
  if (!existing) {
    return { ok: false, error: 'User not found' };
  }
  await sql`
    UPDATE shop_users
    SET is_blocked = ${blocked}, updated_at = CURRENT_TIMESTAMP
    WHERE id = ${userId}
  `;
  return { ok: true };
}

export async function deleteShopUser(
  userId: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await ensureShopUsersTable();
  const existing = await getShopUserById(userId);
  if (!existing) {
    return { ok: false, error: 'User not found' };
  }
  await sql`DELETE FROM shop_users WHERE id = ${userId}`;
  return { ok: true };
}

export async function getShopUserProfile(userId: number): Promise<ShopUserProfile | null> {
  await ensureShopUsersTable();
  const rows = await sql`
    SELECT id, email, name, image, phone, city, address
    FROM shop_users
    WHERE id = ${userId}
    LIMIT 1
  `;
  if (!rows.length) return null;
  const row = rows[0] as {
    email: string | null;
    name: string | null;
    image: string | null;
    phone: string | null;
    city: string | null;
    address: string | null;
  };
  return {
    fullName: row.name?.trim() ?? '',
    phone: row.phone?.trim() ?? '',
    city: row.city?.trim() ?? '',
    address: row.address?.trim() ?? '',
    email: row.email,
    image: row.image?.trim() || null,
  };
}

export async function updateShopUserName(
  userId: number,
  fullName: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const name = fullName.trim().slice(0, 120);
  if (!name || name.length < 2) {
    return { ok: false, error: 'Name must be at least 2 characters' };
  }

  await ensureShopUsersTable();
  const existing = await getShopUserById(userId);
  if (!existing) {
    return { ok: false, error: 'User not found' };
  }

  await sql`
    UPDATE shop_users
    SET name = ${name}, updated_at = CURRENT_TIMESTAMP
    WHERE id = ${userId}
  `;

  return { ok: true };
}

export async function updateShopUserImage(
  userId: number,
  imageUrl: string | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const image = imageUrl?.trim() || null;

  if (image) {
    try {
      const host = new URL(image).hostname.toLowerCase();
      if (!host.endsWith('cloudinary.com')) {
        return { ok: false, error: 'Invalid image URL' };
      }
    } catch {
      return { ok: false, error: 'Invalid image URL' };
    }
  }

  await ensureShopUsersTable();
  const existing = await getShopUserById(userId);
  if (!existing) {
    return { ok: false, error: 'User not found' };
  }

  await sql`
    UPDATE shop_users
    SET image = ${image}, updated_at = CURRENT_TIMESTAMP
    WHERE id = ${userId}
  `;

  return { ok: true };
}

export async function updateShopUserProfile(
  userId: number,
  profile: Pick<ShopUserProfile, 'fullName' | 'phone' | 'city' | 'address'> & { email?: string | null },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const fullName = profile.fullName.trim().slice(0, 120);
  const phone = profile.phone.trim().slice(0, 32);
  const city = profile.city.trim().slice(0, 80);
  const address = profile.address.trim().slice(0, 500);

  if (!fullName || fullName.length < 2) {
    return { ok: false, error: 'Name is required' };
  }
  if (!phone || phone.replace(/\D/g, '').length < 10) {
    return { ok: false, error: 'Valid WhatsApp / mobile number is required' };
  }
  if (!city) {
    return { ok: false, error: 'City is required' };
  }
  if (!address) {
    return { ok: false, error: 'Address is required' };
  }

  await ensureShopUsersTable();
  await sql`
    UPDATE shop_users
    SET
      name = ${fullName},
      phone = ${phone},
      city = ${city},
      address = ${address}
    WHERE id = ${userId}
  `;

  return { ok: true };
}

export async function changeShopUserPassword(
  userId: number,
  input: { currentPassword: string; newPassword: string }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const currentPassword = input.currentPassword;
  const newPassword = input.newPassword;

  const pwCheck = validatePasswordStrength(newPassword);
  if (!pwCheck.valid) {
    return { ok: false, error: pwCheck.errors[0] ?? 'Password does not meet requirements' };
  }

  await ensureShopUsersTable();

  const rows = await sql`
    SELECT id, provider, password_hash
    FROM shop_users
    WHERE id = ${userId}
    LIMIT 1
  `;

  if (!rows.length) {
    return { ok: false, error: 'User not found' };
  }

  const row = rows[0] as { provider: string; password_hash: string | null };

  if (row.provider !== 'credentials') {
    return { ok: false, error: 'Password change is only available for email accounts' };
  }

  if (!verifyShopPassword(currentPassword, row.password_hash)) {
    return { ok: false, error: 'Current password is incorrect' };
  }

  if (currentPassword === newPassword) {
    return { ok: false, error: 'New password must be different from current password' };
  }

  await sql`
    UPDATE shop_users
    SET password_hash = ${hashShopPassword(newPassword)}
    WHERE id = ${userId}
  `;

  return { ok: true };
}

export type AdminUserAlert = {
  id: number;
  name: string | null;
  email: string | null;
  provider: string;
  createdAt: string;
};

export async function listNewShopUsersSince(since: string | null): Promise<AdminUserAlert[]> {
  await ensureShopUsersTable();

  const rows = since
    ? await sql`
        SELECT id, name, email, provider, created_at
        FROM shop_users
        WHERE created_at > (${since}::timestamptz - INTERVAL '15 seconds')
        ORDER BY created_at DESC
        LIMIT 50
      `
    : await sql`
        SELECT id, name, email, provider, created_at
        FROM shop_users
        ORDER BY created_at DESC
        LIMIT 20
      `;

  return rows.map((row) => ({
    id: row.id as number,
    name: (row.name as string | null) ?? null,
    email: (row.email as string | null) ?? null,
    provider: String(row.provider ?? 'credentials'),
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at),
  }));
}
