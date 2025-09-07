const express = require('express');
const router = express.Router();
const { mongoose, getTimescalePool } = require('../config/database');
const { checkRedisHealth } = require('../config/redis');
const logger = require('../utils/logger');

// Basic health check
router.get('/', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Check MongoDB health
    const mongoHealth = {
      status: mongoose.connection.readyState === 1 ? 'healthy' : 'unhealthy',
      readyState: mongoose.connection.readyState,
      database: mongoose.connection.name,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
    };

    // Check TimescaleDB health
    let timescaleHealth = { status: 'unknown' };
    try {
      const pool = getTimescalePool();
      const client = await pool.connect();
      const result = await client.query('SELECT NOW(), version()');
      client.release();
      
      timescaleHealth = {
        status: 'healthy',
        version: result.rows[0].version,
        timestamp: result.rows[0].now,
        poolSize: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount,
      };
    } catch (error) {
      timescaleHealth = {
        status: 'unhealthy',
        error: error.message,
      };
    }

    // Check Redis health
    const redisHealth = await checkRedisHealth();

    // Calculate response time
    const responseTime = Date.now() - startTime;

    // Overall system health
    const overallHealth = 
      mongoHealth.status === 'healthy' &&
      timescaleHealth.status === 'healthy' &&
      redisHealth.status === 'healthy'
        ? 'healthy'
        : 'degraded';

    const healthData = {
      status: overallHealth,
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      service: 'ecoinsight-backend',
      version: '1.0.0',
      services: {
        mongodb: mongoHealth,
        timescaledb: timescaleHealth,
        redis: redisHealth,
      },
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
      },
      environment: process.env.NODE_ENV || 'development',
    };

    // Set appropriate status code
    const statusCode = overallHealth === 'healthy' ? 200 : 503;
    
    res.status(statusCode).json(healthData);

  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      error: 'Health check failed',
      timestamp: new Date().toISOString(),
      details: error.message,
    });
  }
});

// Detailed health check for specific service
router.get('/:service', async (req, res) => {
  const { service } = req.params;
  
  try {
    let healthData = {};
    
    switch (service.toLowerCase()) {
      case 'mongodb':
        healthData = {
          service: 'MongoDB',
          status: mongoose.connection.readyState === 1 ? 'healthy' : 'unhealthy',
          readyState: mongoose.connection.readyState,
          database: mongoose.connection.name,
          host: mongoose.connection.host,
          port: mongoose.connection.port,
          timestamp: new Date().toISOString(),
        };
        break;
        
      case 'timescaledb':
        try {
          const pool = getTimescalePool();
          const client = await pool.connect();
          const result = await client.query('SELECT NOW(), version(), current_database()');
          client.release();
          
          healthData = {
            service: 'TimescaleDB',
            status: 'healthy',
            version: result.rows[0].version,
            database: result.rows[0].current_database,
            timestamp: result.rows[0].now,
            poolSize: pool.totalCount,
            idleCount: pool.idleCount,
            waitingCount: pool.waitingCount,
          };
        } catch (error) {
          healthData = {
            service: 'TimescaleDB',
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString(),
          };
        }
        break;
        
      case 'redis':
        healthData = {
          service: 'Redis',
          ...(await checkRedisHealth()),
        };
        break;
        
      default:
        return res.status(400).json({
          error: 'Invalid service specified',
          availableServices: ['mongodb', 'timescaledb', 'redis'],
        });
    }
    
    const statusCode = healthData.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(healthData);
    
  } catch (error) {
    logger.error(`Health check for ${service} failed:`, error);
    res.status(503).json({
      service,
      status: 'unhealthy',
      error: 'Health check failed',
      timestamp: new Date().toISOString(),
      details: error.message,
    });
  }
});

module.exports = router;
