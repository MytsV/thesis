from typing import List, Optional, Any

from fastapi_camelcase import CamelModel
from pydantic import BaseModel


class BaseEvent(BaseModel):
    event: str


# Events from client to server


class HeartbeatEvent(BaseEvent):
    event: str = "heartbeat"


# Events from server to client


class HeartbeatAcknowledgmentEvent(BaseEvent):
    event: str = "heartbeat_ack"


class UserJoinedEvent(BaseEvent):
    event: str = "user_joined"
    id: int
    username: str
    color: str


class InitEventUser(CamelModel):
    id: int
    username: str
    color: str
    current_view_id: str | None = None
    focused_row_id: str | None = None


class InitEvent(BaseEvent):
    event: str = "init"
    users: List[InitEventUser]


class UserLeftEvent(BaseEvent):
    event: str = "user_left"
    id: int


# Data stored in Redis


class UserPresence(BaseModel):
    username: str
    color: str
    joined_at: int
    current_view_id: str | None = None
    focused_row_id: str | None = None


class UserViewChangedEvent(BaseEvent):
    id: int
    current_view_id: str | None
    event: str = "user_view_changed"


class UserFocusChangedEvent(BaseEvent):
    id: int
    focused_row_id: str | None
    event: str = "user_focus_changed"


class UserPresenceResponse(UserPresence):
    id: int


class RowUpdateInfo(BaseModel):
    row_id: str
    column_name: str
    value: Any
    row_version: int
    view_id: str


class RowUpdateEvent(RowUpdateInfo):
    event: str = "row_update"
