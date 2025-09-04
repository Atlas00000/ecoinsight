const express = require('express');
const router = express.Router();
const ESGReport = require('../models/ESGReport');
const cache = require('../utils/cache');
const { validate, commonValidations } = require('../middleware/validation');
const logger = require('../utils/logger');
const { authenticateJWT } = require('../middleware/auth');

// Get ESG reports with pagination and caching
router.get('/esg', commonValidations.pagination, async (req, res) => {
  try {
    const { page, limit, company, year, reportType } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    const query = {};
    if (company) query.company = new RegExp(company, 'i');
    if (year) query.year = parseInt(year);
    if (reportType) query.reportType = reportType;

    // Check cache first
    const cacheKey = cache.generateKey('esg', { page, limit, ...query });
    const cachedData = await cache.get(cacheKey);
    
    if (cachedData) {
      logger.info('ESG data served from cache');
      return res.json(cachedData);
    }

    // Fetch from database
    const [data, total] = await Promise.all([
      ESGReport.find(query)
        .sort({ year: -1, company: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ESGReport.countDocuments(query),
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
    await cache.set(cacheKey, result, 3600); // 1 hour TTL

    res.json(result);
  } catch (error) {
    logger.error('Error fetching ESG data:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch ESG data' },
    });
  }
});

// Get ESG report by ID
router.get('/esg/:id', commonValidations.objectId, async (req, res) => {
  try {
    const data = await ESGReport.findById(req.params.id).lean();
    
    if (!data) {
      return res.status(404).json({
        success: false,
        error: { message: 'ESG report not found' },
      });
    }

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    logger.error('Error fetching ESG report by ID:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch ESG report' },
    });
  }
});

// Create new ESG report
router.post('/esg', authenticateJWT, async (req, res) => {
  try {
    const esgReport = new ESGReport(req.body);
    await esgReport.save();

    // Clear related cache
    await cache.deleteByPattern('esg:*');

    logger.info('New ESG report created:', esgReport._id);
    res.status(201).json({
      success: true,
      data: esgReport,
    });
  } catch (error) {
    logger.error('Error creating ESG report:', error);
    res.status(400).json({
      success: false,
      error: { message: 'Failed to create ESG report', details: error.message },
    });
  }
});

// Update ESG report
router.put('/esg/:id', commonValidations.objectId, authenticateJWT, async (req, res) => {
  try {
    const data = await ESGReport.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!data) {
      return res.status(404).json({
        success: false,
        error: { message: 'ESG report not found' },
      });
    }

    // Clear related cache
    await cache.deleteByPattern('esg:*');

    logger.info('ESG report updated:', data._id);
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    logger.error('Error updating ESG report:', error);
    res.status(400).json({
      success: false,
      error: { message: 'Failed to update ESG report', details: error.message },
    });
  }
});

// Delete ESG report
router.delete('/esg/:id', commonValidations.objectId, authenticateJWT, async (req, res) => {
  try {
    const data = await ESGReport.findByIdAndDelete(req.params.id);

    if (!data) {
      return res.status(404).json({
        success: false,
        error: { message: 'ESG report not found' },
      });
    }

    // Clear related cache
    await cache.deleteByPattern('esg:*');

    logger.info('ESG report deleted:', req.params.id);
    res.json({
      success: true,
      message: 'ESG report deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting ESG report:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to delete ESG report' },
    });
  }
});

// Get sustainability metrics summary
router.get('/metrics', async (req, res) => {
  try {
    const { company, year } = req.query;
    
    const query = {};
    if (company) query.company = new RegExp(company, 'i');
    if (year) query.year = parseInt(year);

    const cacheKey = cache.generateKey('metrics', { company, year });
    const cachedData = await cache.get(cacheKey);
    
    if (cachedData) {
      return res.json(cachedData);
    }

    const metrics = await ESGReport.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          avgScore: { $avg: '$score' },
          totalReports: { $sum: 1 },
          companies: { $addToSet: '$company' },
          years: { $addToSet: '$year' },
        },
      },
    ]);

    const result = {
      success: true,
      data: metrics[0] || {
        avgScore: 0,
        totalReports: 0,
        companies: [],
        years: [],
      },
    };

    await cache.set(cacheKey, result, 1800); // 30 minutes TTL
    res.json(result);
  } catch (error) {
    logger.error('Error fetching sustainability metrics:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch sustainability metrics' },
    });
  }
});

module.exports = router;
