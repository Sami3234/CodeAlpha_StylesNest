import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { configureCloudinary } from '@/lib/cloudinary-config';
import { reviewImageFolder } from '@/lib/cloudinary-folders';
import { requireShopSession } from '@/lib/require-shop-session';
import { apiErrorResponse } from '@/lib/safe-errors';

export const dynamic = 'force-dynamic';

configureCloudinary();

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);

function parseUserId(sessionUserId: string | undefined): number | null {
  if (!sessionUserId) return null;
  const id = Number(sessionUserId);
  return Number.isFinite(id) && id > 0 ? id : null;
}

export async function POST(request: NextRequest) {
  try {
    const { session, error: authError } = await requireShopSession();
    if (authError) return authError;

    const userId = parseUserId(session!.user?.id);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type) && !file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'Image must be 5 MB or smaller' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const folder = reviewImageFolder(userId);
    const timestamp = Date.now();

    const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: `review_${timestamp}`,
          resource_type: 'image',
        },
        (error, result) => {
          if (error) reject(error);
          else if (result?.secure_url) resolve({ secure_url: result.secure_url });
          else reject(new Error('Upload failed'));
        },
      );
      uploadStream.end(buffer);
    });

    return NextResponse.json({ url: uploadResult.secure_url });
  } catch (error) {
    return apiErrorResponse({ message: 'Failed to upload image', status: 500, cause: error });
  }
}
