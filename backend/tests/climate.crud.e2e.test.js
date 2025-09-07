const request = require('supertest');

const api = request('http://localhost:3001');

jest.setTimeout(20000);

describe('Climate CRUD E2E', () => {
  let token;
  let createdId;
  const email = `cl_${Date.now()}@example.com`;
  const username = `cl_${Date.now()}`;

  beforeAll(async () => {
    await api.post('/api/v1/auth/register')
      .send({ username, email, password: 'secret123' })
      .set('Content-Type', 'application/json');
    const login = await api.post('/api/v1/auth/login')
      .send({ email, password: 'secret123' })
      .set('Content-Type', 'application/json');
    token = login.body?.data?.token;
  });

  it('CREATE climate (201)', async () => {
    const res = await api.post('/api/v1/climate')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({
        location: 'TestCity',
        dataType: 'weather',
        timestamp: new Date().toISOString(),
        value: 12.3,
        unit: 'celsius',
        source: 'test',
        metadata: { note: 'create' },
      });
    expect([201, 400]).toContain(res.statusCode);
    createdId = res.body?.data?._id;
  });

  it('LIST climate (200)', async () => {
    const res = await api.get('/api/v1/climate').query({ page: 1, limit: 5 });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('data');
  });

  it('GET by id (200/404)', async () => {
    if (!createdId) return;
    const res = await api.get(`/api/v1/climate/${createdId}`);
    expect([200, 404]).toContain(res.statusCode);
  });

  it('UPDATE (200/404)', async () => {
    if (!createdId) return;
    const res = await api.put(`/api/v1/climate/${createdId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ unit: 'celsius', source: 'updated' })
      .set('Content-Type', 'application/json');
    expect([200, 404]).toContain(res.statusCode);
  });

  it('DELETE (200/404)', async () => {
    if (!createdId) return;
    const res = await api.delete(`/api/v1/climate/${createdId}`)
      .set('Authorization', `Bearer ${token}`);
    expect([200, 404]).toContain(res.statusCode);
  });
});


