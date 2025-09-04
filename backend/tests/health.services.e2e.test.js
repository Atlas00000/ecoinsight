const request = require('supertest');

const api = request('http://localhost:3001');

describe('Service-specific health checks', () => {
  it('MongoDB health (200/503)', async () => {
    const res = await api.get('/health/mongodb');
    expect([200, 503]).toContain(res.statusCode);
    expect(res.body).toHaveProperty('service');
  });
  it('TimescaleDB health (200/503)', async () => {
    const res = await api.get('/health/timescaledb');
    expect([200, 503]).toContain(res.statusCode);
    expect(res.body).toHaveProperty('service');
  });
  it('Redis health (200/503)', async () => {
    const res = await api.get('/health/redis');
    expect([200, 503]).toContain(res.statusCode);
    expect(res.body).toHaveProperty('service');
  });
});


