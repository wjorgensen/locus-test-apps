# Rust Backend with Axum

A production-ready REST API built with Rust, Axum, PostgreSQL, and Redis.

## Features

- **Axum Web Framework**: High-performance async web framework
- **PostgreSQL Integration**: Using sqlx with compile-time checked queries
- **Redis Caching**: 60-second cache for list endpoints
- **Health Checks**: Comprehensive health and readiness endpoints
- **CRUD API**: Full Todo management with validation
- **Statistics**: Todo completion statistics
- **Error Handling**: Typed errors with proper HTTP responses
- **Multi-stage Docker Build**: Optimized production images
- **Structured Logging**: Tracing with configurable log levels

## Tech Stack

- **Framework**: Axum 0.7
- **Runtime**: Tokio (async)
- **Database**: PostgreSQL via sqlx
- **Cache**: Redis via redis-rs
- **Serialization**: Serde
- **Logging**: tracing + tracing-subscriber
- **Error Handling**: thiserror

## API Endpoints

### Health Checks
- `GET /health` - Detailed health status (DB + Redis)
- `GET /ready` - Readiness probe (returns 200 if healthy)

### Todos
- `GET /api/todos` - List all todos (cached for 60s)
- `POST /api/todos` - Create a new todo
- `GET /api/todos/:id` - Get a specific todo
- `PUT /api/todos/:id` - Update a todo
- `DELETE /api/todos/:id` - Delete a todo

### Statistics
- `GET /api/stats` - Get todo statistics (total, completed, pending)

## Todo Schema

```json
{
  "id": "uuid",
  "title": "string",
  "completed": "boolean",
  "created_at": "timestamp"
}
```

## Environment Variables

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/todos
REDIS_URL=redis://127.0.0.1:6379
PORT=8080
RUST_LOG=debug
```

## Development

### Prerequisites

- Rust 1.75+ (install via [rustup](https://rustup.rs/))
- PostgreSQL 14+
- Redis 7+

### Setup

1. Clone the repository
2. Copy environment file:
   ```bash
   cp .env.example .env
   ```

3. Update `.env` with your database and Redis URLs

4. Run the application:
   ```bash
   cargo run
   ```

The server will start on `http://localhost:8080`

### Building

```bash
# Development build
cargo build

# Release build (optimized)
cargo build --release

# Run tests
cargo test

# Check without building
cargo check
```

## Docker

### Build Image

```bash
docker build -t rust-backend:latest .
```

### Run Container

```bash
docker run -d \
  -p 8080:8080 \
  -e DATABASE_URL=postgresql://user:password@host.docker.internal:5432/todos \
  -e REDIS_URL=redis://host.docker.internal:6379 \
  -e RUST_LOG=info \
  --name rust-backend \
  rust-backend:latest
```

### Multi-stage Build Details

The Dockerfile uses a multi-stage build:
1. **Builder stage**: Compiles the Rust application
   - Uses `rust:1.75-slim` base image
   - Installs build dependencies
   - Caches dependencies separately from source
   - Builds optimized release binary

2. **Runtime stage**: Minimal runtime environment
   - Uses `debian:bookworm-slim` base image
   - Only includes runtime dependencies
   - Runs as non-root user
   - Significantly smaller image size

## Project Structure

```
src/
├── main.rs                 # Application entry point and server setup
├── error.rs               # Custom error types and conversions
├── db.rs                  # Database connection and queries
├── cache.rs               # Redis client and operations
├── models/
│   ├── mod.rs            # Model exports
│   └── todo.rs           # Todo model and DTOs
└── handlers/
    ├── mod.rs            # Handler exports
    ├── health.rs         # Health check handlers
    ├── todos.rs          # Todo CRUD handlers
    └── stats.rs          # Statistics handler
```

## Key Features

### Error Handling

All errors are typed using `thiserror` and implement `IntoResponse` for automatic HTTP error responses:

```rust
pub enum AppError {
    Database(sqlx::Error),
    Redis(redis::RedisError),
    NotFound(String),
    BadRequest(String),
    Internal(String),
}
```

### Caching Strategy

- List endpoint (`GET /api/todos`) is cached for 60 seconds
- Cache is invalidated on create, update, and delete operations
- Cache misses automatically fetch from database and repopulate cache

### Database Connection Pooling

- Maximum 5 concurrent connections
- Automatic connection management via sqlx
- Connection health checks on startup and health endpoint

### Validation

Input validation for todo creation and updates:
- Title cannot be empty
- Title must be less than 500 characters
- Returns 400 Bad Request with error details

## Production Considerations

### Environment Variables

Always set these in production:
- `DATABASE_URL`: PostgreSQL connection string with strong credentials
- `REDIS_URL`: Redis connection string (consider using Redis Sentinel/Cluster)
- `PORT`: Server port (default: 8080)
- `RUST_LOG`: Log level (recommend "info" for production)

### Security

- Non-root user in Docker container
- No sensitive data in logs (URLs are masked)
- Connection pooling prevents resource exhaustion
- Input validation on all endpoints

### Observability

- Structured logging with tracing
- Health and readiness endpoints for orchestration
- Request/response logging via tower-http

### Performance

- Async/await throughout for high concurrency
- Connection pooling for database and Redis
- Efficient serialization with serde
- Caching reduces database load

## Example Requests

### Create Todo
```bash
curl -X POST http://localhost:8080/api/todos \
  -H "Content-Type: application/json" \
  -d '{"title":"Buy groceries","completed":false}'
```

### List Todos
```bash
curl http://localhost:8080/api/todos
```

### Update Todo
```bash
curl -X PUT http://localhost:8080/api/todos/{id} \
  -H "Content-Type: application/json" \
  -d '{"completed":true}'
```

### Get Statistics
```bash
curl http://localhost:8080/api/stats
```

### Health Check
```bash
curl http://localhost:8080/health
```

## License

MIT
