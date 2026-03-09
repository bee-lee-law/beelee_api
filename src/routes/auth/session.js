const express = require('express');
const router = express.Router();
const authService = require('../../services/internal/authService');
const sessionService = require('../../services/internal/sessionService');
const { authMiddleware } = require('../../middleware/authMiddleware');
const config = require('../../config');

/**
 * GET /api/auth/session
 * Get current session info
 */
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const sessionInfo = await authService.getSessionInfo(req.user.sessionId);

    if (!sessionInfo) {
      return res.status(401).json({
        success: false,
        error: { message: 'Session not found' },
      });
    }

    res.json({
      success: true,
      data: {
        session: sessionInfo,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/logout
 * End current session
 */
router.post('/logout', authMiddleware, async (req, res, next) => {
  try {
    await authService.logout(req.user.sessionId);

    // Clear cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.json({
      success: true,
      data: {
        message: 'Logged out successfully',
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: { message: 'Refresh token required' },
      });
    }

    const { accessToken } = await sessionService.refreshAccessToken(refreshToken);

    // Set new access token cookie
    const cookieOptions = {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    };

    res.cookie('accessToken', accessToken, cookieOptions);

    res.json({
      success: true,
      data: {
        message: 'Token refreshed',
      },
    });
  } catch (error) {
    // Clear cookies on refresh failure
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    return res.status(401).json({
      success: false,
      error: { message: 'Failed to refresh token' },
    });
  }
});

module.exports = router;
