const redis = require('redis');
const logger = require('../utils/logger');

let redisClient;

const connectRedis = async () => {
  try {
    const redisUri = process.env.REDIS_URI || 'redis://localhost:6379';
    
    redisClient = redis.createClient({
      url: redisUri,
      socket: {
        connectTimeout: 10000,
        lazyConnect: true,
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error('Redis max reconnection attempts reached');
            return new Error('Redis max reconnection attempts reached');
          }
          return Math.min(retries * 100, 3000);
        },
      },
      retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          logger.error('Redis server refused connection');
          return new Error('Redis server refused connection');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
          logger.error('Redis retry time exhausted');
          return new Error('Redis retry time exhausted');
        }
        if (options.attempt > 10) {
          logger.error('Redis max retry attempts reached');
          return new Error('Redis max retry attempts reached');
        }
        return Math.min(options.attempt * 100, 3000);
      },
    });

    // Event handlers
    redisClient.on('connect', () => {
      logger.info('✅ Redis connected successfully');
    });

    redisClient.on('ready', () => {
      logger.info('Redis ready to accept commands');
    });

    redisClient.on('error', (err) => {
      logger.error('Redis error:', err);
    });

    redisClient.on('end', () => {
      logger.warn('Redis connection ended');
    });

    redisClient.on('reconnecting', () => {
      logger.info('Redis reconnecting...');
    });

    // Connect to Redis
    await redisClient.connect();

    // Test connection
    await redisClient.ping();
    logger.info('Redis ping successful');

  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    throw error;
  }
};

// Get Redis client
const getRedisClient = () => {
  if (!redisClient) {
    throw new Error('Redis not connected');
  }
  return redisClient;
};

// Close Redis connection
const closeRedis = async () => {
  try {
    if (redisClient) {
      await redisClient.quit();
      logger.info('Redis connection closed');
    }
  } catch (error) {
    logger.error('Error closing Redis connection:', error);
  }
};

// Health check function
const checkRedisHealth = async () => {
  try {
    if (!redisClient) {
      return { status: 'disconnected', error: 'Redis client not initialized' };
    }
    
    const start = Date.now();
    await redisClient.ping();
    const responseTime = Date.now() - start;
    
    return {
      status: 'healthy',
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
};

module.exports = {
  connectRedis,
  getRedisClient,
  closeRedis,
  checkRedisHealth,
};
