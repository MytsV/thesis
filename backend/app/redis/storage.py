import os
from typing import AsyncGenerator

import redis

REDIS_HOST = os.environ.get("REDIS_HOST")
REDIS_PORT = int(os.environ.get("REDIS_PORT"))
REDIS_PASSWORD = os.environ.get("REDIS_PASSWORD")
REDIS_DB = int(os.environ.get("REDIS_DB"))

redis_pool = None


async def init_redis_pool():
    """Initialize the Redis connection pool on application startup"""
    global redis_pool
    redis_pool = redis.ConnectionPool(
        host=REDIS_HOST,
        port=REDIS_PORT,
        password=REDIS_PASSWORD,
        db=REDIS_DB,
        decode_responses=True,  # Automatically decode responses to Python strings
    )


async def get_redis() -> AsyncGenerator[redis.Redis, None]:
    """Dependency for getting Redis client"""
    if redis_pool is None:
        await init_redis_pool()

    client = redis.Redis(connection_pool=redis_pool)
    try:
        yield client
    finally:
        await client.close()
