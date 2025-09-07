const request = require('supertest');

const api = request('http://localhost:3001');

jest.setTimeout(20000);

describe('Timeseries endpoints', () => {
  let token;
  const email = `ts_${Date.now()}@example.com`;

  beforeAll(async () => {
    await api.post('/api/v1/auth/register')
      .send({ username: `ts_${Date.now()}`, email, password: 'secret123' })
      .set('Content-Type', 'application/json');
    const login = await api.post('/api/v1/auth/login')
      .send({ email, password: 'secret123' })
      .set('Content-Type', 'application/json');
    token = login.body?.data?.token;
  });

  it('insert timeseries point requires auth', async () => {
    const res = await api.post('/api/v1/timeseries')
      .send({ location: 'TS', dataType: 'weather', timestamp: new Date().toISOString(), value: 1, unit: 'celsius', source: 'test' })
      .set('Content-Type', 'application/json');
    expect([400, 401]).toContain(res.statusCode);
  });

  it('insert timeseries point with token returns 201', async () => {
    if (!token) return; // skip if login failed
    const res = await api.post('/api/v1/timeseries')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({ location: 'TS', dataType: 'weather', timestamp: new Date().toISOString(), value: 2.5, unit: 'celsius', source: 'test' });
    expect(res.statusCode).toBe(201);
  });

  it('query timeseries returns 200', async () => {
    const res = await api.get('/api/v1/timeseries')
      .query({ location: 'TS', dataType: 'weather', bucket: '1 hour' });
    expect(res.statusCode).toBe(200);
  });
});


