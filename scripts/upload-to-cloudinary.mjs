import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });
dotenv.config({ path: path.join(__dirname, '../.env') });

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadImage(filePath, folder, publicId) {
  try {
    console.log(`📤 Uploading: ${publicId}...`);
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      public_id: publicId,
      resource_type: 'auto',
    });
    console.log(`✅ Uploaded: ${publicId}`);
    console.log(`   URL: ${result.secure_url}\n`);
    return result.secure_url;
  } catch (error) {
    console.error(`❌ Error uploading ${publicId}:`, error.message);
    return null;
  }
}

async function main() {
  console.log('🚀 Starting image upload to Cloudinary...\n');
  
  // Check config
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error('❌ Cloudinary credentials not found in environment variables!');
    console.log('Please check your .env.local or .env file.');
    process.exit(1);
  }
  
  console.log(`✅ Cloudinary configured: ${process.env.CLOUDINARY_CLOUD_NAME}\n`);

  const imagesDir = path.join(__dirname, '../public/images');
  const uploadedUrls = {};

  // Upload general store image
  const generalStorePath = path.join(imagesDir, 'genralstore.jpg');
  if (fs.existsSync(generalStorePath)) {
    const url = await uploadImage(generalStorePath, 'homepage', 'general-store');
    if (url) uploadedUrls.generalStore = url;
  } else {
    console.log(`⚠️  File not found: ${generalStorePath}\n`);
  }

  console.log('\n📋 Upload Summary:');
  console.log(JSON.stringify(uploadedUrls, null, 2));
  
  if (Object.keys(uploadedUrls).length > 0) {
    console.log('\n💡 Copy the URL above and update it in src/app/page.tsx');
  }
}

main().catch(console.error);
