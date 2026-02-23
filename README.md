# Locus Test Applications

A comprehensive collection of full-stack test applications for Locus E2E testing and monorepo deployment demonstrations.

## 📁 Repository Structure

This is a **monorepo** containing multiple full-stack applications built with different technology stacks. Each application demonstrates Locus's ability to deploy from subdirectories using the `rootDir` parameter.

```
locus-test-apps/
├── typescript-fullstack/       # TypeScript + Node.js Stack
│   ├── backend/               # Express.js + PostgreSQL + Redis
│   └── frontend/              # Next.js 14 with App Router
├── python-fullstack/          # Python Stack
│   ├── backend/               # FastAPI + PostgreSQL + Redis
│   └── frontend/              # React + Vite + TypeScript
├── go-fullstack/              # Go Stack
│   ├── backend/               # Gin + PostgreSQL + Redis
│   └── frontend/              # Vue 3 + Vite + TypeScript
└── rust-backend/              # Rust + Static Stack
    ├── backend/               # Axum + PostgreSQL + Redis
    └── frontend/              # Vanilla JS (no build tools)
```

## 🎯 Purpose

These applications serve multiple purposes:

1. **E2E Testing** - Comprehensive test suite for the Locus platform
2. **Monorepo Demonstration** - Shows how to deploy multiple services from a single repository
3. **Technology Diversity** - Tests different languages, frameworks, and architectures
4. **Production Patterns** - Demonstrates best practices for each stack
5. **Performance Benchmarking** - Compare deployment times and resource usage across stacks

## 🚀 Quick Start

### Using with Locus

Each application can be deployed independently to Locus by specifying the `rootDir` parameter:

```bash
# Deploy TypeScript backend
locus services create \
  --name typescript-backend \
  --repo https://github.com/wjorgensen/locus-test-apps \
  --branch master \
  --rootDir typescript-fullstack/backend \
  --port 8080

# Deploy TypeScript frontend
locus services create \
  --name typescript-frontend \
  --repo https://github.com/wjorgensen/locus-test-apps \
  --branch master \
  --rootDir typescript-fullstack/frontend \
  --port 3000
```

### Local Development

Each stack can be run locally with Docker Compose:

```bash
# TypeScript stack
cd typescript-fullstack/backend
docker-compose up -d

# Python stack
cd python-fullstack/backend
docker-compose up -d

# Go stack
cd go-fullstack/backend
docker-compose up -d

# Rust stack
cd rust-backend/backend
docker-compose up -d
```

## 📚 Stack Details

### 1. TypeScript Full-Stack

**Backend** (Express.js + PostgreSQL + Redis)
- Modern TypeScript with strict typing
- Express.js REST API
- PostgreSQL with pg driver
- Redis for caching (60s TTL)
- Comprehensive health checks
- **Port**: 8080

**Frontend** (Next.js 14)
- App Router with Server Components
- TypeScript + Tailwind CSS
- Server-side rendering
- Optimistic UI updates
- **Port**: 3000

**Use Case**: Traditional Node.js development with modern React

---

### 2. Python Full-Stack

**Backend** (FastAPI + PostgreSQL + Redis)
- Async Python with FastAPI
- SQLAlchemy with asyncpg
- Redis async client
- Automatic API documentation (Swagger)
- **Port**: 8000

**Frontend** (React + Vite)
- React 18 with TypeScript
- Vite for fast builds
- Modern hooks and composition
- Dark/light mode support
- **Port**: 3000

**Use Case**: Python backend with modern React frontend

---

### 3. Go Full-Stack

**Backend** (Gin + PostgreSQL + Redis)
- High-performance Gin framework
- pgx driver for PostgreSQL
- go-redis client
- Minimal memory footprint
- Fast compilation
- **Port**: 8080

**Frontend** (Vue 3 + Vite)
- Vue 3 Composition API
- TypeScript support
- Component-based architecture
- Reactive state management
- **Port**: 3000

**Use Case**: High-performance Go backend with Vue.js frontend

---

### 4. Rust Backend + Static Frontend

**Backend** (Axum + PostgreSQL + Redis)
- Blazing fast Axum framework
- sqlx with compile-time query checking
- redis-rs client
- Memory-safe by design
- **Port**: 8080

**Frontend** (Vanilla JS/HTML/CSS)
- Zero dependencies
- No build tools required
- Modern ES6+ modules
- CSS Grid and Flexbox
- **Port**: 3000

**Use Case**: Ultra-fast Rust API with lightweight frontend

## 🔧 Common Features

All applications share the same API contract and features:

### API Endpoints

- `GET /health` - Health check with DB and Redis connectivity
- `GET /api/todos` - List all todos (cached 60 seconds)
- `POST /api/todos` - Create a new todo
- `GET /api/todos/:id` - Get a specific todo
- `PUT /api/todos/:id` - Update a todo
- `DELETE /api/todos/:id` - Delete a todo
- `GET /api/stats` - Get statistics (total, completed, pending)

### Data Schema

```typescript
interface Todo {
  id: number;
  title: string;
  completed: boolean;
  created_at: string; // ISO 8601 timestamp
}
```

### Environment Variables

All backends require:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `PORT` - Server port (varies by stack)

All frontends require:
- `<PREFIX>_API_URL` - Backend API URL (prefix varies: NEXT_PUBLIC, VITE, etc.)

## 🧪 Testing

### E2E Tests

The E2E tests verify:
- ✅ Project and environment creation
- ✅ PostgreSQL and Redis addon provisioning
- ✅ Service deployment from monorepo subdirectories
- ✅ Health checks (HTTP, database, Redis)
- ✅ CRUD operations
- ✅ Cache behavior (hit/miss)
- ✅ Inter-service communication
- ✅ Performance metrics

### Running E2E Tests

```bash
cd tests/e2e
npm test
```

### Individual Test Suites

```bash
# TypeScript stack
npm run test:typescript-fullstack

# Python stack
npm run test:python-fullstack

# Go stack
npm run test:go-fullstack

# Rust stack
npm run test:rust-backend
```

## 📊 Performance Comparison

| Stack | Backend | Image Size | Cold Start | Memory | Build Time |
|-------|---------|------------|------------|--------|------------|
| TypeScript | Express.js | ~150 MB | ~2s | ~50 MB | ~30s |
| Python | FastAPI | ~180 MB | ~3s | ~60 MB | ~40s |
| Go | Gin | ~25 MB | <1s | ~15 MB | ~20s |
| Rust | Axum | ~15 MB | <1s | ~10 MB | ~5m |

*Note: Build times include dependency installation. Rust is slower to build but produces the smallest, fastest binaries.*

## 🐳 Docker Images

All applications provide multi-stage Dockerfiles:

- **Builder stage**: Compiles/builds the application
- **Runtime stage**: Minimal production image
- **Security**: Non-root user
- **Health checks**: Configured for orchestrators

## 🔐 Security Features

All applications implement:

- ✅ Parameterized queries (SQL injection prevention)
- ✅ CORS configuration
- ✅ Non-root Docker users
- ✅ Input validation
- ✅ Error message sanitization
- ✅ Health check authentication (where applicable)
- ✅ Environment variable configuration (no hardcoded secrets)

## 📖 Documentation

Each stack includes comprehensive documentation:

- **README.md** - Overview, setup, and API documentation
- **QUICKSTART.md** - Get running in under 5 minutes (where applicable)
- **Dockerfile** - Production-ready containerization
- **docker-compose.yml** - Local development stack

## 🤝 Contributing

To add a new test application:

1. Create a new directory: `{stack-name}/`
2. Add `backend/` and `frontend/` subdirectories
3. Implement the common API contract
4. Add Dockerfiles and docker-compose.yml
5. Write comprehensive README
6. Add E2E tests
7. Update this main README

## 📝 License

MIT License

## 🔗 Resources

- [Locus Documentation](https://docs.buildwithlocus.com)
- [Locus GitHub](https://github.com/wjorgensen/buildwithlocus)
- [Monorepo Support Guide](https://docs.buildwithlocus.com/features/monorepo)

---

**Happy Testing! 🚀**

For questions or issues, please open an issue on the [Locus GitHub repository](https://github.com/wjorgensen/buildwithlocus).
