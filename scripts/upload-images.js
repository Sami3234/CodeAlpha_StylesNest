const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Configure Cloudinary
console.log('🔐 Checking Cloudinary config...');
console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME ? '✅' : '❌');
console.log('API Key:', process.env.CLOUDINARY_API_KEY ? '✅' : '❌');
console.log('API Secret:', process.env.CLOUDINARY_API_SECRET ? '✅' : '❌');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadImage(filePath, folder, publicId) {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      public_id: publicId,
      resource_type: 'auto',
    });
    console.log(`✅ Uploaded: ${publicId} -> ${result.secure_url}`);
    return result.secure_url;
  } catch (error) {
    console.error(`❌ Error uploading ${publicId}:`, error.message);
    return null;
  }
}

async function main() {
  const imagesDir = path.join(__dirname, '../public/images');
  const uploadedUrls = {};

  // Upload general store image
  const generalStorePath = path.join(imagesDir, 'genralstore.jpg');
  if (fs.existsSync(generalStorePath)) {
    const url = await uploadImage(generalStorePath, 'homepage', 'general-store');
    if (url) uploadedUrls.generalStore = url;
  }

  // Upload lace images (even though we'll remove the section, user might want them)
  for (let i = 1; i <= 5; i++) {
    const lacePath = path.join(imagesDir, `lace${i}.jpg`);
    if (fs.existsSync(lacePath)) {
      const url = await uploadImage(lacePath, 'homepage/lace', `lace${i}`);
      if (url) uploadedUrls[`lace${i}`] = url;
    }
  }

  console.log('\n📋 Uploaded URLs:');
  console.log(JSON.stringify(uploadedUrls, null, 2));
}

main().catch(console.error);
