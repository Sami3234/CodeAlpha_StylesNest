import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { ensureLegalPagesColumn } from '@/lib/contact-settings-schema';
import { parseLegalPagesJson } from '@/lib/legal-pages-storage';

export async function GET() {
  try {
    await ensureLegalPagesColumn();
    const rows = (await sql`
      SELECT COALESCE(legal_pages_json, '') AS legal_pages_json
      FROM contact_settings
      LIMIT 1
    `) as { legal_pages_json: string }[];

    const pages = parseLegalPagesJson(rows[0]?.legal_pages_json);

    return NextResponse.json(
      { success: true, pages },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600',
        },
      },
    );
  } catch {
    const { getDefaultLegalPages } = await import('@/lib/legal-pages-defaults');
    return NextResponse.json({ success: true, pages: getDefaultLegalPages() });
  }
}
