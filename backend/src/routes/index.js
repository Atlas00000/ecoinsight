const express = require('express');
const router = express.Router();

// Import route modules
const healthRoutes = require('./health');
const climateRoutes = require('./climate');
const sustainabilityRoutes = require('./sustainability');
const seedRoutes = require('./seed');
const climateExternalRoutes = require('./climate_external');
const authRoutes = require('./auth');
const timeseriesRoutes = require('./timeseries');

// Health check routes
router.use('/health', healthRoutes);

// Auth routes
router.use('/auth', authRoutes);

// Climate data routes
router.use('/climate', climateRoutes);
router.use('/climate', climateExternalRoutes);

// Sustainability routes
router.use('/sustainability', sustainabilityRoutes);

// Timeseries routes
router.use('/timeseries', timeseriesRoutes);

// Seed routes (development only)
router.use('/seed', seedRoutes);

// API documentation route
router.get('/docs', (req, res) => {
  res.json({
    message: 'EcoInsight API Documentation',
    version: '1.0.0',
    endpoints: {
      health: {
        description: 'System health monitoring',
        routes: {
          'GET /health': 'Overall system health',
          'GET /health/:service': 'Specific service health (mongodb, timescaledb, redis)',
        },
      },
      climate: {
        description: 'Climate and environmental data',
        routes: {
          'GET /climate': 'List stored climate data',
          'GET /climate/:id': 'Get specific climate record',
          'POST /climate': 'Create climate record',
          'PUT /climate/:id': 'Update climate record',
          'DELETE /climate/:id': 'Delete climate record',
          'GET /climate/weather/live?city=': 'Fetch live weather (OpenWeatherMap)',
          'GET /climate/air-quality/live?city=': 'Fetch live air quality (OpenAQ)',
        },
      },
      sustainability: {
        description: 'Sustainability and ESG metrics',
        routes: {
          'GET /sustainability/esg': 'ESG reports and metrics',
          'GET /sustainability/metrics': 'Aggregated sustainability metrics',
        },
      },
      timeseries: {
        description: 'TimescaleDB-backed time-series',
        routes: {
          'POST /timeseries': 'Insert time-series point (auth required)',
          'GET /timeseries': 'Query aggregated time-series',
        },
      },
    },
    baseUrl: '/api/v1',
  });
});

// Root API endpoint
router.get('/', (req, res) => {
  res.json({
    message: 'EcoInsight Climate Dashboard API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      docs: '/docs',
      climate: '/climate',
      sustainability: '/sustainability',
      analytics: '/analytics',
    },
  });
});

module.exports = router;
