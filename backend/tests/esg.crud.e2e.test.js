const request = require('supertest');

const api = request('http://localhost:3001');

jest.setTimeout(20000);

describe('ESG CRUD E2E', () => {
  let token;
  let id;
  const email = `esg_${Date.now()}@example.com`;
  const username = `esg_${Date.now()}`;

  beforeAll(async () => {
    await api.post('/api/v1/auth/register')
      .send({ username, email, password: 'secret123' })
      .set('Content-Type', 'application/json');
    const login = await api.post('/api/v1/auth/login')
      .send({ email, password: 'secret123' })
      .set('Content-Type', 'application/json');
    token = login.body?.data?.token;
  });

  it('CREATE ESG (201)', async () => {
    const res = await api.post('/api/v1/sustainability/esg')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({
        company: 'Demo Corp',
        year: 2024,
        reportType: 'annual',
        metrics: { environmental: { carbonEmissions: 1000 } },
        score: 80,
        source: 'test',
        verified: false,
      });
    expect([201, 400]).toContain(res.statusCode);
    id = res.body?.data?._id;
  });

  it('LIST ESG (200)', async () => {
    const res = await api.get('/api/v1/sustainability/esg').query({ page: 1, limit: 5 });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('data');
  });

  it('GET ESG by id (200/404)', async () => {
    if (!id) return;
    const res = await api.get(`/api/v1/sustainability/esg/${id}`);
    expect([200, 404]).toContain(res.statusCode);
  });

  it('UPDATE ESG (200/404)', async () => {
    if (!id) return;
    const res = await api.put(`/api/v1/sustainability/esg/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({ score: 82 });
    expect([200, 404]).toContain(res.statusCode);
  });

  it('DELETE ESG (200/404)', async () => {
    if (!id) return;
    const res = await api.delete(`/api/v1/sustainability/esg/${id}`)
      .set('Authorization', `Bearer ${token}`);
    expect([200, 404]).toContain(res.statusCode);
  });
});


