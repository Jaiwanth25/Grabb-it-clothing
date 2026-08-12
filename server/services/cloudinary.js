const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

let isCloudinaryConfigured = false;

if (CLOUD_NAME && API_KEY && API_SECRET) {
  cloudinary.config({
    cloud_name: CLOUD_NAME,
    api_key: API_KEY,
    api_secret: API_SECRET
  });
  isCloudinaryConfigured = true;
}

/**
 * Uploads an image file to Cloudinary or falls back to local uploads folder
 */
async function uploadImage(filePath, folder = 'grabb-it-products') {
  if (isCloudinaryConfigured) {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder,
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ quality: 'auto', fetch_format: 'auto' }]
      });
      // Delete temporary local file after Cloudinary upload
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return { success: true, url: result.secure_url, publicId: result.public_id };
    } catch (err) {
      console.error('Cloudinary Upload Error:', err.message);
      throw new Error(`Cloudinary upload failed: ${err.message}`);
    }
  } else {
    // Development local storage fallback
    const filename = path.basename(filePath);
    return { success: true, url: `/uploads/${filename}`, isLocal: true };
  }
}

/**
 * Deletes an image from Cloudinary
 */
async function deleteImage(publicIdOrUrl) {
  if (isCloudinaryConfigured && publicIdOrUrl) {
    try {
      // Extract public_id if full Cloudinary URL is passed
      let publicId = publicIdOrUrl;
      if (publicIdOrUrl.includes('cloudinary.com')) {
        const parts = publicIdOrUrl.split('/');
        const fileWithExt = parts.slice(-2).join('/'); // folder/filename.ext
        publicId = fileWithExt.substring(0, fileWithExt.lastIndexOf('.'));
      }
      await cloudinary.uploader.destroy(publicId);
      return { success: true };
    } catch (err) {
      console.error('Cloudinary Delete Error:', err.message);
      return { success: false, error: err.message };
    }
  }
  return { success: true, localSkipped: true };
}

module.exports = {
  uploadImage,
  deleteImage,
  isCloudinaryConfigured
};
