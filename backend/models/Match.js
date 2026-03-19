const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      }
    ],
    conversationId: {
      type: String,
      required: true,
      unique: true
    },
    lastMessageAt: Date
  },
  { timestamps: true }
);

module.exports = mongoose.model('Match', matchSchema);
