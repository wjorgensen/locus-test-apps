# Locus Test Backend

Express.js backend application for Locus E2E tests.

## Features

- ✅ PostgreSQL integration with connection pooling
- ✅ Redis caching layer
- ✅ Health checks with latency metrics
- ✅ CRUD operations on todos
- ✅ Cache invalidation on mutations
- ✅ Graceful shutdown handling

## Endpoints

### Health & Diagnostics
- `GET /health` - Overall health status with DB and Redis connectivity
- `GET /api/db-check` - Detailed database connectivity check
- `GET /api/redis-check` - Detailed Redis connectivity check

### Todos API
- `GET /api/todos` - List all todos (cached for 60s)
- `POST /api/todos` - Create new todo
- `PUT /api/todos/:id` - Update todo
- `DELETE /api/todos/:id` - Delete todo

### Statistics
- `GET /api/stats` - Get statistics (page views, total todos)

## Environment Variables

Required:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string

Optional:
- `PORT` - Server port (default: 8080)

## Local Development

```bash
npm install
npm run dev
```

## Docker Build

```bash
docker build -t locus-test-backend .
docker run -p 8080:8080 \
  -e DATABASE_URL=postgresql://... \
  -e REDIS_URL=redis://... \
  locus-test-backend
```
