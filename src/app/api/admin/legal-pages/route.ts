import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { ensureLegalPagesColumn } from '@/lib/contact-settings-schema';
import {
  legalPagesToJson,
  parseLegalPagesJson,
  sanitizeLegalPages,
} from '@/lib/legal-pages-storage';
import { apiErrorResponse } from '@/lib/safe-errors';
import type { LegalPagesStore } from '@/lib/legal-pages-types';

async function readPagesJson(): Promise<string> {
  await ensureLegalPagesColumn();
  const rows = (await sql`
    SELECT COALESCE(legal_pages_json, '') AS legal_pages_json
    FROM contact_settings
    LIMIT 1
  `) as { legal_pages_json: string }[];
  return rows[0]?.legal_pages_json ?? '';
}

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('admin_session');
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pages = parseLegalPagesJson(await readPagesJson());
    return NextResponse.json({ success: true, pages });
  } catch (error) {
    return apiErrorResponse({ message: 'Failed to load legal pages', status: 500, cause: error });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('admin_session');
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const pages = sanitizeLegalPages(body.pages) as LegalPagesStore;
    const json = legalPagesToJson(pages);

    await ensureLegalPagesColumn();

    const existing = (await sql`SELECT id FROM contact_settings LIMIT 1`) as { id: number }[];

    if (existing.length === 0) {
      await sql`
        INSERT INTO contact_settings (id, whatsapp, legal_pages_json)
        VALUES (1, '', ${json})
        ON CONFLICT (id) DO UPDATE SET legal_pages_json = ${json}, updated_at = CURRENT_TIMESTAMP
      `;
    } else {
      await sql`
        UPDATE contact_settings
        SET legal_pages_json = ${json}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${existing[0].id}
      `;
    }

    return NextResponse.json({ success: true, pages });
  } catch (error) {
    return apiErrorResponse({ message: 'Failed to save legal pages', status: 500, cause: error });
  }
}
