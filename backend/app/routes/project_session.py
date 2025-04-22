import asyncio
import json
import logging
from typing import Dict, Tuple, Set
from uuid import UUID

import redis
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from sqlalchemy.orm import Session
from starlette.status import WS_1008_POLICY_VIOLATION

from app.auth.dependencies import websocket_auth_required
from app.redis.models import InitEvent, HeartbeatAcknowledgmentEvent
from app.redis.storage import get_redis
from app.redis.users import (
    add_user_to_project,
    remove_user_from_project,
    heartbeat_user_presence,
    PROJECT_CHANNEL,
    get_active_users,
)
from app.routes.project import check_user_project_access
from app.sqla.database import get_db
from app.sqla.models import User

logger = logging.getLogger(__name__)
HEARTBEAT_INTERVAL = 10

router = APIRouter()


class CollaborationManager:
    def __init__(self):
        self.active_connections: Dict[Tuple[UUID, int], WebSocket] = {}
        self.heartbeat_tasks: Dict[Tuple[UUID, int], asyncio.Task] = {}
        self.redis_listeners: Dict[UUID, asyncio.Task] = {}
        self.project_users: Dict[UUID, Set[int]] = {}

    async def connect(
        self,
        websocket: WebSocket,
        project_id: UUID,
        user: User,
        redis_client: redis.Redis = Depends(get_redis),
    ) -> None:
        """
        Connect a user to a project and initialize their presence
        """
        await websocket.accept()

        connection_key = (project_id, user.id)

        self.active_connections[connection_key] = websocket

        try:
            await add_user_to_project(
                redis_client, str(project_id), user.id, user.username
            )

            # Add user to project users set
            if project_id not in self.project_users:
                self.project_users[project_id] = set()
            self.project_users[project_id].add(user.id)

            # Start heartbeat task
            if connection_key in self.heartbeat_tasks:
                self.heartbeat_tasks[connection_key].cancel()

            self.heartbeat_tasks[connection_key] = asyncio.create_task(
                self._heartbeat(project_id, user.id)
            )

            # Start Redis listener for this project if it doesn't exist
            if project_id not in self.redis_listeners:
                self.redis_listeners[project_id] = asyncio.create_task(
                    self._listen_for_updates(project_id)
                )

        except Exception as e:
            logger.error(
                f"Error connecting user {user.id} to project {project_id}: {str(e)}"
            )
            await websocket.close(code=WS_1008_POLICY_VIOLATION, reason=str(e))
            raise

    async def disconnect(
        self,
        project_id: UUID,
        user_id: int,
        redis_client: redis.Redis = Depends(get_redis),
    ) -> None:
        """Disconnect a user from a project"""
        connection_key = (project_id, user_id)

        # Remove connection
        if connection_key in self.active_connections:
            del self.active_connections[connection_key]

        # Cancel heartbeat task
        if connection_key in self.heartbeat_tasks:
            self.heartbeat_tasks[connection_key].cancel()
            del self.heartbeat_tasks[connection_key]

        # Remove user from project users set
        if (
            project_id in self.project_users
            and user_id in self.project_users[project_id]
        ):
            self.project_users[project_id].remove(user_id)

            # If no more users in project, cancel the Redis listener
            if not self.project_users[project_id]:
                if project_id in self.redis_listeners:
                    self.redis_listeners[project_id].cancel()
                    del self.redis_listeners[project_id]
                del self.project_users[project_id]

        # Remove user from Redis presence
        try:
            await remove_user_from_project(
                redis_client,
                str(project_id),
                user_id,
            )
        except Exception as e:
            logger.error(
                f"Error disconnecting user {user_id} from project {project_id}: {str(e)}"
            )

    async def broadcast_to_project(self, project_id: UUID, message: dict) -> None:
        if project_id not in self.project_users:
            return

        json_message = json.dumps(message)
        for user_id in self.project_users[project_id]:
            connection_key = (project_id, user_id)
            if connection_key in self.active_connections:
                try:
                    await self.active_connections[connection_key].send_text(
                        json_message
                    )
                except Exception as e:
                    logger.error(f"Error sending message to {user_id}: {str(e)}")

    async def send_message(self, project_id: UUID, user_id: int, message: dict) -> None:
        """Send a message to a specific user in a project"""
        connection_key = (project_id, user_id)
        if connection_key in self.active_connections:
            try:
                await self.active_connections[connection_key].send_text(
                    json.dumps(message)
                )
            except Exception as e:
                logger.error(f"Error sending message to {user_id}: {str(e)}")

    async def _heartbeat(
        self,
        project_id: UUID,
        user_id: int,
        redis_client: redis.Redis = Depends(get_redis),
    ) -> None:
        """Send heartbeat to keep user presence alive"""
        try:
            while True:
                await heartbeat_user_presence(redis_client, str(project_id), user_id)
                await asyncio.sleep(HEARTBEAT_INTERVAL)
        except asyncio.CancelledError:
            pass
        except Exception as e:
            logger.error(f"Heartbeat error for user {user_id}: {str(e)}")

    async def _listen_for_updates(
        self, project_id: UUID, redis_client: redis.Redis = Depends(get_redis)
    ) -> None:
        """Listen for Redis updates for a project and broadcast them"""
        try:
            pubsub = redis_client.pubsub()
            await pubsub.subscribe(PROJECT_CHANNEL.format(project_id=str(project_id)))

            while True:
                message = await pubsub.get_message(ignore_subscribe_messages=True)
                if message and message["type"] == "message":
                    try:
                        data = json.loads(message["data"])
                        await self.broadcast_to_project(project_id, data)
                    except json.JSONDecodeError:
                        # Handle non-JSON messages if needed
                        pass
                await asyncio.sleep(0.01)  # Small sleep to prevent CPU hogging
        except asyncio.CancelledError:
            if pubsub:
                await pubsub.unsubscribe()
        except Exception as e:
            logger.error(f"Redis listener error for project {project_id}: {str(e)}")


# Singleton instance
collaboration_manager = CollaborationManager()


@router.websocket("/projects/{project_id}/collaborate")
async def project_collaboration(
    websocket: WebSocket,
    project_id: UUID,
    db: Session = Depends(get_db),
    redis_client: redis.Redis = Depends(get_redis),
):
    user = await websocket_auth_required(websocket, db)
    if not user:
        await websocket.close(code=1008, reason="Authentication failed")
        return

    try:
        check_user_project_access(db, project_id, user.id)

        await collaboration_manager.connect(websocket, project_id, user)

        active_users = await get_active_users(redis_client, str(project_id))
        init_event = InitEvent(active_users=active_users)
        await websocket.send_text(init_event.model_dump_json())

        try:
            while True:
                # Wait for messages from the client
                data = await websocket.receive_text()

                try:
                    message = json.loads(data)

                    if message.get("type") == "heartbeat":
                        heartbeat_ack_event = HeartbeatAcknowledgmentEvent()
                        await websocket.send_text(heartbeat_ack_event.model_dump_json())
                except json.JSONDecodeError:
                    logger.warning(f"Invalid JSON received from user {user.id}")

        except WebSocketDisconnect:
            # Handle normal disconnection
            pass

    except HTTPException as e:
        logger.warning(
            f"Access denied for user {user.id} to project {project_id}: {e.detail}"
        )
        await websocket.close(code=1008, reason=e.detail)

    except Exception as e:
        logger.error(f"Error in collaboration websocket: {str(e)}")
        await websocket.close(code=1011, reason="Server error")

    finally:
        await collaboration_manager.disconnect(project_id, user.id)
