#!/bin/bash

# Simple development server for the frontend
# Requires Python 3 (pre-installed on macOS)

PORT=3000
FRONTEND_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Starting development server for Todo List Frontend..."
echo "Frontend directory: $FRONTEND_DIR"
echo "Server will be available at: http://localhost:$PORT"
echo ""
echo "Make sure your Rust backend is running at http://localhost:8080"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

cd "$FRONTEND_DIR" && python3 -m http.server $PORT
