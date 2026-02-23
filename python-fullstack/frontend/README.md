# Locus Todo Frontend

A modern React + Vite + TypeScript frontend application for the Locus fullstack todo demo.

## Features

- **React 18** with TypeScript for type safety
- **Vite** for fast development and optimized builds
- **Responsive design** that works on mobile and desktop
- **Real-time connection status** indicator
- **Full CRUD operations** for todos
- **Clean, modern UI** with dark/light mode support
- **Production-ready** Docker container with nginx

## Prerequisites

- Node.js 18+ and npm
- Docker (for containerized deployment)

## Development

### Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env to point to your backend API
# VITE_API_URL=http://localhost:8000
```

### Run Development Server

```bash
npm run dev
```

The app will be available at http://localhost:5173

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Docker Deployment

### Build Docker Image

```bash
docker build -t locus-todo-frontend:latest .
```

### Build with Custom API URL

```bash
docker build --build-arg VITE_API_URL=http://your-api-url:8000 -t locus-todo-frontend:latest .
```

### Run Docker Container

```bash
docker run -p 3000:3000 locus-todo-frontend:latest
```

The app will be available at http://localhost:3000

### Docker Compose Integration

This frontend is designed to work with the backend in a Docker Compose setup. See the main README in the parent directory for full-stack deployment instructions.

## Project Structure

```
frontend/
├── src/
│   ├── api/
│   │   └── client.ts          # API client with typed requests
│   ├── components/
│   │   ├── TodoList.tsx        # Main todo list component
│   │   └── TodoList.css        # Component styles
│   ├── App.tsx                 # Root application component
│   ├── App.css                 # App-level styles
│   ├── main.tsx                # Application entry point
│   ├── index.css               # Global styles
│   └── vite-env.d.ts           # TypeScript declarations
├── index.html                  # HTML entry point
├── vite.config.ts              # Vite configuration
├── tsconfig.json               # TypeScript configuration
├── package.json                # Dependencies and scripts
├── Dockerfile                  # Multi-stage production build
├── nginx.conf                  # Nginx configuration
└── README.md                   # This file
```

## API Integration

The frontend communicates with the backend API using a typed client (`src/api/client.ts`):

- `GET /health` - Check backend health
- `GET /todos` - Fetch all todos
- `POST /todos` - Create a new todo
- `PUT /todos/:id` - Update a todo
- `DELETE /todos/:id` - Delete a todo

Configure the backend URL using the `VITE_API_URL` environment variable.

## Features in Detail

### Connection Status

A real-time indicator shows whether the frontend can reach the backend API. The indicator updates automatically and shows:
- Green: Connected
- Red: Disconnected

### Todo Operations

- **Add**: Enter text and click "Add Todo"
- **Toggle**: Click the checkbox to mark complete/incomplete
- **Delete**: Click the "Delete" button to remove a todo
- **Auto-refresh**: List updates immediately after any operation

### Error Handling

The app gracefully handles errors and displays user-friendly messages when:
- Backend is unreachable
- Network requests fail
- Invalid data is received

### Responsive Design

The layout adapts to different screen sizes:
- Desktop: Horizontal form layout
- Mobile: Vertical form layout, optimized touch targets

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:8000` |

## Performance

The production Docker image is optimized for performance:

- **Multi-stage build** reduces final image size
- **Nginx** serves static files efficiently
- **Gzip compression** enabled for all text assets
- **Cache headers** set for optimal browser caching
- **Health check** endpoint for container orchestration

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT
