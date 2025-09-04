const { validationResult } = require('express-validator');

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        details: errors.array(),
      },
    });
  }
  next();
};

// Common validation rules
const commonValidations = {
  pagination: [
    (req, res, next) => {
      req.query.page = parseInt(req.query.page) || 1;
      req.query.limit = Math.min(parseInt(req.query.limit) || 10, 100);
      next();
    },
  ],
  
  objectId: [
    (req, res, next) => {
      const { id } = req.params;
      if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
        return res.status(400).json({
          success: false,
          error: { message: 'Invalid ID format' },
        });
      }
      next();
    },
  ],
};

module.exports = {
  validate,
  commonValidations,
};
