const express = require('express');
const router = express.Router();
const { seedAllData } = require('../utils/seedData');
const logger = require('../utils/logger');

// Seed database with sample data (development only)
router.post('/', async (req, res) => {
  try {
    // Only allow seeding in development
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        error: { message: 'Seeding not allowed in production' },
      });
    }

    logger.info('Starting database seeding...');
    await seedAllData();
    
    res.json({
      success: true,
      message: 'Database seeded successfully with sample data',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error seeding database:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to seed database', details: error.message },
    });
  }
});

module.exports = router;
