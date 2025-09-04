const express = require('express');
const router = express.Router();
const cache = require('../utils/cache');
const ClimateData = require('../models/ClimateData');
const logger = require('../utils/logger');
const { fetchCurrentWeatherByCity } = require('../services/openweather');
const { fetchAirQualityByCity } = require('../services/openaq');

// GET /api/v1/climate/weather/live?city=London
router.get('/weather/live', async (req, res) => {
  try {
    const city = req.query.city;
    if (!city) return res.status(400).json({ success: false, error: { message: 'city is required' } });

    const cacheKey = cache.generateKey('weather_live', { city });
    const cached = await cache.get(cacheKey);
    if (cached) return res.json({ success: true, source: 'cache', data: cached });

    const payload = await fetchCurrentWeatherByCity(city);

    // persist minimal doc
    await ClimateData.create({
      location: payload.city,
      dataType: 'weather',
      timestamp: new Date(payload.timestamp),
      value: payload.tempCelsius,
      unit: 'celsius',
      source: 'OpenWeatherMap',
      metadata: {
        humidity: payload.humidity,
        pressure: payload.pressure,
        weather: payload.weather,
        description: payload.description,
        windSpeed: payload.windSpeed,
      },
    });

    await cache.set(cacheKey, payload, 600); // 10 min
    res.json({ success: true, source: 'live', data: payload });
  } catch (error) {
    logger.error('weather/live error', error);
    res.status(500).json({ success: false, error: { message: 'Failed to fetch weather' } });
  }
});

// GET /api/v1/climate/air-quality/live?city=London
router.get('/air-quality/live', async (req, res) => {
  try {
    const city = req.query.city;
    if (!city) return res.status(400).json({ success: false, error: { message: 'city is required' } });

    const cacheKey = cache.generateKey('aq_live', { city });
    const cached = await cache.get(cacheKey);
    if (cached) return res.json({ success: true, source: 'cache', data: cached });

    const payload = await fetchAirQualityByCity(city);
    if (!payload) return res.status(404).json({ success: false, error: { message: 'No data for city' } });

    // choose primary parameter if present
    const pm25 = payload.measurements?.pm25?.value ?? null;

    await ClimateData.create({
      location: payload.city,
      dataType: 'air_quality',
      timestamp: new Date(payload.timestamp),
      value: pm25 !== null ? pm25 : 0,
      unit: payload.measurements?.pm25?.unit || 'AQI',
      source: 'OpenAQ',
      metadata: payload.measurements,
    });

    await cache.set(cacheKey, payload, 600); // 10 min
    res.json({ success: true, source: 'live', data: payload });
  } catch (error) {
    logger.error('air-quality/live error', error);
    res.status(500).json({ success: false, error: { message: 'Failed to fetch air quality' } });
  }
});

module.exports = router;
