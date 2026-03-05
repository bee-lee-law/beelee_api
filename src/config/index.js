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

  // JWT Configuration
  jwtSecret: process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  // Token Encryption
  tokenEncryptionKey: process.env.TOKEN_ENCRYPTION_KEY || 'dev-encryption-key-32chars!!',

  // Owner Mode
  ownerPasswordHash: process.env.OWNER_PASSWORD_HASH,

  // AWS Configuration
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    dynamoTablePrefix: process.env.DYNAMODB_TABLE_PREFIX || 'beelee_',
  },

  // Challonge OAuth
  challonge: {
    clientId: process.env.CHALLONGE_CLIENT_ID,
    clientSecret: process.env.CHALLONGE_CLIENT_SECRET,
    redirectUri: process.env.CHALLONGE_REDIRECT_URI || 'http://localhost:8888/api/auth/oauth/callback',
    apiBaseUrl: 'https://api.challonge.com/v2.1',
    authBaseUrl: 'https://api.challonge.com/oauth',
  },
};
