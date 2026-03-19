const jwt = require('jsonwebtoken');

const generateToken = (payload, options = {}) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('Missing JWT_SECRET environment variable.');
  }

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || process.env.JWT_EXPIRES_IN || '15m',
    ...options
  });
};

module.exports = generateToken;
