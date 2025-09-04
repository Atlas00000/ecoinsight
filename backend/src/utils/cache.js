const { getRedisClient } = require('../config/redis');
const logger = require('./logger');

class Cache {
  constructor() {
    this.defaultTTL = 3600; // 1 hour default
  }

  async get(key) {
    try {
      const client = getRedisClient();
      const value = await client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  async set(key, value, ttl = this.defaultTTL) {
    try {
      const client = getRedisClient();
      await client.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error('Cache set error:', error);
      return false;
    }
  }

  async delete(key) {
    try {
      const client = getRedisClient();
      await client.del(key);
      return true;
    } catch (error) {
      logger.error('Cache delete error:', error);
      return false;
    }
  }

  // Delete multiple keys by pattern using SCAN iterator (node-redis v4)
  async deleteByPattern(pattern) {
    try {
      const client = getRedisClient();
      const keysToDelete = [];
      for await (const key of client.scanIterator({ MATCH: pattern, COUNT: 250 })) {
        keysToDelete.push(key);
        if (keysToDelete.length >= 1000) {
          await client.del(keysToDelete);
          keysToDelete.length = 0;
        }
      }
      if (keysToDelete.length > 0) {
        await client.del(keysToDelete);
      }
      return true;
    } catch (error) {
      logger.error('Cache deleteByPattern error:', error);
      return false;
    }
  }

  async exists(key) {
    try {
      const client = getRedisClient();
      return await client.exists(key) === 1;
    } catch (error) {
      logger.error('Cache exists error:', error);
      return false;
    }
  }

  // Generate cache key from request parameters
  generateKey(prefix, params) {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|');
    return `${prefix}:${sortedParams}`;
  }
}

module.exports = new Cache();
