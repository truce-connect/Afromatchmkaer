const asyncHandler = require('../utils/asyncHandler');
const FriendRequest = require('../models/FriendRequest');
const User = require('../models/User');
const Match = require('../models/Match');
const { createNotification } = require('../utils/notificationService');

const sendFriendRequest = asyncHandler(async (req, res) => {
  const { targetUserId } = req.body;

  if (!targetUserId) {
    return res.status(400).json({ message: 'targetUserId is required.' });
  }

  if (targetUserId === req.user.id) {
    return res.status(400).json({ message: 'You cannot send a friend request to yourself.' });
  }

  const targetUser = await User.findById(targetUserId);
  if (!targetUser) {
    return res.status(404).json({ message: 'User not found.' });
  }

  const alreadyFriends = await User.exists({ _id: req.user.id, friends: targetUserId });
  if (alreadyFriends) {
    return res.status(409).json({ message: 'You are already connected.' });
  }

  const request = await FriendRequest.findOneAndUpdate(
    { sender: req.user.id, receiver: targetUserId },
    { status: 'pending' },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  ).lean();

  await createNotification({
    user: targetUserId,
    actor: req.user.id,
    type: 'friend_request',
    message: 'You have a new friend request',
    metadata: { requestId: request._id.toString() }
  });

  res.status(201).json({ message: 'Friend request sent.', requestId: request._id });
});

const respondToFriendRequest = asyncHandler(async (req, res) => {
  const { requestId, action } = req.body;
  if (!requestId || !['accept', 'reject'].includes(action)) {
    return res.status(400).json({ message: 'requestId and valid action are required.' });
  }

  const friendRequest = await FriendRequest.findById(requestId);
  if (!friendRequest || friendRequest.receiver.toString() !== req.user.id) {
    return res.status(404).json({ message: 'Friend request not found.' });
  }

  if (friendRequest.status !== 'pending') {
    return res.status(400).json({ message: 'Request has already been processed.' });
  }

  friendRequest.status = action === 'accept' ? 'accepted' : 'rejected';
  await friendRequest.save();

  if (action === 'accept') {
    await Promise.all([
      User.findByIdAndUpdate(friendRequest.receiver, { $addToSet: { friends: friendRequest.sender } }),
      User.findByIdAndUpdate(friendRequest.sender, { $addToSet: { friends: friendRequest.receiver } })
    ]);

    // Create a Match/conversation record so both users can message each other.
    // Use a stable conversationId derived from both user IDs (sorted) to avoid duplicates.
    const ids = [friendRequest.sender.toString(), friendRequest.receiver.toString()].sort();
    const stableConversationId = `conv_${ids[0]}_${ids[1]}`;
    await Match.findOneAndUpdate(
      { conversationId: stableConversationId },
      { conversationId: stableConversationId, participants: ids },
      { upsert: true, setDefaultsOnInsert: true }
    );

    await createNotification({
      user: friendRequest.sender,
      actor: req.user.id,
      type: 'friend_accept',
      message: 'Your friend request was accepted',
      metadata: { requestId: friendRequest._id.toString() }
    });
  }

  res.json({ message: `Friend request ${action}ed.` });
});

const listFriends = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id)
    .populate('friends', 'name profileImage country bio')
    .lean();
  res.json({ friends: user?.friends || [] });
});

const listPendingRequests = asyncHandler(async (req, res) => {
  const requests = await FriendRequest.find({ receiver: req.user.id, status: 'pending' })
    .populate('sender', 'name profileImage country')
    .sort({ createdAt: -1 })
    .lean();
  res.json({ requests });
});

module.exports = { sendFriendRequest, respondToFriendRequest, listFriends, listPendingRequests };
