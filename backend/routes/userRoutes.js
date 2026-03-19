const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const {
	discoverUsers,
	getUserMatches,
	getUserById,
	getCurrentUser,
	updateProfile,
	reportUser,
	deleteAccount
} = require('../controllers/userController');

const router = express.Router();

router.use(authMiddleware);

router.get('/discover', discoverUsers);
router.get('/matches', getUserMatches);
router.get('/me', getCurrentUser);
router.patch('/me', updateProfile);
router.put('/update', updateProfile);
router.post('/report', reportUser);
router.delete('/delete', deleteAccount);
router.get('/:id', getUserById);

module.exports = router;
