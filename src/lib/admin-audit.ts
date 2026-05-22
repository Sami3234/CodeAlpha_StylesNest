import { sql } from '@/lib/db';

let tableReady: Promise<void> | null = null;

async function ensureAuditTable(): Promise<void> {
  if (!tableReady) {
    tableReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS admin_audit_log (
          id SERIAL PRIMARY KEY,
          admin_id INTEGER,
          admin_email TEXT,
          action TEXT NOT NULL,
          entity_type TEXT,
          entity_id TEXT,
          details JSONB,
          ip TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS idx_admin_audit_created
        ON admin_audit_log (created_at DESC)
      `;
    })();
  }
  await tableReady;
}

export type AdminAuditInput = {
  adminId?: number;
  adminEmail?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  details?: Record<string, unknown>;
  ip?: string | null;
};

export async function logAdminAction(input: AdminAuditInput): Promise<void> {
  try {
    await ensureAuditTable();
    await sql`
      INSERT INTO admin_audit_log (
        admin_id,
        admin_email,
        action,
        entity_type,
        entity_id,
        details,
        ip
      )
      VALUES (
        ${input.adminId ?? null},
        ${input.adminEmail ?? null},
        ${input.action},
        ${input.entityType ?? null},
        ${input.entityId ?? null},
        ${input.details ? JSON.stringify(input.details) : null}::jsonb,
        ${input.ip ?? null}
      )
    `;
  } catch (error) {
    console.error('admin_audit_log insert failed:', error);
  }
}
