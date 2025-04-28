import json
import random
from typing import Optional, List, Dict

import redis
from fastapi import HTTPException

from app.redis.models import (
    UserPresence,
    UserJoinedEvent,
    UserLeftEvent,
    UserPresenceResponse,
    UserViewChangedEvent,
    UserFocusChangedEvent,
)

USER_PRESENCE_KEY = "presence:project:{project_id}:users"
PROJECT_CHANNEL = "project:{project_id}:updates"

PRESENCE_TIMEOUT = 30

# Coming from Catppuccin latte palette
USER_COLORS = [
    "#e64553",  # Maroon
    "#04a5e5",  # Sky
    "#40a02b",  # Green
    "#8839ef",  # Mauve
    "#fe640b",  # Peach
    "#dc8a78",  # Rosewater
]

MAX_USERS = 6


async def get_user_color(
    redis_client: redis.Redis,
    project_id: str,
) -> Optional[str]:
    """Assign a color to user, ensuring uniqueness within project."""

    presence_key = USER_PRESENCE_KEY.format(project_id=project_id)
    current_users = redis_client.hgetall(presence_key)

    taken_colors = set()
    for user_json in current_users.values():
        try:
            user_data = json.loads(user_json)
            if "color" in user_data:
                taken_colors.add(user_data["color"])
        except (json.JSONDecodeError, KeyError):
            pass

    available_colors = [c for c in USER_COLORS if c not in taken_colors]

    if available_colors:
        return random.choice(available_colors)

    return None


async def add_user_to_project(
    redis_client: redis.Redis, project_id: str, user_id: int, username: str
) -> None:
    """Add user to project presence and publish join notification"""

    active_users = redis_client.hlen(USER_PRESENCE_KEY.format(project_id=project_id))

    if active_users >= MAX_USERS:
        raise HTTPException(
            status_code=400,
            detail=f"Maximum of {MAX_USERS} concurrent users reached for this project",
        )

    color = await get_user_color(redis_client, project_id)
    if not color:
        raise HTTPException(
            status_code=400,
            detail=f"Maximum of {MAX_USERS} concurrent users reached for this project",
        )

    user_presence = UserPresence(
        username=username, color=color, joined_at=redis_client.time()[0]
    )

    presence_key = USER_PRESENCE_KEY.format(project_id=project_id)
    user_id_field = str(user_id)

    # Set user presence with timeout
    redis_client.hset(presence_key, user_id_field, user_presence.model_dump_json())

    redis_client.hexpire(presence_key, PRESENCE_TIMEOUT, user_id_field)

    joined_event = UserJoinedEvent(id=user_id, username=username, color=color)

    redis_client.publish(
        PROJECT_CHANNEL.format(project_id=project_id), joined_event.model_dump_json()
    )


async def remove_user_from_project(
    redis_client: redis.Redis, project_id: str, user_id: int
) -> None:
    """Remove user from project presence and publish leave notification"""

    redis_client.hdel(USER_PRESENCE_KEY.format(project_id=project_id), str(user_id))

    left_event = UserLeftEvent(id=user_id)

    redis_client.publish(
        PROJECT_CHANNEL.format(project_id=project_id), left_event.model_dump_json()
    )


async def get_active_users(redis_client: redis.Redis, project_id: str) -> List[Dict]:
    """Get list of active users in a project"""
    users_data = redis_client.hgetall(USER_PRESENCE_KEY.format(project_id=project_id))

    result = []
    for user_id, user_json in users_data.items():
        try:
            user_data = json.loads(user_json)
            response = UserPresenceResponse(
                id=int(user_id),
                **user_data,
            )
            result.append(response.model_dump())
        except json.JSONDecodeError:
            pass

    return result


async def heartbeat_user_presence(
    redis_client: redis.Redis, project_id: str, user_id: int
) -> None:
    """Refresh user presence timeout"""

    presence_key = USER_PRESENCE_KEY.format(project_id=project_id)
    user_id_field = str(user_id)

    user_exists = redis_client.hexists(presence_key, user_id_field)

    if user_exists:
        redis_client.hexpire(
            USER_PRESENCE_KEY.format(project_id=project_id),
            PRESENCE_TIMEOUT,
            user_id_field,
        )


async def update_user_view(
    redis_client: redis.Redis,
    project_id: str,
    user_id: int,
    current_view_id: str | None,
) -> None:
    """Update the view a user is currently on and publish update notification"""

    presence_key = USER_PRESENCE_KEY.format(project_id=project_id)
    user_id_field = str(user_id)

    if not redis_client.hexists(presence_key, user_id_field):
        return

    user_json = redis_client.hget(presence_key, user_id_field)
    user_data = json.loads(user_json)

    user_data["current_view_id"] = current_view_id

    redis_client.hset(presence_key, user_id_field, json.dumps(user_data))

    redis_client.hexpire(presence_key, PRESENCE_TIMEOUT, user_id_field)

    view_changed_event = UserViewChangedEvent(
        id=user_id, current_view_id=current_view_id
    )

    redis_client.publish(
        PROJECT_CHANNEL.format(project_id=project_id),
        view_changed_event.model_dump_json(),
    )


async def update_user_focus(
    redis_client: redis.Redis,
    project_id: str,
    user_id: int,
    focused_row_id: Optional[str],
) -> None:
    """Update the row a user is focused on and publish update notification"""

    presence_key = USER_PRESENCE_KEY.format(project_id=project_id)
    user_id_field = str(user_id)

    if not redis_client.hexists(presence_key, user_id_field):
        return

    user_json = redis_client.hget(presence_key, user_id_field)
    user_data = json.loads(user_json)

    user_data["focused_row_id"] = focused_row_id

    redis_client.hset(presence_key, user_id_field, json.dumps(user_data))

    redis_client.hexpire(presence_key, PRESENCE_TIMEOUT, user_id_field)

    focus_changed_event = UserFocusChangedEvent(
        id=user_id, focused_row_id=focused_row_id
    )

    redis_client.publish(
        PROJECT_CHANNEL.format(project_id=project_id),
        focus_changed_event.model_dump_json(),
    )
