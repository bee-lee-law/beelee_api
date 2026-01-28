const rateLimiter = (maxRequests = 100, windowMs = 60000) => {
  const requests = new Map();

  // Periodically clean up stale entries to prevent memory growth
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of requests) {
      const recent = timestamps.filter((time) => time > now - windowMs);
      if (recent.length === 0) {
        requests.delete(key);
      } else {
        requests.set(key, recent);
      }
    }
  }, windowMs);
  cleanupInterval.unref();

  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;

    if (!requests.has(key)) {
      requests.set(key, []);
    }

    const recentRequests = requests.get(key).filter((time) => time > windowStart);

    if (recentRequests.length >= maxRequests) {
      res.set('Retry-After', Math.ceil(windowMs / 1000));
      return res.status(429).json({
        success: false,
        error: {
          message: 'Too many requests, please try again later.',
        },
      });
    }

    recentRequests.push(now);
    requests.set(key, recentRequests);

    next();
  };
};

module.exports = rateLimiter;
