const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    type: {
      type: String,
      enum: ['friend_request', 'friend_accept', 'new_message', 'community_invite', 'community_join', 'profile_view'],
      required: true
    },
    message: {
      type: String,
      required: true
    },
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: () => ({})
    },
    read: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, read: 1 });
notificationSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
