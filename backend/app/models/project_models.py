from pydantic import BaseModel, Field


class ProjectCreateResponse(BaseModel):
    title: str
    description: str | None = None
    user_id: int
