import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import { configureCloudinary } from '@/lib/cloudinary-config';
import { homepageBulkFolder, sanitizePathSegment } from '@/lib/cloudinary-folders';
import { apiErrorResponse } from '@/lib/safe-errors';
import { requireAdminSession } from '@/lib/require-admin-session';

configureCloudinary();

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminSession(request);
    if (!admin.ok) return admin.response;

    const { imageName } = await request.json();
    
    if (!imageName) {
      return NextResponse.json({ error: 'Image name required' }, { status: 400 });
    }

    const imagePath = path.join(process.cwd(), 'public', 'images', imageName);
    
    if (!fs.existsSync(imagePath)) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    const baseName = imageName.replace(/\.(jpg|jpeg|png|webp)$/i, '');
    const result = await cloudinary.uploader.upload(imagePath, {
      folder: homepageBulkFolder(),
      public_id: sanitizePathSegment(baseName),
    });

    return NextResponse.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return apiErrorResponse({ message: 'Failed to upload', status: 500, cause: error });
  }
}
