const express = require('express');
const router = express.Router();
const cache = require('../../middleware/cache');
const osmService = require('../../services/external/osmService');

// GET /api/bike/infrastructure/bike-lanes
router.get('/bike-lanes', cache(Infinity), async (req, res, next) => {
  try {
    const city = req.query.city || 'Grand Rapids';

    if (!/^[a-zA-Z\s.\-']+$/.test(city) || city.length > 100) {
      return res.status(400).json({
        ok: false,
        error: {
          message: 'Invalid city name',
        },
      });
    }

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

    const coordPattern = /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/;
    if (!coordPattern.test(location)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Location must be in "lng,lat" format',
        },
      });
    }

    const parsedRadius = Number(radius) || 1000;
    if (parsedRadius < 1 || parsedRadius > 5000) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Radius must be between 1 and 5000 meters',
        },
      });
    }

    const parking = await osmService.getBikeParking(location, parsedRadius);
    res.json({
      success: true,
      data: parking,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
