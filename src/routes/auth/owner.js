const express = require('express');
const router = express.Router();
const authService = require('../../services/internal/authService');
const config = require('../../config');
const rateLimiter = require('../../middleware/rateLimiter');

/**
 * POST /api/auth/owner/login
 * Authenticate with owner password
 * Rate limited: 5 attempts per 15 minutes
 */
router.post('/login', rateLimiter(5, 15 * 60 * 1000), async (req, res, next) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        error: { message: 'Password is required' },
      });
    }

    const { accessToken, refreshToken } = await authService.authenticateOwner(
      password,
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

    res.json({
      success: true,
      data: {
        mode: 'owner',
        message: 'Owner mode authenticated',
      },
    });
  } catch (error) {
    // Don't leak specific error details for security
    if (
      error.message === 'Invalid password' ||
      error.message === 'Owner mode not configured' ||
      error.message === 'Owner Challonge tokens not configured'
    ) {
      return res.status(401).json({
        success: false,
        error: { message: 'Authentication failed' },
      });
    }
    next(error);
  }
});

module.exports = router;
