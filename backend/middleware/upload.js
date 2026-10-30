const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Ensure uploads directory exists (use os.tmpdir() on Vercel Serverless)
let uploadsDir = process.env.VERCEL
  ? path.join(os.tmpdir(), 'civiclens-uploads')
  : path.join(__dirname, '../uploads');

try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch {
  uploadsDir = path.join(os.tmpdir(), 'civiclens-uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'complaint-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter (supports both images and videos)
const fileFilter = (req, file, cb) => {
  const allowedExtensions = /\.(jpeg|jpg|png|gif|webp|mp4|webm|mov|avi|mkv|ogg|m4v)$/i;
  const isImageOrVideoMime =
    file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/');
  const hasAllowedExt = allowedExtensions.test(path.extname(file.originalname).toLowerCase());

  if (isImageOrVideoMime && hasAllowedExt) {
    return cb(null, true);
  } else {
    cb(new Error('Only image (jpeg, jpg, png, gif, webp) and video (mp4, webm, mov, avi, mkv, ogg) files are allowed!'));
  }
};

// Create multer upload instance (up to 50MB for video support)
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: fileFilter
});

module.exports = upload;
