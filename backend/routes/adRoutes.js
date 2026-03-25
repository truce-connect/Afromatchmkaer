const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const { getActiveAds, getAllAds, createAd, updateAd, deleteAd } = require('../controllers/adController');

const router = express.Router();

// Public — any visitor can fetch active ads to display
router.get('/', getActiveAds);

// Admin only
router.get('/all', authMiddleware, adminMiddleware, getAllAds);
router.post('/', authMiddleware, adminMiddleware, createAd);
router.patch('/:id', authMiddleware, adminMiddleware, updateAd);
router.delete('/:id', authMiddleware, adminMiddleware, deleteAd);

module.exports = router;
