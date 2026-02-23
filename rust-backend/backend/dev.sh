#!/bin/bash

# Development helper script for Rust backend

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${BLUE}Creating .env file from .env.example...${NC}"
    cp .env.example .env
    echo -e "${GREEN}Done! Please update .env with your database credentials${NC}"
    exit 0
fi

# Command handling
case "${1:-run}" in
    run|start)
        echo -e "${BLUE}Starting Rust backend...${NC}"
        cargo run
        ;;

    build)
        echo -e "${BLUE}Building Rust backend...${NC}"
        cargo build
        ;;

    release)
        echo -e "${BLUE}Building release version...${NC}"
        cargo build --release
        ;;

    test)
        echo -e "${BLUE}Running tests...${NC}"
        cargo test
        ;;

    check)
        echo -e "${BLUE}Checking code...${NC}"
        cargo check
        ;;

    format|fmt)
        echo -e "${BLUE}Formatting code...${NC}"
        cargo fmt
        ;;

    lint)
        echo -e "${BLUE}Running clippy...${NC}"
        cargo clippy -- -D warnings
        ;;

    docker-build)
        echo -e "${BLUE}Building Docker image...${NC}"
        docker build -t rust-backend:latest .
        ;;

    docker-run)
        echo -e "${BLUE}Running Docker container...${NC}"
        docker run -d \
            -p 8080:8080 \
            --env-file .env \
            --name rust-backend \
            rust-backend:latest
        echo -e "${GREEN}Container started! Access at http://localhost:8080${NC}"
        ;;

    docker-stop)
        echo -e "${BLUE}Stopping Docker container...${NC}"
        docker stop rust-backend || true
        docker rm rust-backend || true
        ;;

    clean)
        echo -e "${BLUE}Cleaning build artifacts...${NC}"
        cargo clean
        ;;

    help)
        echo "Usage: ./dev.sh [command]"
        echo ""
        echo "Commands:"
        echo "  run           - Run the application (default)"
        echo "  build         - Build the application"
        echo "  release       - Build release version"
        echo "  test          - Run tests"
        echo "  check         - Check code without building"
        echo "  format        - Format code with rustfmt"
        echo "  lint          - Run clippy linter"
        echo "  docker-build  - Build Docker image"
        echo "  docker-run    - Run Docker container"
        echo "  docker-stop   - Stop Docker container"
        echo "  clean         - Clean build artifacts"
        echo "  help          - Show this help"
        ;;

    *)
        echo -e "${RED}Unknown command: $1${NC}"
        echo "Run './dev.sh help' for usage"
        exit 1
        ;;
esac
