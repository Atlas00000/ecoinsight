const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const logger = require('./utils/logger');
const swaggerUi = require('swagger-ui-express');
const swaggerJSDoc = require('swagger-jsdoc');
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
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
if ((process.env.NODE_ENV === 'production') && (!process.env.ALLOWED_ORIGINS || allowedOrigins.length === 0)) {
  logger.warn('CORS: ALLOWED_ORIGINS is not set in production; defaulting to localhost. Configure ALLOWED_ORIGINS.');
}
app.use(cors({
  origin: allowedOrigins,
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
  const isHealth = req.path === '/health' || req.path.startsWith('/api/v1/health');
  const logMethod = (process.env.NODE_ENV === 'production' && isHealth) ? 'debug' : 'info';
  logger[logMethod](`${req.method} ${req.path}`, {
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

// Swagger/OpenAPI setup (minimal inline spec)
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'EcoInsight API',
      version: '1.0.0',
      description: 'API documentation for EcoInsight Backend',
    },
    servers: [
      { url: '/api/v1', description: 'Base Path' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                message: { type: 'string' },
                details: { type: 'object' },
              },
            },
          },
        },
        AuthRegisterRequest: {
          type: 'object',
          required: ['username', 'email', 'password'],
          properties: {
            username: { type: 'string' },
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 6 },
          },
        },
        AuthLoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string' },
          },
        },
        ClimateData: {
          type: 'object',
          required: ['location', 'dataType', 'timestamp', 'value', 'unit', 'source'],
          properties: {
            location: { type: 'string' },
            dataType: { type: 'string', enum: ['weather', 'air_quality', 'emissions', 'temperature'] },
            timestamp: { type: 'string', format: 'date-time' },
            value: {},
            unit: { type: 'string' },
            source: { type: 'string' },
            metadata: { type: 'object' },
          },
        },
        ESGReport: {
          type: 'object',
          required: ['company', 'year', 'reportType', 'source'],
          properties: {
            company: { type: 'string' },
            year: { type: 'integer' },
            reportType: { type: 'string', enum: ['annual', 'quarterly', 'sustainability', 'esg'] },
            metrics: { type: 'object' },
            score: { type: 'number' },
            source: { type: 'string' },
            verified: { type: 'boolean' },
          },
        },
        TimeseriesPoint: {
          type: 'object',
          required: ['location', 'dataType', 'timestamp', 'value', 'unit', 'source'],
          properties: {
            location: { type: 'string' },
            dataType: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
            value: { type: 'number' },
            unit: { type: 'string' },
            source: { type: 'string' },
            metadata: { type: 'object' },
          },
        },
      },
    },
    paths: {
      '/auth/register': {
        post: {
          summary: 'Register user',
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthRegisterRequest' } } } },
          responses: { '201': { description: 'Created' } },
        },
      },
      '/auth/login': {
        post: {
          summary: 'Login',
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthLoginRequest' } } } },
          responses: { '200': { description: 'OK' } },
        },
      },
      '/climate': {
        get: { 
          summary: 'List climate data',
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
            { name: 'location', in: 'query', schema: { type: 'string' } },
            { name: 'dataType', in: 'query', schema: { type: 'string', enum: ['weather','air_quality','emissions','temperature'] } },
            { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date-time' } },
            { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date-time' } },
          ],
          responses: { '200': { description: 'OK' }, '400': { description: 'Bad Request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } } }
        },
        post: {
          summary: 'Create climate data',
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ClimateData' } } } },
          responses: { '201': { description: 'Created' }, '401': { description: 'Unauthorized' } },
        },
      },
      '/climate/{id}': {
        get: { summary: 'Get climate by id', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'OK' }, '404': { description: 'Not Found' } } },
        put: { summary: 'Update climate', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'OK' }, '401': { description: 'Unauthorized' } } },
        delete: { summary: 'Delete climate', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'OK' }, '401': { description: 'Unauthorized' } } },
      },
      '/sustainability/esg': {
        get: { 
          summary: 'List ESG reports',
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
            { name: 'company', in: 'query', schema: { type: 'string' } },
            { name: 'year', in: 'query', schema: { type: 'integer' } },
            { name: 'reportType', in: 'query', schema: { type: 'string', enum: ['annual','quarterly','sustainability','esg'] } },
          ],
          responses: { '200': { description: 'OK' }, '400': { description: 'Bad Request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } } }
        },
        post: { summary: 'Create ESG report', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ESGReport' } } } }, responses: { '201': { description: 'Created' }, '401': { description: 'Unauthorized' } } },
      },
      '/sustainability/esg/{id}': {
        get: { summary: 'Get ESG by id', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'OK' }, '404': { description: 'Not Found' } } },
        put: { summary: 'Update ESG', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'OK' } } },
        delete: { summary: 'Delete ESG', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'OK' } } },
      },
      '/timeseries': {
        get: { 
          summary: 'Query aggregated timeseries',
          parameters: [
            { name: 'location', in: 'query', required: true, schema: { type: 'string' } },
            { name: 'dataType', in: 'query', required: true, schema: { type: 'string' } },
            { name: 'start', in: 'query', schema: { type: 'string', format: 'date-time' } },
            { name: 'end', in: 'query', schema: { type: 'string', format: 'date-time' } },
            { name: 'bucket', in: 'query', schema: { type: 'string', example: '1 hour' } },
          ],
          responses: { '200': { description: 'OK' }, '400': { description: 'Bad Request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } } }
        },
        post: { summary: 'Insert timeseries point', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/TimeseriesPoint' } } } }, responses: { '201': { description: 'Created' } } },
      },
      '/health': {
        get: { summary: 'Overall system health', responses: { '200': { description: 'OK' }, '503': { description: 'Service Unavailable' } } },
      },
    },
  },
  apis: [],
};
const swaggerSpec = swaggerJSDoc(swaggerOptions);
app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api/v1/docs.json', (req, res) => res.json(swaggerSpec));

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
const { closeConnections } = require('./config/database');
const { closeRedis } = require('./config/redis');

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  try { await closeConnections(); } catch {}
  try { await closeRedis(); } catch {}
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  try { await closeConnections(); } catch {}
  try { await closeRedis(); } catch {}
  process.exit(0);
});

startServer();
