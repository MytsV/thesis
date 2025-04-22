from typing import List

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


class InitEvent(BaseEvent):
    event: str = "init"
    users: List[InitEventUser]


class UserLeftEvent(BaseEvent):
    event: str = "user_left"
    id: int


# Data stored in Redis


class UserPresence(CamelModel):
    username: str
    color: str
    joined_at: int


class UserPresenceResponse(UserPresence):
    id: int
