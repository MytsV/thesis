import asyncio
import contextlib
import json
from typing import Dict, Tuple, Set, List, Any, Optional
from uuid import UUID
from fastapi import WebSocket

from app.redis.models import FilterSortUpdateEvent, SortModelItem
from app.redis.storage import get_redis
from app.redis.users import get_user_filter_sort, SUBSCRIPTION_CHANNEL
from app.websocket.logging import logger


class SubscriptionManager:
    def __init__(self):
        # Connection key: (project_id, watcher_id, watched_id, view_id)
        self.active_connections: Dict[Tuple[UUID, int, int, str], WebSocket] = {}
        # Reverse index: watched_user -> set of connection keys
        self.watched_index: Dict[Tuple[UUID, int], Set[Tuple[UUID, int, int, str]]] = {}
        # Redis listeners for each (project_id, view_id, user_id) combination
        self.redis_listeners: Dict[Tuple[UUID, str, int], asyncio.Task] = {}

    @contextlib.asynccontextmanager
    async def redis_client(self):
        """Context manager for getting and cleaning up Redis client"""
        redis_gen = get_redis()
        try:
            client = await redis_gen.__anext__()
            yield client
        finally:
            await redis_gen.aclose()

    async def connect_subscription(
        self,
        websocket: WebSocket,
        project_id: UUID,
        watcher_id: int,
        watched_id: int,
        view_id: Optional[str] = None,
    ) -> bool:
        """Connect a subscription WebSocket for watching a specific user"""
        await websocket.accept()

        connection_key = (project_id, watcher_id, watched_id, view_id)

        # Check if already subscribed
        if connection_key in self.active_connections:
            await websocket.close(code=4000, reason="Already subscribed")
            return False

        self.active_connections[connection_key] = websocket

        try:
            # Add to reverse index
            watched_key = (project_id, watched_id)
            if watched_key not in self.watched_index:
                self.watched_index[watched_key] = set()
            self.watched_index[watched_key].add(connection_key)

            # Start Redis listener if needed
            if view_id is not None:
                self._start_redis_listener(project_id, view_id, watched_id)

            # Send current filter/sort state
            async with self.redis_client() as redis_client:
                prefs = await get_user_filter_sort(
                    redis_client, str(project_id), view_id, watched_id
                )
                if prefs:
                    update_event = FilterSortUpdateEvent(
                        view_id=view_id,
                        filter_model=prefs.filter_model,
                        sort_model=prefs.sort_model,
                    )
                    await websocket.send_text(update_event.model_dump_json())

            return True

        except Exception as e:
            logger.error(
                f"Error connecting subscription for watcher {watcher_id} "
                f"watching {watched_id} in project {project_id}: {str(e)}"
            )
            await websocket.close(code=1011, reason=str(e))
            raise

    def _start_redis_listener(
        self, project_id: UUID, view_id: str, user_id: int
    ) -> None:
        """Start Redis listener for a specific project/view/user combination if not already running"""
        listener_key = (project_id, view_id, user_id)

        if listener_key not in self.redis_listeners:
            self.redis_listeners[listener_key] = asyncio.create_task(
                self._listen_for_updates(project_id, view_id, user_id)
            )

    async def disconnect_subscription(
        self,
        project_id: UUID,
        watcher_id: int,
        watched_id: int,
        view_id: Optional[str] = None,
    ) -> None:
        """Disconnect a subscription WebSocket"""
        connection_key = (project_id, watcher_id, watched_id, view_id)

        if connection_key not in self.active_connections:
            return

        # Remove connection
        del self.active_connections[connection_key]

        # Remove from reverse index
        watched_key = (project_id, watched_id)
        if watched_key in self.watched_index:
            self.watched_index[watched_key].discard(connection_key)

            # Clean up empty sets
            if not self.watched_index[watched_key]:
                del self.watched_index[watched_key]

        # Clean up Redis listener if no longer needed
        if view_id is not None:
            self._cleanup_redis_listener_if_needed(project_id, view_id, watched_id)

    def _cleanup_redis_listener_if_needed(
        self, project_id: UUID, view_id: str, user_id: int
    ) -> None:
        """Clean up Redis listener if no connections are watching this combination"""
        listener_key = (project_id, view_id, user_id)

        # Check if any connections still watching this combination
        still_watching = any(
            key
            for key in self.active_connections.keys()
            if key[0] == project_id and key[2] == user_id and key[3] == view_id
        )

        # If no one is watching, cancel the listener
        if not still_watching and listener_key in self.redis_listeners:
            self.redis_listeners[listener_key].cancel()
            del self.redis_listeners[listener_key]

    async def notify_watchers(
        self,
        project_id: UUID,
        user_id: int,
        view_id: str,
        filter_model: Dict[str, Any],
        sort_model: List[SortModelItem],
    ) -> None:
        """Notify all users watching this user's filter/sort changes"""
        watched_key = (project_id, user_id)

        if watched_key not in self.watched_index:
            return

        update_event = FilterSortUpdateEvent(
            view_id=view_id,
            filter_model=filter_model,
            sort_model=sort_model,
        )
        json_message = update_event.model_dump_json()

        # Notify all watchers
        for connection_key in self.watched_index[watched_key].copy():
            _, _, _, watch_view_id = connection_key

            # Only notify if watching all views or this specific view
            if watch_view_id is None or watch_view_id == view_id:
                await self._send_to_connection(connection_key, json_message)

    async def _send_to_connection(
        self, connection_key: Tuple[UUID, int, int, str], json_message: str
    ) -> None:
        """Send a message to a specific connection with error handling"""
        websocket = self.active_connections.get(connection_key)
        if not websocket:
            return

        try:
            await websocket.send_text(json_message)
        except Exception as e:
            project_id, watcher_id, watched_id, view_id = connection_key
            logger.error(
                f"Error sending message to watcher {watcher_id} "
                f"(watching {watched_id} in project {project_id}): {str(e)}"
            )
            # Clean up broken connection
            await self.disconnect_subscription(
                project_id, watcher_id, watched_id, view_id
            )

    async def broadcast_message(
        self, project_id: UUID, view_id: str, user_id: int, data: dict
    ):
        watched_key = (project_id, user_id)
        if watched_key in self.watched_index:
            json_message = json.dumps(data)

            for connection_key in self.watched_index[watched_key].copy():
                _, _, _, watch_view_id = connection_key

                # Only notify if watching all views or this specific view
                if watch_view_id is None or watch_view_id == view_id:
                    await self._send_to_connection(connection_key, json_message)

    async def _listen_for_updates(
        self, project_id: UUID, view_id: str, user_id: int
    ) -> None:
        """Listen for Redis updates for a project and broadcast them"""
        async with self.redis_client() as redis_client:
            pubsub = None
            try:
                pubsub = redis_client.pubsub()
                pubsub.subscribe(
                    SUBSCRIPTION_CHANNEL.format(
                        project_id=str(project_id), view_id=view_id, user_id=user_id
                    )
                )

                while True:
                    message = pubsub.get_message(ignore_subscribe_messages=True)
                    if message and message["type"] == "message":
                        try:
                            data = json.loads(message["data"])
                            await self.broadcast_message(
                                project_id, view_id, user_id, data
                            )
                        except json.JSONDecodeError:
                            # Handle non-JSON messages if needed
                            pass
                    await asyncio.sleep(0.01)  # Small sleep to prevent CPU hogging

            except asyncio.CancelledError:
                if pubsub:
                    pubsub.unsubscribe()
            except Exception as e:
                logger.error(f"Redis listener error for project {project_id}: {str(e)}")


subscription_manager = SubscriptionManager()
