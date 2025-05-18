from typing import Dict, Callable, Awaitable
from uuid import UUID
import redis
from fastapi import WebSocket

from app.redis.models import HeartbeatAcknowledgmentEvent
from app.redis.users import (
    save_user_filter_sort,
    heartbeat_user_presence,
    update_user_view,
    update_user_focus,
)
from app.sqla.models import User
from app.websocket.logging import logger


class CollaborationMessageHandler:
    def __init__(
        self,
        websocket: WebSocket,
        project_id: UUID,
        user: User,
        redis_client: redis.Redis,
    ):
        self.websocket = websocket
        self.project_id = project_id
        self.user = user
        self.redis_client = redis_client

    async def handle_message(self, message: dict):
        """Handle incoming WebSocket messages based on their type."""
        message_type = message.get("event")

        message_handlers: Dict[str, Callable[[dict], Awaitable[None]]] = {
            "heartbeat": self.__handle_heartbeat_message,
            "view_change": self.__handle_view_change_message,
            "focus_change": self.__handle_focus_change_message,
            "filter_sort_update": self.__handle_filter_sort_update_message,
        }

        handler = message_handlers.get(message_type)
        if handler:
            await handler(message)
        else:
            logger.warning(
                f"Unknown message type '{message_type}' received from user {self.user.id}"
            )

    async def __handle_filter_sort_update_message(self, message: dict):
        """Handle filter/sort update messages"""
        view_id = message.get("view_id")
        filter_update = message.get("filter_model")
        sort_update = message.get("sort_model")

        if not view_id:
            logger.warning(
                f"Missing view_id in filter/sort update from user {self.user.id}"
            )
            return

        await save_user_filter_sort(
            self.redis_client,
            str(self.project_id),
            view_id,
            self.user.id,
            filter_update,
            sort_update,
        )

    async def __handle_heartbeat_message(self, message: dict):
        """Handle heartbeat messages to keep the user presence alive."""
        await heartbeat_user_presence(
            self.redis_client, str(self.project_id), self.user.id
        )

        # Send acknowledgment back to client
        heartbeat_ack_event = HeartbeatAcknowledgmentEvent()
        await self.websocket.send_text(heartbeat_ack_event.model_dump_json())

    async def __handle_view_change_message(self, message: dict):
        """Handle messages when a user changes their view."""
        current_view_id = message.get("view_id")
        await update_user_view(
            self.redis_client, str(self.project_id), self.user.id, current_view_id
        )

    async def __handle_focus_change_message(self, message: dict):
        """Handle messages when a user changes their focus to a specific row."""
        focused_row_id = message.get("row_id")
        await update_user_focus(
            self.redis_client, str(self.project_id), self.user.id, focused_row_id
        )
