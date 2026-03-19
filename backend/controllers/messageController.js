const { validationResult } = require('express-validator');
const Message = require('../models/Message');
const Match = require('../models/Match');
const asyncHandler = require('../utils/asyncHandler');
const { createNotification } = require('../utils/notificationService');

const ATTACHMENT_TYPES = new Set(['image', 'video', 'document']);

const createMessage = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed');
    error.statusCode = 422;
    error.details = errors.array();
    throw error;
  }

  const { conversationId, recipientId, body } = req.body;
  const attachments = Array.isArray(req.body.attachments)
    ? req.body.attachments
        .filter((item) => item && typeof item.url === 'string' && item.url.trim())
        .map((item) => ({
          url: item.url.trim(),
          type: ATTACHMENT_TYPES.has(item.type) ? item.type : 'document',
          mimetype: typeof item.mimetype === 'string' ? item.mimetype : undefined,
          size: typeof item.size === 'number' ? item.size : undefined,
          originalName: typeof item.originalName === 'string' ? item.originalName : undefined
        }))
    : [];
  const trimmedBody = typeof body === 'string' ? body.trim() : '';

  if (!trimmedBody && attachments.length === 0) {
    return res.status(400).json({ message: 'Send a message or include an attachment.' });
  }

  const match = await Match.findOne({ conversationId, participants: req.user.id });
  if (!match) {
    return res.status(403).json({ message: 'You do not have access to this conversation.' });
  }

  const message = await Message.create({
    conversationId,
    sender: req.user.id,
    recipient: recipientId,
    body: trimmedBody,
    attachments
  });

  match.lastMessageAt = message.createdAt;
  await match.save();

  if (recipientId && recipientId !== req.user.id) {
    await createNotification({
      user: recipientId,
      actor: req.user.id,
      type: 'new_message',
      message: 'You have a new message',
      metadata: {
        conversationId,
        messageId: message._id.toString()
      }
    });
  }

  res.status(201).json(message);
});

const getConversation = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;

  const match = await Match.findOne({ conversationId, participants: req.user.id });
  if (!match) {
    return res.status(403).json({ message: 'You do not have access to this conversation.' });
  }

  const messages = await Message.find({ conversationId }).sort({ createdAt: 1 });
  res.json(messages);
});

module.exports = { createMessage, getConversation };
