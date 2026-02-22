# Locus Test Application - TypeScript Full-Stack

This is a test application for Locus E2E tests, demonstrating a full-stack TypeScript application with PostgreSQL and Redis integration.

## Structure

- `backend/` - Express.js API server
- `frontend/` - Next.js web application (coming soon)

## Backend Features

- ✅ Express.js REST API
- ✅ PostgreSQL database with connection pooling
- ✅ Redis caching layer
- ✅ Health checks with connectivity status
- ✅ CRUD operations (todos)
- ✅ Cache invalidation on mutations
- ✅ Graceful shutdown handling

## Deployment to Locus

This application is designed to be deployed on the Locus platform with:

1. **PostgreSQL addon** - Provides `DATABASE_URL` environment variable
2. **Redis addon** - Provides `REDIS_URL` environment variable

### Backend Service Configuration

```yaml
Build Method: Dockerfile
Dockerfile Path: backend/Dockerfile
Port: 8080
Health Check: /health
```

### Required Environment Variables

- `DATABASE_URL` - PostgreSQL connection string (from addon)
- `REDIS_URL` - Redis connection string (from addon)
- `PORT` - Server port (default: 8080)

## Local Development

### Backend

```bash
cd backend
npm install

# Set environment variables
export DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
export REDIS_URL=redis://localhost:6379

npm run dev
```

### Testing

```bash
# Health check
curl http://localhost:8080/health

# Create todo
curl -X POST http://localhost:8080/api/todos \
  -H "Content-Type: application/json" \
  -d '{"title":"Test todo","completed":false}'

# List todos
curl http://localhost:8080/api/todos

# Update todo
curl -X PUT http://localhost:8080/api/todos/1 \
  -H "Content-Type: application/json" \
  -d '{"completed":true}'

# Delete todo
curl -X DELETE http://localhost:8080/api/todos/1

# Get statistics
curl http://localhost:8080/api/stats
```

## API Documentation

### Health & Diagnostics

#### GET /health
Overall health status with database and Redis connectivity.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-22T14:00:00.000Z",
  "database": {
    "connected": true,
    "latency": 15
  },
  "redis": {
    "connected": true,
    "latency": 5
  }
}
```

#### GET /api/db-check
Detailed database connectivity check.

**Response:**
```json
{
  "connected": true,
  "latency": 20,
  "database": "locus",
  "user": "postgres",
  "version": "PostgreSQL 16.1"
}
```

#### GET /api/redis-check
Detailed Redis connectivity check.

**Response:**
```json
{
  "connected": true,
  "ping": "PONG",
  "latency": 8,
  "setGetWorks": true
}
```

### Todos API

#### GET /api/todos
List all todos (cached for 60 seconds).

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "title": "Test todo",
      "completed": false,
      "created_at": "2026-02-22T14:00:00.000Z"
    }
  ],
  "cached": false
}
```

#### POST /api/todos
Create a new todo.

**Request:**
```json
{
  "title": "New todo",
  "completed": false
}
```

**Response:**
```json
{
  "id": 1,
  "title": "New todo",
  "completed": false,
  "created_at": "2026-02-22T14:00:00.000Z"
}
```

#### PUT /api/todos/:id
Update a todo.

**Request:**
```json
{
  "title": "Updated todo",
  "completed": true
}
```

**Response:**
```json
{
  "id": 1,
  "title": "Updated todo",
  "completed": true,
  "created_at": "2026-02-22T14:00:00.000Z"
}
```

#### DELETE /api/todos/:id
Delete a todo.

**Response:** 204 No Content

### Statistics

#### GET /api/stats
Get application statistics.

**Response:**
```json
{
  "pageViews": 42,
  "totalTodos": 5
}
```

## License

MIT
