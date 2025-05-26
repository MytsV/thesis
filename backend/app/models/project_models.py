import uuid
from datetime import datetime
from typing import List, Optional

from fastapi_camelcase import CamelModel
from pydantic import BaseModel

from app.models.user_models import UserDetailResponse
from app.sqla.models import File


class ProjectCreateResponse(CamelModel):
    id: uuid.UUID
    title: str
    description: str | None = None
    owner_id: int

    class Config:
        from_attributes = True


class ProjectListResponse(CamelModel):
    id: uuid.UUID
    title: str
    description: str | None = None
    created_at: datetime
    owner_id: int
    owner_username: str | None = None
    is_shared: bool = False
    active_user_count: int = 0

    class Config:
        from_attributes = True


class FileResponse(CamelModel):
    id: int
    name: str
    relative_path: str
    file_size: int | None = None
    file_type: str | None = None

    class Config:
        from_attributes = True

    @classmethod
    def from_orm(cls, file: File):
        return cls(
            id=file.id,
            name=file.original_filename,
            relative_path=file.file_path.replace("./", "/"),
            file_size=file.file_size,
            file_type=file.file_type,
        )


class ProjectDetailResponse(CamelModel):
    id: uuid.UUID
    title: str
    description: str | None = None
    created_at: datetime
    owner: UserDetailResponse
    files: List[FileResponse]

    class Config:
        from_attributes = True


class UserChatResponse(CamelModel):
    id: int
    username: str
    avatar_url: str | None = None

    class Config:
        from_attributes = True


class ViewChatResponse(CamelModel):
    id: uuid.UUID
    name: str
    view_type: str

    class Config:
        from_attributes = True


class ChatMessageResponse(CamelModel):
    id: uuid.UUID
    content: str
    created_at: int
    user: UserChatResponse
    view: Optional[ViewChatResponse] = None

    class Config:
        from_attributes = True
