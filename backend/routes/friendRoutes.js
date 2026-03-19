const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { sendFriendRequest, respondToFriendRequest } = require('../controllers/friendController');

const router = express.Router();

router.use(authMiddleware);
router.post('/request', sendFriendRequest);
router.post('/request/respond', respondToFriendRequest);

module.exports = router;
