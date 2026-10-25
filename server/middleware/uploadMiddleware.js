const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary if env variables exist
let storage;

if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });

  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'grabb-it-clothing',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif', 'svg', 'heic', 'heif', 'bmp', 'tiff', 'ico']
    }
  });
} else {
  // Fallback to local storage for development
  const uploadDir = path.join(__dirname, '../uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const allowedExtList = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.heic', '.heif', '.bmp', '.svg'];

  storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const rawExt = path.extname(file.originalname || '').toLowerCase().replace(/[^a-z0-9.]/g, '');
      const ext = allowedExtList.includes(rawExt) ? rawExt : '.jpg';
      cb(null, 'grabb-upload-' + uniqueSuffix + ext);
    }
  });
}

const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 
    'image/avif', 'image/heic', 'image/heif', 'image/bmp', 'image/svg+xml'
  ];
  const isImageMime = file.mimetype && allowedMimes.includes(file.mimetype.toLowerCase());
  const isImageExt = /\.(jpg|jpeg|png|webp|gif|avif|svg|heic|heif|bmp)$/i.test(file.originalname || '');
  
  if (isImageMime && isImageExt) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only secure image formats (JPG, PNG, WEBP, GIF, AVIF, HEIC, BMP, SVG) are permitted!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB limit
});

module.exports = upload;
