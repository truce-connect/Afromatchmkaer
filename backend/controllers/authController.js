const jwt = require('jsonwebtoken');
const ms = require('ms');
const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

const isProduction = process.env.NODE_ENV === 'production';
const ACCESS_TTL = process.env.JWT_ACCESS_EXPIRES || '30m';
const REFRESH_TTL = process.env.JWT_REFRESH_EXPIRES || '7d';

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'strict',
  path: '/'
};

const sanitizeUser = (userDoc) => {
  if (!userDoc) return null;
  const user = userDoc.toObject ? userDoc.toObject() : userDoc;
  delete user.password;
  return user;
};

const normalizeStringArray = (value) => {
  if (Array.isArray(value)) {
    return value.filter(Boolean).map((item) => String(item).trim());
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const issueTokens = (userId) => {
  const accessToken = generateToken({ id: userId }, { expiresIn: ACCESS_TTL });
  const refreshToken = generateToken({ id: userId, type: 'refresh' }, { expiresIn: REFRESH_TTL });
  return { accessToken, refreshToken };
};

const attachCookie = (res, name, ttl, token) => {
  if (!token) return;
  res.cookie(name, token, {
    ...cookieOptions,
    maxAge: ms(ttl)
  });
};

const clearAuthCookies = (res) => {
  res.clearCookie('afr_access', cookieOptions);
  res.clearCookie('afr_refresh', cookieOptions);
};

const register = asyncHandler(async (req, res) => {
  const { name, username, email, password, age, gender, country, address, phone, preferredGender, diaspora, interests, profileImage, gallery } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existingEmail = await User.findOne({ email: normalizedEmail });
  if (existingEmail) {
    return res.status(409).json({ message: 'Email already registered.' });
  }

  let normalizedUsername = null;
  if (username) {
    normalizedUsername = username.trim().toLowerCase();
    const existingUsername = await User.findOne({ username: normalizedUsername });
    if (existingUsername) {
      return res.status(409).json({ message: 'Username already taken.' });
    }
  }

  const normalizedInterests = normalizeStringArray(interests);
  const normalizedGallery = normalizeStringArray(gallery);
  if (profileImage && !normalizedGallery.includes(profileImage)) {
    normalizedGallery.unshift(profileImage);
  }

  const user = await User.create({
    name: name.trim(),
    username: normalizedUsername,
    email: normalizedEmail,
    password,
    age,
    gender,
    country,
    address,
    phone,
    preferredGender: preferredGender || 'both',
    diaspora,
    interests: normalizedInterests,
    profileImage,
    gallery: normalizedGallery
  });

  const tokens = issueTokens(user._id);
  attachCookie(res, 'afr_refresh', REFRESH_TTL, tokens.refreshToken);
  attachCookie(res, 'afr_access', ACCESS_TTL, tokens.accessToken);

  res.status(201).json({
    message: 'Account created successfully.',
    accessToken: tokens.accessToken,
    user: sanitizeUser(user)
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  user.lastActiveAt = new Date();
  await user.save();

  const tokens = issueTokens(user._id);
  attachCookie(res, 'afr_refresh', REFRESH_TTL, tokens.refreshToken);
  attachCookie(res, 'afr_access', ACCESS_TTL, tokens.accessToken);

  res.json({ accessToken: tokens.accessToken, user: sanitizeUser(user) });
});

const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.afr_refresh || req.body?.refreshToken;
  if (!token) {
    return res.status(401).json({ message: 'Refresh token missing.' });
  }

  // Clear the incoming refresh token cookie immediately (rotation)
  res.clearCookie('afr_refresh', cookieOptions);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.type !== 'refresh') {
      return res.status(401).json({ message: 'Invalid refresh token.' });
    }

    const user = await User.findById(payload.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Issue brand new tokens (old refresh token is already cleared above)
    const tokens = issueTokens(user._id);
    attachCookie(res, 'afr_refresh', REFRESH_TTL, tokens.refreshToken);
    attachCookie(res, 'afr_access', ACCESS_TTL, tokens.accessToken);
    res.json({ accessToken: tokens.accessToken });
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired refresh token.' });
  }
});

const logout = asyncHandler(async (_req, res) => {
  clearAuthCookies(res);
  res.json({ message: 'Logged out successfully.' });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current and new passwords are required.' });
  }

  const user = await User.findById(req.user.id).select('+password');
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  const matches = await user.comparePassword(currentPassword);
  if (!matches) {
    return res.status(400).json({ message: 'Current password is incorrect.' });
  }

  if (currentPassword === newPassword) {
    return res.status(400).json({ message: 'New password must be different.' });
  }

  user.password = newPassword;
  await user.save();

  res.json({ message: 'Password updated successfully.' });
});

const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }
  res.json(sanitizeUser(user));
});

const featureUnavailable = (label) =>
  asyncHandler(async (_req, res) => {
    res.status(501).json({ message: `${label} is not available yet.` });
  });

const resendOtp = featureUnavailable('OTP resend');
const verifyOtp = featureUnavailable('OTP verification');
const forgotPassword = featureUnavailable('Password recovery');
const resetPassword = featureUnavailable('Password reset');
const initiateTwoFactorSetup = featureUnavailable('Two-factor setup');
const verifyTwoFactorSetup = featureUnavailable('Two-factor verification');
const disableTwoFactor = featureUnavailable('Two-factor disable');

const checkUsername = asyncHandler(async (req, res) => {
  const username = req.query.username?.toLowerCase();
  if (!username) {
    return res.status(400).json({ message: 'Username is required.' });
  }
  const exists = await User.exists({ username });
  res.json({ available: !exists });
});

const oauthCallback = (provider) =>
  asyncHandler(async (_req, res) => {
    res.status(501).json({ message: `${provider} login is not available yet.` });
  });

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  resendOtp,
  verifyOtp,
  forgotPassword,
  resetPassword,
  checkUsername,
  initiateTwoFactorSetup,
  verifyTwoFactorSetup,
  disableTwoFactor,
  oauthCallback,
  me,
  changePassword
};
