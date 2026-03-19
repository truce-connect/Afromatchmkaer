const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const Report = require('../models/Report');

const sanitizeUser = (userDoc) => {
  if (!userDoc) return null;
  const user = userDoc.toObject ? userDoc.toObject() : userDoc;
  delete user.password;
  return user;
};

const normalizeArrayInput = (value) => {
  if (Array.isArray(value)) {
    return value.filter(Boolean).map((item) => item.trim());
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const normalizeInterestFilter = (value) => {
  if (typeof value === 'undefined') return [];
  if (Array.isArray(value)) {
    return value.flatMap((entry) => normalizeArrayInput(entry));
  }
  return normalizeArrayInput(value);
};

const toBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const lower = value.toLowerCase();
    return lower === 'true' || lower === '1' || lower === 'yes';
  }
  return Boolean(value);
};

const PRIVACY_OPTIONS = {
  profileVisibility: ['everyone', 'matches', 'private'],
  friendRequests: ['everyone', 'friends_of_friends', 'no_one'],
  messages: ['everyone', 'matches', 'friends_only']
};

const discoverUsers = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(Math.max(1, Number(req.query.limit) || 12), 60);
  const skip = (page - 1) * limit;

  const filters = { _id: { $ne: req.user?.id } };

  const ageMin = Number(req.query.ageMin);
  const ageMax = Number(req.query.ageMax);
  if (!Number.isNaN(ageMin) || !Number.isNaN(ageMax)) {
    filters.age = {};
    if (!Number.isNaN(ageMin)) {
      filters.age.$gte = ageMin;
    }
    if (!Number.isNaN(ageMax)) {
      filters.age.$lte = ageMax;
    }
  }

  if (req.query.country) {
    const country = String(req.query.country).trim();
    if (country) {
      filters.country = new RegExp(`^${country}`, 'i');
    }
  }

  const interestValues = normalizeInterestFilter(req.query.interests ?? req.query.interest);
  if (interestValues.length) {
    filters.interests = { $in: interestValues };
  }

  const [users, total] = await Promise.all([
    User.find(filters)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(filters)
  ]);

  const hasNextPage = skip + users.length < total;

  res.json({
    page,
    limit,
    total,
    results: users.map(sanitizeUser),
    hasNextPage
  });
});

const getUserMatches = asyncHandler(async (req, res) => {
  const currentUser = await User.findById(req.user.id).select('interests country age');
  if (!currentUser) {
    return res.status(404).json({ message: 'User not found.' });
  }

  const interestPool = (currentUser.interests || []).filter(Boolean);
  const baseQuery = { _id: { $ne: req.user.id } };
  if (interestPool.length) {
    baseQuery.interests = { $in: interestPool };
  }
  if (typeof currentUser.age === 'number' && !Number.isNaN(currentUser.age)) {
    const minAge = Math.max(18, currentUser.age - 5);
    const maxAge = currentUser.age + 5;
    baseQuery.age = { $gte: minAge, $lte: maxAge };
  }

  const limit = 20;
  const results = [];
  const seen = new Set();

  const fetchAndAppend = async (query) => {
    if (results.length >= limit) {
      return;
    }
    const docs = await User.find(query)
      .sort({ updatedAt: -1 })
      .limit(limit);
    docs.forEach((doc) => {
      if (results.length >= limit) {
        return;
      }
      const identifier = doc._id.toString();
      if (seen.has(identifier)) {
        return;
      }
      seen.add(identifier);
      results.push(sanitizeUser(doc));
    });
  };

  if (currentUser.country) {
    await fetchAndAppend({ ...baseQuery, country: currentUser.country });
  }

  if (results.length < limit) {
    await fetchAndAppend(baseQuery);
  }

  res.json(results.slice(0, limit));
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).populate('friends', 'name profileImage country');
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }
  res.json(sanitizeUser(user));
});
const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).populate('friends', 'name profileImage country');
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }
  res.json(sanitizeUser(user));
});

const updateProfile = asyncHandler(async (req, res) => {
  const editableFields = ['name', 'bio', 'country', 'address', 'age', 'gender', 'diaspora', 'interests', 'gallery', 'profileImage', 'coverPhoto', 'onboardingComplete'];
  const updates = {};

  editableFields.forEach((field) => {
    if (typeof req.body[field] !== 'undefined') {
      if (field === 'interests' || field === 'gallery') {
        updates[field] = normalizeArrayInput(req.body[field]);
      } else if (field === 'name' && typeof req.body[field] === 'string') {
        updates[field] = req.body[field].trim();
      } else {
        updates[field] = req.body[field];
      }
    }
  });

  if (typeof req.body.email === 'string') {
    updates.email = req.body.email.trim().toLowerCase();
  }

  if (typeof req.body.username === 'string') {
    updates.username = req.body.username.trim().toLowerCase();
  }

  const notificationPreferences = req.body.notificationPreferences;
  const notificationKeys = ['friendRequests', 'messages', 'communityActivity', 'emailUpdates'];
  if (notificationPreferences && typeof notificationPreferences === 'object') {
    notificationKeys.forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(notificationPreferences, key)) {
        updates[`notificationPreferences.${key}`] = toBoolean(notificationPreferences[key]);
      }
    });
  }

  const privacySettings = req.body.privacySettings;
  if (privacySettings && typeof privacySettings === 'object') {
    Object.entries(PRIVACY_OPTIONS).forEach(([key, allowed]) => {
      const value = privacySettings[key];
      if (typeof value === 'string' && allowed.includes(value)) {
        updates[`privacySettings.${key}`] = value;
      }
    });
  }

  const user = await User.findByIdAndUpdate(req.user.id, updates, {
    returnDocument: 'after',
    runValidators: true
  });

  res.json(sanitizeUser(user));
});

const deleteAccount = asyncHandler(async (req, res) => {
  await User.findByIdAndDelete(req.user.id);
  res.json({ message: 'Account deleted successfully.' });
});

const reportUser = asyncHandler(async (req, res) => {
  const { targetUserId, reason, details } = req.body || {};

  if (!targetUserId || !reason) {
    return res.status(400).json({ message: 'targetUserId and reason are required.' });
  }

  if (targetUserId === req.user.id) {
    return res.status(400).json({ message: 'You cannot report yourself.' });
  }

  const targetUser = await User.findById(targetUserId);
  if (!targetUser) {
    return res.status(404).json({ message: 'User not found.' });
  }

  const report = await Report.create({
    reporter: req.user.id,
    target: targetUserId,
    reason: reason.trim(),
    details
  });

  res.status(201).json({ message: 'Report submitted successfully.', reportId: report._id });
});

module.exports = {
  discoverUsers,
  getUserById,
  getCurrentUser,
  updateProfile,
  reportUser,
  getUserMatches,
  deleteAccount
};
