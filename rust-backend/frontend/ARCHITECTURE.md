# Frontend Architecture

## Overview

A modern, modular frontend built with vanilla JavaScript ES6+ modules, following best practices for separation of concerns and maintainability.

## Directory Structure

```
frontend/
├── index.html                  # Main HTML entry point
├── css/
│   └── style.css              # Modern CSS with custom properties
├── js/
│   ├── config.js              # Configuration management
│   ├── api.js                 # API client and service layer
│   └── app.js                 # Application logic and UI
├── Dockerfile                 # Production container image
├── nginx.conf                 # Web server configuration
├── start-dev.sh              # Development server script
├── .dockerignore             # Docker build exclusions
├── docker-compose.example.yml # Full stack orchestration example
├── README.md                  # Complete documentation
├── QUICKSTART.md             # Quick start guide
└── ARCHITECTURE.md           # This file
```

## Module Architecture

### Layer 1: Configuration (`js/config.js`)
```
┌─────────────────────────────┐
│      Configuration          │
│  - API endpoints            │
│  - Timeout settings         │
│  - Feature flags            │
│  - Runtime overrides        │
└─────────────────────────────┘
```

**Responsibilities:**
- Define application constants
- Manage API URLs and endpoints
- Allow runtime configuration via `window.CONFIG`
- Provide immutable configuration object

**Key Features:**
- Environment-agnostic (dev/staging/prod)
- Override via script tag before module load
- Frozen object prevents accidental mutations

### Layer 2: API Client (`js/api.js`)
```
┌─────────────────────────────┐
│       API Client            │
│  ┌─────────────────────┐   │
│  │    APIClient        │   │
│  │  - request()        │   │
│  │  - get/post/put     │   │
│  │  - delete/patch     │   │
│  │  - checkHealth()    │   │
│  └─────────────────────┘   │
│  ┌─────────────────────┐   │
│  │    TodoAPI          │   │
│  │  - getAll()         │   │
│  │  - create()         │   │
│  │  - update()         │   │
│  │  - delete()         │   │
│  │  - toggleComplete() │   │
│  └─────────────────────┘   │
└─────────────────────────────┘
```

**Responsibilities:**
- HTTP communication with backend
- Request/response handling
- Error handling and retries
- Timeout management
- Health check monitoring

**Key Features:**
- Generic `APIClient` for HTTP operations
- Specialized `TodoAPI` for business logic
- Custom `APIError` class for structured errors
- Automatic timeout with AbortController
- Type-safe error responses

**Design Patterns:**
- Service Layer pattern
- Singleton instances
- Promise-based async/await
- Error boundary handling

### Layer 3: Application (`js/app.js`)
```
┌─────────────────────────────────────────┐
│           Application Layer             │
│  ┌───────────────────────────────────┐  │
│  │         State Management          │  │
│  │  - todos[]                        │  │
│  │  - filter (all/active/completed)  │  │
│  │  - isConnected                    │  │
│  │  - isLoading                      │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │      Event Handlers               │  │
│  │  - handleAddTodo()                │  │
│  │  - handleToggleTodo()             │  │
│  │  - handleDeleteTodo()             │  │
│  │  - handleClearCompleted()         │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │       UI Rendering                │  │
│  │  - renderTodos()                  │  │
│  │  - updateConnectionStatus()       │  │
│  │  - showError() / hideError()      │  │
│  │  - setLoading()                   │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

**Responsibilities:**
- Application state management
- DOM manipulation and rendering
- Event handling and user interactions
- Optimistic UI updates
- Connection monitoring

**Key Features:**
- Centralized state object
- Optimistic updates with rollback
- Automatic health checks (30s interval)
- Filter management (all/active/completed)
- Error recovery with retry logic

**Design Patterns:**
- MVC-like separation (Model=state, View=render, Controller=handlers)
- Observer pattern for UI updates
- Optimistic UI pattern
- Error boundary with rollback

## Data Flow

### Initialization Flow
```
1. Browser loads index.html
2. Loads config.js → Sets up CONFIG
3. Loads api.js → Creates APIClient & TodoAPI
4. Loads app.js → Calls init()
5. init() → checkConnection()
6. If connected → loadTodos()
7. startHealthCheck() → Monitor every 30s
```

### User Action Flow (Add Todo)
```
User types + submits
    ↓
handleAddTodo(event)
    ↓
todoAPI.create(title)  ← API Client
    ↓
Backend API (POST /todos)
    ↓
Response: new todo object
    ↓
state.todos.unshift(newTodo)  ← Update state
    ↓
renderTodos()  ← Re-render UI
```

### Optimistic Update Flow (Toggle Todo)
```
User clicks checkbox
    ↓
handleToggleTodo(id)
    ↓
1. Save previous state
2. Update UI immediately (optimistic)
3. renderTodos()  ← User sees instant feedback
    ↓
todoAPI.toggleComplete(id, completed)
    ↓
If success: Keep UI as-is
If error: Rollback state + re-render
```

## State Management

### State Object
```javascript
const state = {
    todos: [],              // Array of todo objects
    filter: 'all',          // Current filter
    isConnected: false,     // Backend connection status
    isLoading: false        // Loading indicator
};
```

### State Mutations
- Only through event handlers
- Immutable patterns where possible
- Optimistic updates with rollback capability

### UI Sync
- Manual re-rendering on state change
- No virtual DOM (lightweight approach)
- Direct DOM manipulation via `innerHTML`

## CSS Architecture

### Design System
```css
:root {
    /* Color Palette */
    --color-primary: #6366f1;
    --color-success: #10b981;
    --color-danger: #ef4444;

    /* Spacing Scale */
    --spacing-xs: 0.25rem;
    --spacing-sm: 0.5rem;
    --spacing-md: 1rem;
    /* ... */

    /* Typography Scale */
    --font-size-sm: 0.875rem;
    --font-size-base: 1rem;
    /* ... */

    /* Component Variables */
    --radius-sm: 0.375rem;
    --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
    --transition-fast: 150ms;
}
```

### Layout System
- **CSS Grid** for main layout
- **Flexbox** for component alignment
- **Mobile-first** responsive design
- **Custom properties** for theming

### Component Structure
```
.container
├── .app-header
│   ├── h1
│   └── .status-indicator
├── .app-main
│   ├── .todo-input-section
│   │   └── .todo-form
│   ├── .todo-list-section
│   │   ├── .todo-filters
│   │   ├── .todo-list
│   │   │   └── .todo-item (repeating)
│   │   └── .todo-footer
│   └── (states: empty, error, loading)
└── (inline scripts)
```

## Error Handling Strategy

### Network Errors
1. Catch at API Client level
2. Convert to `APIError` with status code
3. Display user-friendly message
4. Offer retry mechanism
5. Log to console for debugging

### Optimistic Update Failures
1. Store previous state before update
2. Update UI immediately
3. Call API
4. On error: Rollback state + re-render
5. Show error alert to user

### Connection Monitoring
1. Health check every 30 seconds
2. Update status indicator
3. On disconnect: Show error state
4. On reconnect: Auto-reload todos

## Performance Optimizations

### Network
- Request timeout (10s)
- Health check caching
- Minimal API calls (optimistic updates)
- Gzip compression (nginx)

### Rendering
- No virtual DOM overhead
- Direct DOM manipulation
- Debounced filter updates
- Conditional rendering (states)

### Assets
- Single CSS file (~12KB)
- Three JS modules (~15KB total)
- No external dependencies
- Browser caching (1 year for assets)

### Bundle Size
```
index.html:     ~4 KB
css/style.css: ~12 KB
js/config.js:   ~1 KB
js/api.js:      ~6 KB
js/app.js:     ~10 KB
─────────────────────
Total:         ~33 KB (uncompressed)
Gzipped:       ~10 KB
```

## Security Considerations

### XSS Prevention
- HTML escaping via `escapeHtml()`
- No `innerHTML` with user content
- No `eval()` or dynamic script execution
- CSP-friendly (no inline scripts)

### CORS
- Configured in nginx.conf
- Adjust `Access-Control-Allow-Origin` for production
- Preflight request handling

### Content Security Policy
- No inline scripts or styles
- All JS loaded as modules
- Strict CSP headers in nginx

## Browser Compatibility

### Required Features
- ES6 Modules (import/export)
- Async/await
- Fetch API
- CSS Grid
- CSS Custom Properties
- Template literals

### Supported Browsers
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

### Polyfills
None required for modern browsers. For older browsers, consider:
- Babel for ES6+ transpilation
- Polyfill.io for fetch/Promise
- CSS Grid fallback with Flexbox

## Deployment

### Development
```bash
python3 -m http.server 3000
```
Simple, no build required.

### Production (Docker)
```dockerfile
FROM nginx:alpine
COPY . /usr/share/nginx/html
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
```

### Configuration per Environment
```javascript
// dev
window.CONFIG = {
  API_BASE_URL: 'http://localhost:8080'
};

// prod
window.CONFIG = {
  API_BASE_URL: 'https://api.example.com'
};
```

## Testing Strategy

### Manual Testing Checklist
- [ ] Load page, verify connection status
- [ ] Add todo, verify it appears
- [ ] Toggle completion, verify state
- [ ] Delete todo, verify removal
- [ ] Filter todos (all/active/completed)
- [ ] Clear completed todos
- [ ] Test with backend offline
- [ ] Test error recovery
- [ ] Test on mobile viewport
- [ ] Test keyboard navigation
- [ ] Test with screen reader

### Automated Testing (Future)
Could add:
- Jest for unit tests
- Playwright for E2E tests
- Lighthouse for performance
- axe for accessibility

## Extension Points

### Adding New Features
1. **New API endpoint**: Add method to `TodoAPI` class
2. **New UI component**: Add HTML to `index.html`, styles to `style.css`
3. **New handler**: Add function to `app.js`, wire up in `setupEventListeners()`
4. **New configuration**: Add to `defaultConfig` in `config.js`

### Customization
- **Theming**: Modify CSS custom properties in `:root`
- **Layout**: Adjust Grid/Flexbox in `style.css`
- **API URL**: Override `window.CONFIG.API_BASE_URL`
- **Behavior**: Modify handlers in `app.js`

## Best Practices Applied

1. **Separation of Concerns**: Config → API → App layers
2. **Single Responsibility**: Each module has one job
3. **DRY**: Reusable functions, no duplication
4. **Error Handling**: Graceful degradation
5. **Accessibility**: ARIA labels, semantic HTML
6. **Performance**: Minimal dependencies, optimized assets
7. **Security**: XSS prevention, CSP compliance
8. **Maintainability**: Clear code structure, documentation
9. **Testability**: Pure functions, modular design
10. **User Experience**: Optimistic updates, loading states

## Future Enhancements

### Short Term
- [ ] Add todo editing capability
- [ ] Local storage backup
- [ ] Keyboard shortcuts
- [ ] Dark mode toggle

### Medium Term
- [ ] Drag and drop reordering
- [ ] Due dates and reminders
- [ ] Categories/tags
- [ ] Search functionality
- [ ] Bulk operations

### Long Term
- [ ] Progressive Web App (PWA)
- [ ] Offline support with Service Worker
- [ ] Real-time sync (WebSockets)
- [ ] Multi-user collaboration
- [ ] Export/import (JSON, CSV)

## Resources

- [MDN Web Docs](https://developer.mozilla.org/)
- [ES6 Modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
- [CSS Grid](https://css-tricks.com/snippets/css/complete-guide-grid/)
- [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
