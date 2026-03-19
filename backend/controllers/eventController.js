const Event = require('../models/Event');
const User = require('../models/User');
const Community = require('../models/Community');
const asyncHandler = require('../utils/asyncHandler');

const MAX_EVENTS_LIMIT = 24;
const DEFAULT_LIMIT = 6;
const ALLOWED_HOST_TYPES = ['user', 'community', 'partner'];

const toArrayParam = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry).trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  return [];
};

const resolveLimit = (candidate, fallback = DEFAULT_LIMIT) => {
  const parsed = Number(candidate);
  if (Number.isFinite(parsed) && parsed > 0) {
    return Math.min(parsed, MAX_EVENTS_LIMIT);
  }
  return fallback;
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildFilter = ({
  timeframe = 'upcoming',
  tags = [],
  location,
  hostType,
  communityIds = [],
  followingIds = []
}) => {
  const filter = { status: 'published' };
  const now = new Date();
  if (timeframe === 'past') {
    filter.startsAt = { $lt: now };
  } else if (timeframe !== 'all') {
    filter.startsAt = { $gte: now };
  }
  if (tags.length) {
    filter.tags = { $in: tags };
  }
  if (hostType) {
    filter.hostType = hostType;
  }
  if (communityIds.length) {
    filter.community = { $in: communityIds };
  }
  if (followingIds.length) {
    filter.createdBy = { $in: followingIds };
  }
  if (location) {
    const escaped = escapeRegex(location);
    filter.$or = [{ country: new RegExp(escaped, 'i') }, { city: new RegExp(escaped, 'i') }];
  }
  return filter;
};

const queryEvents = async ({ filter, sort, limit, fallback = DEFAULT_LIMIT }) => {
  const resolvedLimit = resolveLimit(limit, fallback);
  return Event.find(filter).sort(sort).limit(resolvedLimit).lean();
};

const fetchUserContext = async (userId) => {
  if (!userId) return null;
  return User.findById(userId)
    .select('name profileImage interests communities friends country')
    .lean();
};

const createHttpError = (message, statusCode = 400) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

const parseDate = (value, label) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw createHttpError(`Invalid ${label}.`);
  }
  return date;
};

const parsePositiveNumber = (value) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw createHttpError('Capacity must be a positive number.');
  }
  return parsed;
};

const buildOrganizer = (userDoc, communityDoc) => {
  if (communityDoc) {
    return {
      name: communityDoc.name,
      community: communityDoc.name,
      avatar: communityDoc.coverImage || undefined
    };
  }
  if (!userDoc) {
    return undefined;
  }
  return {
    id: userDoc._id?.toString(),
    name: userDoc.name,
    avatar: userDoc.profileImage || undefined
  };
};

const listEvents = asyncHandler(async (req, res) => {
  const { timeframe, location, hostType } = req.query;
  const tags = toArrayParam(req.query.tags || req.query.interests);
  const communityIds = toArrayParam(req.query.communityIds);
  const followingIds = toArrayParam(req.query.followingIds);

  const filter = buildFilter({ timeframe, tags, location, hostType, communityIds, followingIds });
  const events = await queryEvents({ filter, sort: { startsAt: 1 }, limit: req.query.limit });
  res.json(events);
});

const getRecommendedEvents = asyncHandler(async (req, res) => {
  const context = await fetchUserContext(req.user?.id);
  let tags = toArrayParam(req.query.tags || req.query.interests);
  if (!tags.length && Array.isArray(context?.interests)) {
    tags = context.interests;
  }

  let communityIds = toArrayParam(req.query.communityIds);
  if (!communityIds.length && Array.isArray(context?.communities)) {
    communityIds = context.communities.map((id) => id.toString());
  }

  let followingIds = toArrayParam(req.query.followingIds);
  if (!followingIds.length && Array.isArray(context?.friends)) {
    followingIds = context.friends.map((id) => id.toString());
  }

  const filter = buildFilter({
    timeframe: req.query.timeframe,
    tags,
    location: req.query.location || context?.country,
    communityIds,
    followingIds
  });

  const events = await queryEvents({
    filter,
    sort: { popularityScore: -1, startsAt: 1 },
    limit: req.query.limit,
    fallback: 6
  });
  res.json(events);
});

const getCommunityEvents = asyncHandler(async (req, res) => {
  const context = await fetchUserContext(req.user?.id);
  let communityIds = toArrayParam(req.query.communityIds);
  if (!communityIds.length && Array.isArray(context?.communities)) {
    communityIds = context.communities.map((id) => id.toString());
  }

  const filter = buildFilter({
    timeframe: req.query.timeframe,
    tags: toArrayParam(req.query.tags || req.query.interests),
    hostType: 'community',
    communityIds
  });

  const events = await queryEvents({
    filter,
    sort: { startsAt: 1 },
    limit: req.query.limit,
    fallback: 6
  });
  res.json(events);
});

const getUserEvents = asyncHandler(async (req, res) => {
  const context = await fetchUserContext(req.user?.id);
  let followingIds = toArrayParam(req.query.followingIds);
  if (!followingIds.length && Array.isArray(context?.friends)) {
    followingIds = context.friends.map((id) => id.toString());
  }
  if (context?._id) {
    followingIds = [...new Set([context._id.toString(), ...followingIds])];
  }

  const filter = buildFilter({
    timeframe: req.query.timeframe,
    tags: toArrayParam(req.query.tags || req.query.interests),
    hostType: 'user',
    followingIds
  });

  const events = await queryEvents({
    filter,
    sort: { startsAt: 1 },
    limit: req.query.limit,
    fallback: 6
  });
  res.json(events);
});

const getTrendingEvents = asyncHandler(async (req, res) => {
  const filter = buildFilter({ timeframe: req.query.timeframe, tags: toArrayParam(req.query.tags) });
  const events = await queryEvents({
    filter,
    sort: { popularityScore: -1, attendeeCount: -1, startsAt: 1 },
    limit: req.query.limit,
    fallback: 9
  });
  res.json(events);
});

const getNearbyEvents = asyncHandler(async (req, res) => {
  const context = await fetchUserContext(req.user?.id);
  const filter = buildFilter({
    timeframe: req.query.timeframe,
    tags: toArrayParam(req.query.tags || req.query.interests),
    location: req.query.location || context?.country
  });
  filter.isVirtual = { $ne: true };

  const events = await queryEvents({
    filter,
    sort: { startsAt: 1 },
    limit: req.query.limit,
    fallback: 6
  });
  res.json(events);
});

const createEvent = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user?.id)
    .select('name profileImage country communities')
    .lean();

  if (!user) {
    throw createHttpError('User context not found.', 404);
  }

  if (!req.body.title || !req.body.title.trim()) {
    throw createHttpError('Event title is required.');
  }
  if (!req.body.description || !req.body.description.trim()) {
    throw createHttpError('Event description is required.');
  }

  const startsAt = parseDate(req.body.startsAt, 'start date');
  if (!startsAt) {
    throw createHttpError('Start date is required.');
  }
  const endsAt = req.body.endsAt ? parseDate(req.body.endsAt, 'end date') : undefined;
  if (endsAt && endsAt < startsAt) {
    throw createHttpError('End date must be after start date.');
  }

  let hostType = ALLOWED_HOST_TYPES.includes(req.body.hostType) ? req.body.hostType : 'user';
  let communityDoc = null;
  const requestedCommunity = req.body.communityId || req.body.community;

  if (hostType === 'community' || requestedCommunity) {
    communityDoc = await Community.findOne({ _id: requestedCommunity, members: user._id }).select('name coverImage');
    if (!communityDoc) {
      throw createHttpError('Community not found or access denied.', 403);
    }
    hostType = 'community';
  }

  const tags = toArrayParam(req.body.tags).slice(0, 12);
  const capacity = req.body.capacity ? parsePositiveNumber(req.body.capacity) : undefined;

  const payload = {
    title: req.body.title.trim(),
    description: req.body.description.trim(),
    summary: req.body.summary?.trim() || undefined,
    location: req.body.location?.trim() || undefined,
    city: req.body.city?.trim() || undefined,
    country: req.body.country?.trim() || user.country || undefined,
    timezone: req.body.timezone?.trim() || undefined,
    isVirtual: Boolean(req.body.isVirtual),
    startsAt,
    endsAt,
    coverImage: req.body.coverImage?.trim() || undefined,
    tags,
    capacity,
    hostType,
    community: communityDoc?._id,
    organizer: buildOrganizer(user, communityDoc),
    createdBy: req.user.id,
    shareUrl: req.body.shareUrl?.trim() || undefined,
    source: req.body.source?.trim() || undefined
  };

  const event = await Event.create(payload);
  res.status(201).json(event);
});

module.exports = {
  listEvents,
  getRecommendedEvents,
  getCommunityEvents,
  getUserEvents,
  getTrendingEvents,
  getNearbyEvents,
  createEvent
};
