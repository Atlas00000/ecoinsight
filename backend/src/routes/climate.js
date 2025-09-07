const express = require('express');
const router = express.Router();
const ClimateData = require('../models/ClimateData');
const cache = require('../utils/cache');
const { validate, commonValidations } = require('../middleware/validation');
const logger = require('../utils/logger');
const { authenticateJWT } = require('../middleware/auth');

// Get climate data with pagination and caching
router.get('/', commonValidations.pagination, async (req, res) => {
  try {
    const { page, limit, location, dataType, startDate, endDate } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    const query = {};
    if (location) query.location = new RegExp(location, 'i');
    if (dataType) query.dataType = dataType;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    // Check cache first
    const cacheKey = cache.generateKey('climate', { page, limit, ...query });
    const cachedData = await cache.get(cacheKey);
    
    if (cachedData) {
      logger.info('Climate data served from cache');
      return res.json(cachedData);
    }

    // Fetch from database
    const [data, total] = await Promise.all([
      ClimateData.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ClimateData.countDocuments(query),
    ]);

    const result = {
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };

    // Cache the result
    await cache.set(cacheKey, result, 1800); // 30 minutes TTL

    res.json(result);
  } catch (error) {
    logger.error('Error fetching climate data:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch climate data' },
    });
  }
});

// Get climate data by ID
router.get('/:id', commonValidations.objectId, async (req, res) => {
  try {
    const data = await ClimateData.findById(req.params.id).lean();
    
    if (!data) {
      return res.status(404).json({
        success: false,
        error: { message: 'Climate data not found' },
      });
    }

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    logger.error('Error fetching climate data by ID:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch climate data' },
    });
  }
});

// Create new climate data
router.post('/', authenticateJWT, commonValidations.climateCreate, validate, async (req, res) => {
  try {
    const climateData = new ClimateData(req.body);
    await climateData.save();

    // Clear related cache
    await cache.deleteByPattern('climate:*');

    logger.info('New climate data created:', climateData._id);
    res.status(201).json({
      success: true,
      data: climateData,
    });
  } catch (error) {
    logger.error('Error creating climate data:', error);
    res.status(400).json({
      success: false,
      error: { message: 'Failed to create climate data', details: error.message },
    });
  }
});

// Update climate data
router.put('/:id', commonValidations.objectId, authenticateJWT, commonValidations.climateUpdate, validate, async (req, res) => {
  try {
    const data = await ClimateData.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!data) {
      return res.status(404).json({
        success: false,
        error: { message: 'Climate data not found' },
      });
    }

    // Clear related cache
    await cache.deleteByPattern('climate:*');

    logger.info('Climate data updated:', data._id);
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    logger.error('Error updating climate data:', error);
    res.status(400).json({
      success: false,
      error: { message: 'Failed to update climate data', details: error.message },
    });
  }
});

// Delete climate data
router.delete('/:id', commonValidations.objectId, authenticateJWT, async (req, res) => {
  try {
    const data = await ClimateData.findByIdAndDelete(req.params.id);

    if (!data) {
      return res.status(404).json({
        success: false,
        error: { message: 'Climate data not found' },
      });
    }

    // Clear related cache
    await cache.deleteByPattern('climate:*');

    logger.info('Climate data deleted:', req.params.id);
    res.json({
      success: true,
      message: 'Climate data deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting climate data:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to delete climate data' },
    });
  }
});

module.exports = router;
