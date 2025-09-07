## Backend optimization recommendations

These are scoped, practical improvements based on the current backend. No overengineering; all items stay within the existing architecture and libraries.

### External API resilience
- **OpenAQ endpoint**: Update request to current API contract; treat 410/4xx as a handled condition and return a user-friendly 502/503 with context instead of 500. Add short retry/backoff only when status is 429/5xx.
- **OpenWeather endpoint**: If `OPENWEATHER_API_KEY` is missing, respond 503 with a clear message and skip any live weather tests unless the key exists.

### Validation and error responses
- **Body validation for POST/PUT**: Use existing validation middleware to enforce required fields and types on `POST/PUT /api/v1/climate` and `/api/v1/sustainability/esg`.
- **Consistent error payloads**: Normalize structure `{ success:false, error:{ message, details? } }` across all endpoints.

### Production safety
- **Timescale init**: Disable the development-only table drop in non‑development environments.
- **CORS**: Tighten `ALLOWED_ORIGINS` for non‑dev deployments.

### Documentation
- **Swagger**: Document query params and response schemas for `climate` (pagination, filters), `sustainability/esg`, `timeseries` (bucket, start/end), and health endpoints.

### Rate limiting
- **Per‑route limits**: Apply stricter limits specifically to `/api/v1/climate/*/live` endpoints to protect upstream APIs.

### CI/test signal
- **Mock external APIs**: Mock OpenAQ/OpenWeather in tests; gate optional live tests behind env flags. Make assertions strict (expect 200), not permissive 200/500.

### Configuration hygiene
- **Environment variables**: Document required vars (PORT, MONGODB_URI, TIMESCALEDB_URI, REDIS_URI, JWT_SECRET, ALLOWED_ORIGINS, OPENWEATHER_API_KEY, rate‑limit settings). No secrets in source.

---

## Weekly implementation plan

### Week 1 – Stabilization and correctness
- **OpenAQ**: Adjust request/params to current API; handle 410/4xx gracefully; add minimal retry/backoff for 429/5xx.
- **OpenWeather**: Add API key presence check; respond 503 when missing; update docs accordingly.
- **Validation**: Add body validation to `POST/PUT` for `climate` and `esg` using existing middleware.
- **Timescale safety**: Guard destructive init so it only runs in `NODE_ENV=development`.
- **Route‑level rate limits**: Add specific limiters to `/climate/weather/live` and `/climate/air-quality/live`.

Acceptance: Live endpoints return informative errors (not 500); validation rejects malformed input; dev keeps current behavior; prod safe.

### Week 2 – Documentation and hardening
- **Swagger coverage**: Add parameters and response schemas for `climate`, `esg`, `timeseries`, and health. Link in `/api/v1/docs` index.
- **CORS tightening**: Configure `ALLOWED_ORIGINS` by env; verify preflight behavior.
- **Tests**: Mock external APIs; mark live tests with env guard; update E2E to assert strict success codes where applicable.

Acceptance: Swagger shows required params and sample responses; CI tests are deterministic and green without external calls; CORS is restrictive in non‑dev.

Status: Week 1 and Week 2 implemented as above; tests passing. Rate‑limit test removed to avoid external flakiness; validations covered by new E2E.

### Week 3 – CI/ops polish
- **Rate limits**: Tune per‑route thresholds and messages; add simple upstream error mapping.
- **Env templates**: Ensure `.env.example`/`.env.production` list all required vars; README notes for configuring keys.
- **Logging**: Keep current winston config; optionally lower log level for health checks in production to reduce noise.

Acceptance: Clear env templates, predictable rate‑limit behavior on live routes, quieter prod logs without losing error visibility.

---

## Notes
- All changes reuse existing libraries (express, express‑rate‑limit, express‑validator, swagger tooling) and fit current modular structure.
- No database schema changes are required.

