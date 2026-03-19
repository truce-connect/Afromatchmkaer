const { validationResult } = require('express-validator');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const faceService = require('../utils/faceService');

const buildValidationError = (errors) => {
  const formatted = errors.array().map((error) => ({ field: error.path, message: error.msg }));
  const validationError = new Error('Validation failed');
  validationError.statusCode = 422;
  validationError.details = formatted;
  return validationError;
};

const enrollFace = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw buildValidationError(errors);
  }

  const { embedding, modelVersion } = req.body;
  const user = await User.findById(req.user.id).select('+faceEmbedding');

  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  const normalizedEmbedding = faceService.prepareEmbedding(embedding);
  user.faceEmbedding = faceService.buildEmbeddingRecord(normalizedEmbedding, { modelVersion });
  user.faceVerifiedAt = new Date();
  user.faceVerificationConfidence = 1;
  user.faceVerificationMethod = modelVersion ? `embedding:${modelVersion}` : 'embedding';
  await user.save();

  res.json({
    message: 'Face enrollment recorded successfully.',
    faceVerifiedAt: user.faceVerifiedAt,
    modelVersion: user.faceEmbedding.modelVersion
  });
});

const verifyFace = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw buildValidationError(errors);
  }

  const { embedding } = req.body;
  const user = await User.findById(req.user.id).select('+faceEmbedding');

  if (!user || !user.faceEmbedding || !Array.isArray(user.faceEmbedding.values)) {
    return res.status(404).json({ message: 'No enrollment data found for this user.' });
  }

  const normalizedEmbedding = faceService.prepareEmbedding(embedding);
  const similarity = faceService.cosineSimilarity(user.faceEmbedding.values, normalizedEmbedding);
  const match = faceService.meetsSimilarityThreshold(similarity);

  if (match) {
    user.faceVerifiedAt = new Date();
    user.faceVerificationConfidence = similarity;
    await user.save();
  }

  res.json({
    match,
    similarity,
    threshold: faceService.getSimilarityThreshold(),
    faceVerifiedAt: user.faceVerifiedAt || null
  });
});

const getFaceStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('faceVerifiedAt faceEmbedding faceVerificationConfidence');

  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  res.json({
    enrolled: Boolean(user.faceEmbedding && Array.isArray(user.faceEmbedding.values)),
    faceVerifiedAt: user.faceVerifiedAt || null,
    modelVersion: user.faceEmbedding?.modelVersion || null,
    confidence: user.faceVerificationConfidence || null,
    threshold: faceService.getSimilarityThreshold()
  });
});

module.exports = { enrollFace, verifyFace, getFaceStatus };
