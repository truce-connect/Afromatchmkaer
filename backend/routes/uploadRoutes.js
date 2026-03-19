const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const rateLimiter = require('../middleware/rateLimiter');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

const ALLOWED_PURPOSES = new Set(['profile', 'gallery', 'message']);
const UPLOAD_ROOT = path.join(__dirname, '..', 'uploads');

const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const resolvePurpose = (rawPurpose) => {
  if (rawPurpose && ALLOWED_PURPOSES.has(rawPurpose)) {
    return rawPurpose;
  }
  return 'general';
};

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const purpose = resolvePurpose(req.body.purpose);
    req.uploadPurpose = purpose;
    const folder = path.join(UPLOAD_ROOT, purpose);
    ensureDir(folder);
    cb(null, folder);
  },
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const unique = Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname) || '';
    cb(null, `${timestamp}-${unique}${extension}`);
  }
});

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB per file
const allowedMimePatterns = [/^image\//i, /^video\//i, /application\/(pdf)$/i, /msword$/i, /vnd\.openxmlformats-officedocument/];

const fileFilter = (_req, file, cb) => {
  const isAllowed = allowedMimePatterns.some((pattern) => pattern.test(file.mimetype));
  if (!isAllowed) {
    return cb(new Error('Unsupported file type.'));
  }
  return cb(null, true);
};

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES, files: 5 },
  fileFilter
});

const buildFileResponse = (req, file) => {
  const baseUrl = process.env.FILE_BASE_URL || `${req.protocol}://${req.get('host')}`;
  const purpose = req.uploadPurpose || resolvePurpose(req.body.purpose);
  const type = file.mimetype.startsWith('image/') ? 'image' : file.mimetype.startsWith('video/') ? 'video' : 'document';
  return {
    url: `${baseUrl}/uploads/${purpose}/${file.filename}`,
    mimetype: file.mimetype,
    size: file.size,
    originalName: file.originalname,
    purpose,
    type
  };
};

const respondWithFiles = (req, res) => {
  const files = Array.isArray(req.files) ? req.files : req.file ? [req.file] : [];
  if (files.length === 0) {
    return res.status(400).json({ message: 'Upload at least one file.' });
  }
  const payload = files.map((file) => buildFileResponse(req, file));
  return res.status(201).json({ files: payload });
};

router.post('/public', rateLimiter, upload.array('files', 5), respondWithFiles);
router.post('/protected', authMiddleware, rateLimiter, upload.array('files', 5), respondWithFiles);

router.use((err, _req, res, next) => {
  if (!err) {
    return next();
  }

  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: err.message });
  }

  return res.status(400).json({ message: err.message || 'Upload failed.' });
});

module.exports = router;
