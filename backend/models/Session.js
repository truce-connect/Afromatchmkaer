const crypto = require('crypto');
const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => crypto.randomUUID()
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    refreshTokenHash: {
      type: String,
      required: true
    },
    device: String,
    browser: String,
    ip: String,
    userAgent: String,
    createdAt: {
      type: Date,
      default: Date.now
    },
    lastUsedAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: {
      type: Date,
      required: true
    }
  }
);

sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Session', sessionSchema);
