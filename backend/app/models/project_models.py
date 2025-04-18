import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class ProjectCreateResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: str | None = None
    user_id: int


class ProjectListResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: str | None = None
    created_at: datetime
    user_id: int
    # TODO: add fields coming from Redis
