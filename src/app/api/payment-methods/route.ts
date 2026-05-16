import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { ensurePaymentMethodsColumn } from '@/lib/contact-settings-schema';
import {
  DEFAULT_PAYMENT_METHODS,
  getActivePaymentMethods,
  parsePaymentMethods,
} from '@/lib/payment-methods';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await ensurePaymentMethodsColumn();

    const rows = (await sql`
      SELECT COALESCE(payment_methods_json, '') AS payment_methods_json,
        COALESCE(whatsapp, '') AS whatsapp
      FROM contact_settings
      LIMIT 1
    `) as { payment_methods_json: string; whatsapp: string }[];

    const raw = rows[0]?.payment_methods_json ?? '';
    let methods = parsePaymentMethods(raw);
    if (!methods.length) {
      methods = DEFAULT_PAYMENT_METHODS;
    }

    return NextResponse.json({
      success: true,
      methods: getActivePaymentMethods(methods),
      storeWhatsApp: rows[0]?.whatsapp ?? '',
    });
  } catch {
    return NextResponse.json({
      success: true,
      methods: getActivePaymentMethods(DEFAULT_PAYMENT_METHODS),
      storeWhatsApp: '',
    });
  }
}
