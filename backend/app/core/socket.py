# ----- SETUP & INFRASTRUCTURE -----

from redis import asyncio as aioredis
import socketio
from app.core.config import REDIS_URL

# Async Redis Manager - multiple worker communicating to connected users via Redis
mgr = socketio.AsyncRedisManager(REDIS_URL)

# ASGI Socket.IO Server
sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins='*',
    client_manager=mgr,
    ping_timeout=60,
    ping_interval=25,
)