import { v2 as cloudinary } from 'cloudinary';

/**
 * Configure Cloudinary from CLOUDINARY_URL or separate env vars.
 * CLOUDINARY_URL format: cloudinary://API_KEY:API_SECRET@CLOUD_NAME
 */
export function configureCloudinary(): void {
  const url = process.env.CLOUDINARY_URL?.trim();

  if (url?.startsWith('cloudinary://')) {
    const rest = url.slice('cloudinary://'.length);
    const at = rest.lastIndexOf('@');
    if (at === -1) {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });
      return;
    }
    const cloudName = rest.slice(at + 1).trim();
    const auth = rest.slice(0, at);
    const colon = auth.indexOf(':');
    const apiKey = colon >= 0 ? auth.slice(0, colon) : '';
    const apiSecret = colon >= 0 ? auth.slice(colon + 1) : '';
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
    return;
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}
