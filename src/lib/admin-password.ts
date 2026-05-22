import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const BCRYPT_ROUNDS = 12;
const SHA256_HEX_LEN = 64;

export function isBcryptHash(stored: string | null | undefined): boolean {
  return Boolean(stored?.startsWith('$2a$') || stored?.startsWith('$2b$') || stored?.startsWith('$2y$'));
}

export async function hashAdminPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

function sha256Hex(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/** Verify password; `needsUpgrade` when login succeeded with legacy SHA-256 or plain text. */
export async function verifyAdminPassword(
  password: string,
  stored: string | null | undefined,
): Promise<{ ok: boolean; needsUpgrade: boolean }> {
  if (!stored) return { ok: false, needsUpgrade: false };

  if (isBcryptHash(stored)) {
    const ok = await bcrypt.compare(password, stored);
    return { ok, needsUpgrade: false };
  }

  if (stored.length === SHA256_HEX_LEN) {
    const ok = stored === sha256Hex(password);
    return { ok, needsUpgrade: ok };
  }

  const ok = stored === password;
  return { ok, needsUpgrade: ok };
}
