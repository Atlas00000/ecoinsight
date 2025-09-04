const express = require('express');
const router = express.Router();
const { getTimescalePool } = require('../config/database');
const { authenticateJWT } = require('../middleware/auth');

// POST /api/v1/timeseries
router.post('/', authenticateJWT, async (req, res) => {
  try {
    const { location, dataType, timestamp, value, unit, source, metadata } = req.body;
    if (!location || !dataType || !timestamp || value === undefined || !unit || !source) {
      return res.status(400).json({ success: false, error: { message: 'location, dataType, timestamp, value, unit, source are required' } });
    }
    const pool = getTimescalePool();
    const q = `INSERT INTO climate_timeseries (location, data_type, ts, value, unit, source, metadata)
               VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`;
    const params = [location, dataType, new Date(timestamp), Number(value), unit, source, metadata || {}];
    const { rows } = await pool.query(q, params);
    return res.status(201).json({ success: true, data: { id: rows[0].id } });
  } catch (error) {
    return res.status(500).json({ success: false, error: { message: 'Failed to insert timeseries' } });
  }
});

// GET /api/v1/timeseries?location=..&dataType=..&start=..&end=..&bucket=1 hour
router.get('/', async (req, res) => {
  try {
    const { location, dataType, start, end, bucket } = req.query;
    if (!location || !dataType) {
      return res.status(400).json({ success: false, error: { message: 'location and dataType are required' } });
    }
    const pool = getTimescalePool();
    const from = start ? new Date(start) : new Date(Date.now() - 24 * 3600 * 1000);
    const to = end ? new Date(end) : new Date();
    const interval = bucket || '1 hour';

    const q = `
      SELECT time_bucket($1::interval, ts) AS bucket,
             AVG(value) as value_avg,
             MIN(value) as value_min,
             MAX(value) as value_max
      FROM climate_timeseries
      WHERE location = $2 AND data_type = $3 AND ts BETWEEN $4 AND $5
      GROUP BY bucket
      ORDER BY bucket DESC
      LIMIT 500;
    `;
    const params = [interval, location, dataType, from, to];
    const { rows } = await pool.query(q, params);
    return res.json({ success: true, data: rows });
  } catch (error) {
    return res.status(500).json({ success: false, error: { message: 'Failed to query timeseries' } });
  }
});

module.exports = router;


