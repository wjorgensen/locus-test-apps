# Quick Start Guide

Get the Go Fullstack Backend up and running in under 5 minutes.

## Prerequisites

- Go 1.22+ (or Docker)
- Make (optional, for convenience commands)

## Option 1: Docker Compose (Recommended)

The fastest way to get started:

```bash
# Start all services (backend, PostgreSQL, Redis)
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f backend

# Test the API
curl http://localhost:8080/health
```

That's it! The API is now running at http://localhost:8080

## Option 2: Local Development

### Step 1: Start Dependencies

```bash
# Start PostgreSQL
docker run -d --name postgres -p 5432:5432 \
  -e POSTGRES_PASSWORD=postgres \
  postgres:15-alpine

# Start Redis
docker run -d --name redis -p 6379:6379 \
  redis:7-alpine
```

### Step 2: Install Dependencies

```bash
cd ~/locus-test-apps/go-fullstack/backend
go mod download
```

### Step 3: Set Environment Variables

```bash
export DATABASE_URL="postgres://postgres:postgres@localhost:5432/todos?sslmode=disable"
export REDIS_URL="redis://localhost:6379/0"
export PORT="8080"
export GIN_MODE="debug"
```

### Step 4: Run the Application

```bash
# Using Go directly
go run main.go

# Or using Make
make run

# Or with hot reload (requires air)
make dev
```

## Testing the API

### Health Check

```bash
curl http://localhost:8080/health
```

Expected response:
```json
{
  "status": "healthy",
  "services": {
    "database": "healthy",
    "redis": "healthy"
  },
  "time": "2024-01-15T10:30:00Z"
}
```

### Create a Todo

```bash
curl -X POST http://localhost:8080/api/todos \
  -H "Content-Type: application/json" \
  -d '{"title": "Buy groceries", "completed": false}'
```

### List Todos

```bash
curl http://localhost:8080/api/todos
```

### Get Statistics

```bash
curl http://localhost:8080/api/stats
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/todos` | List all todos (cached) |
| GET | `/api/todos/:id` | Get a specific todo |
| POST | `/api/todos` | Create a new todo |
| PUT | `/api/todos/:id` | Update a todo |
| DELETE | `/api/todos/:id` | Delete a todo |
| GET | `/api/stats` | Get statistics |

## Common Commands

### Using Make

```bash
make help          # Show all commands
make deps          # Download dependencies
make build         # Build the binary
make run           # Run the application
make test          # Run tests
make docker-run    # Start with Docker Compose
make docker-stop   # Stop Docker Compose
make clean         # Clean build artifacts
```

### Using Go directly

```bash
go run main.go           # Run
go build -o server       # Build
go test ./...            # Test
go mod tidy              # Clean dependencies
```

### Using Docker

```bash
docker-compose up -d     # Start services
docker-compose down      # Stop services
docker-compose logs -f   # View logs
docker-compose ps        # Check status
```

## Stopping the Application

### Docker Compose

```bash
docker-compose down

# Remove volumes (data will be lost)
docker-compose down -v
```

### Local Development

Press `Ctrl+C` in the terminal running the application.

Clean up Docker containers:
```bash
docker stop postgres redis
docker rm postgres redis
```

## Troubleshooting

### Port already in use

```bash
# Find process using port 8080
lsof -i :8080

# Kill the process
kill -9 <PID>
```

### Database connection failed

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check PostgreSQL logs
docker logs postgres
```

### Redis connection failed

```bash
# Check if Redis is running
docker ps | grep redis

# Check Redis logs
docker logs redis
```

### "Go command not found"

Install Go from https://go.dev/doc/install or use the Docker Compose option.

## Next Steps

- Read the [README](README.md) for detailed information
- Check [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment
- Explore the code in the `handlers/`, `database/`, and `cache/` directories
- Add your own endpoints and features

## Development Tips

1. **Use hot reload** for faster development:
   ```bash
   make dev  # Automatically reloads on code changes
   ```

2. **Check the cache** header:
   ```bash
   curl -I http://localhost:8080/api/todos
   # Look for X-Cache: HIT or X-Cache: MISS
   ```

3. **Enable debug mode** for verbose logging:
   ```bash
   export GIN_MODE=debug
   ```

4. **Run tests** before committing:
   ```bash
   make test
   ```

## Need Help?

- Check the [README](README.md) for comprehensive documentation
- Review [DEPLOYMENT.md](DEPLOYMENT.md) for deployment guides
- Look at the code examples in `handlers/` directory
- Open an issue on GitHub

Happy coding!
