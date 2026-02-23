# Quick Start Guide

## Option 1: Docker Compose (Recommended)

The fastest way to get started is using Docker Compose, which sets up PostgreSQL, Redis, and the backend automatically:

```bash
# Start all services
docker-compose up -d

# Check logs
docker-compose logs -f backend

# Test the API
./test-api.sh

# Stop all services
docker-compose down
```

Access the API at: http://localhost:8080

## Option 2: Local Development

### Prerequisites

1. Install Rust (https://rustup.rs/):
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

2. Install PostgreSQL and Redis:
   ```bash
   # macOS
   brew install postgresql@15 redis
   brew services start postgresql@15
   brew services start redis

   # Ubuntu/Debian
   sudo apt install postgresql-15 redis-server
   sudo systemctl start postgresql redis-server
   ```

3. Create database:
   ```bash
   createdb todos
   ```

### Setup

1. Copy environment file:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your credentials:
   ```env
   DATABASE_URL=postgresql://postgres:password@localhost:5432/todos
   REDIS_URL=redis://127.0.0.1:6379
   PORT=8080
   RUST_LOG=debug
   ```

3. Run the application:
   ```bash
   cargo run
   # or use the helper script
   ./dev.sh run
   ```

## Option 3: Docker Only

Build and run just the backend in Docker:

```bash
# Build image
docker build -t rust-backend:latest .

# Run container (requires PostgreSQL and Redis running separately)
docker run -d \
  -p 8080:8080 \
  -e DATABASE_URL=postgresql://user:pass@host.docker.internal:5432/todos \
  -e REDIS_URL=redis://host.docker.internal:6379 \
  -e RUST_LOG=info \
  --name rust-backend \
  rust-backend:latest
```

## Testing the API

### Health Check
```bash
curl http://localhost:8080/health
```

### Create a Todo
```bash
curl -X POST http://localhost:8080/api/todos \
  -H "Content-Type: application/json" \
  -d '{"title":"Buy milk","completed":false}'
```

### List Todos
```bash
curl http://localhost:8080/api/todos
```

### Get Statistics
```bash
curl http://localhost:8080/api/stats
```

### Run Full Test Suite
```bash
./test-api.sh
```

## Development Commands

Using the helper script (`./dev.sh`):

```bash
./dev.sh run          # Run the application
./dev.sh build        # Build the application
./dev.sh test         # Run tests
./dev.sh format       # Format code
./dev.sh lint         # Run linter
./dev.sh docker-build # Build Docker image
./dev.sh clean        # Clean build artifacts
./dev.sh help         # Show all commands
```

## Project Structure

```
backend/
├── src/
│   ├── main.rs              # Entry point & server setup
│   ├── error.rs             # Custom error types
│   ├── db.rs                # PostgreSQL operations
│   ├── cache.rs             # Redis operations
│   ├── models/
│   │   ├── mod.rs          # Model exports
│   │   └── todo.rs         # Todo model & DTOs
│   └── handlers/
│       ├── mod.rs          # Handler exports
│       ├── health.rs       # Health checks
│       ├── todos.rs        # CRUD operations
│       └── stats.rs        # Statistics
├── Cargo.toml              # Dependencies
├── Dockerfile              # Multi-stage build
├── docker-compose.yml      # Local development stack
└── README.md              # Full documentation
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /health | Health check (DB + Redis) |
| GET | /ready | Readiness probe |
| GET | /api/todos | List all todos (cached 60s) |
| POST | /api/todos | Create a todo |
| GET | /api/todos/:id | Get a specific todo |
| PUT | /api/todos/:id | Update a todo |
| DELETE | /api/todos/:id | Delete a todo |
| GET | /api/stats | Get statistics |

## Troubleshooting

### Database connection failed
- Ensure PostgreSQL is running
- Check DATABASE_URL in .env
- Verify database exists: `createdb todos`

### Redis connection failed
- Ensure Redis is running
- Check REDIS_URL in .env
- Test Redis: `redis-cli ping`

### Port already in use
- Change PORT in .env
- Check for running processes: `lsof -i :8080`

### Build errors
- Update Rust: `rustup update`
- Clean and rebuild: `cargo clean && cargo build`

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Explore the source code in `src/`
- Add authentication and authorization
- Add more endpoints (filtering, pagination, search)
- Set up CI/CD pipeline
- Deploy to production

## Resources

- [Axum Documentation](https://docs.rs/axum/latest/axum/)
- [sqlx Documentation](https://docs.rs/sqlx/latest/sqlx/)
- [Redis-rs Documentation](https://docs.rs/redis/latest/redis/)
- [Tokio Documentation](https://tokio.rs/)
