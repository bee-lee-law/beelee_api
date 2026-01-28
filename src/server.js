const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config');
const errorHandler = require('./middleware/errorHandler');
const rateLimiter = require('./middleware/rateLimiter');
const routes = require('./routes');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.nodeEnv === 'development' ? true : config.corsOrigins,
  credentials: true,
}));
app.use(rateLimiter(100, 60000));

// Body parsing with size limits
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api', routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found',
    },
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${config.nodeEnv}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🚴 Bike API: http://localhost:${PORT}/api/bike`);
});

module.exports = app;
