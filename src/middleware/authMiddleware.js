const jwtUtils = require('../utils/jwtUtils');
const sessionService = require('../services/internal/sessionService');

/**
 * Authentication middleware - validates JWT from cookie or Authorization header
 * Attaches decoded user info to req.user
 */
async function authMiddleware(req, res, next) {
  try {
    // Get token from cookie or Authorization header
    let token = req.cookies?.accessToken;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: { message: 'Authentication required' },
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwtUtils.verifyAccessToken(token);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: { message: 'Token expired', code: 'TOKEN_EXPIRED' },
        });
      }
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid token' },
      });
    }

    // Validate session still exists
    const session = await sessionService.validateSession(decoded.sessionId);
    if (!session) {
      return res.status(401).json({
        success: false,
        error: { message: 'Session expired or invalid' },
      });
    }

    // Attach user info to request
    req.user = {
      sessionId: decoded.sessionId,
      mode: decoded.mode,
      challongeUserId: decoded.challongeUserId,
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    return res.status(500).json({
      success: false,
      error: { message: 'Authentication error' },
    });
  }
}

/**
 * Optional auth middleware - attaches user if authenticated, but doesn't require it
 */
async function optionalAuthMiddleware(req, res, next) {
  try {
    let token = req.cookies?.accessToken;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (token) {
      try {
        const decoded = jwtUtils.verifyAccessToken(token);
        const session = await sessionService.validateSession(decoded.sessionId);

        if (session) {
          req.user = {
            sessionId: decoded.sessionId,
            mode: decoded.mode,
            challongeUserId: decoded.challongeUserId,
          };
        }
      } catch (error) {
        // Token invalid, continue without user
      }
    }

    next();
  } catch (error) {
    next();
  }
}

/**
 * Require specific auth mode(s)
 * @param {string|string[]} modes - Required mode(s): 'sandbox', 'user', 'owner'
 */
function requireMode(modes) {
  const allowedModes = Array.isArray(modes) ? modes : [modes];

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Authentication required' },
      });
    }

    if (!allowedModes.includes(req.user.mode)) {
      return res.status(403).json({
        success: false,
        error: { message: 'Access denied for current authentication mode' },
      });
    }

    next();
  };
}

module.exports = {
  authMiddleware,
  optionalAuthMiddleware,
  requireMode,
};
