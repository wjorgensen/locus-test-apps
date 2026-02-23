import express, { Request, Response } from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import { createClient } from 'redis';

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Redis client
const redisClient = createClient({
  url: process.env.REDIS_URL,
});

// Initialize database and Redis
async function initialize() {
  try {
    // Connect to Redis
    await redisClient.connect();
    console.log('✅ Connected to Redis');

    // Test database connection
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL');

    // Create todos table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS todos (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Database schema initialized');

    client.release();
  } catch (error) {
    console.error('❌ Initialization error:', error);
    throw error;
  }
}

// Root route
app.get('/', (req: Request, res: Response) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Locus Demo</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0a0a; color: #e5e5e5; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .container { max-width: 640px; width: 100%; padding: 2rem; }
    h1 { font-size: 2rem; margin-bottom: 0.5rem; color: #fff; }
    .subtitle { color: #888; margin-bottom: 2rem; }
    .card { background: #161616; border: 1px solid #262626; border-radius: 12px; padding: 1.5rem; margin-bottom: 1rem; }
    .card h2 { font-size: 1rem; color: #a3a3a3; margin-bottom: 1rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 500; }
    .endpoint { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid #222; }
    .endpoint:last-child { border-bottom: none; }
    .method { background: #1a3a2a; color: #4ade80; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; font-family: monospace; font-weight: 600; }
    .method.post { background: #1a2a3a; color: #60a5fa; }
    .method.put { background: #2a2a1a; color: #facc15; }
    .method.del { background: #2a1a1a; color: #f87171; }
    .path { font-family: monospace; color: #d4d4d4; }
    .status { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 999px; font-size: 0.85rem; }
    .status.ok { background: #052e16; color: #4ade80; }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: #4ade80; animation: pulse 2s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
    .footer { text-align: center; margin-top: 2rem; color: #525252; font-size: 0.85rem; }
    a { color: #60a5fa; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Locus Demo App</h1>
    <p class="subtitle">TypeScript full-stack application deployed on <a href="https://github.com/wjorgensen/locus-test-apps">Locus</a></p>
    <div class="card">
      <h2>Status</h2>
      <span class="status ok"><span class="dot"></span> Operational</span>
    </div>
    <div class="card">
      <h2>API Endpoints</h2>
      <div class="endpoint"><span class="method">GET</span> <span class="path">/health</span></div>
      <div class="endpoint"><span class="method">GET</span> <span class="path">/api/todos</span></div>
      <div class="endpoint"><span class="method post">POST</span> <span class="path">/api/todos</span></div>
      <div class="endpoint"><span class="method put">PUT</span> <span class="path">/api/todos/:id</span></div>
      <div class="endpoint"><span class="method del">DEL</span> <span class="path">/api/todos/:id</span></div>
      <div class="endpoint"><span class="method">GET</span> <span class="path">/api/stats</span></div>
    </div>
    <p class="footer">Powered by Locus Platform</p>
  </div>
</body>
</html>`);
});

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  try {
    // Check database
    const dbStart = Date.now();
    const dbResult = await pool.query('SELECT 1 as health');
    const dbLatency = Date.now() - dbStart;

    // Check Redis
    const redisStart = Date.now();
    const redisPing = await redisClient.ping();
    const redisLatency = Date.now() - redisStart;

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: {
        connected: dbResult.rows.length > 0,
        latency: dbLatency,
      },
      redis: {
        connected: redisPing === 'PONG',
        latency: redisLatency,
      },
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Database connectivity check
app.get('/api/db-check', async (req: Request, res: Response) => {
  try {
    const start = Date.now();
    const result = await pool.query('SELECT current_database(), current_user, version()');
    const latency = Date.now() - start;

    res.json({
      connected: true,
      latency,
      database: result.rows[0].current_database,
      user: result.rows[0].current_user,
      version: result.rows[0].version.split(' ')[0] + ' ' + result.rows[0].version.split(' ')[1],
    });
  } catch (error) {
    res.status(500).json({
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Redis connectivity check
app.get('/api/redis-check', async (req: Request, res: Response) => {
  try {
    const start = Date.now();
    const ping = await redisClient.ping();
    const latency = Date.now() - start;

    // Test SET/GET
    await redisClient.set('health-check', 'ok');
    const value = await redisClient.get('health-check');

    res.json({
      connected: true,
      ping,
      latency,
      setGetWorks: value === 'ok',
    });
  } catch (error) {
    res.status(500).json({
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get all todos (with caching)
app.get('/api/todos', async (req: Request, res: Response) => {
  const cacheKey = 'todos:all';

  try {
    // Try cache first
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return res.json({
        data: JSON.parse(cached),
        cached: true,
      });
    }

    // Query database
    const result = await pool.query('SELECT * FROM todos ORDER BY created_at DESC');

    // Cache for 60 seconds
    await redisClient.setEx(cacheKey, 60, JSON.stringify(result.rows));

    res.json({
      data: result.rows,
      cached: false,
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Create todo
app.post('/api/todos', async (req: Request, res: Response) => {
  const { title, completed = false } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO todos (title, completed) VALUES ($1, $2) RETURNING *',
      [title, completed]
    );

    // Invalidate cache
    await redisClient.del('todos:all');

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Update todo
app.put('/api/todos/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, completed } = req.body;

  try {
    const result = await pool.query(
      'UPDATE todos SET title = COALESCE($1, title), completed = COALESCE($2, completed) WHERE id = $3 RETURNING *',
      [title, completed, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    // Invalidate cache
    await redisClient.del('todos:all');

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Delete todo
app.delete('/api/todos/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM todos WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    // Invalidate cache
    await redisClient.del('todos:all');

    res.status(204).send();
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Statistics endpoint (demonstrates Redis usage)
app.get('/api/stats', async (req: Request, res: Response) => {
  try {
    // Increment page view counter
    await redisClient.incr('stats:page-views');

    const [pageViews, totalTodos] = await Promise.all([
      redisClient.get('stats:page-views'),
      pool.query('SELECT COUNT(*) as count FROM todos'),
    ]);

    res.json({
      pageViews: parseInt(pageViews || '0', 10),
      totalTodos: parseInt(totalTodos.rows[0].count, 10),
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');

  try {
    await redisClient.quit();
    await pool.end();
    console.log('✅ Connections closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

// Start server
initialize()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
    });
  })
  .catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
