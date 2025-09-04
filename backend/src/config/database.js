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

    // Test connection
    const client = await timescalePool.connect();
    await client.query('SELECT NOW()');
    client.release();

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
