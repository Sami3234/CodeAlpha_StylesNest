import { sql } from '@/lib/db';

const WINDOW_MINUTES = 15;
const MAX_FAILURES = 5;

let tableReady: Promise<void> | null = null;

async function ensureLoginAttemptsTable(): Promise<void> {
  if (!tableReady) {
    tableReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS admin_login_attempts (
          id SERIAL PRIMARY KEY,
          email TEXT NOT NULL,
          ip TEXT,
          success BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS idx_admin_login_attempts_email_created
        ON admin_login_attempts (email, created_at DESC)
      `;
    })();
  }
  await tableReady;
}

export async function recordLoginAttempt(
  email: string,
  ip: string | null,
  success: boolean,
): Promise<void> {
  await ensureLoginAttemptsTable();
  const normalized = email.trim().toLowerCase();
  await sql`
    INSERT INTO admin_login_attempts (email, ip, success)
    VALUES (${normalized}, ${ip}, ${success})
  `;
  if (!success) {
    await sql`
      DELETE FROM admin_login_attempts
      WHERE created_at < NOW() - INTERVAL '7 days'
    `;
  }
}

export async function isLoginRateLimited(
  email: string,
  ip: string | null,
): Promise<{ limited: boolean; retryAfterMinutes?: number }> {
  await ensureLoginAttemptsTable();
  const normalized = email.trim().toLowerCase();

  const rows = await sql`
    SELECT COUNT(*)::int AS failures
    FROM admin_login_attempts
    WHERE email = ${normalized}
      AND success = false
      AND created_at > NOW() - INTERVAL '15 minutes'
  `;

  const failures = Number(rows[0]?.failures ?? 0);
  if (failures >= MAX_FAILURES) {
    return { limited: true, retryAfterMinutes: WINDOW_MINUTES };
  }

  if (ip) {
    const ipRows = await sql`
      SELECT COUNT(*)::int AS failures
      FROM admin_login_attempts
      WHERE ip = ${ip}
        AND success = false
        AND created_at > NOW() - INTERVAL '15 minutes'
    `;
    const ipFailures = Number(ipRows[0]?.failures ?? 0);
    if (ipFailures >= MAX_FAILURES * 2) {
      return { limited: true, retryAfterMinutes: WINDOW_MINUTES };
    }
  }

  return { limited: false };
}
