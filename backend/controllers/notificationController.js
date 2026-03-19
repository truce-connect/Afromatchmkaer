const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');

const CATEGORY_FILTERS = {
  messages: ['new_message'],
  community: ['community_invite', 'community_join']
};

const normalizeMetadata = (metadata) => {
  if (!metadata) return {};
  if (metadata instanceof Map) {
    return Object.fromEntries(metadata.entries());
  }
  if (typeof metadata.toObject === 'function') {
    return metadata.toObject();
  }
  return metadata;
};

const formatNotification = (notification) => {
  if (!notification) return null;
  const base = notification.toObject ? notification.toObject({ virtuals: false }) : notification;
  return {
    _id: base._id,
    type: base.type,
    message: base.message,
    read: base.read,
    metadata: normalizeMetadata(base.metadata),
    createdAt: base.createdAt,
    updatedAt: base.updatedAt,
    actor: base.actor && base.actor._id ? {
      _id: base.actor._id,
      name: base.actor.name,
      profileImage: base.actor.profileImage,
      username: base.actor.username
    } : base.actor
  };
};

const parsePagination = (value, fallback, max) => {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, max);
};

exports.getNotifications = asyncHandler(async (req, res) => {
  const page = parsePagination(req.query.page, 1, 200);
  const limit = parsePagination(req.query.limit, 20, 100);
  const skip = (page - 1) * limit;

  const filters = { user: req.user.id };
  const { filter, category } = req.query;

  if (filter === 'unread' || req.query.status === 'unread') {
    filters.read = false;
  }

  if (category && CATEGORY_FILTERS[category]) {
    filters.type = { $in: CATEGORY_FILTERS[category] };
  }

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filters)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('actor', 'name profileImage username')
      .lean({ autopopulate: false }),
    Notification.countDocuments(filters),
    Notification.countDocuments({ user: req.user.id, read: false })
  ]);

  res.json({
    page,
    limit,
    total,
    hasNextPage: skip + notifications.length < total,
    unreadCount,
    results: notifications.map((entry) => formatNotification(entry))
  });
});

exports.markNotificationRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid notification id.' });
  }

  const notification = await Notification.findOneAndUpdate(
    { _id: id, user: req.user.id },
    { read: true },
    { returnDocument: 'after' }
  ).populate('actor', 'name profileImage username');

  if (!notification) {
    return res.status(404).json({ message: 'Notification not found.' });
  }

  res.json({ notification: formatNotification(notification) });
});

exports.markAllNotificationsRead = asyncHandler(async (req, res) => {
  const result = await Notification.updateMany({ user: req.user.id, read: false }, { read: true });
  res.json({ updated: result.modifiedCount || 0 });
});
