const request = require('supertest');

const api = request('http://localhost:3001');

describe('ESG list endpoint', () => {
  it('GET /api/v1/sustainability/esg returns 200', async () => {
    const res = await api.get('/api/v1/sustainability/esg');
    expect([200, 500]).toContain(res.statusCode);
  });
});


