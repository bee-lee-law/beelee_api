const express = require('express');
const router = express.Router();

// Import sub-routes
const routeRoutes = require('./routes');
const safetyRoutes = require('./safety');
const infrastructureRoutes = require('./infrastructure');

// Mount sub-routes
router.use('/routes', routeRoutes);
router.use('/safety', safetyRoutes);
router.use('/infrastructure', infrastructureRoutes);

// Base bike endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Bike Safety Analyzer API',
    endpoints: {
      routes: '/api/bike/routes',
      safety: '/api/bike/safety',
      infrastructure: '/api/bike/infrastructure',
    },
  });
});

module.exports = router;
