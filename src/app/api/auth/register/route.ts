import { NextRequest, NextResponse } from 'next/server';
import { registerCredentialsUser } from '@/lib/shop-users';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = String(body.name ?? '');
    const email = String(body.email ?? '');
    const password = String(body.password ?? '');

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
