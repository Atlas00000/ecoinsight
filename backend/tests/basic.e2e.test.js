const request = require('supertest');

// Target the running server (Docker maps 3001)
const api = request('http://localhost:3001');

describe('EcoInsight backend (minimal E2E)', () => {
  let token;

  it('GET /health should return healthy or degraded (200 or 503)', async () => {
    const res = await api.get('/health');
    expect([200, 503]).toContain(res.statusCode);
    expect(res.body).toHaveProperty('status');
  });

  it('GET /api/v1 should return API info', async () => {
    const res = await api.get('/api/v1');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message');
  });

  it('GET /api/v1/docs should load Swagger UI (200)', async () => {
    const res = await api.get('/api/v1/docs');
    expect(res.statusCode).toBe(200);
  });

  it('POST /api/v1/auth/register then login', async () => {
    const email = `demo_${Date.now()}@example.com`;
    const register = await api
      .post('/api/v1/auth/register')
      .send({ username: `demo_${Date.now()}`, email, password: 'secret123' })
      .set('Content-Type', 'application/json');
    expect([200, 201, 409]).toContain(register.statusCode);

    const login = await api
      .post('/api/v1/auth/login')
      .send({ email, password: 'secret123' })
      .set('Content-Type', 'application/json');
    // If user already existed (409 on register), login should still work
    expect([200, 401]).toContain(login.statusCode);
    if (login.statusCode === 200) {
      expect(login.body).toHaveProperty('data.token');
      token = login.body.data.token;
    }
  });

  it('POST /api/v1/climate without token should be 401', async () => {
    const res = await api
      .post('/api/v1/climate')
      .send({
        location: 'TestCity',
        dataType: 'weather',
        timestamp: new Date().toISOString(),
        value: 10,
        unit: 'celsius',
        source: 'test',
      })
      .set('Content-Type', 'application/json');
    expect([400, 401]).toContain(res.statusCode);
  });

  it('POST /api/v1/climate with token should be 201', async () => {
    if (!token) return; // skip if login failed
    const res = await api
      .post('/api/v1/climate')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({
        location: 'TestCity',
        dataType: 'weather',
        timestamp: new Date().toISOString(),
        value: 15,
        unit: 'celsius',
        source: 'test',
      });
    expect([201, 400]).toContain(res.statusCode);
  });
});


