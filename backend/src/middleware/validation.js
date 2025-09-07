const { validationResult } = require('express-validator');
const { body } = require('express-validator');

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
  climateCreate: [
    body('location').isString().trim().notEmpty(),
    body('dataType').isString().isIn(['weather', 'air_quality', 'emissions', 'temperature']),
    body('timestamp').isISO8601(),
    body('value').exists(),
    body('unit').isString().trim().notEmpty(),
    body('source').isString().trim().notEmpty(),
    (req, res, next) => next(),
  ],
  esgCreate: [
    body('company').isString().trim().notEmpty(),
    body('year').isInt(),
    body('reportType').isString().isIn(['annual', 'quarterly', 'sustainability', 'esg']),
    body('source').isString().trim().notEmpty(),
    (req, res, next) => next(),
  ],
  // For updates, ensure body is not empty and only known fields are present
  climateUpdate: [
    (req, res, next) => {
      if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ success: false, error: { message: 'Update body cannot be empty' } });
      }
      const allowed = new Set(['location','dataType','timestamp','value','unit','source','metadata']);
      for (const k of Object.keys(req.body)) {
        if (!allowed.has(k)) {
          return res.status(400).json({ success: false, error: { message: `Unknown field: ${k}` } });
        }
      }
      next();
    },
  ],
  esgUpdate: [
    (req, res, next) => {
      if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ success: false, error: { message: 'Update body cannot be empty' } });
      }
      const allowed = new Set(['company','year','reportType','metrics','score','source','verified']);
      for (const k of Object.keys(req.body)) {
        if (!allowed.has(k)) {
          return res.status(400).json({ success: false, error: { message: `Unknown field: ${k}` } });
        }
      }
      next();
    },
  ],
};

module.exports = {
  validate,
  commonValidations,
};
