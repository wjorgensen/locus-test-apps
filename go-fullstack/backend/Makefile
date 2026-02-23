.PHONY: help build run test clean docker-build docker-run docker-stop dev deps

# Default target
help:
	@echo "Available commands:"
	@echo "  make deps          - Download Go dependencies"
	@echo "  make build         - Build the application"
	@echo "  make run           - Run the application"
	@echo "  make dev           - Run in development mode"
	@echo "  make test          - Run tests"
	@echo "  make clean         - Clean build artifacts"
	@echo "  make docker-build  - Build Docker image"
	@echo "  make docker-run    - Run with Docker Compose"
	@echo "  make docker-stop   - Stop Docker Compose services"
	@echo "  make docker-clean  - Clean Docker resources"

# Download dependencies
deps:
	go mod download
	go mod verify

# Build the application
build:
	go build -o bin/server main.go

# Run the application
run:
	go run main.go

# Development mode with live reload (requires air)
dev:
	@if command -v air > /dev/null; then \
		air; \
	else \
		echo "air not installed. Installing..."; \
		go install github.com/cosmtrek/air@latest; \
		air; \
	fi

# Run tests
test:
	go test -v -cover ./...

# Run tests with race detection
test-race:
	go test -v -race ./...

# Run tests with coverage report
test-coverage:
	go test -v -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out -o coverage.html
	@echo "Coverage report generated: coverage.html"

# Clean build artifacts
clean:
	rm -rf bin/
	rm -f coverage.out coverage.html

# Docker commands
docker-build:
	docker build -t go-fullstack-backend:latest .

docker-run:
	docker-compose up -d

docker-stop:
	docker-compose down

docker-clean:
	docker-compose down -v
	docker rmi go-fullstack-backend:latest 2>/dev/null || true

# Format code
fmt:
	go fmt ./...

# Lint code (requires golangci-lint)
lint:
	@if command -v golangci-lint > /dev/null; then \
		golangci-lint run; \
	else \
		echo "golangci-lint not installed. Install it from https://golangci-lint.run/usage/install/"; \
	fi

# Show module info
mod-info:
	go list -m all

# Tidy dependencies
tidy:
	go mod tidy

# Generate documentation
docs:
	@echo "Starting godoc server on http://localhost:6060"
	@echo "Visit http://localhost:6060/pkg/github.com/locus/go-fullstack-backend/"
	godoc -http=:6060
