const jwt = require("jsonwebtoken");
const crypto = require("crypto");

/**
 * Generate JWT token
 * @param {String} userId - User ID to include in token
 * @returns {String} - JWT token
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

/**
 * Generate random token for verification/reset
 * @returns {String} - Random token
 */
const generateRandomToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

/**
 * Hash a token
 * @param {String} token - Token to hash
 * @returns {String} - Hashed token
 */
const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

module.exports = {
  generateToken,
  generateRandomToken,
  hashToken,
};
