import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { ensurePaymentMethodsColumn } from '@/lib/contact-settings-schema';
import {
  DEFAULT_PAYMENT_METHODS,
  parsePaymentMethods,
  sanitizePaymentMethods,
  type PaymentMethod,
} from '@/lib/payment-methods';

export const dynamic = 'force-dynamic';

async function loadMethods(): Promise<PaymentMethod[]> {
  await ensurePaymentMethodsColumn();
  const rows = (await sql`
    SELECT COALESCE(payment_methods_json, '') AS payment_methods_json
    FROM contact_settings
    LIMIT 1
  `) as { payment_methods_json: string }[];

  const parsed = parsePaymentMethods(rows[0]?.payment_methods_json ?? '');
  return parsed.length ? parsed : DEFAULT_PAYMENT_METHODS;
}

async function saveMethods(methods: PaymentMethod[]) {
  await ensurePaymentMethodsColumn();
  const json = JSON.stringify(sanitizePaymentMethods(methods));

  const existing = await sql`SELECT id FROM contact_settings LIMIT 1`;
  if (existing.length === 0) {
    await sql`
      INSERT INTO contact_settings (id, whatsapp, payment_methods_json)
      VALUES (1, '923001234567', ${json})
    `;
  } else {
    await sql`
      UPDATE contact_settings
      SET payment_methods_json = ${json}, updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `;
  }
}

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('admin_session');
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const methods = await loadMethods();
    return NextResponse.json({ success: true, methods });
  } catch (error) {
    console.error('GET payment methods:', error);
    return NextResponse.json({ error: 'Failed to load payment methods' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('admin_session');
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const methods = sanitizePaymentMethods(parsePaymentMethods(body.methods ?? []));
    if (!methods.length) {
      return NextResponse.json(
        { error: 'Add at least one payment method' },
        { status: 400 }
      );
    }

    await saveMethods(methods);
    return NextResponse.json({ success: true, methods });
  } catch (error) {
    console.error('PUT payment methods:', error);
    return NextResponse.json({ error: 'Failed to save payment methods' }, { status: 500 });
  }
}
