const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead
} = require('../controllers/notificationController');

const router = express.Router();

router.use(authMiddleware);

router.get('/', getNotifications);
router.put('/read-all', markAllNotificationsRead);
router.put('/read/:id', markNotificationRead);

module.exports = router;
