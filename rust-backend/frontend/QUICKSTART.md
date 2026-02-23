# Quick Start Guide

Get the Todo List frontend running in under 2 minutes!

## Option 1: Local Development (Fastest)

### Step 1: Start the Backend
Make sure your Rust backend is running:
```bash
cd ~/locus-test-apps/rust-backend/backend
cargo run
```

The backend should be accessible at http://localhost:8080

### Step 2: Start the Frontend
```bash
cd ~/locus-test-apps/rust-backend/frontend
./start-dev.sh
```

### Step 3: Open in Browser
Visit http://localhost:3000

That's it! You should see the todo list application.

## Option 2: Docker (Production-like)

### Build and Run
```bash
cd ~/locus-test-apps/rust-backend/frontend

# Build the Docker image
docker build -t todo-frontend .

# Run the container
docker run -d -p 3000:3000 --name todo-frontend todo-frontend
```

### Access
Visit http://localhost:3000

### View Logs
```bash
docker logs -f todo-frontend
```

### Stop
```bash
docker stop todo-frontend
docker rm todo-frontend
```

## Option 3: Docker Compose (Full Stack)

### Setup
```bash
cd ~/locus-test-apps/rust-backend

# Copy the example docker-compose file
cp frontend/docker-compose.example.yml docker-compose.yml

# Start all services
docker-compose up -d
```

This will start:
- Frontend at http://localhost:3000
- Backend at http://localhost:8080
- PostgreSQL database at localhost:5432

### Check Status
```bash
docker-compose ps
docker-compose logs -f
```

### Stop All
```bash
docker-compose down
```

## Troubleshooting

### Frontend Can't Connect to Backend

1. **Check backend is running**:
   ```bash
   curl http://localhost:8080/health
   ```

   Should return: `OK`

2. **Check API URL** in `js/config.js`:
   ```javascript
   API_BASE_URL: 'http://localhost:8080'
   ```

3. **Check browser console** (F12) for CORS errors

### CORS Errors

Add CORS middleware to your Rust backend:

```rust
use tower_http::cors::{CorsLayer, Any};

let app = Router::new()
    .layer(
        CorsLayer::new()
            .allow_origin(Any)
            .allow_methods(Any)
            .allow_headers(Any)
    );
```

### Module Loading Errors

Make sure you're running a web server, not opening the file directly:
- Use `./start-dev.sh` or `python3 -m http.server 3000`
- Don't open `file:///path/to/index.html` directly

### Port Already in Use

Change the port in `start-dev.sh` or use a different port:
```bash
cd frontend
python3 -m http.server 3001
```

Then update the backend URL if needed.

## Next Steps

1. **Read the full README.md** for detailed documentation
2. **Customize styles** in `css/style.css`
3. **Modify configuration** in `js/config.js`
4. **Add features** in `js/app.js`

## Feature Overview

- Add todos by typing and pressing Enter
- Click checkbox to mark complete/incomplete
- Click trash icon to delete
- Filter by All/Active/Completed
- Clear all completed todos at once
- See connection status in header
- Responsive design works on mobile

Enjoy!
