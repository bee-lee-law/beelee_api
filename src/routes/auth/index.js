const express = require('express');
const router = express.Router();

const sandboxRoutes = require('./sandbox');
const ownerRoutes = require('./owner');
const oauthRoutes = require('./oauth');
const sessionRoutes = require('./session');

// Mount auth sub-routes
router.use('/sandbox', sandboxRoutes);
router.use('/owner', ownerRoutes);
router.use('/oauth', oauthRoutes);
router.use('/session', sessionRoutes);

// Convenience aliases
router.post('/logout', (req, res, next) => {
  // Forward to session logout
  req.url = '/session/logout';
  sessionRoutes(req, res, next);
});

router.post('/refresh', (req, res, next) => {
  // Forward to session refresh
  req.url = '/session/refresh';
  sessionRoutes(req, res, next);
});

module.exports = router;
