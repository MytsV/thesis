import redis

from app.redis.models import (
    RowUpdateInfo,
    RowUpdateEvent,
    ChatMessageInfo,
    ChatMessageEvent,
)
from app.redis.users import PROJECT_CHANNEL


def update_row(
    redis_client: redis.Redis,
    update_data: RowUpdateInfo,
    project_id: str,
):
    event = RowUpdateEvent(**update_data.model_dump())
    redis_client.publish(
        PROJECT_CHANNEL.format(project_id=project_id),
        event.model_dump_json(),
    )


def broadcast_chat_message(
    redis_client: redis.Redis,
    chat_message_data: ChatMessageInfo,
    project_id: str,
):
    event = ChatMessageEvent(**chat_message_data.model_dump())
    redis_client.publish(
        PROJECT_CHANNEL.format(project_id=project_id),
        event.model_dump_json(),
    )
