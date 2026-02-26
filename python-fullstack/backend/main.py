"""FastAPI application for Todo management with PostgreSQL and Redis."""
import logging
import os
import signal
import asyncio
import time
from contextlib import asynccontextmanager
from typing import List, Optional
from datetime import datetime

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text

from database import get_db, init_db, check_db_health, close_db, engine
from redis_client import (
    check_redis_health,
    close_redis,
    get_cached,
    set_cached,
    delete_cached,
    clear_pattern,
    get_redis,
)
from models import Todo

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Environment variables
PORT = int(os.getenv("PORT", "8080"))

# Graceful shutdown handling
shutdown_event = asyncio.Event()


def handle_shutdown(signum, frame):
    """Handle shutdown signals."""
    logger.info(f"Received signal {signum}, initiating graceful shutdown...")
    shutdown_event.set()


signal.signal(signal.SIGINT, handle_shutdown)
signal.signal(signal.SIGTERM, handle_shutdown)


# Lifespan context manager for startup/shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan."""
    # Startup
    logger.info("Starting FastAPI application...")
    try:
        await init_db()
        logger.info("Application startup complete")
    except Exception as e:
        logger.error(f"Failed to start application: {e}")
        raise

    yield

    # Shutdown
    logger.info("Shutting down application...")
    try:
        await close_db()
        await close_redis()
        logger.info("Application shutdown complete")
    except Exception as e:
        logger.error(f"Error during shutdown: {e}")


# Create FastAPI app
app = FastAPI(
    title="Todo API",
    description="FastAPI Todo application with PostgreSQL and Redis",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Pydantic models
class TodoCreate(BaseModel):
    """Schema for creating a todo."""
    title: str = Field(..., min_length=1, max_length=500)
    completed: bool = False


class TodoUpdate(BaseModel):
    """Schema for updating a todo."""
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    completed: Optional[bool] = None


class TodoResponse(BaseModel):
    """Schema for todo response."""
    id: int
    title: str
    completed: bool
    created_at: str

    class Config:
        from_attributes = True


class ServiceHealth(BaseModel):
    """Schema for service health status."""
    connected: bool


class HealthResponse(BaseModel):
    """Schema for health check response."""
    status: str
    database: ServiceHealth
    redis: ServiceHealth
    timestamp: str


# Health check endpoint
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint that verifies DB and Redis connectivity."""
    db_connected = await check_db_health()
    redis_connected = await check_redis_health()

    return HealthResponse(
        status="ok" if (db_connected and redis_connected) else "error",
        database=ServiceHealth(connected=db_connected),
        redis=ServiceHealth(connected=redis_connected),
        timestamp=datetime.utcnow().isoformat(),
    )


# Database connectivity check
@app.get("/api/db-check")
async def db_check():
    """Database connectivity check."""
    try:
        start = time.time()
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT current_database(), current_user, version()"))
            row = result.fetchone()
        latency = int((time.time() - start) * 1000)

        return {
            "connected": True,
            "latency": latency,
            "database": row[0],
            "user": row[1],
            "version": " ".join(row[2].split(" ")[:2]),
        }
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"connected": False, "error": str(e)},
        )


# Redis connectivity check
@app.get("/api/redis-check")
async def redis_check():
    """Redis connectivity check."""
    try:
        client = await get_redis()
        start = time.time()
        ping = await client.ping()
        latency = int((time.time() - start) * 1000)

        # Test SET/GET
        await client.set("health-check", "ok")
        value = await client.get("health-check")

        return {
            "connected": True,
            "ping": "PONG" if ping else "FAIL",
            "latency": latency,
            "setGetWorks": value == "ok",
        }
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"connected": False, "error": str(e)},
        )


# Todo CRUD endpoints
@app.get("/api/todos")
async def list_todos(db: AsyncSession = Depends(get_db)):
    """List all todos with caching (60 seconds TTL)."""
    cache_key = "todos:list"

    # Try to get from cache
    cached = await get_cached(cache_key)
    if cached is not None:
        logger.info("Returning cached todos")
        return {"data": cached, "cached": True}

    # Query from database
    try:
        result = await db.execute(select(Todo).order_by(Todo.created_at.desc()))
        todos = result.scalars().all()
        response = [todo.to_dict() for todo in todos]

        # Cache the result for 60 seconds
        await set_cached(cache_key, response, ttl=60)

        logger.info(f"Fetched {len(response)} todos from database")
        return {"data": response, "cached": False}
    except Exception as e:
        logger.error(f"Failed to list todos: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to list todos: {str(e)}")


@app.post("/api/todos", response_model=TodoResponse, status_code=status.HTTP_201_CREATED)
async def create_todo(todo_data: TodoCreate, db: AsyncSession = Depends(get_db)):
    """Create a new todo."""
    try:
        todo = Todo(title=todo_data.title, completed=todo_data.completed)
        db.add(todo)
        await db.commit()
        await db.refresh(todo)

        # Invalidate cache
        await clear_pattern("todos:*")

        logger.info(f"Created todo with id {todo.id}")
        return todo.to_dict()
    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to create todo: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create todo: {str(e)}")


@app.get("/api/todos/{todo_id}", response_model=TodoResponse)
async def get_todo(todo_id: int, db: AsyncSession = Depends(get_db)):
    """Get a specific todo by ID."""
    try:
        result = await db.execute(select(Todo).where(Todo.id == todo_id))
        todo = result.scalar_one_or_none()

        if not todo:
            raise HTTPException(status_code=404, detail=f"Todo with id {todo_id} not found")

        return todo.to_dict()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get todo {todo_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get todo: {str(e)}")


@app.put("/api/todos/{todo_id}", response_model=TodoResponse)
async def update_todo(todo_id: int, todo_data: TodoUpdate, db: AsyncSession = Depends(get_db)):
    """Update a todo."""
    try:
        result = await db.execute(select(Todo).where(Todo.id == todo_id))
        todo = result.scalar_one_or_none()

        if not todo:
            raise HTTPException(status_code=404, detail=f"Todo with id {todo_id} not found")

        if todo_data.title is not None:
            todo.title = todo_data.title
        if todo_data.completed is not None:
            todo.completed = todo_data.completed

        await db.commit()
        await db.refresh(todo)

        # Invalidate cache
        await clear_pattern("todos:*")

        logger.info(f"Updated todo with id {todo_id}")
        return todo.to_dict()
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to update todo {todo_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update todo: {str(e)}")


@app.delete("/api/todos/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_todo(todo_id: int, db: AsyncSession = Depends(get_db)):
    """Delete a todo."""
    try:
        result = await db.execute(select(Todo).where(Todo.id == todo_id))
        todo = result.scalar_one_or_none()

        if not todo:
            raise HTTPException(status_code=404, detail=f"Todo with id {todo_id} not found")

        await db.delete(todo)
        await db.commit()

        # Invalidate cache
        await clear_pattern("todos:*")

        logger.info(f"Deleted todo with id {todo_id}")
        return None
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to delete todo {todo_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete todo: {str(e)}")


@app.get("/api/stats")
async def get_stats(db: AsyncSession = Depends(get_db)):
    """Get statistics about todos."""
    try:
        # Increment page view counter in Redis
        client = await get_redis()
        await client.incr("stats:page-views")
        page_views = await client.get("stats:page-views")

        # Get total count
        total_result = await db.execute(select(func.count()).select_from(Todo))
        total_todos = total_result.scalar() or 0

        return {
            "pageViews": int(page_views or 0),
            "totalTodos": total_todos,
        }
    except Exception as e:
        logger.error(f"Failed to get stats: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "FastAPI Todo API",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "todos": "/api/todos",
            "stats": "/api/stats",
        },
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=PORT,
        log_level="info",
        access_log=True,
    )
