const mongoose = require('mongoose');
const Community = require('../models/Community');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { createNotification } = require('../utils/notificationService');

const normalizeInterestsInput = (payload) => {
  if (!payload) return [];
  const values = Array.isArray(payload) ? payload : String(payload).split(',');
  return Array.from(
    new Set(
      values
        .filter((value) => typeof value === 'string')
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean)
    )
  );
};

const shapeUserSummary = (user) => {
  if (!user) return null;
  if (user._id) {
    return {
      _id: user._id,
      name: user.name,
      profileImage: user.profileImage,
      country: user.country,
      interests: user.interests || []
    };
  }
  return { _id: user };
};

const formatCommunity = (communityDoc, { includeMembers = false, currentUserId } = {}) => {
  if (!communityDoc) return null;
  const community =
    typeof communityDoc.toObject === 'function' ? communityDoc.toObject({ virtuals: false }) : communityDoc;

  const memberEntries = community.members || [];
  const memberIds = memberEntries.map((member) => {
    if (!member) return null;
    if (typeof member === 'string') return member;
    if (member._id) return member._id.toString();
    if (member instanceof mongoose.Types.ObjectId) return member.toString();
    return member;
  });

  const isMember = currentUserId ? memberIds.includes(currentUserId.toString()) : false;

  const base = {
    _id: community._id,
    name: community.name,
    slug: community.slug,
    description: community.description,
    coverImage: community.coverImage,
    interests: community.interests && community.interests.length ? community.interests : community.tags || [],
    privacy: community.privacy,
    city: community.city,
    createdAt: community.createdAt,
    updatedAt: community.updatedAt,
    memberCount: memberIds.filter(Boolean).length,
    isMember,
    createdBy: community.createdBy && community.createdBy._id ? shapeUserSummary(community.createdBy) : community.createdBy
  };

  if (includeMembers) {
    base.members = memberEntries
      .map((member) => shapeUserSummary(member))
      .filter(Boolean);
  }

  return base;
};

const attachSlug = (name) => {
  if (!name) return undefined;
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');
  return `${base}-${Date.now().toString(36)}`;
};

const parsePagination = (value, fallback, max) => {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, max);
};

exports.listCommunities = asyncHandler(async (req, res) => {
  const page = parsePagination(req.query.page, 1, 1000);
  const limit = parsePagination(req.query.limit, 9, 50);
  const skip = (page - 1) * limit;

  const user = await User.findById(req.user.id).select('interests');
  const interestFilter = normalizeInterestsInput(req.query.interests || req.query.interest);
  const interests = interestFilter.length ? interestFilter : normalizeInterestsInput(user?.interests);

  const filters = {};
  if (interests.length) {
    filters.interests = { $in: interests };
  }
  if (req.query.search) {
    filters.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { description: { $regex: req.query.search, $options: 'i' } }
    ];
  }

  const [communities, total] = await Promise.all([
    Community.find(filters)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('name description coverImage interests members createdAt updatedAt slug privacy city createdBy')
      .populate('createdBy', 'name profileImage country')
      .lean({ autopopulate: false }),
    Community.countDocuments(filters)
  ]);

  const formatted = communities.map((community) => formatCommunity(community, { currentUserId: req.user.id }));

  return res.json({
    page,
    limit,
    total,
    hasNextPage: skip + communities.length < total,
    results: formatted
  });
});

exports.createCommunity = asyncHandler(async (req, res) => {
  const { name, description, interests, coverImage, city, privacy } = req.body;
  if (!name || !description) {
    return res.status(400).json({ message: 'Name and description are required.' });
  }

  const normalizedInterests = normalizeInterestsInput(interests);

  const community = await Community.create({
    name,
    description,
    coverImage,
    city,
    privacy: privacy || 'public',
    interests: normalizedInterests,
    slug: attachSlug(name),
    createdBy: req.user.id,
    members: [req.user.id]
  });

  await community.populate('createdBy', 'name profileImage country');

  return res.status(201).json(formatCommunity(community, { includeMembers: true, currentUserId: req.user.id }));
});

exports.joinCommunity = asyncHandler(async (req, res) => {
  const { communityId } = req.body;
  if (!communityId) {
    return res.status(400).json({ message: 'Community ID is required.' });
  }

  const community = await Community.findById(communityId);
  if (!community) {
    return res.status(404).json({ message: 'Community not found.' });
  }

  const memberIds = community.members.map((member) => member.toString());
  if (!memberIds.includes(req.user.id)) {
    community.members.push(req.user.id);
    await community.save();
  }

  await community.populate('createdBy', 'name profileImage country');

  if (community.createdBy && community.createdBy._id && community.createdBy._id.toString() !== req.user.id) {
    await createNotification({
      user: community.createdBy._id,
      actor: req.user.id,
      type: 'community_join',
      message: 'A new member joined your community',
      metadata: {
        communityId: community._id.toString()
      }
    });
  }

  return res.json(formatCommunity(community, { currentUserId: req.user.id }));
});

exports.getCommunityById = asyncHandler(async (req, res) => {
  const { communityId } = req.params;
  const community = await Community.findById(communityId)
    .populate('createdBy', 'name profileImage country')
    .populate('members', 'name profileImage country interests');

  if (!community) {
    return res.status(404).json({ message: 'Community not found.' });
  }

  return res.json(formatCommunity(community, { includeMembers: true, currentUserId: req.user.id }));
});

exports.inviteToCommunity = asyncHandler(async (req, res) => {
  const { communityId, userId } = req.body;
  if (!communityId || !userId) {
    return res.status(400).json({ message: 'Community ID and user ID are required.' });
  }

  const community = await Community.findById(communityId);
  if (!community) {
    return res.status(404).json({ message: 'Community not found.' });
  }

  if (community.createdBy.toString() !== req.user.id) {
    return res.status(403).json({ message: 'Only community admins can invite members.' });
  }

  const targetUser = await User.findById(userId).select('_id');
  if (!targetUser) {
    return res.status(404).json({ message: 'User not found.' });
  }

  const alreadyMember = community.members.some((member) => member.toString() === userId);
  if (!alreadyMember) {
    community.members.push(userId);
    await community.save();
  }

  await createNotification({
    user: userId,
    actor: req.user.id,
    type: 'community_invite',
    message: 'You have been invited to join a community',
    metadata: {
      communityId: community._id.toString()
    }
  });

  return res.json({ message: 'Invitation sent and member added to the community.' });
});
