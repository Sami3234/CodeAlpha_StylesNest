import { NextRequest, NextResponse } from 'next/server';
import { registerCredentialsUser } from '@/lib/shop-users';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = String(body.name ?? '');
    const email = String(body.email ?? '');
    const password = String(body.password ?? '');
    const acceptedTerms = body.acceptedTerms === true;

    if (!acceptedTerms) {
      return NextResponse.json(
        { error: 'You must accept the Terms & Conditions to register.' },
        { status: 400 },
      );
    }

    const result = await registerCredentialsUser({ name, email, password });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, id: result.id });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
