const express = require('express');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const rateLimiter = require('../middleware/rateLimiter');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

const ALLOWED_PURPOSES = new Set(['profile', 'gallery', 'message']);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const resolvePurpose = (rawPurpose) => {
  if (rawPurpose && ALLOWED_PURPOSES.has(rawPurpose)) return rawPurpose;
  return 'general';
};

const storage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => {
    const purpose = resolvePurpose(req.body.purpose);
    req.uploadPurpose = purpose;
    const isVideo = file.mimetype.startsWith('video/');
    return {
      folder: `afromatchmaker/${purpose}`,
      resource_type: isVideo ? 'video' : 'image',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mov'],
      transformation: purpose === 'profile' ? [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }] : [{ quality: 'auto' }]
    };
  }
});

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;
const allowedMimePatterns = [/^image\//i, /^video\//i];

const fileFilter = (_req, file, cb) => {
  const isAllowed = allowedMimePatterns.some((pattern) => pattern.test(file.mimetype));
  if (!isAllowed) return cb(new Error('Unsupported file type.'));
  return cb(null, true);
};

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES, files: 5 },
  fileFilter
});

const buildFileResponse = (req, file) => {
  const purpose = req.uploadPurpose || resolvePurpose(req.body.purpose);
  const type = file.mimetype.startsWith('image/') ? 'image' : 'video';
  return {
    url: file.path,
    mimetype: file.mimetype,
    size: file.size,
    originalName: file.originalname,
    purpose,
    type
  };
};

const respondWithFiles = (req, res) => {
  const files = Array.isArray(req.files) ? req.files : req.file ? [req.file] : [];
  if (files.length === 0) return res.status(400).json({ message: 'Upload at least one file.' });
  const payload = files.map((file) => buildFileResponse(req, file));
  return res.status(201).json({ files: payload });
};

router.post('/public', rateLimiter, upload.array('files', 5), respondWithFiles);
router.post('/protected', authMiddleware, rateLimiter, upload.array('files', 5), respondWithFiles);

router.use((err, _req, res, next) => {
  if (!err) return next();
  if (err instanceof multer.MulterError) return res.status(400).json({ message: err.message });
  return res.status(400).json({ message: err.message || 'Upload failed.' });
});

module.exports = router;

