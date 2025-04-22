from typing import List

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
    user_id: int
    username: str


class InitEventUser(BaseModel):
    user_id: int
    username: str


class InitEvent(BaseEvent):
    event: str = "init"
    users: List[InitEventUser]


class UserLeftEvent(BaseEvent):
    event: str = "user_left"
    user_id: int


# Data stored in Redis


class UserPresence(BaseModel):
    username: str
    color: str
    joined_at: str


class UserPresenceResponse(UserPresence):
    user_id: int
