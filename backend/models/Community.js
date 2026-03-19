const mongoose = require('mongoose');

const communitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    slug: {
      type: String,
      trim: true,
      unique: true,
      sparse: true
    },
    description: {
      type: String,
      required: true,
      maxlength: 1200
    },
    coverImage: String,
    interests: {
      type: [String],
      default: [],
      set: (values = []) =>
        Array.from(
          new Set(
            values
              .filter((value) => typeof value === 'string')
              .map((value) => value.trim().toLowerCase())
              .filter(Boolean)
          )
        )
    },
    city: {
      type: String,
      trim: true
    },
    privacy: {
      type: String,
      enum: ['public', 'private'],
      default: 'public'
    },
    memberLimit: Number,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    tags: {
      type: [String],
      default: []
    }
  },
  { timestamps: true }
);

communitySchema.index({ name: 'text', tags: 1 });

module.exports = mongoose.model('Community', communitySchema);
