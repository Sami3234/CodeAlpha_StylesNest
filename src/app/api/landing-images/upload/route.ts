import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { configureCloudinary } from '@/lib/cloudinary-config';
import { landingImageFolder, sanitizePathSegment } from '@/lib/cloudinary-folders';
import { apiErrorResponse } from '@/lib/safe-errors';
import { requireAdminSession } from '@/lib/require-admin-session';

configureCloudinary();

// Upload image to Cloudinary only (without saving to DB)
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminSession(request);
    if (!admin.ok) return admin.response;

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const section = formData.get('section') as string;
    const imageType = formData.get('imageType') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const timestamp = Date.now();

    const sec = section || 'general';
    const folder = landingImageFolder(sec);
    const typeSafe = sanitizePathSegment(imageType || 'image');

    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: `${typeSafe}_${timestamp}`,
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    const result = uploadResult as { secure_url: string; public_id: string };

    return NextResponse.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      message: 'Image uploaded successfully'
    });
  } catch (error) {
    return apiErrorResponse({ message: 'Failed to upload image', status: 500, cause: error });
  }
}

