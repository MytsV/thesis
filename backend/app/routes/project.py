from typing import List

from fastapi import (
    Depends,
    APIRouter,
    Form,
    File as FastAPIFile,
    Form,
    UploadFile,
    HTTPException,
)
from sqlalchemy.orm import Session
from starlette.status import HTTP_422_UNPROCESSABLE_ENTITY

from app.auth.dependencies import get_current_user
from app.file_storage import LocalFileStorageService, FileStorageService
from app.models.project_models import ProjectCreateResponse
from app.sqla.database import get_db
from app.sqla.file_repository import FileRepository
from app.sqla.models import Project, User


def get_storage_service():
    return LocalFileStorageService(base_upload_dir="./uploads")


def get_file_repository(
    db: Session = Depends(get_db),
    storage_service: FileStorageService = Depends(get_storage_service),
):
    return FileRepository(db_session=db, storage_service=storage_service)


router = APIRouter(prefix="/projects")


@router.post("/", response_model=ProjectCreateResponse)
async def create_project(
    title: str = Form(..., min_length=3, max_length=100),
    description: str = Form(None),
    files: List[UploadFile] = FastAPIFile(..., max_items=3),
    db: Session = Depends(get_db),
    file_repository: FileRepository = Depends(get_file_repository),
    user: User = Depends(get_current_user),
):
    if title.strip() == "":
        raise HTTPException(
            status_code=HTTP_422_UNPROCESSABLE_ENTITY, detail="Title cannot be empty"
        )

    project = Project(title=title, description=description, user_id=user.id)
    db.add(project)
    db.commit()
    db.refresh(project)

    # TODO: validate files
    for file in files:
        await file_repository.create_file(project.id, file)

    # TODO: process files

    # TODO: delete the project if file processing fails (rollback)
    # TODO: close the project after creation
    return project
