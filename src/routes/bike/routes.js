const express = require('express');
const router = express.Router();
const cache = require('../../middleware/cache');
const mapboxService = require('../../services/external/mapboxService');


const testReturn = {
  "routes": [
    {
      "weight_name": "bicycle",
      "weight": 2193.371,
      "duration": 909.681,
      "distance": 4498.503,
      "legs": [
        {
          "via_waypoints": [],
          "admins": [
            {
              "iso_3166_1_alpha3": "USA",
              "iso_3166_1": "US"
            }
          ],
          "weight": 2193.371,
          "duration": 909.681,
          "steps": [],
          "distance": 4498.503,
          "summary": "Fulton Street West, Seward Avenue Northwest"
        }
      ],
      "geometry": "mydeGbkwiO~@?M|UuVTFje@gKz]gJHo@~qBgl@NMlQw@@"
    }
  ],
  "waypoints": [
    {
      "distance": 6.508,
      "name": "Eastern Avenue Southeast",
      "location": [
        -85.649301,
        42.955905
      ]
    },
    {
      "distance": 3.551,
      "name": "Cadwell Avenue Northwest",
      "location": [
        -85.685646,
        42.971003
      ]
    }
  ],
  "code": "Ok",
  "uuid": "ok6FFJse9J1Ow3Y4xcrIHBbepetdwCZHQAn0enKvTmw_1pC9qBtp-A=="
}

const testing = false;

const processDirectionsPayload = (inLoad) => {
  try{
    return{
      routes: inLoad.routes,
      waypoints: inLoad.waypoints,
      ok: true
    }
  }catch(e){
    console.log('error found: ' + e);
    return {
      error: e,
      ok: false
    }
  }
}

// GET /api/bike/routes/directions
router.get('/directions', cache(300), async (req, res, next) => {
  if(testing){
    res.json(processDirectionsPayload(testReturn));
    return;
  }
  try {
    const { origin, destination } = req.query;

    if (!origin || !destination) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Origin and destination are required',
        },
      });
    }

    const coordPattern = /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/;
    if (!coordPattern.test(origin) || !coordPattern.test(destination)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Origin and destination must be in "lng,lat" format',
        },
      });
    }

    const mbQuery = await mapboxService.getDirections(origin, destination, 'cycling');
    //const route = mbQuery.waypoints.map((waypoint)=>waypoint.location);
    res.json(processDirectionsPayload(mbQuery));
  } catch (error) {
    next(error);
  }
});

// GET /api/bike/routes/alternative
router.get('/alternative', cache(300), async (req, res, next) => {
  try {
    const { origin, destination } = req.query;

    if (!origin || !destination) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Origin and destination are required',
        },
      });
    }

    const coordPattern = /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/;
    if (!coordPattern.test(origin) || !coordPattern.test(destination)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Origin and destination must be in "lng,lat" format',
        },
      });
    }

    const routes = await mapboxService.getAlternativeRoutes(
      origin,
      destination,
      'cycling'
    );
    res.json({
      success: true,
      data: routes,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
