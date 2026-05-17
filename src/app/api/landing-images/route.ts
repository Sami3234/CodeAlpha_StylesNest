import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { v2 as cloudinary } from 'cloudinary';
import { configureCloudinary } from '@/lib/cloudinary-config';
import { landingImageFolder, sanitizePathSegment } from '@/lib/cloudinary-folders';
import { apiErrorResponse } from '@/lib/safe-errors';
import { requireAdminSession } from '@/lib/require-admin-session';

configureCloudinary();

/** Avoid stale CDN/route caching for carousel assets */
export const dynamic = 'force-dynamic';

// GET all landing images
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section');

    /** NULL is_active treated as visible (legacy rows). */
    let images;
    if (section) {
      images = await sql`
        SELECT * FROM landing_images 
        WHERE section = ${section} AND COALESCE(is_active, true) = true
        ORDER BY display_order ASC, created_at ASC
      `;
    } else {
      images = await sql`
        SELECT * FROM landing_images 
        WHERE COALESCE(is_active, true) = true
        ORDER BY section ASC, display_order ASC, created_at ASC
      `;
    }

    // Filter out any images with empty URLs
    const validImages = Array.isArray(images)
      ? images.filter((img: Record<string, unknown>) => {
          const url =
            typeof img.image_url === 'string' ? img.image_url.trim() : '';
          return url !== '';
        })
      : [];

    return NextResponse.json(
      { success: true, images: validImages },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      },
    );
  } catch (error) {
    console.error('Error fetching landing images:', error);
    return NextResponse.json(
      { error: 'Failed to fetch landing images' },
      { status: 500 }
    );
  }
}

// Section upload limits
const SECTION_LIMITS: Record<string, number> = {
  hero: 4,
  garments: 5,
  clothes: 5,
  jewelry: 7,
  cosmetics: 5,
  jewellery: 4,
  general_store: 1,
};

// Image size limits (in bytes)
const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB for other sections
const MAX_BANNER_SIZE = 5 * 1024 * 1024; // 5MB for hero banner

// POST - Upload and save landing image (admin only)
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminSession(request);
    if (!admin.ok) return admin.response;

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const section = formData.get('section') as string;
    const imageType = formData.get('imageType') as string;
    const displayOrder = formData.get('displayOrder') ? parseInt(formData.get('displayOrder') as string) : 0;

    if (!file || !section || !imageType) {
      return NextResponse.json(
        { error: 'File, section, and imageType are required' },
        { status: 400 }
      );
    }

    // Check file format for hero banner - only PNG/WebP allowed
    if (section === 'hero') {
      const allowedTypes = ['image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: 'Banner images must be PNG or WebP format to maintain quality.' },
          { status: 400 }
        );
      }
    }

    // Check file size
    const maxSize = section === 'hero' ? MAX_BANNER_SIZE : MAX_FILE_SIZE;
    if (file.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      return NextResponse.json(
        { error: `File size too large! Maximum ${maxSizeMB}MB allowed${section === 'hero' ? ' for banner images' : ''}.` },
        { status: 400 }
      );
    }

    // Check upload limit for this section
    const maxImages = SECTION_LIMITS[section];
    if (maxImages === undefined) {
      return NextResponse.json(
        { error: 'Invalid section' },
        { status: 400 }
      );
    }

    // Count existing images for this section
    const existingImages = await sql`
      SELECT COUNT(*) as count FROM landing_images 
      WHERE section = ${section} AND COALESCE(is_active, true) = true
    `;
    const currentCount = Number(existingImages[0]?.count || 0);

    if (currentCount >= maxImages) {
      return NextResponse.json(
        { 
          error: `Upload limit reached! Maximum ${maxImages} image(s) allowed for ${section} section. Please delete existing images to upload new ones.`,
          limitReached: true,
          currentCount,
          maxImages
        },
        { status: 400 }
      );
    }

    // Upload to Cloudinary
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const timestamp = Date.now();

    const uploadResult = await new Promise((resolve, reject) => {
      const folder = landingImageFolder(section);
      const typeSafe = sanitizePathSegment(imageType);
      const uploadOptions: Record<string, unknown> = {
        folder,
        public_id: `${typeSafe}_${timestamp}`,
        resource_type: 'auto',
      };

      // For hero banner, maintain quality but don't force resize (cropping is done client-side)
      if (section === 'hero') {
        uploadOptions.quality = 'auto:best';
        uploadOptions.format = 'png';
        // Don't force dimensions - let the cropped image maintain its aspect ratio
      }

      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    const result = uploadResult as { secure_url: string; public_id: string };

    // Save to database
    try {
      const [savedImage] = await sql`
        INSERT INTO landing_images (section, image_type, image_url, cloudinary_public_id, display_order)
        VALUES (${section}, ${imageType}, ${result.secure_url}, ${result.public_id}, ${displayOrder})
        RETURNING *
      `;

      return NextResponse.json({
        success: true,
        image: savedImage,
        message: 'Image uploaded successfully'
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      // If database insert fails, try to delete from Cloudinary
      try {
        await cloudinary.uploader.destroy(result.public_id);
      } catch (cloudinaryError) {
        console.error('Error cleaning up Cloudinary:', cloudinaryError);
      }
      return apiErrorResponse({
        message: 'Failed to save image. Please try again.',
        status: 500,
        cause: dbError,
      });
    }
  } catch (error) {
    console.error('Error uploading landing image:', error);
    return apiErrorResponse({ message: 'Failed to upload image', status: 500, cause: error });
  }
}

// PUT - Update landing image (admin only)
export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdminSession(request);
    if (!admin.ok) return admin.response;

    const body = await request.json();
    const { id, section, imageType, displayOrder, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Image ID is required' },
        { status: 400 }
      );
    }

    // Build update parts
    const hasUpdates = section !== undefined || imageType !== undefined || 
                      displayOrder !== undefined || isActive !== undefined;

    if (!hasUpdates) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    // Fetch current image first
    const [currentImage] = await sql`
      SELECT * FROM landing_images WHERE id = ${id}
    `;

    if (!currentImage) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    // Update with provided values or keep existing
    const updatedSection = section !== undefined ? section : currentImage.section;
    const updatedImageType = imageType !== undefined ? imageType : currentImage.image_type;
    const updatedDisplayOrder = displayOrder !== undefined ? displayOrder : currentImage.display_order;
    const updatedIsActive = isActive !== undefined ? isActive : currentImage.is_active;

    const [updatedImage] = await sql`
      UPDATE landing_images 
      SET 
        section = ${updatedSection},
        image_type = ${updatedImageType},
        display_order = ${updatedDisplayOrder},
        is_active = ${updatedIsActive},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;

    return NextResponse.json({
      success: true,
      image: updatedImage,
      message: 'Image updated successfully'
    });
  } catch (error) {
    console.error('Error updating landing image:', error);
    return NextResponse.json(
      { error: 'Failed to update image' },
      { status: 500 }
    );
  }
}

// DELETE - Delete landing image (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdminSession(request);
    if (!admin.ok) return admin.response;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Image ID is required' },
        { status: 400 }
      );
    }

    // Get image to delete from Cloudinary
    const [image] = await sql`
      SELECT cloudinary_public_id FROM landing_images WHERE id = ${id}
    `;

    if (image && image.cloudinary_public_id) {
      try {
        await cloudinary.uploader.destroy(image.cloudinary_public_id);
      } catch (cloudinaryError) {
        console.error('Error deleting from Cloudinary:', cloudinaryError);
        // Continue with database deletion even if Cloudinary deletion fails
      }
    }

    await sql`DELETE FROM landing_images WHERE id = ${id}`;

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting landing image:', error);
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    );
  }
}

