const express = require('express');
const router = express.Router();

// Import project-specific routes
const bikeRoutes = require('./bike');
// Add more projects here as they're developed
// const shippingRoutes = require('./shipping');

// Mount routes
router.use('/bike', bikeRoutes);
// router.use('/shipping', shippingRoutes);

module.exports = router;
