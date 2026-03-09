const { v4: uuidv4 } = require('uuid');
const jwtUtils = require('../../utils/jwtUtils');
const cryptoUtils = require('../../utils/cryptoUtils');
const dynamoService = require('../aws/dynamoService');

class SessionService {
  constructor() {
    // Session service manages user sessions and JWT tokens
  }

  /**
   * Create a new session
   * @param {Object} params - { mode, challongeUserId, ipAddress, userAgent }
   * @returns {Object} { accessToken, refreshToken, session }
   */
  async createSession({ mode, challongeUserId = null, ipAddress, userAgent }) {
    const sessionId = uuidv4();

    // Generate tokens
    const accessToken = jwtUtils.generateAccessToken({
      sub: challongeUserId || mode,
      mode,
      challongeUserId,
      sessionId,
    });

    const refreshToken = jwtUtils.generateRefreshToken({
      sub: sessionId,
      sessionId,
    });

    // Store session in DynamoDB
    const session = {
      session_id: sessionId,
      mode,
      challonge_user_id: challongeUserId,
      refresh_token_hash: cryptoUtils.hash(refreshToken),
      ip_address: ipAddress,
      user_agent: userAgent,
      last_accessed: Date.now(),
      expires_at: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days (TTL)
    };

    await dynamoService.createSession(session);

    return {
      accessToken,
      refreshToken,
      session,
    };
  }

  /**
   * Get session by ID
   * @param {string} sessionId
   * @returns {Object|null} Session data or null
   */
  async getSession(sessionId) {
    return dynamoService.getSession(sessionId);
  }

  /**
   * Validate a session exists and is not expired
   * @param {string} sessionId
   * @returns {Object|null} Session if valid, null otherwise
   */
  async validateSession(sessionId) {
    const session = await this.getSession(sessionId);

    if (!session) {
      return null;
    }

    // Check if expired
    if (session.expires_at && Date.now() > session.expires_at) {
      await this.deleteSession(sessionId);
      return null;
    }

    // Update last accessed
    await dynamoService.touchSession(sessionId);

    return session;
  }

  /**
   * Refresh an access token using a refresh token
   * @param {string} refreshToken - The refresh token
   * @returns {Object} { accessToken, session } or throws error
   */
  async refreshAccessToken(refreshToken) {
    // Verify refresh token
    let decoded;
    try {
      decoded = jwtUtils.verifyRefreshToken(refreshToken);
    } catch (error) {
      throw new Error('Invalid refresh token');
    }

    // Get session
    const session = await this.getSession(decoded.sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Verify refresh token hash matches
    const tokenHash = cryptoUtils.hash(refreshToken);
    if (tokenHash !== session.refresh_token_hash) {
      throw new Error('Refresh token mismatch');
    }

    // Generate new access token
    const accessToken = jwtUtils.generateAccessToken({
      sub: session.challonge_user_id || session.mode,
      mode: session.mode,
      challongeUserId: session.challonge_user_id,
      sessionId: session.session_id,
    });

    return {
      accessToken,
      session,
    };
  }

  /**
   * Delete a session (logout)
   * @param {string} sessionId
   */
  async deleteSession(sessionId) {
    await dynamoService.deleteSession(sessionId);
  }

  /**
   * Get session info for API response (sanitized)
   * @param {Object} session - Raw session from DB
   * @returns {Object} Sanitized session info
   */
  getSessionInfo(session) {
    return {
      mode: session.mode,
      challongeUserId: session.challonge_user_id,
      createdAt: session.created_at,
      lastAccessed: session.last_accessed,
    };
  }
}

module.exports = new SessionService();
