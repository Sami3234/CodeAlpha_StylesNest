import { sql } from '@/lib/db';
import {
  ensureSupportTicketsTable,
  type SupportTicketRow,
  type SupportTicketStatus,
} from '@/lib/support-tickets-schema';

const MAX_NAME = 120;
const MAX_EMAIL = 160;
const MAX_PHONE = 24;
const MAX_SUBJECT = 160;
const MAX_MESSAGE = 4000;
const MAX_ADMIN_NOTES = 2000;

function cleanText(raw: unknown, max: number): string {
  return String(raw ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

function cleanEmail(raw: unknown): string | null {
  const email = cleanText(raw, MAX_EMAIL).toLowerCase();
  if (!email) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

function cleanPhone(raw: unknown): string | null {
  const digits = String(raw ?? '').replace(/\D/g, '').slice(0, MAX_PHONE);
  return digits.length >= 10 ? digits : null;
}

export type CreateSupportTicketInput = {
  name: string;
  email?: string | null;
  phone?: string | null;
  subject: string;
  message: string;
  shopUserId?: number | null;
};

export type AdminSupportTicket = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  subject: string;
  message: string;
  status: SupportTicketStatus;
  shopUserId: number | null;
  adminNotes: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminSupportAlert = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  subject: string;
  message: string;
  createdAt: string;
};

function mapRow(row: SupportTicketRow): AdminSupportTicket {
  const created =
    row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at);
  const updated =
    row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at);
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    subject: row.subject,
    message: row.message,
    status: row.status as SupportTicketStatus,
    shopUserId: row.shop_user_id,
    adminNotes: String(row.admin_notes ?? '').trim(),
    createdAt: created,
    updatedAt: updated,
  };
}

export function validateCreateSupportTicket(
  input: CreateSupportTicketInput,
): { ok: true; data: CreateSupportTicketInput } | { ok: false; error: string } {
  const name = cleanText(input.name, MAX_NAME);
  const subject = cleanText(input.subject, MAX_SUBJECT);
  const message = cleanText(input.message, MAX_MESSAGE);
  const email = input.email ? cleanEmail(input.email) : null;
  const phone = input.phone ? cleanPhone(input.phone) : null;

  if (name.length < 2) return { ok: false, error: 'Please enter your name.' };
  if (subject.length < 3) return { ok: false, error: 'Please enter a subject.' };
  if (message.length < 10) return { ok: false, error: 'Please describe your issue (at least 10 characters).' };
  if (input.email && !email) return { ok: false, error: 'Please enter a valid email address.' };
  if (input.phone && !phone) return { ok: false, error: 'Please enter a valid phone number.' };
  if (!email && !phone) {
    return { ok: false, error: 'Please provide an email or phone number so we can reach you.' };
  }

  return {
    ok: true,
    data: {
      name,
      email,
      phone,
      subject,
      message,
      shopUserId: input.shopUserId ?? null,
    },
  };
}

export async function createSupportTicket(
  input: CreateSupportTicketInput,
): Promise<AdminSupportTicket> {
  await ensureSupportTicketsTable();
  const rows = await sql`
    INSERT INTO support_tickets (name, email, phone, subject, message, shop_user_id)
    VALUES (
      ${input.name},
      ${input.email},
      ${input.phone},
      ${input.subject},
      ${input.message},
      ${input.shopUserId ?? null}
    )
    RETURNING *
  `;
  return mapRow(rows[0] as SupportTicketRow);
}

export async function listAdminSupportTickets(
  status: 'all' | SupportTicketStatus,
): Promise<AdminSupportTicket[]> {
  await ensureSupportTicketsTable();
  const rows =
    status === 'all'
      ? await sql`
          SELECT * FROM support_tickets
          ORDER BY created_at DESC
          LIMIT 200
        `
      : await sql`
          SELECT * FROM support_tickets
          WHERE status = ${status}
          ORDER BY created_at DESC
          LIMIT 200
        `;
  return (rows as SupportTicketRow[]).map(mapRow);
}

export async function countOpenSupportTickets(): Promise<number> {
  await ensureSupportTicketsTable();
  const rows = await sql`
    SELECT COUNT(*)::int AS c FROM support_tickets WHERE status = 'open'
  `;
  return Number(rows[0]?.c ?? 0);
}

export async function updateSupportTicket(
  id: number,
  patch: { status?: SupportTicketStatus; adminNotes?: string },
): Promise<AdminSupportTicket | null> {
  await ensureSupportTicketsTable();
  const status = patch.status;
  const adminNotes =
    patch.adminNotes !== undefined ? cleanText(patch.adminNotes, MAX_ADMIN_NOTES) : undefined;

  if (status === undefined && adminNotes === undefined) return null;

  const rows =
    status !== undefined && adminNotes !== undefined
      ? await sql`
          UPDATE support_tickets
          SET status = ${status}, admin_notes = ${adminNotes}, updated_at = CURRENT_TIMESTAMP
          WHERE id = ${id}
          RETURNING *
        `
      : status !== undefined
        ? await sql`
            UPDATE support_tickets
            SET status = ${status}, updated_at = CURRENT_TIMESTAMP
            WHERE id = ${id}
            RETURNING *
          `
        : await sql`
            UPDATE support_tickets
            SET admin_notes = ${adminNotes!}, updated_at = CURRENT_TIMESTAMP
            WHERE id = ${id}
            RETURNING *
          `;

  if (rows.length === 0) return null;
  return mapRow(rows[0] as SupportTicketRow);
}

export async function listNewOpenSupportTicketsSince(
  since: string | null,
): Promise<AdminSupportAlert[]> {
  await ensureSupportTicketsTable();

  const rows = since
    ? await sql`
        SELECT id, name, email, phone, subject, message, created_at
        FROM support_tickets
        WHERE status = 'open'
          AND created_at > (${since}::timestamptz - INTERVAL '15 seconds')
        ORDER BY created_at DESC
        LIMIT 50
      `
    : await sql`
        SELECT id, name, email, phone, subject, message, created_at
        FROM support_tickets
        WHERE status = 'open'
        ORDER BY created_at DESC
        LIMIT 20
      `;

  return (rows as SupportTicketRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    subject: row.subject,
    message: row.message.slice(0, 120),
    createdAt:
      row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
  }));
}
