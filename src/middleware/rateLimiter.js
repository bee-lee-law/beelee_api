// Basic rate limiting middleware (placeholder)
// For production, consider using express-rate-limit package

const rateLimiter = (maxRequests = 100, windowMs = 60000) => {
  const requests = new Map();

  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get request history for this IP
    if (!requests.has(key)) {
      requests.set(key, []);
    }

    const requestHistory = requests.get(key);

    // Filter out old requests
    const recentRequests = requestHistory.filter((time) => time > windowStart);

    if (recentRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: {
          message: 'Too many requests, please try again later.',
        },
      });
    }

    // Add current request
    recentRequests.push(now);
    requests.set(key, recentRequests);

    next();
  };
};

module.exports = rateLimiter;
