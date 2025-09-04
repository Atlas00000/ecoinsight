const axios = require('axios');

async function fetchAirQualityByCity(city) {
  const url = 'https://api.openaq.org/v2/measurements';
  const params = {
    city,
    parameter: ['pm25','pm10'],
    limit: 1,
    sort: 'desc',
    order_by: 'datetime',
  };
  const { data } = await axios.get(url, { params, timeout: 8000 });
  const m = data?.results?.[0];
  if (!m) return null;
  return {
    city,
    location: m.location,
    country: m.country,
    coordinates: m.coordinates,
    measurements: { [m.parameter]: { value: m.value, unit: m.unit } },
    timestamp: m.date?.utc || m.datetime || new Date().toISOString(),
    raw: m,
  };
}

module.exports = { fetchAirQualityByCity };
