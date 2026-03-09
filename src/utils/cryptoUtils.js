const crypto = require('crypto');
const config = require('../config');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Get encryption key from config (must be 32 bytes for AES-256)
 * @returns {Buffer} 32-byte key
 */
function getEncryptionKey() {
  const key = config.tokenEncryptionKey;
  // Hash the key to ensure it's exactly 32 bytes
  return crypto.createHash('sha256').update(key).digest();
}

/**
 * Encrypt a string using AES-256-GCM
 * @param {string} plaintext - Text to encrypt
 * @returns {Object} { encrypted, iv, authTag } - all base64 encoded
 */
function encrypt(plaintext) {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  const authTag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
  };
}

/**
 * Decrypt a string using AES-256-GCM
 * @param {string} encrypted - Base64 encrypted text
 * @param {string} iv - Base64 initialization vector
 * @param {string} authTag - Base64 authentication tag
 * @returns {string} Decrypted plaintext
 * @throws {Error} If decryption fails
 */
function decrypt(encrypted, iv, authTag) {
  const key = getEncryptionKey();
  const ivBuffer = Buffer.from(iv, 'base64');
  const authTagBuffer = Buffer.from(authTag, 'base64');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, ivBuffer);
  decipher.setAuthTag(authTagBuffer);

  let decrypted = decipher.update(encrypted, 'base64', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Encrypt tokens for storage (combines encrypted data into single string)
 * @param {string} token - Token to encrypt
 * @returns {string} Combined encrypted string (iv:authTag:encrypted)
 */
function encryptToken(token) {
  const { encrypted, iv, authTag } = encrypt(token);
  return `${iv}:${authTag}:${encrypted}`;
}

/**
 * Decrypt a stored token
 * @param {string} encryptedToken - Combined encrypted string
 * @returns {string} Decrypted token
 */
function decryptToken(encryptedToken) {
  const [iv, authTag, encrypted] = encryptedToken.split(':');
  return decrypt(encrypted, iv, authTag);
}

/**
 * Hash a string using SHA-256
 * @param {string} input - String to hash
 * @returns {string} Hex-encoded hash
 */
function hash(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

module.exports = {
  encrypt,
  decrypt,
  encryptToken,
  decryptToken,
  hash,
};
