const crypto = require('crypto');

const getEmbeddingDimension = () => Number(process.env.FACE_EMBEDDING_DIM || 512);
const getSimilarityThreshold = () => Number(process.env.FACE_SIMILARITY_THRESHOLD || 0.78);

const validateValues = (embedding) => {
  if (!Array.isArray(embedding)) {
    throw new Error('embedding must be an array of numbers.');
  }

  if (embedding.length !== getEmbeddingDimension()) {
    throw new Error(`embedding must contain exactly ${getEmbeddingDimension()} values.`);
  }

  return embedding.map((value, index) => {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
      throw new Error(`embedding[${index}] is not a finite number.`);
    }
    return numericValue;
  });
};

const l2Normalize = (values) => {
  const magnitude = Math.sqrt(values.reduce((sum, value) => sum + value * value, 0));
  if (magnitude === 0) {
    throw new Error('embedding magnitude is zero; cannot normalize.');
  }
  return values.map((value) => value / magnitude);
};

const cosineSimilarity = (a, b) => {
  if (a.length !== b.length) {
    throw new Error('Embeddings must be the same dimension.');
  }
  return a.reduce((sum, value, index) => sum + value * b[index], 0);
};

const checksumEmbedding = (values) =>
  crypto.createHash('sha256').update(values.join('|')).digest('hex');

const prepareEmbedding = (embedding) => {
  const numericValues = validateValues(embedding);
  return l2Normalize(numericValues);
};

const buildEmbeddingRecord = (values, metadata = {}) => ({
  values,
  dimension: values.length,
  modelVersion: metadata.modelVersion || 'unspecified',
  checksum: checksumEmbedding(values),
  updatedAt: new Date()
});

const meetsSimilarityThreshold = (similarity) => similarity >= getSimilarityThreshold();

module.exports = {
  getEmbeddingDimension,
  getSimilarityThreshold,
  prepareEmbedding,
  cosineSimilarity,
  buildEmbeddingRecord,
  meetsSimilarityThreshold
};
