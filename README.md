# EcoInsight - Climate Dashboard Project

A comprehensive climate and sustainability dashboard built with MERN stack + Timeseries capabilities, focusing on simplicity, modularity, and industry best practices.

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- Git

### 1. Clone and Setup
```bash
git clone <your-repo-url>
cd climatedash
```

### 2. Environment Configuration
```bash
cd backend
cp .env.example .env
# Edit .env with your API keys and configuration
```

### 3. Start Services
```bash
# From project root
docker-compose up -d
```

### 4. Verify Setup
```bash
# Check all services are running
docker-compose ps

# Test health endpoints
curl http://localhost:3001/health
curl http://localhost:3001/api/v1
```

## 🏗️ Architecture

### Technology Stack
- **Frontend**: Next.js + D3.js (time-series sustainability visualizations)
- **Backend**: Express.js (API gateway for metrics)
- **Database**: MongoDB + TimescaleDB (via separate service)
- **Infrastructure**: Docker + Redis
- **Optional**: Apache Kafka (stream live IoT data)

### Service Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   External      │
│   (Next.js)     │◄──►│   (Express.js)  │◄──►│   APIs          │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                ┌─────────────────────────────────┐
                │           Data Layer            │
                ├─────────────────┬───────────────┤
                │   MongoDB       │  TimescaleDB │
                │   (ESG Data)    │  (Time Series)│
                └─────────────────┴───────────────┘
                                │
                                ▼
                        ┌─────────────────┐
                        │      Redis      │
                        │   (Caching)     │
                        └─────────────────┘
```

## 📊 API Endpoints

### Health Monitoring
- `GET /health` - Overall system health
- `GET /health/:service` - Specific service health

### Core API
- `GET /api/v1` - API information
- `GET /api/v1/docs` - API documentation

### Planned Endpoints
- `GET /api/v1/climate/weather` - Weather data
- `GET /api/v1/climate/air-quality` - Air quality data
- `GET /api/v1/climate/emissions` - Emissions data
- `GET /api/v1/sustainability/esg` - ESG metrics
- `GET /api/v1/analytics/trends` - Trend analysis

## 🔧 Development

### Local Development
```bash
# Install dependencies
cd backend
npm install

# Start development server
npm run dev

# Run tests
npm test

# Lint code
npm run lint
```

### Docker Development
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Rebuild backend
docker-compose up -d --build backend

# Stop all services
docker-compose down
```

### Database Access
```bash
# MongoDB
docker exec -it ecoinsight_mongodb mongosh -u admin -p ecoinsight2024

# TimescaleDB
docker exec -it ecoinsight_timescaledb psql -U admin -d ecoinsight_timeseries

# Redis
docker exec -it ecoinsight_redis redis-cli
```

## 📁 Project Structure

```
climatedash/
├── docker-compose.yml          # Docker services configuration
├── docker-compose.prod.yml     # Production services configuration
├── backend/                    # Backend API service
│   ├── Dockerfile             # Backend container
│   ├── package.json           # Dependencies
│   ├── .env.example           # Dev environment variables template
│   ├── .env.production.example# Prod environment variables template
│   ├── src/                   # Source code
│   │   ├── config/            # Database and Redis config
│   │   ├── middleware/        # Express middleware
│   │   ├── routes/            # API routes
│   │   ├── utils/             # Utilities (logger, etc.)
│   │   └── server.js          # Main server file
│   └── healthcheck.js         # Docker health check
├── mongo-init/                 # MongoDB initialization scripts
└── README.md                   # This file
```

## 🛡️ Security Features

- **Helmet.js** - Security headers
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - API request throttling
- **Input Validation** - Request sanitization
- **JWT Authentication** - Secure token-based auth
- **Environment Variables** - Secure configuration

## 📈 Performance Features

- **Redis Caching** - Response caching with TTL
- **Compression** - Gzip response compression
- **Connection Pooling** - Database connection optimization
- **Lazy Loading** - On-demand data loading
- **Pagination** - Limited data payloads

## 🔍 Monitoring & Observability

- **Health Checks** - Service health monitoring
- **Structured Logging** - Winston logger with file rotation
- **Performance Metrics** - Response time tracking
- **Error Tracking** - Centralized error handling
- **API Documentation** - Swagger/OpenAPI docs

## 🚀 Deployment (Production)

### 1) Prepare environment
```bash
# Copy production env template and edit values
cp backend/.env.production.example backend/.env.production
# Set strong JWT secret, DB users/passwords, allowed origins, API keys
```

### 2) Start production stack
```bash
# From project root
docker compose -f docker-compose.prod.yml up -d --build
```

### 3) Verify
```bash
curl http://localhost:3001/health
curl http://localhost:3001/api/v1
curl http://localhost:3001/api/v1/docs
```

### 4) Logs & lifecycle
```bash
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml down
```

## 📚 API Documentation

Once the server is running, visit:
- **API Info**: http://localhost:3001/api/v1
- **Health Check**: http://localhost:3001/health
- **Swagger Docs**: http://localhost:3001/api/v1/docs

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- --testNamePattern="health"

# Run tests in watch mode
npm run test:watch
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- **Issues**: Create a GitHub issue
- **Documentation**: Check the API docs
- **Health Check**: Use `/health` endpoint for system status

## 🎯 Roadmap

### Week 1: Foundation ✅
- [x] Docker environment setup
- [x] MongoDB + TimescaleDB containers
- [x] Basic Express.js server structure
- [x] Security middleware (Helmet, CORS)
- [x] Rate limiting setup
- [x] Health check endpoint

### Week 2: Core Backend Architecture
- [ ] API gateway setup
- [ ] Database models and schemas
- [ ] Basic CRUD operations
- [ ] Error handling middleware
- [ ] Redis connection and caching
- [ ] Basic logging setup
- [ ] Input validation

### Week 3-4: Data Layer & APIs
- [ ] Climate APIs integration
- [ ] Data validation and caching
- [ ] Performance optimization

### Week 5-8: Frontend & Integration
- [ ] Next.js frontend
- [ ] D3.js visualizations
- [ ] Full-stack integration
- [ ] Testing and deployment

---

**EcoInsight** - Making climate data accessible and actionable 🌱
