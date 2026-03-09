const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const authService = require('../../services/internal/authService');
const config = require('../../config');

// Store state tokens temporarily (in production, use Redis or similar)
const stateTokens = new Map();

// Clean up expired state tokens every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [state, data] of stateTokens.entries()) {
    if (now - data.createdAt > 10 * 60 * 1000) {
      // 10 minute expiry
      stateTokens.delete(state);
    }
  }
}, 5 * 60 * 1000);

/**
 * GET /api/auth/oauth/authorize
 * Get Challonge OAuth authorization URL
 */
router.get('/authorize', (req, res) => {
  try {
    // Generate CSRF state token
    const state = crypto.randomBytes(32).toString('hex');

    // Store state with timestamp
    stateTokens.set(state, {
      createdAt: Date.now(),
      redirectTo: req.query.redirect || '/challonge',
    });

    const authUrl = authService.getAuthorizationUrl(state);

    res.json({
      success: true,
      data: {
        authUrl,
        state,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to generate authorization URL' },
    });
  }
});

/**
 * GET /api/auth/oauth/callback
 * Handle Challonge OAuth callback
 */
router.get('/callback', async (req, res, next) => {
  try {
    const { code, state, error, error_description } = req.query;

    // Check for OAuth error
    if (error) {
      console.error('OAuth error:', error, error_description);
      return res.redirect(
        `${config.corsOrigins[0]}/challonge/login?error=${encodeURIComponent(error_description || error)}`
      );
    }

    // Validate required params
    if (!code || !state) {
      return res.redirect(
        `${config.corsOrigins[0]}/challonge/login?error=${encodeURIComponent('Missing authorization code or state')}`
      );
    }

    // Validate state token
    const stateData = stateTokens.get(state);
    if (!stateData) {
      return res.redirect(
        `${config.corsOrigins[0]}/challonge/login?error=${encodeURIComponent('Invalid or expired state token')}`
      );
    }

    // Remove used state token
    stateTokens.delete(state);

    // Complete OAuth flow
    const { accessToken, refreshToken, user } = await authService.completeOAuthFlow(
      code,
      {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      }
    );

    // Set cookies
    const cookieOptions = {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    };

    res.cookie('accessToken', accessToken, cookieOptions);
    res.cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Redirect to frontend with success
    const redirectTo = stateData.redirectTo || '/challonge';
    res.redirect(`${config.corsOrigins[0]}${redirectTo}?auth=success`);
  } catch (error) {
    console.error('OAuth callback error:', error.message);
    res.redirect(
      `${config.corsOrigins[0]}/challonge/login?error=${encodeURIComponent('Authentication failed')}`
    );
  }
});

module.exports = router;
