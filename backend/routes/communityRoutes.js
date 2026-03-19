const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const {
  listCommunities,
  createCommunity,
  joinCommunity,
  getCommunityById,
  inviteToCommunity
} = require('../controllers/communityController');

const router = express.Router();

router.use(authMiddleware);

router.get('/', listCommunities);
router.post('/create', createCommunity);
router.post('/join', joinCommunity);
router.post('/invite', inviteToCommunity);
router.get('/:communityId', getCommunityById);

module.exports = router;
