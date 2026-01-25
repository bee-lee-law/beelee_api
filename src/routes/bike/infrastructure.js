const express = require('express');
const router = express.Router();
const cache = require('../../middleware/cache');
const osmService = require('../../services/external/osmService');

// GET /api/bike/infrastructure/bike-lanes
router.get('/bike-lanes', cache(86400), async (req, res, next) => {
  try {
    const city = req.query.city || 'Grand Rapids';

    const bikeLanes = await osmService.getBikeLanes(city);
    res.json({
      ok: true,
      data: bikeLanes,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/bike/infrastructure/bike-parking
router.get('/bike-parking', cache(300), async (req, res, next) => {
  try {
    const { location, radius } = req.query;

    if (!location) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Location parameter is required (format: "lng,lat")',
        },
      });
    }

    const parking = await osmService.getBikeParking(location, radius || 1000);
    res.json({
      success: true,
      data: parking,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
