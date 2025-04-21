import uuid
from datetime import datetime

from fastapi_camelcase import CamelModel


class ProjectCreateResponse(CamelModel):
    id: uuid.UUID
    title: str
    description: str | None = None
    owner_id: int


class ProjectListResponse(CamelModel):
    id: uuid.UUID
    title: str
    description: str | None = None
    created_at: datetime
    owner_id: int
    # TODO: add fields coming from Redis
