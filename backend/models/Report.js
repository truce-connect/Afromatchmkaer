const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    target: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reason: {
      type: String,
      required: true,
      trim: true
    },
    details: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ['open', 'reviewed', 'resolved'],
      default: 'open'
    }
  },
  { timestamps: true }
);

reportSchema.index({ reporter: 1, target: 1, createdAt: -1 });

module.exports = mongoose.model('Report', reportSchema);
