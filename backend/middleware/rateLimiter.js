const rateLimit = require('express-rate-limit');

const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX || 200),
  message: 'Too many requests. Please try again later.'
});

// Strict limiter for auth endpoints (login, register, forgot-password)
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many attempts. Please try again in 15 minutes.',
  skipSuccessfulRequests: true
});

module.exports = apiRateLimiter;
module.exports.authRateLimiter = authRateLimiter;
