const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// Try to load env vars manually
try {
  const envLocal = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
  envLocal.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length) {
      process.env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
    }
  });
} catch (e) {
  // Try .env
  try {
    const env = fs.readFileSync(path.join(__dirname, '../.env'), 'utf8');
    env.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length) {
        process.env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
      }
    });
  } catch (e2) {
    console.error('Could not load .env files');
  }
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function upload() {
  console.log('Starting upload...');
  console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME || 'NOT SET');
  
  const filePath = path.join(__dirname, '../public/images/genralstore.jpg');
  
  if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    return;
  }
  
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'homepage',
      public_id: 'general-store',
    });
    console.log('SUCCESS! URL:', result.secure_url);
  } catch (error) {
    console.error('ERROR:', error.message);
  }
}

upload();
