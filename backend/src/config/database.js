const mongoose = require('mongoose');
const { Pool } = require('pg');
const logger = require('../utils/logger');

// MongoDB connection
const connectMongoDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecoinsight';
    
    await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info('✅ MongoDB connected successfully');
    
    // Connection event handlers
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    throw error;
  }
};

// TimescaleDB connection
let timescalePool;
const connectTimescaleDB = async () => {
  try {
    const timescaleUri = process.env.TIMESCALEDB_URI || 'postgresql://admin:ecoinsight2024@localhost:5432/ecoinsight_timeseries';
    
    timescalePool = new Pool({
      connectionString: timescaleUri,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });

    // Test connection and ensure hypertable exists
    const client = await timescalePool.connect();
    try {
      await client.query('SELECT NOW()');
      // Ensure clean schema in development: drop conflicting table if it exists
      // Development-only: avoid destructive drops in non-development environments
      if ((process.env.NODE_ENV || 'development') === 'development') {
        await client.query(`
          DO $$
          BEGIN
            IF to_regclass('public.climate_timeseries') IS NOT NULL THEN
              DROP TABLE public.climate_timeseries CASCADE;
            END IF;
          END$$;
        `);
      }
      // Create table
      await client.query(`
        CREATE TABLE IF NOT EXISTS climate_timeseries (
          id BIGSERIAL,
          location TEXT NOT NULL,
          data_type TEXT NOT NULL,
          ts TIMESTAMPTZ NOT NULL,
          value DOUBLE PRECISION NOT NULL,
          unit TEXT NOT NULL,
          source TEXT NOT NULL,
          metadata JSONB DEFAULT '{}'::jsonb
        );
      `);
      // Create hypertable if not already
      await client.query(`
        SELECT create_hypertable('climate_timeseries', 'ts', if_not_exists => TRUE);
      `);
      // Helpful index
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_climate_timeseries_loc_type_ts
        ON climate_timeseries (location, data_type, ts DESC);
      `);
    } finally {
      client.release();
    }

    logger.info('✅ TimescaleDB connected successfully');

    // Pool event handlers
    timescalePool.on('error', (err) => {
      logger.error('TimescaleDB pool error:', err);
    });

  } catch (error) {
    logger.error('Failed to connect to TimescaleDB:', error);
    throw error;
  }
};

// Main connection function
const connectDB = async () => {
  await Promise.all([
    connectMongoDB(),
    connectTimescaleDB(),
  ]);
};

// Get TimescaleDB pool
const getTimescalePool = () => {
  if (!timescalePool) {
    throw new Error('TimescaleDB not connected');
  }
  return timescalePool;
};

// Close all connections
const closeConnections = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed');
    }
    
    if (timescalePool) {
      await timescalePool.end();
      logger.info('TimescaleDB connection closed');
    }
  } catch (error) {
    logger.error('Error closing connections:', error);
  }
};

module.exports = {
  connectDB,
  getTimescalePool,
  closeConnections,
  mongoose,
};
