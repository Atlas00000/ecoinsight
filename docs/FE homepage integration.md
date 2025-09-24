## Frontend Homepage Integration Plan (Weekly + Priority)

This plan outlines engaging homepage sections that directly integrate with existing backend endpoints. Priorities: H = High, M = Medium, L = Low.

### Backend endpoint mapping (reference)
- Hero KPI strip: `GET /health`, `GET /api/v1/climate?page=1&limit=1` (use `total`), `GET /api/v1/sustainability/esg?page=1&limit=1` (use `total`)
- Climate snapshot: `GET /api/v1/climate/weather/live?city=...`, `GET /api/v1/climate/air-quality/live?city=...`
- Time-series overview: `GET /api/v1/timeseries?location=...&dataType=...&bucket=1 hour`
- ESG highlights: `GET /api/v1/sustainability/esg?page=1&limit=...`
- ESG metrics summary: `GET /api/v1/sustainability/metrics?company=&year=`
- Recent climate records: `GET /api/v1/climate?page=&limit=&location=&dataType=&startDate=&endDate=`
- API health ribbon: `GET /health`
- Auth CTA: `POST /api/v1/auth/register`, `POST /api/v1/auth/login`
- Add a datapoint (protected): `POST /api/v1/climate`
- Stream to timeseries (protected): `POST /api/v1/timeseries`
- Docs link: `/api/v1/docs`

---

## Week 1 (Foundation + Core UX)

- Hero KPI strip (H)
  - Show system status (healthy/degraded), response time
  - Display totals from climate and ESG (use `pagination.total`)

- API health ribbon (H)
  - MongoDB, TimescaleDB, Redis statuses from `/health.services`

- Recent climate records (H)
  - Paginated table (location, dataType, timestamp, value, unit, source)
  - Query params: `page`, `limit`, optional `location`, `dataType`

- ESG highlights (M)
  - Card list of recent/top ESG reports (company, year, score)

- Authentication CTA (H)
  - Register/Login modals; store JWT; basic error toasts for 400/401

- Docs quick-link (L)
  - Button to `/api/v1/docs`

Deliverables:
- API client wrapper with base URL and JWT header injection
- Basic layout, routing, and environment config (read ALLOWED_ORIGINS on backend)

---

## Week 2 (Data Visuals + Live Snapshot)

- “Your Climate Snapshot” (H)
  - City selector; Weather + Air Quality cards
  - Live vs cache badge (use `source` field and response content)
  - Handle 503 (missing key) and 503 with `upstreamStatus` gracefully

- Time-series overview (H)
  - Mini charts for last 24–168h using `time_bucket` data (avg/min/max)
  - Controls: dataType (weather/air_quality), bucket size

- Quick filters (M)
  - Chips to filter climate list by dataType, and time presets (24h/7d)

- Data freshness and source badges (M)
  - Inline labels on cards/tables with `timestamp`, `source`, and cache/live

Deliverables:
- Lightweight chart components (line/area) fed by `/timeseries`
- Centralized error toast handling for 429/503/400

---

## Week 3 (Protected Actions + Polish)

- “Add a datapoint” (protected) (M)
  - Form for `location`, `dataType`, `timestamp`, `value`, `unit`, `source`
  - POST `/api/v1/climate` then refresh list; show success toast

- “Stream to timeseries” (protected) (M)
  - Minimal form; POST to `/api/v1/timeseries` and show returned `id`

- Pagination & loading polish (M)
  - Consistent loading skeletons and empty states

- Environment notice (dev) (L)
  - Banner when weather key is missing (weather returns 503 with message)

Deliverables:
- Guarded routes/components based on JWT presence
- Simple cache-busting in UI on successful mutations

---

## Week 4 (Refinement)

- ESG metrics summary (M)
  - Card with `avgScore`, `totalReports`, counts of companies and years

- Accessibility & responsiveness (M)
  - Keyboard nav, contrast, mobile breakpoints for key sections

- API examples (L)
  - Inline tooltips linking to `/api/v1/docs` for discoverability

Deliverables:
- Final pass on UX copy and empty/error states

---

## Notes
- Respect backend rate limits on live endpoints; debounce user-triggered calls
- Surface backend `ErrorResponse` messages in toasts without exposing internals
- Prefer server-provided pagination totals to compute counts quickly

