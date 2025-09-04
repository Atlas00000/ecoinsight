const axios = require('axios');

async function fetchCurrentWeatherByCity(city) {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENWEATHER_API_KEY is not set');
  }
  const url = 'https://api.openweathermap.org/data/2.5/weather';
  const params = { q: city, units: 'metric', appid: apiKey };
  const { data } = await axios.get(url, { params, timeout: 8000 });
  // Normalize minimal fields
  return {
    city: data.name,
    tempCelsius: data.main?.temp,
    humidity: data.main?.humidity,
    pressure: data.main?.pressure,
    weather: data.weather?.[0]?.main,
    description: data.weather?.[0]?.description,
    windSpeed: data.wind?.speed,
    timestamp: new Date(data.dt * 1000).toISOString(),
    raw: data,
  };
}

module.exports = { fetchCurrentWeatherByCity };
