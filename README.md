<div align="center">

# 🌿 EcoInsight Backend

<em>Climate and sustainability API platform — secure, performant, and production-ready.</em>

[![Node](https://img.shields.io/badge/Node-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.x-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com)
[![TimescaleDB](https://img.shields.io/badge/TimescaleDB-PG16-205375?logo=postgresql&logoColor=white)](https://www.timescale.com)
[![Redis](https://img.shields.io/badge/Redis-7.x-DC382D?logo=redis&logoColor=white)](https://redis.io)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

> Backend-only repository. This project exposes the EcoInsight API with health checks, ESG data, climate endpoints, and time-series analytics — no frontend required.

## ✨ Features

- Security-first: Helmet, CORS, JWT, rate limiting, validation
- Time-series analytics with TimescaleDB (bucketed aggregations)
- Redis-backed caching for responsive reads
- Robust health endpoints with per-service diagnostics
- Swagger/OpenAPI docs included out-of-the-box
- Docker Compose for MongoDB/TimescaleDB/Redis and API

## 🧭 Architecture

```
Clients / Integrations
        |
        v
  EcoInsight API (Express)
        |
  +-----+------+-----------------------+
  |            |                       |
  v            v                       v
MongoDB   TimescaleDB               Redis
(ESG)     (Time‑Series)             (Cache)
        |
        v
External Providers (OpenWeather, OpenAQ)
```

## 🚀 Quick Start (Docker)

```bash
# From project root
docker compose up -d

# Verify
curl http://localhost:3001/health
curl http://localhost:3001/api/v1
```

## ⚙️ Configuration

Set via environment variables (see `docker-compose.yml` for defaults):

- `PORT` (default: `3001`)
- `MONGODB_URI`, `TIMESCALEDB_URI`, `REDIS_URI`
- `JWT_SECRET` (required for auth flows)
- `ALLOWED_ORIGINS` (CORS; strongly recommended in production)
- `OPENWEATHER_API_KEY` (optional; required for live weather)
- `API_RATE_LIMIT_WINDOW`, `API_RATE_LIMIT_MAX`

## 📚 API Overview

- `GET /health` — Overall system and per-service status
- `GET /api/v1` — API info root
- `GET /api/v1/docs` — Swagger UI
- `GET /api/v1/climate` — Paginated climate records
- `GET /api/v1/timeseries` — Bucketed aggregates (avg/min/max)
- `GET /api/v1/sustainability/esg` — ESG reports (paginated)
- `GET /api/v1/sustainability/metrics` — ESG summary metrics
- `GET /api/v1/climate/weather/live?city=` — Live weather (503 if key missing)
- `GET /api/v1/climate/air-quality/live?city=` — Live air quality

Error responses conform to a consistent `ErrorResponse` shape.

## 🔒 Security & Hardening

- Helmet CSP with conservative defaults
- JWT-based auth for mutations
- Centralized input validation and error handling
- Per-route rate limits on live upstream calls

## 📈 Performance

- Redis caching with TTL and pattern invalidation
- Gzip compression enabled
- Efficient TimescaleDB aggregations via `time_bucket`

## 🔍 Observability

- Structured logs (Winston) with rotating files
- Detailed health payload (uptime, memory, pool sizes)

## 🧪 Development

```bash
cd backend
npm install
npm run dev

# Tests
npm test
```

## 🗂️ Project Structure

```
ecoinsight/
├── backend/
│   ├── src/
│   │   ├── config/           # Mongo, TimescaleDB, Redis
│   │   ├── middleware/       # auth, validation, errors
│   │   ├── routes/           # health, climate, sustainability, timeseries
│   │   └── server.js         # app bootstrap
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
├── docker-compose.prod.yml
└── mongo-init/
```

## 🛣️ Backend Roadmap

- Week 1: Core platform, health, security, DB wiring ✅
- Week 2: CRUD, caching, docs, validation ✅
- Week 3: Live data ingestion + time-series aggregation ✅
- Week 4: Observability polish, hardening, production configs ✅

---

Made with care to keep things simple, secure, and scalable. 🌱
