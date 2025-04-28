import asyncio
import contextlib
import json
import logging
import uuid
from typing import Dict, Tuple, Set
from uuid import UUID

import redis
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from sqlalchemy.orm import Session
from starlette.status import WS_1008_POLICY_VIOLATION

from app.auth.dependencies import websocket_auth_required
from app.redis.models import InitEvent, HeartbeatAcknowledgmentEvent, InitEventUser
from app.redis.storage import get_redis, redis_pool
from app.redis.users import (
    add_user_to_project,
    remove_user_from_project,
    heartbeat_user_presence,
    PROJECT_CHANNEL,
    get_active_users,
    update_user_view,
    update_user_focus,
)
from app.routes.project import check_user_project_access
from app.sqla.database import get_db
from app.sqla.models import User

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

HEARTBEAT_INTERVAL = 10

router = APIRouter()


class CollaborationManager:
    def __init__(self):
        # Connection tracking
        self.active_connections: Dict[Tuple[UUID, int, str], WebSocket] = {}
        self.heartbeat_tasks: Dict[Tuple[UUID, int, str], asyncio.Task] = {}
        self.redis_listeners: Dict[UUID, asyncio.Task] = {}

        # User tracking
        self.project_users: Dict[UUID, Set[int]] = {}
        self.connection_counts: Dict[Tuple[UUID, int], int] = {}

    @contextlib.asynccontextmanager
    async def redis_client(self):
        """Context manager for getting and cleaning up Redis client"""
        redis_gen = get_redis()
        try:
            client = await redis_gen.__anext__()
            yield client
        finally:
            await redis_gen.aclose()

    async def connect(
        self, websocket: WebSocket, project_id: UUID, user: User, connection_id: str
    ) -> None:
        """Connect a user to a project and initialize their presence"""
        await websocket.accept()

        connection_key = (project_id, user.id, connection_id)
        user_project_key = (project_id, user.id)

        self.active_connections[connection_key] = websocket

        try:
            async with self.redis_client() as redis_client:
                # Handle first connection for this user in this project
                if user_project_key not in self.connection_counts:
                    self.connection_counts[user_project_key] = 0
                    await add_user_to_project(
                        redis_client, str(project_id), user.id, user.username
                    )

                # Increment connection count
                self.connection_counts[user_project_key] += 1
                logger.info(
                    f"User {user.id} connection {connection_id} added to project {project_id}. "
                    f"Total connections: {self.connection_counts[user_project_key]}"
                )

                # Track user in project
                if project_id not in self.project_users:
                    self.project_users[project_id] = set()
                self.project_users[project_id].add(user.id)

                # Start heartbeat and Redis listener tasks
                self._start_connection_tasks(project_id, user.id, connection_id)

        except Exception as e:
            logger.error(
                f"Error connecting user {user.id} (conn {connection_id}) to project {project_id}: {str(e)}"
            )
            await websocket.close(code=WS_1008_POLICY_VIOLATION, reason=str(e))
            raise

    def _start_connection_tasks(
        self, project_id: UUID, user_id: int, connection_id: str
    ) -> None:
        """Start heartbeat and Redis listener tasks for a connection"""
        connection_key = (project_id, user_id, connection_id)

        # Start heartbeat task for this connection
        self.heartbeat_tasks[connection_key] = asyncio.create_task(
            self._heartbeat(project_id, user_id, connection_id)
        )

        # Start Redis listener for this project if it doesn't exist
        if project_id not in self.redis_listeners:
            self.redis_listeners[project_id] = asyncio.create_task(
                self._listen_for_updates(project_id)
            )

    async def disconnect(
        self, project_id: UUID, user_id: int, connection_id: str = None
    ) -> None:
        """
        Disconnect a user from a project
        If connection_id is provided, only that specific connection is removed
        If connection_id is None, all connections for this user in this project are removed
        """
        user_project_key = (project_id, user_id)
        connections_to_remove = self._get_connections_to_remove(
            project_id, user_id, connection_id
        )

        # If no connections found, nothing to do
        if not connections_to_remove:
            return

        # Remove all identified connections and their tasks
        for key in connections_to_remove:
            self._remove_connection(key)

        # Update connection count and handle possible full disconnect
        if user_project_key in self.connection_counts:
            self.connection_counts[user_project_key] -= len(connections_to_remove)
            remaining_count = self.connection_counts[user_project_key]

            if remaining_count <= 0:
                await self._handle_user_full_disconnect(project_id, user_id)
            else:
                logger.info(
                    f"User {user_id} still has {remaining_count} connections to project {project_id}"
                )

    def _get_connections_to_remove(
        self, project_id: UUID, user_id: int, connection_id: str = None
    ) -> list:
        """Get list of connection keys that should be removed"""
        if connection_id is None:
            # Remove all connections for this user in this project
            return [
                key
                for key in self.active_connections.keys()
                if key[0] == project_id and key[1] == user_id
            ]
        else:
            # Remove specific connection if it exists
            connection_key = (project_id, user_id, connection_id)
            return [connection_key] if connection_key in self.active_connections else []

    def _remove_connection(self, connection_key: Tuple[UUID, int, str]) -> None:
        """Remove a specific connection and its associated tasks"""
        if connection_key in self.active_connections:
            del self.active_connections[connection_key]

        # Cancel associated heartbeat task
        if connection_key in self.heartbeat_tasks:
            self.heartbeat_tasks[connection_key].cancel()
            del self.heartbeat_tasks[connection_key]

    async def _handle_user_full_disconnect(
        self, project_id: UUID, user_id: int
    ) -> None:
        """Handle operations when a user has no more connections to a project"""
        user_project_key = (project_id, user_id)
        logger.info(
            f"User {user_id} has no more connections to project {project_id}. Removing from presence."
        )

        # Clean up tracking data
        del self.connection_counts[user_project_key]

        # Remove user from project users set
        if (
            project_id in self.project_users
            and user_id in self.project_users[project_id]
        ):
            self.project_users[project_id].remove(user_id)

            # If no more users in project, clean up project resources
            if not self.project_users[project_id]:
                self._cleanup_project_resources(project_id)

        # Remove user from Redis presence
        async with self.redis_client() as redis_client:
            try:
                await remove_user_from_project(redis_client, str(project_id), user_id)
            except Exception as e:
                logger.error(
                    f"Error disconnecting user {user_id} from project {project_id}: {str(e)}"
                )

    def _cleanup_project_resources(self, project_id: UUID) -> None:
        """Clean up resources for a project when no users remain"""
        if project_id in self.redis_listeners:
            self.redis_listeners[project_id].cancel()
            del self.redis_listeners[project_id]

        if project_id in self.project_users:
            del self.project_users[project_id]

    async def broadcast_to_project(self, project_id: UUID, message: dict) -> None:
        """Broadcast a message to all users in a project"""
        if project_id not in self.project_users:
            return

        json_message = json.dumps(message)

        # Find and send to all connections in project
        for user_id in self.project_users[project_id]:
            connection_keys = [
                key
                for key in self.active_connections.keys()
                if key[0] == project_id and key[1] == user_id
            ]

            for connection_key in connection_keys:
                await self._send_to_connection(connection_key, json_message)

    async def send_message(self, project_id: UUID, user_id: int, message: dict) -> None:
        """Send a message to all connections of a specific user in a project"""
        json_message = json.dumps(message)

        # Find all connections for this user in this project
        connection_keys = [
            key
            for key in self.active_connections.keys()
            if key[0] == project_id and key[1] == user_id
        ]

        # Send to each connection
        for connection_key in connection_keys:
            await self._send_to_connection(connection_key, json_message)

    async def _send_to_connection(
        self, connection_key: Tuple[UUID, int, str], json_message: str
    ) -> None:
        """Send a message to a specific connection with error handling"""
        try:
            await self.active_connections[connection_key].send_text(json_message)
        except Exception as e:
            logger.error(
                f"Error sending message to user {connection_key[1]} connection {connection_key[2]}: {str(e)}"
            )

    async def _heartbeat(
        self, project_id: UUID, user_id: int, connection_id: str
    ) -> None:
        """Send heartbeat to keep user presence alive"""
        try:
            while True:
                user_project_key = (project_id, user_id)

                # Only send heartbeat if user still has connections
                if (
                    user_project_key in self.connection_counts
                    and self.connection_counts[user_project_key] > 0
                ):
                    async with self.redis_client() as redis_client:
                        await heartbeat_user_presence(
                            redis_client, str(project_id), user_id
                        )

                await asyncio.sleep(HEARTBEAT_INTERVAL)

        except asyncio.CancelledError:
            pass
        except Exception as e:
            logger.error(
                f"Heartbeat error for user {user_id} connection {connection_id}: {str(e)}"
            )

    async def _listen_for_updates(self, project_id: UUID) -> None:
        """Listen for Redis updates for a project and broadcast them"""
        async with self.redis_client() as redis_client:
            pubsub = None
            try:
                pubsub = redis_client.pubsub()
                pubsub.subscribe(PROJECT_CHANNEL.format(project_id=str(project_id)))

                while True:
                    message = pubsub.get_message(ignore_subscribe_messages=True)
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
                    pubsub.unsubscribe()
            except Exception as e:
                logger.error(f"Redis listener error for project {project_id}: {str(e)}")


# Singleton instance
collaboration_manager = CollaborationManager()


# TODO: refactor
async def handle_message(
    message: dict,
    websocket: WebSocket,
    project_id: UUID,
    user: User,
    redis_client: redis.Redis,
):
    """Handle incoming WebSocket messages based on their type."""
    message_type = message.get("event")

    message_handlers = {
        "heartbeat": handle_heartbeat_message,
        "view_change": handle_view_change_message,
        "focus_change": handle_focus_change_message,
    }

    handler = message_handlers.get(message_type)
    if handler:
        await handler(
            message=message,
            websocket=websocket,
            project_id=project_id,
            user=user,
            redis_client=redis_client,
        )
    else:
        logger.warning(
            f"Unknown message type '{message_type}' received from user {user.id}"
        )


async def handle_heartbeat_message(
    message: dict,
    websocket: WebSocket,
    project_id: UUID,
    user: User,
    redis_client: redis.Redis,
):
    """Handle heartbeat messages to keep the user presence alive."""
    await heartbeat_user_presence(redis_client, str(project_id), user.id)

    # Send acknowledgment back to client
    heartbeat_ack_event = HeartbeatAcknowledgmentEvent()
    await websocket.send_text(heartbeat_ack_event.model_dump_json())


async def handle_view_change_message(
    message: dict,
    websocket: WebSocket,
    project_id: UUID,
    user: User,
    redis_client: redis.Redis,
):
    """Handle messages when a user changes their view."""
    current_view_id = message.get("view_id")
    await update_user_view(redis_client, str(project_id), user.id, current_view_id)


async def handle_focus_change_message(
    message: dict,
    websocket: WebSocket,
    project_id: UUID,
    user: User,
    redis_client: redis.Redis,
):
    """Handle messages when a user changes their focus to a specific row."""
    focused_row_id = message.get("row_id")
    await update_user_focus(redis_client, str(project_id), user.id, focused_row_id)


@router.websocket("/ws/projects/{project_id}/collaborate")
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

    connection_id = str(uuid.uuid4())

    try:
        # Verify project access
        check_user_project_access(db, project_id, user.id)

        # Connect to collaboration manager
        await collaboration_manager.connect(websocket, project_id, user, connection_id)

        # Send initial state
        active_users = await get_active_users(redis_client, str(project_id))
        print(active_users)
        init_event = InitEvent(users=active_users)
        await websocket.send_text(init_event.model_dump_json())

        # Main message loop
        try:
            while True:
                data = await websocket.receive_text()
                try:
                    message = json.loads(data)
                    await handle_message(
                        message=message,
                        websocket=websocket,
                        project_id=project_id,
                        user=user,
                        redis_client=redis_client,
                    )
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
        await collaboration_manager.disconnect(project_id, user.id, connection_id)
