const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Generate an access token
 * @param {Object} payload - Token payload { sub, mode, challongeUserId }
 * @returns {string} Signed JWT token
 */
function generateAccessToken(payload) {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

/**
 * Generate a refresh token
 * @param {Object} payload - Token payload { sub, sessionId }
 * @returns {string} Signed JWT refresh token
 */
function generateRefreshToken(payload) {
  return jwt.sign(payload, config.jwtRefreshSecret, {
    expiresIn: config.jwtRefreshExpiresIn,
  });
}

/**
 * Verify an access token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
function verifyAccessToken(token) {
  return jwt.verify(token, config.jwtSecret);
}

/**
 * Verify a refresh token
 * @param {string} token - JWT refresh token to verify
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
function verifyRefreshToken(token) {
  return jwt.verify(token, config.jwtRefreshSecret);
}

/**
 * Decode a token without verification (for inspection)
 * @param {string} token - JWT token
 * @returns {Object|null} Decoded payload or null
 */
function decodeToken(token) {
  return jwt.decode(token);
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
};
