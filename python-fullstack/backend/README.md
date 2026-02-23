# FastAPI Todo Backend

A production-ready FastAPI backend application with PostgreSQL and Redis integration.

## Features

- FastAPI framework with async/await support
- PostgreSQL database with SQLAlchemy ORM (async)
- Redis caching with 60-second TTL
- CRUD API for todo management
- Health check endpoint with DB and Redis connectivity checks
- Statistics endpoint for todo metrics
- Multi-stage Docker build for optimized image size
- Graceful shutdown handling
- Comprehensive error handling and logging
- CORS support for frontend integration

## Tech Stack

- **Framework**: FastAPI 0.109.0
- **Web Server**: Uvicorn with uvloop and httptools
- **Database**: PostgreSQL with asyncpg driver
- **ORM**: SQLAlchemy 2.0 (async)
- **Cache**: Redis (async client)
- **Validation**: Pydantic v2
- **Python**: 3.11

## Project Structure

```
backend/
├── main.py              # FastAPI application and routes
├── models.py            # SQLAlchemy models
├── database.py          # Database connection and session management
├── redis_client.py      # Redis client and caching utilities
├── requirements.txt     # Python dependencies
├── Dockerfile           # Multi-stage Docker build
├── .dockerignore        # Docker ignore patterns
└── README.md           # This file
```

## API Endpoints

### Health Check
- `GET /health` - Check application health (DB + Redis)

### Todos
- `GET /api/todos` - List all todos (cached for 60s)
- `POST /api/todos` - Create a new todo
- `GET /api/todos/{id}` - Get a specific todo
- `PUT /api/todos/{id}` - Update a todo
- `DELETE /api/todos/{id}` - Delete a todo

### Statistics
- `GET /api/stats` - Get todo statistics (total, completed, pending)

### Root
- `GET /` - API information

## Environment Variables

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/todos
REDIS_URL=redis://localhost:6379/0
PORT=8000
```

## Local Development

### Prerequisites

- Python 3.11+
- PostgreSQL 14+
- Redis 7+

### Setup

1. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set environment variables:
```bash
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/todos
export REDIS_URL=redis://localhost:6379/0
export PORT=8000
```

4. Run the application:
```bash
python main.py
# Or with uvicorn directly:
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

5. Access the API:
- API: http://localhost:8000
- Interactive docs: http://localhost:8000/docs
- Alternative docs: http://localhost:8000/redoc

## Docker Deployment

### Build the image:
```bash
docker build -t python-fastapi-todos .
```

### Run the container:
```bash
docker run -d \
  --name fastapi-backend \
  -p 8000:8000 \
  -e DATABASE_URL=postgresql://user:password@db:5432/todos \
  -e REDIS_URL=redis://redis:6379/0 \
  python-fastapi-todos
```

## Docker Compose

```yaml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@db:5432/todos
      REDIS_URL: redis://redis:6379/0
    depends_on:
      - db
      - redis

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: todos
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

## Database Schema

### Todo Table
```sql
CREATE TABLE todos (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    completed BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
```

## Caching Strategy

- **List endpoint** (`/api/todos`): Cached for 60 seconds
- **Stats endpoint** (`/api/stats`): Cached for 60 seconds
- Cache is invalidated on create, update, and delete operations
- Cache keys use pattern: `todos:*`

## Error Handling

All endpoints include proper error handling:
- 400 Bad Request - Invalid input
- 404 Not Found - Resource not found
- 500 Internal Server Error - Server error with details logged

## Logging

Structured logging with timestamps:
- INFO level for normal operations
- WARNING level for cache failures (non-critical)
- ERROR level for database and critical errors

## Production Considerations

1. **Database Connections**: Connection pooling configured (pool_size=10, max_overflow=20)
2. **Redis Connections**: Connection pooling with max 10 connections
3. **Graceful Shutdown**: SIGTERM/SIGINT handling to close connections properly
4. **Health Checks**: Built-in health check endpoint for orchestrators
5. **Security**: Non-root user in Docker, CORS configured
6. **Performance**: Multi-stage Docker build for smaller images
7. **Observability**: Comprehensive logging for debugging

## Testing

Example curl commands:

```bash
# Health check
curl http://localhost:8000/health

# Create todo
curl -X POST http://localhost:8000/api/todos \
  -H "Content-Type: application/json" \
  -d '{"title":"Test todo","completed":false}'

# List todos
curl http://localhost:8000/api/todos

# Get stats
curl http://localhost:8000/api/stats

# Update todo
curl -X PUT http://localhost:8000/api/todos/1 \
  -H "Content-Type: application/json" \
  -d '{"completed":true}'

# Delete todo
curl -X DELETE http://localhost:8000/api/todos/1
```

## License

MIT
