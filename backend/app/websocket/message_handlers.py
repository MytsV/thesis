from typing import Dict, Callable, Awaitable
from uuid import UUID
import redis
from fastapi import WebSocket
from sqlalchemy.orm import Session

from app.redis.models import HeartbeatAcknowledgmentEvent, ChatMessageInfo
from app.redis.users import (
    save_user_filter_sort,
    heartbeat_user_presence,
    update_user_view,
    update_user_focus,
)
from app.redis.views import broadcast_chat_message
from app.sqla.models import User, ChatMessage, View
from app.websocket.logging import logger


class CollaborationMessageHandler:
    def __init__(
        self,
        websocket: WebSocket,
        project_id: UUID,
        user: User,
        redis_client: redis.Redis,
        db: Session,
    ):
        self.websocket = websocket
        self.project_id = project_id
        self.user = user
        self.redis_client = redis_client
        self.db = db

    async def handle_message(self, message: dict):
        """Handle incoming WebSocket messages based on their type."""
        message_type = message.get("event")

        message_handlers: Dict[str, Callable[[dict], Awaitable[None]]] = {
            "heartbeat": self.__handle_heartbeat_message,
            "view_change": self.__handle_view_change_message,
            "focus_change": self.__handle_focus_change_message,
            "filter_sort_update": self.__handle_filter_sort_update_message,
            "chat_message": self.__handle_chat_message,
        }

        handler = message_handlers.get(message_type)
        if handler:
            await handler(message)
        else:
            logger.warning(
                f"Unknown message type '{message_type}' received from user {self.user.id}"
            )

    async def __handle_chat_message(self, message: dict):
        """Handle new chat message creation and broadcasting."""
        try:
            content = message.get("content")
            view_id = message.get("view_id")

            if not content or not content.strip():
                logger.warning(f"Empty chat message from user {self.user.id}")
                return

            if view_id:
                view = (
                    self.db.query(View)
                    .filter(View.id == view_id, View.project_id == self.project_id)
                    .first()
                )

                if not view:
                    logger.warning(
                        f"Invalid view_id {view_id} in chat message from user {self.user.id}"
                    )
                    return

            # Create the chat message in the database
            chat_message = ChatMessage(
                content=content.strip(),
                user_id=self.user.id,
                project_id=self.project_id,
                view_id=view_id,
            )

            self.db.add(chat_message)
            self.db.commit()
            self.db.refresh(chat_message)

            self.db.refresh(chat_message, ["user", "view"])

            # Create message info for broadcasting
            chat_message_info = ChatMessageInfo(
                message_id=chat_message.id,
                content=chat_message.content,
                user_id=chat_message.user.id,
                user_username=chat_message.user.username,
                user_avatar_url=chat_message.user.avatar_url,
                view_id=chat_message.view.id if chat_message.view else None,
                view_name=chat_message.view.name if chat_message.view else None,
                view_type=chat_message.view.view_type if chat_message.view else None,
                created_at=int(chat_message.created_at.timestamp()) * 1000,
            )

            # Broadcast the message to all users in the project
            broadcast_chat_message(
                self.redis_client, chat_message_info, str(self.project_id)
            )

        except Exception as e:
            logger.error(
                f"Error handling chat message from user {self.user.id}: {str(e)}"
            )
            self.db.rollback()

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
