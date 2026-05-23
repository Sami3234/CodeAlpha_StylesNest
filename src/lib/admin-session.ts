import crypto from 'crypto';
import { sql } from '@/lib/db';

const SESSION_DAYS = 7;
/** Avoid a DB round-trip on every parallel admin API call during dashboard load. */
const SESSION_VALIDATION_CACHE_MS = 25_000;

type CachedValidation = {
  adminId: number;
  email: string;
  validUntil: number;
};

const validationCache = new Map<string, CachedValidation>();
let lastTouchAt = 0;

let tableReady: Promise<void> | null = null;

export async function ensureAdminSessionsTable(): Promise<void> {
  if (!tableReady) {
    tableReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS admin_sessions (
          token TEXT PRIMARY KEY,
          admin_id INTEGER NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at)
      `;
      await sql`
        ALTER TABLE admin_sessions
        ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      `;
    })();
  }
  await tableReady;
}

export async function createAdminSession(adminId: number): Promise<string> {
  await ensureAdminSessionsTable();
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  try {
    await sql`
      INSERT INTO admin_sessions (token, admin_id, expires_at, last_activity_at)
      VALUES (${token}, ${adminId}, ${expiresAt.toISOString()}, CURRENT_TIMESTAMP)
    `;
  } catch {
    await sql`
      INSERT INTO admin_sessions (token, admin_id, expires_at)
      VALUES (${token}, ${adminId}, ${expiresAt.toISOString()})
    `;
  }

  return token;
}

export async function validateAdminSession(
  token: string | undefined | null,
  options?: { touch?: boolean },
): Promise<{ adminId: number; email: string } | null> {
  if (!token?.trim()) return null;

  const cacheKey = token.trim();
  const cached = validationCache.get(cacheKey);
  if (cached && cached.validUntil > Date.now()) {
    if (options?.touch !== false) {
      void touchSessionIfDue(cacheKey);
    }
    return { adminId: cached.adminId, email: cached.email };
  }

  await ensureAdminSessionsTable();

  const rows = await sql`
    SELECT s.admin_id, a.email
    FROM admin_sessions s
    INNER JOIN admin a ON a.id = s.admin_id
    WHERE s.token = ${token}
      AND s.expires_at > NOW()
      AND (
        s.last_activity_at IS NULL
        OR s.last_activity_at > NOW() - INTERVAL '2 hours'
      )
    LIMIT 1
  `;

  if (rows.length === 0) {
    validationCache.delete(cacheKey);
    await sql`DELETE FROM admin_sessions WHERE token = ${token}`;
    return null;
  }

  const session = {
    adminId: Number(rows[0].admin_id),
    email: String(rows[0].email),
  };

  validationCache.set(cacheKey, {
    ...session,
    validUntil: Date.now() + SESSION_VALIDATION_CACHE_MS,
  });

  if (options?.touch !== false) {
    void touchSessionIfDue(cacheKey);
  }

  return session;
}

async function touchSessionIfDue(token: string): Promise<void> {
  const now = Date.now();
  if (now - lastTouchAt < 60_000) return;
  lastTouchAt = now;
  try {
    await sql`
      UPDATE admin_sessions
      SET last_activity_at = CURRENT_TIMESTAMP
      WHERE token = ${token}
    `;
  } catch {
    /* column may be missing on very old DBs */
  }
}

export function clearAdminSessionValidationCache(token?: string | null): void {
  if (token?.trim()) {
    validationCache.delete(token.trim());
    return;
  }
  validationCache.clear();
}

export async function revokeAdminSession(token: string | undefined | null): Promise<void> {
  if (!token?.trim()) return;
  clearAdminSessionValidationCache(token);
  await ensureAdminSessionsTable();
  await sql`DELETE FROM admin_sessions WHERE token = ${token}`;
}

export async function purgeExpiredAdminSessions(): Promise<void> {
  await ensureAdminSessionsTable();
  await sql`DELETE FROM admin_sessions WHERE expires_at <= NOW()`;
}
