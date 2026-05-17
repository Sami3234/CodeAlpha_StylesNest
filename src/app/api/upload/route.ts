import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { configureCloudinary } from '@/lib/cloudinary-config';
import { productImageFolder, sanitizePathSegment } from '@/lib/cloudinary-folders';
import { requireAdminSession } from '@/lib/require-admin-session';

configureCloudinary();

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminSession(request);
    if (!admin.ok) return admin.response;
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const category = formData.get('category') as string;
    const productNameRaw = formData.get('productName');
    const productName =
      typeof productNameRaw === 'string' && productNameRaw.trim()
        ? productNameRaw.trim()
        : 'product';
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    if (!category) {
      return NextResponse.json(
        { error: 'Category is required' },
        { status: 400 }
      );
    }

    const timestamp = Date.now();
    const folder = productImageFolder(category);
    const nameBase = sanitizePathSegment(productName);

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Cloudinary: {CLOUDINARY_UPLOAD_PREFIX}/products/{category}/{productSlug}_{timestamp}
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: `${nameBase}_${timestamp}`,
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
      message: 'File uploaded successfully'
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

