const express = require('express');
const {
  listEvents,
  getRecommendedEvents,
  getCommunityEvents,
  getUserEvents,
  getTrendingEvents,
  getNearbyEvents,
  createEvent
} = require('../controllers/eventController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', listEvents);
router.get('/recommended', getRecommendedEvents);
router.get('/community', getCommunityEvents);
router.get('/user', getUserEvents);
router.get('/trending', getTrendingEvents);
router.get('/nearby', getNearbyEvents);
router.post('/', createEvent);

module.exports = router;
