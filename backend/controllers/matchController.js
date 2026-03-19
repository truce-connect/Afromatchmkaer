const Match = require('../models/Match');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

const getMatches = asyncHandler(async (req, res) => {
  const matches = await Match.find({ participants: req.user.id })
    .sort({ updatedAt: -1 })
    .lean();

  const participantIds = [
    ...new Set(matches.flatMap((match) => match.participants.map((id) => id.toString())))
  ];

  const profiles = await User.find({ _id: { $in: participantIds } });
  const profileMap = profiles.reduce((acc, profile) => {
    acc[profile._id] = profile;
    return acc;
  }, {});

  const formatted = matches.map((match) => {
    const otherParticipant = match.participants.find((id) => id.toString() !== req.user.id);
    const profile = profileMap[otherParticipant];
    const sanitizedProfile = profile ? profile.toObject() : null;
    if (sanitizedProfile) {
      delete sanitizedProfile.password;
    }

    return {
      ...match,
      profile: sanitizedProfile
    };
  });

  res.json(formatted);
});

module.exports = { getMatches };
