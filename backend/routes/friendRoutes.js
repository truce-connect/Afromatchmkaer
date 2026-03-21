const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { sendFriendRequest, respondToFriendRequest, listFriends, listPendingRequests } = require('../controllers/friendController');

const router = express.Router();

router.use(authMiddleware);
router.get('/', listFriends);
router.get('/requests/pending', listPendingRequests);
router.post('/request', sendFriendRequest);
router.post('/request/respond', respondToFriendRequest);

module.exports = router;
