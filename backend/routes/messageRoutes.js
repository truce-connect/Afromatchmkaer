const express = require('express');
const { body } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const { createMessage, getConversation } = require('../controllers/messageController');

const router = express.Router();

router.use(authMiddleware);

router.post(
  '/',
  [
    body('conversationId').notEmpty().withMessage('conversationId is required.'),
    body('recipientId').notEmpty().withMessage('recipientId is required.'),
    body('body').optional().isLength({ min: 1, max: 1000 }).withMessage('Message body must be between 1 and 1000 characters.'),
    body('attachments').optional().isArray({ max: 5 }).withMessage('Up to 5 attachments allowed.'),
    body('attachments.*.url').optional().isString().withMessage('Attachment url is required.'),
    body('attachments.*.type')
      .optional()
      .isIn(['image', 'video', 'document'])
      .withMessage('Attachment type must be image, video, or document.'),
    body('attachments.*.mimetype').optional().isString(),
    body('attachments.*.size').optional().isInt({ min: 0 }),
    body('attachments.*.originalName').optional().isString()
  ],
  createMessage
);

router.get('/:conversationId', getConversation);

module.exports = router;
