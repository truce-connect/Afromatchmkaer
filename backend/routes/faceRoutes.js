const express = require('express');
const { body } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const rateLimiter = require('../middleware/rateLimiter');
const { enrollFace, verifyFace, getFaceStatus } = require('../controllers/faceController');
const faceService = require('../utils/faceService');

const router = express.Router();
const embeddingDimension = faceService.getEmbeddingDimension();

const embeddingValidator = body('embedding')
  .isArray({ min: embeddingDimension, max: embeddingDimension })
  .withMessage(`embedding must be an array with ${embeddingDimension} numeric values.`)
  .custom((values) => values.every((value) => Number.isFinite(Number(value))))
  .withMessage('embedding must only contain finite numbers.');

router.use(authMiddleware);

router.get('/status', rateLimiter, getFaceStatus);

router.post(
  '/enroll',
  rateLimiter,
  [embeddingValidator, body('modelVersion').optional().isString().isLength({ max: 60 })],
  enrollFace
);

router.post('/verify', rateLimiter, [embeddingValidator], verifyFace);

module.exports = router;
