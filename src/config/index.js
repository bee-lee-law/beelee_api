require('dotenv').config();

module.exports = {
  port: process.env.PORT || 8888,
  nodeEnv: process.env.NODE_ENV || 'development',

  // API Keys (add as needed)
  mapboxApiKey: process.env.MAPBOX_API_KEY,
  osmApiKey: process.env.OSM_API_KEY,
  collisionApiKey: process.env.COLLISION_API_KEY,

  // CORS Configuration
  corsOrigins: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : ['http://localhost:3000', 'http://localhost:5173'],
};
