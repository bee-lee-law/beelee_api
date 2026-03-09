const bcrypt = require('bcryptjs');
const axios = require('axios');
const config = require('../../config');
const sessionService = require('./sessionService');
const tokenService = require('./tokenService');

class AuthService {
  constructor() {
    this.challongeAuthUrl = config.challonge.authBaseUrl;
    this.challongeApiUrl = config.challonge.apiBaseUrl;
    this.clientId = config.challonge.clientId;
    this.clientSecret = config.challonge.clientSecret;
    this.redirectUri = config.challonge.redirectUri;
  }

  // ============ Sandbox Mode ============

  /**
   * Initialize a sandbox session
   * @param {Object} requestInfo - { ipAddress, userAgent }
   * @returns {Object} { accessToken, refreshToken }
   */
  async initSandbox({ ipAddress, userAgent }) {
    const { accessToken, refreshToken } = await sessionService.createSession({
      mode: 'sandbox',
      challongeUserId: null,
      ipAddress,
      userAgent,
    });

    return { accessToken, refreshToken };
  }

  // ============ Owner Mode ============

  /**
   * Authenticate owner mode with password
   * @param {string} password - Owner password
   * @param {Object} requestInfo - { ipAddress, userAgent }
   * @returns {Object} { accessToken, refreshToken }
   */
  async authenticateOwner(password, { ipAddress, userAgent }) {
    // Verify password
    const passwordHash = config.ownerPasswordHash;

    if (!passwordHash) {
      throw new Error('Owner mode not configured');
    }

    const isValid = await bcrypt.compare(password, passwordHash);
    if (!isValid) {
      throw new Error('Invalid password');
    }

    // Check if owner tokens exist
    const ownerTokens = await tokenService.getTokens('owner');
    if (!ownerTokens) {
      throw new Error('Owner Challonge tokens not configured');
    }

    // Create session
    const { accessToken, refreshToken } = await sessionService.createSession({
      mode: 'owner',
      challongeUserId: 'owner',
      ipAddress,
      userAgent,
    });

    return { accessToken, refreshToken };
  }

  // ============ OAuth Mode ============

  /**
   * Generate Challonge OAuth authorization URL
   * @param {string} state - CSRF protection state
   * @returns {string} Authorization URL
   */
  getAuthorizationUrl(state) {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: 'me tournaments:read tournaments:write',
      state,
    });

    return `${this.challongeAuthUrl}/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   * @param {string} code - Authorization code from callback
   * @returns {Object} { accessToken, refreshToken, expiresIn }
   */
  async exchangeCodeForTokens(code) {
    try {
      const response = await axios.post(
        `${this.challongeAuthUrl}/token`,
        new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          client_id: this.clientId,
          client_secret: this.clientSecret,
          redirect_uri: this.redirectUri,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in,
        scopes: response.data.scope,
      };
    } catch (error) {
      console.error('OAuth token exchange error:', error.response?.data || error.message);
      throw new Error('Failed to exchange authorization code');
    }
  }

  /**
   * Get user info from Challonge
   * @param {string} accessToken - Challonge access token
   * @returns {Object} User info
   */
  async getChallongeUser(accessToken) {
    try {
      const response = await axios.get(`${this.challongeApiUrl}/me.json`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Authorization-Type': 'v2',
          'Content-Type': 'application/vnd.api+json',
          Accept: 'application/json',
        },
      });

      return response.data.data;
    } catch (error) {
      console.error('Get Challonge user error:', error.response?.data || error.message);
      throw new Error('Failed to get user info from Challonge');
    }
  }

  /**
   * Complete OAuth flow - exchange code, get user, create session
   * @param {string} code - Authorization code
   * @param {Object} requestInfo - { ipAddress, userAgent }
   * @returns {Object} { accessToken, refreshToken, user }
   */
  async completeOAuthFlow(code, { ipAddress, userAgent }) {
    // Exchange code for Challonge tokens
    const challongeTokens = await this.exchangeCodeForTokens(code);

    // Get user info
    const user = await this.getChallongeUser(challongeTokens.accessToken);
    const userId = user.id;

    // Store Challonge tokens encrypted
    await tokenService.storeTokens(userId, challongeTokens);

    // Create session with our JWT
    const { accessToken, refreshToken } = await sessionService.createSession({
      mode: 'user',
      challongeUserId: userId,
      ipAddress,
      userAgent,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: userId,
        username: user.attributes?.username,
        email: user.attributes?.email,
      },
    };
  }

  /**
   * Refresh Challonge tokens using refresh token
   * @param {string} userId - Challonge user ID or 'owner'
   * @returns {Object} New tokens
   */
  async refreshChallongeTokens(userId) {
    const tokens = await tokenService.getTokens(userId);

    if (!tokens || !tokens.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await axios.post(
        `${this.challongeAuthUrl}/token`,
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: tokens.refreshToken,
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const newTokens = {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token || tokens.refreshToken,
        expiresIn: response.data.expires_in,
      };

      await tokenService.updateTokens(userId, newTokens);

      return newTokens;
    } catch (error) {
      console.error('Token refresh error:', error.response?.data || error.message);
      throw new Error('Failed to refresh Challonge tokens');
    }
  }

  // ============ Session Management ============

  /**
   * Logout - delete session
   * @param {string} sessionId
   */
  async logout(sessionId) {
    await sessionService.deleteSession(sessionId);
  }

  /**
   * Get current session info
   * @param {string} sessionId
   * @returns {Object|null} Session info
   */
  async getSessionInfo(sessionId) {
    const session = await sessionService.validateSession(sessionId);
    if (!session) {
      return null;
    }
    return sessionService.getSessionInfo(session);
  }
}

module.exports = new AuthService();
