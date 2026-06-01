import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/require-admin-session';
import { queryAdminBusinessReport } from '@/lib/admin-business-report';
import { logAdminAction } from '@/lib/admin-audit';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminSession(request);
    if (!admin.ok) return admin.response;

    const report = await queryAdminBusinessReport(admin.email);

    await logAdminAction({
      adminId: admin.adminId,
      adminEmail: admin.email,
      action: 'admin.report_download',
      details: {
        products: report.products.length,
        orders: report.orders.length,
      },
    });

    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error('Admin report error:', error);
    return NextResponse.json({ error: 'Failed to generate report data' }, { status: 500 });
  }
}
