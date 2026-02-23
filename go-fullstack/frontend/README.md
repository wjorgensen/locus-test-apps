# Go Fullstack Frontend - Vue 3 + TypeScript + Vite

A modern Vue 3 frontend application for the Go fullstack todo app, built with TypeScript and Vite.

## Features

- Vue 3 with Composition API
- TypeScript for type safety
- Vite for fast development and optimized builds
- Real-time connection status to backend
- Full CRUD operations for todos
- Responsive design with dark/light mode support
- Production-ready Docker image with nginx

## Tech Stack

- **Vue 3** - Progressive JavaScript framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Next-generation frontend tooling
- **Nginx** - Production web server

## Project Structure

```
frontend/
├── src/
│   ├── api/
│   │   └── client.ts          # API client for backend communication
│   ├── components/
│   │   ├── TodoItem.vue       # Individual todo item component
│   │   └── TodoList.vue       # Todo list container component
│   ├── types/
│   │   └── index.ts           # TypeScript type definitions
│   ├── App.vue                # Main application component
│   ├── main.ts                # Application entry point
│   └── style.css              # Global styles
├── public/                     # Static assets
├── Dockerfile                  # Multi-stage production build
├── nginx.conf                  # Nginx configuration
├── vite.config.ts             # Vite configuration
└── package.json               # Dependencies and scripts
```

## Development

### Prerequisites

- Node.js 18+ and npm

### Setup

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Configure the backend API URL in `.env`:
```env
VITE_API_URL=http://localhost:8080
```

### Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

Built files will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Docker

### Build Docker Image

```bash
docker build -t go-fullstack-frontend .
```

### Run Docker Container

```bash
docker run -p 3000:3000 \
  -e VITE_API_URL=http://localhost:8080 \
  go-fullstack-frontend
```

### Docker Compose (with backend)

Create a `docker-compose.yml` in the project root:

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8080:8080"
    environment:
      - DATABASE_URL=postgres://user:pass@db:5432/todos?sslmode=disable
    depends_on:
      - db

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - VITE_API_URL=http://localhost:8080
    depends_on:
      - backend

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=todos
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

Run the full stack:

```bash
docker-compose up
```

## Component Architecture

### App.vue

Main application component that:
- Checks backend connection status
- Displays connection indicator
- Renders TodoList when connected
- Shows error state when disconnected

### TodoList.vue

Container component that:
- Fetches todos from the API
- Handles todo creation
- Manages todo updates and deletions
- Shows loading and empty states
- Displays error messages

### TodoItem.vue

Individual todo component that:
- Displays todo title and timestamp
- Allows inline editing (double-click)
- Toggles completion status
- Supports deletion with confirmation
- Keyboard shortcuts (Enter to save, Escape to cancel)

## API Client

The API client (`src/api/client.ts`) provides a clean interface for backend communication:

```typescript
// Health check
await apiClient.healthCheck()

// Get all todos
const todos = await apiClient.getTodos()

// Create todo
const newTodo = await apiClient.createTodo({ title: 'New task' })

// Update todo
const updated = await apiClient.updateTodo(1, { completed: true })

// Delete todo
await apiClient.deleteTodo(1)
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:8080` |

## Features in Detail

### Connection Status

The app continuously monitors the backend connection:
- Green dot: Connected
- Red dot: Disconnected
- Yellow dot: Checking connection
- Auto-retry every 30 seconds
- Manual retry button on error

### Todo Operations

**Create**: Type in the input field and click "Add" or press Enter

**Read**: Todos automatically load on connection

**Update**:
- Double-click todo text to edit
- Click checkbox to toggle completion
- Press Enter to save, Escape to cancel

**Delete**: Click × button and confirm

### Keyboard Shortcuts

- `Enter` - Save todo edit
- `Escape` - Cancel todo edit
- Double-click - Start editing todo

### Responsive Design

- Mobile-friendly layout
- Touch-friendly buttons
- Adaptive text sizes
- Dark/light mode support

## Production Deployment

The Dockerfile uses a multi-stage build:

1. **Builder stage**: Compiles the Vue app
2. **Production stage**: Serves static files with nginx

Benefits:
- Small image size (nginx:alpine base)
- Fast serving with nginx
- Environment variables injected at runtime
- Gzip compression enabled
- Security headers configured
- SPA routing support

## Performance

- Vite HMR for instant dev updates
- Code splitting and lazy loading
- Optimized production builds
- Gzip compression in production
- Static asset caching (1 year)

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES2020+ features required
- No IE11 support

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For issues and questions, please open an issue on GitHub.
