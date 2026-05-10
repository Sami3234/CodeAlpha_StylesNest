import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import crypto from 'crypto';

// Simple password hashing function using Node.js crypto
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Hash the provided password
    const hashedPassword = hashPassword(password);

    // Check if admin exists
    const result = await sql`
      SELECT id, email, password FROM admin WHERE email = ${email} LIMIT 1
    `;

    if (result.length === 0) {
      console.error(`Login failed: Admin with email ${email} not found`);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const admin = result[0];

    // Check if password is properly hashed (SHA-256 hash is 64 characters)
    const isPasswordHashed = admin.password && admin.password.length === 64;
    
    let passwordMatch = false;
    
    if (isPasswordHashed) {
      // Compare hashed passwords
      passwordMatch = admin.password === hashedPassword;
    } else {
      // If password is not hashed (plain text), compare directly
      // This allows backward compatibility for manually added passwords
      passwordMatch = admin.password === password;
      
      // If login successful with plain text password, auto-hash it for future
      if (passwordMatch) {
        console.log(`Auto-hashing plain text password for ${email}`);
        await sql`
          UPDATE admin 
          SET password = ${hashedPassword}, updated_at = CURRENT_TIMESTAMP
          WHERE id = ${admin.id}
        `;
      }
    }

    // Compare passwords
    if (!passwordMatch) {
      console.error(`Login failed: Password mismatch for email ${email}`);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Create a simple session token
    const sessionToken = crypto.randomBytes(32).toString('hex');

    // Return success with session token
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      admin: {
        id: admin.id,
        email: admin.email,
      },
    });

    // Set HTTP-only cookie for session
    response.cookies.set('admin_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Failed to login' },
      { status: 500 }
    );
  }
}
