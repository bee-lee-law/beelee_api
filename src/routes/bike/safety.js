const express = require('express');
const router = express.Router();
const cache = require('../../middleware/cache');
const collisionService = require('../../services/external/collisionService');
const safetyScoreService = require('../../services/internal/safetyScoreService');

// GET /api/bike/safety/collisions
router.get('/collisions', cache(300), async (req, res, next) => {
  try {
    const { bounds } = req.query;

    if (!bounds) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Bounds parameter is required (format: "swLng,swLat,neLng,neLat")',
        },
      });
    }

    const collisions = await collisionService.getCollisions(bounds);
    res.json({
      success: true,
      data: collisions,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/bike/safety/score
router.get('/score', async (req, res, next) => {
  try {
    const { route } = req.query;

    if (!route) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Route parameter is required',
        },
      });
    }

    const score = await safetyScoreService.calculateScore(JSON.parse(route));
    res.json({
      success: true,
      data: score,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/bike/safety/analyze
router.post('/analyze', async (req, res, next) => {
  try {
    const { route } = req.body;

    if (!route) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Route data is required in request body',
        },
      });
    }

    const analysis = await safetyScoreService.analyzeRoute(route);
    res.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
