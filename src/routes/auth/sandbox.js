const express = require('express');
const router = express.Router();
const authService = require('../../services/internal/authService');
const config = require('../../config');

/**
 * POST /api/auth/sandbox/init
 * Initialize sandbox mode session
 */
router.post('/init', async (req, res, next) => {
  try {
    const { accessToken, refreshToken } = await authService.initSandbox({
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

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
        mode: 'sandbox',
        message: 'Sandbox mode initialized',
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
