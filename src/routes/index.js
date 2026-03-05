const express = require('express');
const router = express.Router();

// Import auth routes
const authRoutes = require('./auth');

// Import Challonge routes
const challongeRoutes = require('./challonge');

// Import project-specific routes
const bikeRoutes = require('./bike');
// Add more projects here as they're developed
// const shippingRoutes = require('./shipping');

// Mount auth routes
router.use('/auth', authRoutes);

// Mount Challonge routes
router.use('/challonge', challongeRoutes);

// Mount project routes
router.use('/bike', bikeRoutes);
// router.use('/shipping', shippingRoutes);

module.exports = router;
