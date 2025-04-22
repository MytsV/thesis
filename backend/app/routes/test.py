import asyncio
import json
import random
from typing import Dict

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session

from app.sqla.database import get_db
from app.sqla.models import User
from app.auth.dependencies import websocket_auth_required

router = APIRouter()


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, WebSocket] = {}
        self.tasks: Dict[int, asyncio.Task] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: int):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
        if user_id in self.tasks:
            self.tasks[user_id].cancel()
            del self.tasks[user_id]

    async def send_message(self, message: str, user_id: int):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_text(message)

    def start_task(self, user_id: int, username: str):
        if user_id in self.tasks:
            self.tasks[user_id].cancel()
        self.tasks[user_id] = asyncio.create_task(self._send_updates(user_id, username))

    async def _send_updates(self, user_id: int, username: str):
        try:
            while True:
                random_digits = str(random.randint(1000, 9999))
                message = f"{username}{random_digits}"
                await self.send_message(message, user_id)
                await asyncio.sleep(0.5)
        except asyncio.CancelledError:
            pass


manager = ConnectionManager()


@router.websocket("/ws/test")
async def updates_websocket(websocket: WebSocket, db: Session = Depends(get_db)):
    user = await websocket_auth_required(websocket, db)
    if user is None:
        return

    await manager.connect(websocket, user.id)

    try:
        manager.start_task(user.id, user.username)

        while True:
            await websocket.receive_text()

    except WebSocketDisconnect:
        manager.disconnect(user.id)
    except Exception:
        manager.disconnect(user.id)
