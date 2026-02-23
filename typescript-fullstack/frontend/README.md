# Todo Frontend - Next.js 14

A production-ready frontend application built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

- **Next.js 14** with App Router
- **Server-Side Rendering** for optimal performance
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Production-ready Dockerfile** with multi-stage build and standalone output
- **Real-time connection status** monitoring
- **Complete CRUD operations** for todos
- **Error handling** and loading states
- **Responsive design** with modern UI

## Prerequisites

- Node.js 20+
- npm or yarn
- Backend API running (see backend README)

## Quick Start

### Development

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Update `.env` with your backend URL:
```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

### Production Build

Build the application:
```bash
npm run build
npm start
```

### Docker

Build the image:
```bash
docker build -t todo-frontend .
```

Run the container:
```bash
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=http://backend:4000 \
  todo-frontend
```

Or with docker-compose:
```bash
# From the parent directory
docker-compose up
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:4000` |

## Project Structure

```
frontend/
├── app/
│   ├── api/
│   │   └── health/          # Health check endpoint
│   │       └── route.ts
│   ├── globals.css          # Global styles with Tailwind
│   ├── layout.tsx           # Root layout with header/footer
│   └── page.tsx             # Home page
├── components/
│   └── TodoList.tsx         # Main todo list component
├── lib/
│   └── api.ts               # API client with typed methods
├── public/                  # Static assets
├── Dockerfile               # Multi-stage production build
├── .dockerignore            # Docker ignore patterns
├── next.config.js           # Next.js configuration
├── tailwind.config.js       # Tailwind CSS configuration
├── postcss.config.js        # PostCSS configuration
├── tsconfig.json            # TypeScript configuration
├── package.json             # Dependencies and scripts
└── README.md                # This file
```

## API Integration

The frontend communicates with the backend through the `apiClient` in `lib/api.ts`:

```typescript
// Get all todos
const todos = await apiClient.getTodos();

// Create a todo
const newTodo = await apiClient.createTodo({ title: 'New task' });

// Update a todo
const updated = await apiClient.updateTodo(id, { completed: true });

// Delete a todo
await apiClient.deleteTodo(id);
```

## Features

### Connection Status
- Real-time monitoring of backend connectivity
- Visual indicators (connected/disconnected/connecting)
- Automatic reconnection attempts every 10 seconds

### Todo Management
- **Create**: Add new todos with title validation
- **Read**: View all todos with completion status
- **Update**: Edit titles inline or toggle completion
- **Delete**: Remove todos with confirmation

### UI/UX
- Loading states for all async operations
- Error messages with dismiss option
- Optimistic UI updates
- Responsive design for mobile/tablet/desktop
- Keyboard shortcuts (Enter to save, Escape to cancel)

### Statistics
- Total todos count
- Completed todos count
- Remaining todos count

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |

## Production Deployment

### Using Docker

1. Build the image:
```bash
docker build -t todo-frontend:latest .
```

2. Run with environment variables:
```bash
docker run -d \
  --name todo-frontend \
  -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=https://api.yourdomain.com \
  todo-frontend:latest
```

### Using a Platform (Vercel, Netlify, etc.)

1. Set environment variables in your platform's dashboard:
   - `NEXT_PUBLIC_API_URL`: Your backend API URL

2. Deploy:
```bash
# Vercel
vercel --prod

# Netlify
netlify deploy --prod
```

## Optimization Features

- **Standalone Output**: Minimal production bundle
- **Multi-stage Docker Build**: Smaller image size
- **Image Optimization**: Automatic with Next.js
- **Code Splitting**: Automatic route-based splitting
- **Static Generation**: Pre-rendered pages where possible
- **Compression**: Built-in gzip compression
- **Security Headers**: X-Frame-Options, CSP, etc.

## Health Check

The application includes a health check endpoint at `/api/health`:

```bash
curl http://localhost:3000/api/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-20T12:00:00.000Z",
  "service": "todo-frontend"
}
```

## Browser Support

- Chrome (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Edge (last 2 versions)

## Troubleshooting

### Port already in use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run dev
```

### Cannot connect to backend
1. Verify backend is running
2. Check `NEXT_PUBLIC_API_URL` in `.env`
3. Verify CORS is enabled on backend
4. Check network connectivity

### Build fails
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Try building again
npm run build
```

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Support

For issues and questions, please open an issue on GitHub.
