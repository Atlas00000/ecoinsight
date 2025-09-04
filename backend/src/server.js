const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const logger = require('./utils/logger');
const { connectDB } = require('./config/database');
const { connectRedis } = require('./config/redis');
const errorHandler = require('./middleware/errorHandler');
const healthCheck = require('./routes/health');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.API_RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.API_RATE_LIMIT_MAX) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(parseInt(process.env.API_RATE_LIMIT_WINDOW) / 1000 / 60),
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
  });
  next();
});

// Health check endpoint
app.use('/health', healthCheck);

// API routes
app.use('/api/v1', require('./routes'));

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to EcoInsight Climate Dashboard API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    documentation: '/api/v1/docs',
    health: '/health',
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
  });
});

// Global error handler
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    // Connect to databases
    await connectDB();
    await connectRedis();
    
    app.listen(PORT, () => {
      logger.info(`🚀 EcoInsight Backend Server running on port ${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 Health Check: http://localhost:${PORT}/health`);
      logger.info(`📚 API Docs: http://localhost:${PORT}/api/v1/docs`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer();
