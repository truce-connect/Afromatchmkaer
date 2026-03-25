const asyncHandler = require('../utils/asyncHandler');
const Ad = require('../models/Ad');

// GET /api/ads — public: return all active ads (for the popup)
const getActiveAds = asyncHandler(async (_req, res) => {
  const ads = await Ad.find({ active: true }).sort({ createdAt: -1 }).lean();
  return res.json({ ads });
});

// GET /api/ads/all — admin: return all ads including inactive
const getAllAds = asyncHandler(async (_req, res) => {
  const ads = await Ad.find().sort({ createdAt: -1 }).lean();
  return res.json({ ads });
});

// POST /api/ads — admin: create a new ad
const createAd = asyncHandler(async (req, res) => {
  const { title, imageUrl, linkUrl } = req.body;
  if (!title || !imageUrl) {
    return res.status(400).json({ message: 'Title and image are required.' });
  }
  const ad = await Ad.create({ title, imageUrl, linkUrl: linkUrl || null, createdBy: req.user.id });
  return res.status(201).json({ ad });
});

// PATCH /api/ads/:id — admin: toggle active or update fields
const updateAd = asyncHandler(async (req, res) => {
  const ad = await Ad.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!ad) return res.status(404).json({ message: 'Ad not found.' });
  return res.json({ ad });
});

// DELETE /api/ads/:id — admin: delete an ad
const deleteAd = asyncHandler(async (req, res) => {
  const ad = await Ad.findByIdAndDelete(req.params.id);
  if (!ad) return res.status(404).json({ message: 'Ad not found.' });
  return res.json({ message: 'Ad deleted.' });
});

module.exports = { getActiveAds, getAllAds, createAd, updateAd, deleteAd };
