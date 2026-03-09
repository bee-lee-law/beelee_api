const cryptoUtils = require('../../utils/cryptoUtils');
const dynamoService = require('../aws/dynamoService');

class TokenService {
  constructor() {
    // Token service handles encryption/decryption and storage of OAuth tokens
  }

  /**
   * Encrypt and store OAuth tokens for a user
   * @param {string} userId - Challonge user ID or 'owner'
   * @param {Object} tokens - { accessToken, refreshToken, expiresIn, scopes }
   */
  async storeTokens(userId, tokens) {
    const encryptedAccess = cryptoUtils.encryptToken(tokens.accessToken);
    const encryptedRefresh = tokens.refreshToken
      ? cryptoUtils.encryptToken(tokens.refreshToken)
      : null;

    const tokenData = {
      access_token_encrypted: encryptedAccess,
      refresh_token_encrypted: encryptedRefresh,
      scopes: tokens.scopes || '',
      expires_at: tokens.expiresIn
        ? Date.now() + tokens.expiresIn * 1000
        : null,
      created_at: Date.now(),
    };

    await dynamoService.storeOAuthTokens(userId, tokenData);
  }

  /**
   * Retrieve and decrypt OAuth tokens for a user
   * @param {string} userId - Challonge user ID or 'owner'
   * @returns {Object|null} { accessToken, refreshToken, expiresAt, scopes } or null
   */
  async getTokens(userId) {
    const tokenData = await dynamoService.getOAuthTokens(userId);

    if (!tokenData) {
      return null;
    }

    try {
      const accessToken = cryptoUtils.decryptToken(
        tokenData.access_token_encrypted
      );
      const refreshToken = tokenData.refresh_token_encrypted
        ? cryptoUtils.decryptToken(tokenData.refresh_token_encrypted)
        : null;

      return {
        accessToken,
        refreshToken,
        expiresAt: tokenData.expires_at,
        scopes: tokenData.scopes,
      };
    } catch (error) {
      console.error('Error decrypting tokens:', error.message);
      return null;
    }
  }

  /**
   * Check if stored tokens are expired
   * @param {string} userId - Challonge user ID or 'owner'
   * @returns {boolean} True if tokens exist and are expired
   */
  async areTokensExpired(userId) {
    const tokens = await this.getTokens(userId);
    if (!tokens || !tokens.expiresAt) {
      return true;
    }
    // Consider expired if within 5 minutes of expiry
    return Date.now() > tokens.expiresAt - 5 * 60 * 1000;
  }

  /**
   * Update tokens after a refresh
   * @param {string} userId - Challonge user ID or 'owner'
   * @param {Object} tokens - New tokens from refresh
   */
  async updateTokens(userId, tokens) {
    const encryptedAccess = cryptoUtils.encryptToken(tokens.accessToken);
    const encryptedRefresh = tokens.refreshToken
      ? cryptoUtils.encryptToken(tokens.refreshToken)
      : null;

    await dynamoService.updateOAuthTokens(userId, {
      access_token_encrypted: encryptedAccess,
      refresh_token_encrypted: encryptedRefresh,
      token_iv: '', // Not used in combined format
      expires_at: tokens.expiresIn
        ? Date.now() + tokens.expiresIn * 1000
        : null,
    });
  }

  /**
   * Delete stored tokens for a user
   * @param {string} userId - Challonge user ID or 'owner'
   */
  async deleteTokens(userId) {
    await dynamoService.deleteOAuthTokens(userId);
  }
}

module.exports = new TokenService();
