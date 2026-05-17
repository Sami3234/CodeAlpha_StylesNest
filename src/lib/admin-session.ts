import crypto from 'crypto';
import { sql } from '@/lib/db';

const SESSION_DAYS = 7;
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
    })();
  }
  await tableReady;
}

export async function createAdminSession(adminId: number): Promise<string> {
  await ensureAdminSessionsTable();
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await sql`
    INSERT INTO admin_sessions (token, admin_id, expires_at)
    VALUES (${token}, ${adminId}, ${expiresAt.toISOString()})
  `;

  return token;
}

export async function validateAdminSession(
  token: string | undefined | null,
): Promise<{ adminId: number; email: string } | null> {
  if (!token?.trim()) return null;

  await ensureAdminSessionsTable();

  const rows = await sql`
    SELECT s.admin_id, a.email
    FROM admin_sessions s
    INNER JOIN admin a ON a.id = s.admin_id
    WHERE s.token = ${token}
      AND s.expires_at > NOW()
    LIMIT 1
  `;

  if (rows.length === 0) return null;

  return {
    adminId: Number(rows[0].admin_id),
    email: String(rows[0].email),
  };
}

export async function revokeAdminSession(token: string | undefined | null): Promise<void> {
  if (!token?.trim()) return;
  await ensureAdminSessionsTable();
  await sql`DELETE FROM admin_sessions WHERE token = ${token}`;
}

export async function purgeExpiredAdminSessions(): Promise<void> {
  await ensureAdminSessionsTable();
  await sql`DELETE FROM admin_sessions WHERE expires_at <= NOW()`;
}
