"""Redis client for caching."""
import logging
import json
from typing import Optional, Any
import redis.asyncio as redis
import os

logger = logging.getLogger(__name__)

# Get Redis URL from environment
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# Global Redis client
_redis_client: Optional[redis.Redis] = None


async def get_redis() -> redis.Redis:
    """Get or create Redis client."""
    global _redis_client
    if _redis_client is None:
        _redis_client = redis.from_url(
            REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
            max_connections=10,
            socket_connect_timeout=5,
            socket_timeout=5,
        )
    return _redis_client


async def check_redis_health() -> bool:
    """Check if Redis is accessible."""
    try:
        client = await get_redis()
        await client.ping()
        return True
    except Exception as e:
        logger.error(f"Redis health check failed: {e}")
        return False


async def close_redis():
    """Close Redis connection gracefully."""
    global _redis_client
    if _redis_client:
        try:
            await _redis_client.close()
            logger.info("Redis connection closed")
        except Exception as e:
            logger.error(f"Error closing Redis connection: {e}")
        finally:
            _redis_client = None


async def get_cached(key: str) -> Optional[Any]:
    """Get value from cache."""
    try:
        client = await get_redis()
        value = await client.get(key)
        if value:
            return json.loads(value)
        return None
    except Exception as e:
        logger.warning(f"Failed to get cached value for key '{key}': {e}")
        return None


async def set_cached(key: str, value: Any, ttl: int = 60) -> bool:
    """Set value in cache with TTL in seconds."""
    try:
        client = await get_redis()
        await client.setex(key, ttl, json.dumps(value))
        return True
    except Exception as e:
        logger.warning(f"Failed to cache value for key '{key}': {e}")
        return False


async def delete_cached(key: str) -> bool:
    """Delete value from cache."""
    try:
        client = await get_redis()
        await client.delete(key)
        return True
    except Exception as e:
        logger.warning(f"Failed to delete cached key '{key}': {e}")
        return False


async def clear_pattern(pattern: str) -> int:
    """Clear all keys matching pattern."""
    try:
        client = await get_redis()
        keys = []
        async for key in client.scan_iter(match=pattern):
            keys.append(key)
        if keys:
            return await client.delete(*keys)
        return 0
    except Exception as e:
        logger.warning(f"Failed to clear pattern '{pattern}': {e}")
        return 0
