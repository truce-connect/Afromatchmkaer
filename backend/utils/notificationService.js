const Notification = require('../models/Notification');

const safeMetadata = (metadata = {}) => {
  if (!metadata || typeof metadata !== 'object') {
    return undefined;
  }

  return Object.entries(metadata).reduce((acc, [key, value]) => {
    if (typeof value === 'undefined') {
      return acc;
    }
    acc[key] = value;
    return acc;
  }, {});
};

const createNotification = async ({ user, actor, type, message, metadata }) => {
  if (!user || !type || !message) {
    return null;
  }

  try {
    const payload = {
      user,
      actor,
      type,
      message,
      metadata: safeMetadata(metadata)
    };

    return await Notification.create(payload);
  } catch (error) {
    console.error('Notification creation failed', error);
    return null;
  }
};

module.exports = {
  createNotification
};
