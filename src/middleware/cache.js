// Simple in-memory cache middleware
const cache = new Map();

const cacheMiddleware = (ttl = 300) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = req.originalUrl || req.url;
    const cached = cache.get(key);

    if (cached && Date.now() < cached.expiry) {
      return res.json(cached.data);
    }

    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to cache response
    res.json = (data) => {
      // Only cache successful responses (2xx status codes)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(key, {
          data,
          expiry: Date.now() + ttl * 1000,
        });
      }
      return originalJson(data);
    };

    next();
  };
};

// Helper to clear cache
cacheMiddleware.clear = () => {
  cache.clear();
};

module.exports = cacheMiddleware;
