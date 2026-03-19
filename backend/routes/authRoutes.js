const express = require('express');
const { body, query } = require('express-validator');
const passport = require('../config/passport');
const {
  register,
  resendOtp,
  verifyOtp,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  checkUsername,
  initiateTwoFactorSetup,
  verifyTwoFactorSetup,
  disableTwoFactor,
  oauthCallback,
  changePassword
} = require('../controllers/authController');
const rateLimiter = require('../middleware/rateLimiter');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post(
  '/register',
  rateLimiter,
  [
    body('name').notEmpty().withMessage('Name is required.'),
    body('username').notEmpty().withMessage('Username is required.'),
    body('email').isEmail().withMessage('Valid email is required.'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
    body('age').optional().isInt({ min: 18, max: 90 }).withMessage('Age must be between 18 and 90.'),
    body('gender').optional().isString(),
    body('country').notEmpty().withMessage('Country is required.'),
    body('address').optional().isString(),
    body('diaspora').optional().isBoolean(),
    body('interests').isArray({ min: 1 }).withMessage('Add at least one hobby/interest.'),
    body('interests.*').isString().withMessage('Interests must be strings.'),
    body('profileImage').optional().isString(),
    body('gallery').optional().isArray({ max: 6 }).withMessage('Up to 6 gallery images allowed.'),
    body('gallery.*').isString().withMessage('Gallery entries must be strings.')
  ],
  register
);

router.post(
  '/login',
  rateLimiter,
  [body('email').isEmail(), body('password').notEmpty(), body('twoFactorCode').optional().isString()],
  login
);

router.post(
  '/verify-otp',
  rateLimiter,
  [body('email').isEmail(), body('code').isLength({ min: 6, max: 6 })],
  verifyOtp
);

router.post(
  '/resend-otp',
  rateLimiter,
  [body('email').isEmail().withMessage('Valid email is required.')],
  resendOtp
);

router.post('/refresh-token', refreshToken);

router.post('/logout', logout);

router.post(
  '/forgot-password',
  rateLimiter,
  [body('email').isEmail().withMessage('Valid email is required.')],
  forgotPassword
);

router.post(
  '/reset-password',
  rateLimiter,
  [
    body('token').notEmpty().withMessage('Reset token is required.'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
  ],
  resetPassword
);

router.put(
  '/change-password',
  authMiddleware,
  [
    body('currentPassword').isLength({ min: 8 }).withMessage('Current password is required.'),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters.')
  ],
  changePassword
);

router.get('/check-username', [query('username').notEmpty().withMessage('username is required')], checkUsername);

router.post('/2fa/setup', authMiddleware, initiateTwoFactorSetup);

router.post(
  '/2fa/verify',
  authMiddleware,
  [body('token').isLength({ min: 6, max: 6 }).withMessage('Valid token is required.')],
  verifyTwoFactorSetup
);

router.post(
  '/2fa/disable',
  authMiddleware,
  [body('token').isLength({ min: 6, max: 6 }).withMessage('Valid token is required.')],
  disableTwoFactor
);

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  router.get('/oauth/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
  router.get(
    '/oauth/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: (process.env.WEB_APP_URL || 'http://localhost:3000') + '/login?error=google' }),
    oauthCallback('google')
  );
}

if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  router.get('/oauth/facebook', passport.authenticate('facebook', { scope: ['email'], session: false }));
  router.get(
    '/oauth/facebook/callback',
    passport.authenticate('facebook', { session: false, failureRedirect: (process.env.WEB_APP_URL || 'http://localhost:3000') + '/login?error=facebook' }),
    oauthCallback('facebook')
  );
}

if (process.env.APPLE_CLIENT_ID && process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID && process.env.APPLE_PRIVATE_KEY) {
  router.post(
    '/oauth/apple',
    passport.authenticate('apple', { scope: ['name', 'email'], session: false }),
    oauthCallback('apple')
  );
}

module.exports = router;
