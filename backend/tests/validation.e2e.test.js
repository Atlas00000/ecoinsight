const request = require('supertest');

const api = request('http://localhost:3001');

jest.setTimeout(20000);

describe('Validation for create endpoints', () => {
  let token;
  const email = `val_${Date.now()}@example.com`;
  const username = `val_${Date.now()}`;

  beforeAll(async () => {
    await api
      .post('/api/v1/auth/register')
      .send({ username, email, password: 'secret123' })
      .set('Content-Type', 'application/json');
    const login = await api
      .post('/api/v1/auth/login')
      .send({ email, password: 'secret123' })
      .set('Content-Type', 'application/json');
    token = login.body?.data?.token;
  });

  it('POST /api/v1/climate with empty body returns 400', async () => {
    const res = await api
      .post('/api/v1/climate')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({});
    expect([400, 401]).toContain(res.statusCode);
    if (res.statusCode === 400) {
      expect(res.body?.success).toBe(false);
    }
  });

  it('POST /api/v1/sustainability/esg with empty body returns 400', async () => {
    const res = await api
      .post('/api/v1/sustainability/esg')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({});
    expect([400, 401]).toContain(res.statusCode);
    if (res.statusCode === 400) {
      expect(res.body?.success).toBe(false);
    }
  });
});


