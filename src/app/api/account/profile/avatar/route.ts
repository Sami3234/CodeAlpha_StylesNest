import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { configureCloudinary } from '@/lib/cloudinary-config';
import { profileImageFolder } from '@/lib/cloudinary-folders';
import { getShopUserProfile, updateShopUserImage } from '@/lib/shop-users';
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
    const folder = profileImageFolder(userId);
    const timestamp = Date.now();

    const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: `avatar_${timestamp}`,
          resource_type: 'image',
          transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'auto' }],
        },
        (error, result) => {
          if (error) reject(error);
          else if (result?.secure_url) resolve({ secure_url: result.secure_url });
          else reject(new Error('Upload failed'));
        },
      );
      uploadStream.end(buffer);
    });

    const saveResult = await updateShopUserImage(userId, uploadResult.secure_url);
    if (!saveResult.ok) {
      return NextResponse.json({ error: saveResult.error }, { status: 400 });
    }

    const profile = await getShopUserProfile(userId);
    return NextResponse.json({
      success: true,
      url: uploadResult.secure_url,
      profile,
    });
  } catch (error) {
    return apiErrorResponse({ message: 'Failed to upload profile photo', status: 500, cause: error });
  }
}
