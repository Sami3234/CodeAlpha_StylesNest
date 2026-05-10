const { neon } = require('@neondatabase/serverless');
const cloudinary = require('cloudinary').v2;
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
require('dotenv').config({ path: path.join(__dirname, '../.env') });

/**
 * Cloudinary Migration Script
 * 
 * Migrates images from old Cloudinary account to new Cloudinary account
 * and updates database URLs
 * 
 * Usage: node scripts/migrate-cloudinary.js
 */

// Old Cloudinary config (source)
const OLD_CLOUDINARY = {
  cloud_name: 'drn7iks5k',
  api_key: '969984943497382',
  api_secret: '0ghaeEA69DPB9-ulyQ9hHatMF3A'
};

// New Cloudinary config (destination)
const NEW_CLOUDINARY = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dyatbojxo',
  api_key: process.env.CLOUDINARY_API_KEY || '825666236313569',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'Cw6lqYsL3moEObTOM_hgJ2jmHNA'
};

// Database connection
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('❌ DATABASE_URL not found');
  process.exit(1);
}
const sql = neon(databaseUrl, { fetchOptions: { cache: 'no-store' } });

// Configure Cloudinary instances
// We'll use the same cloudinary instance but switch configs as needed
cloudinary.config(OLD_CLOUDINARY);
const oldCloudinary = cloudinary;

// For new Cloudinary, we'll create upload function that uses new config

/**
 * Download image from URL
 */
function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  });
}

/**
 * Upload image to new Cloudinary
 */
async function uploadToNewCloudinary(buffer, folder, publicId) {
  // Temporarily switch to new config
  const currentConfig = cloudinary.config();
  cloudinary.config(NEW_CLOUDINARY);
  
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        public_id: publicId,
        resource_type: 'auto',
      },
      (error, result) => {
        // Restore old config
        cloudinary.config(currentConfig);
        if (error) reject(error);
        else resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
}

/**
 * Extract folder and public_id from Cloudinary URL
 */
function parseCloudinaryUrl(url) {
  try {
    // Extract from URL like: https://res.cloudinary.com/cloud_name/image/upload/v123/folder/public_id.jpg
    const match = url.match(/res\.cloudinary\.com\/[^\/]+\/(image|video|raw)\/upload\/(?:v\d+\/)?(.+)/);
    if (match) {
      const pathParts = match[2].split('/');
      const filename = pathParts[pathParts.length - 1];
      const publicId = filename.replace(/\.[^.]+$/, ''); // Remove extension
      const folder = pathParts.length > 1 ? pathParts.slice(0, -1).join('/') : '';
      return { folder, publicId };
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Migrate product images
 */
async function migrateProductImages() {
  console.log('\n📦 Migrating product images...');
  
  const products = await sql`SELECT id, image, images FROM products`;
  let migrated = 0;
  let errors = 0;
  const updates = [];

  for (const product of products) {
    try {
      const imageUpdates = {
        id: product.id,
        newMainImage: product.image,
        newImages: product.images || []
      };

      // Migrate main image
      if (product.image && product.image.includes('cloudinary.com')) {
        console.log(`  📸 Migrating main image for product ${product.id}...`);
        const buffer = await downloadImage(product.image);
        const parsed = parseCloudinaryUrl(product.image);
        const folder = parsed?.folder || 'products';
        const publicId = parsed?.publicId || `product_${product.id}_main_${Date.now()}`;
        
        const result = await uploadToNewCloudinary(buffer, folder, publicId);
        imageUpdates.newMainImage = result.secure_url;
        console.log(`    ✅ Main image migrated: ${result.secure_url.substring(0, 60)}...`);
      }

      // Migrate additional images
      if (product.images && Array.isArray(product.images) && product.images.length > 0) {
        const newImages = [];
        for (let i = 0; i < product.images.length; i++) {
          const imgUrl = product.images[i];
          if (imgUrl && imgUrl.includes('cloudinary.com')) {
            try {
              console.log(`  📸 Migrating image ${i + 1} for product ${product.id}...`);
              const buffer = await downloadImage(imgUrl);
              const parsed = parseCloudinaryUrl(imgUrl);
              const folder = parsed?.folder || 'products';
              const publicId = parsed?.publicId || `product_${product.id}_${i}_${Date.now()}`;
              
              const result = await uploadToNewCloudinary(buffer, folder, publicId);
              newImages.push(result.secure_url);
              console.log(`    ✅ Image ${i + 1} migrated`);
            } catch (error) {
              console.error(`    ❌ Error migrating image ${i + 1}:`, error.message);
              newImages.push(imgUrl); // Keep old URL if migration fails
            }
          } else {
            newImages.push(imgUrl); // Keep non-Cloudinary URLs as is
          }
        }
        imageUpdates.newImages = newImages;
      }

      updates.push(imageUpdates);
      migrated++;
    } catch (error) {
      console.error(`  ❌ Error migrating product ${product.id}:`, error.message);
      errors++;
    }
  }

  // Update database
  console.log(`\n💾 Updating database...`);
  for (const update of updates) {
    try {
      await sql`
        UPDATE products
        SET 
          image = ${update.newMainImage},
          images = ${JSON.stringify(update.newImages)}::jsonb,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${update.id}
      `;
    } catch (error) {
      console.error(`  ❌ Error updating product ${update.id}:`, error.message);
    }
  }

  console.log(`✅ Products: ${migrated} migrated, ${errors} errors`);
  return { migrated, errors };
}

/**
 * Migrate landing images
 */
async function migrateLandingImages() {
  console.log('\n🖼️  Migrating landing images...');
  
  const images = await sql`SELECT id, image_url, cloudinary_public_id, section FROM landing_images`;
  let migrated = 0;
  let errors = 0;

  for (const img of images) {
    try {
      if (img.image_url && img.image_url.includes('cloudinary.com')) {
        console.log(`  📸 Migrating landing image ${img.id} (${img.section})...`);
        const buffer = await downloadImage(img.image_url);
        const parsed = parseCloudinaryUrl(img.image_url);
        const folder = parsed?.folder || `landing/${img.section}`;
        const publicId = parsed?.publicId || img.cloudinary_public_id || `landing_${img.id}_${Date.now()}`;
        
        const result = await uploadToNewCloudinary(buffer, folder, publicId);
        
        // Update database
        await sql`
          UPDATE landing_images
          SET 
            image_url = ${result.secure_url},
            cloudinary_public_id = ${result.public_id},
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${img.id}
        `;
        
        console.log(`    ✅ Image migrated: ${result.secure_url.substring(0, 60)}...`);
        migrated++;
      }
    } catch (error) {
      console.error(`  ❌ Error migrating landing image ${img.id}:`, error.message);
      errors++;
    }
  }

  console.log(`✅ Landing Images: ${migrated} migrated, ${errors} errors`);
  return { migrated, errors };
}

/**
 * Main migration function
 */
async function migrate() {
  try {
    console.log('🔄 Starting Cloudinary migration...');
    console.log(`📤 Source: ${OLD_CLOUDINARY.cloud_name}`);
    console.log(`📥 Destination: ${NEW_CLOUDINARY.cloud_name}`);
    
    const results = {
      products: { migrated: 0, errors: 0 },
      landing_images: { migrated: 0, errors: 0 }
    };

    // Migrate product images
    results.products = await migrateProductImages();

    // Migrate landing images
    results.landing_images = await migrateLandingImages();

    // Summary
    const totalMigrated = results.products.migrated + results.landing_images.migrated;
    const totalErrors = results.products.errors + results.landing_images.errors;

    console.log('\n🎉 Migration completed!');
    console.log(`📊 Total: ${totalMigrated} images migrated, ${totalErrors} errors`);
    console.log('\n💡 Next step: Update .env.local to use new Cloudinary credentials');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrate();
