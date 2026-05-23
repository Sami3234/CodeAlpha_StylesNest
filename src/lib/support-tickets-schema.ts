import { sql } from '@/lib/db';

export type SupportTicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export type SupportTicketRow = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  subject: string;
  message: string;
  status: SupportTicketStatus;
  shop_user_id: number | null;
  admin_notes: string | null;
  created_at: string | Date;
  updated_at: string | Date;
};

let ready: Promise<void> | null = null;

export async function ensureSupportTicketsTable(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS support_tickets (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT,
          phone TEXT,
          subject TEXT NOT NULL,
          message TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'open',
          shop_user_id INTEGER,
          admin_notes TEXT DEFAULT '',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS idx_support_tickets_status_created
        ON support_tickets (status, created_at DESC)
      `;
    })().catch((error) => {
      ready = null;
      throw error;
    });
  }
  await ready;
}
