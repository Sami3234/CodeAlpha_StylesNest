import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import crypto from 'crypto';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Get admin profile
export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('admin_session');

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get admin data (in production, verify session token)
    const result = await sql`
      SELECT id, email FROM admin LIMIT 1
    ` as Array<{ id: number; email: string }>;

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      admin: {
        id: result[0].id,
        email: result[0].email,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: 'Failed to get profile' },
      { status: 500 }
    );
  }
}

// Update admin profile
export async function PUT(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('admin_session');

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { email, password, currentPassword } = await request.json();

    // Get current admin data
    const currentAdmin = await sql`
      SELECT id, password FROM admin LIMIT 1
    ` as Array<{ id: number; password: string }>;

    if (currentAdmin.length === 0) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 404 }
      );
    }

    // If password is being updated, verify current password
    if (password) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: 'Current password is required to update password' },
          { status: 400 }
        );
      }

      const hashedCurrentPassword = hashPassword(currentPassword);
      const storedPassword = currentAdmin[0].password;
      
      // Check if password is properly hashed (SHA-256 hash is 64 characters)
      const isPasswordHashed = storedPassword && storedPassword.length === 64;
      
      let passwordMatch = false;
      if (isPasswordHashed) {
        // Compare hashed passwords
        passwordMatch = storedPassword === hashedCurrentPassword;
      } else {
        // If password is not hashed (plain text), compare directly
        passwordMatch = storedPassword === currentPassword;
      }

      if (!passwordMatch) {
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 400 }
        );
      }
    }

    // Update admin
    if (email && password) {
      const hashedPassword = hashPassword(password);
      await sql`
        UPDATE admin 
        SET email = ${email}, password = ${hashedPassword}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${currentAdmin[0].id}
      `;
    } else if (email) {
      await sql`
        UPDATE admin 
        SET email = ${email}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${currentAdmin[0].id}
      `;
    } else if (password) {
      const hashedPassword = hashPassword(password);
      await sql`
        UPDATE admin 
        SET password = ${hashedPassword}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${currentAdmin[0].id}
      `;
    } else {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    // Get updated admin data
    const updatedAdmin = await sql`
      SELECT id, email FROM admin WHERE id = ${currentAdmin[0].id}
    ` as Array<{ id: number; email: string }>;

    if (updatedAdmin.length === 0) {
      return NextResponse.json(
        { error: 'Admin not found after update' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      admin: {
        id: updatedAdmin[0].id,
        email: updatedAdmin[0].email,
      },
    });
  } catch (error: unknown) {
    console.error('Update profile error:', error);
    
    // Handle unique constraint violation (duplicate email)
    if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
      const dbError = error as { code: string; message: string };
      if (dbError.code === '23505' || dbError.message.includes('unique')) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
