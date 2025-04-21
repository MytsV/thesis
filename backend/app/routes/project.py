from typing import List, Tuple, Optional
from uuid import UUID

from fastapi import (
    Depends,
    APIRouter,
    Form,
    File as FastAPIFile,
    Form,
    UploadFile,
    HTTPException,
    Query,
)
from fastapi.params import Path
from sqlalchemy import desc
from sqlalchemy.orm import Session
from starlette.status import (
    HTTP_422_UNPROCESSABLE_ENTITY,
    HTTP_404_NOT_FOUND,
    HTTP_403_FORBIDDEN,
    HTTP_201_CREATED,
    HTTP_400_BAD_REQUEST,
)

from app.auth.dependencies import get_current_user
from app.models.user_models import UserDetailResponse
from app.utils.file_storage import LocalFileStorageService, FileStorageService
from app.models.base_models import PaginatedResponse
from app.models.project_models import (
    ProjectCreateResponse,
    ProjectListResponse,
    ProjectDetailResponse,
    FileResponse,
)
from app.sqla.database import get_db
from app.sqla.file_repository import FileRepository
from app.sqla.models import Project, User, ProjectShare


def get_storage_service():
    return LocalFileStorageService(base_upload_dir="./uploads")


def get_file_repository(
    db: Session = Depends(get_db),
    storage_service: FileStorageService = Depends(get_storage_service),
):
    return FileRepository(db_session=db, storage_service=storage_service)


router = APIRouter(prefix="/projects")

MAX_FILES = 3


@router.post("/", response_model=ProjectCreateResponse)
async def create_project(
    title: str = Form(..., min_length=3, max_length=100),
    description: str = Form(None),
    files: List[UploadFile] = FastAPIFile(..., max_items=MAX_FILES),
    db: Session = Depends(get_db),
    file_repository: FileRepository = Depends(get_file_repository),
    user: User = Depends(get_current_user),
):
    if len(files) > MAX_FILES:
        raise HTTPException(
            status_code=HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Maximum 3 files allowed per project",
        )

    if title.strip() == "":
        raise HTTPException(
            status_code=HTTP_422_UNPROCESSABLE_ENTITY, detail="Title cannot be empty"
        )

    project = Project(title=title, description=description, owner_id=user.id)
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


@router.get(path="", response_model=PaginatedResponse[ProjectListResponse])
async def list_user_projects(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    offset = (page - 1) * page_size

    projects = (
        db.query(Project)
        .filter(Project.owner_id == current_user.id)
        .order_by(desc(Project.created_at))
        .offset(offset)
        .limit(page_size + 1)
        .all()
    )

    has_next_page = len(projects) > page_size

    if has_next_page:
        projects = projects[:page_size]

    return PaginatedResponse(data=projects, has_next_page=has_next_page)


def check_project_exists(db: Session, project_id: UUID) -> Project:
    """
    Check if a project exists and return it.
    Raises 404 if not found.
    """
    project = db.query(Project).filter(Project.id == project_id).first()

    if not project:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Project not found")

    return project


def check_user_project_access(
    db: Session, project_id: UUID, user_id: int
) -> Tuple[Project, bool]:
    """
    Check if a user has access to a project.
    Returns tuple of (project, is_owner).
    Raises 403 if no access.
    """
    # Get the project
    project = check_project_exists(db, project_id)

    # Check if user is owner
    is_owner = project.owner_id == user_id

    # Check if user has shared access
    has_shared_access = False
    if not is_owner:
        shared_access = (
            db.query(ProjectShare)
            .filter(
                ProjectShare.project_id == project_id, ProjectShare.user_id == user_id
            )
            .first()
        )
        has_shared_access = shared_access is not None

    if not (is_owner or has_shared_access):
        raise HTTPException(
            status_code=HTTP_403_FORBIDDEN,
            detail="You don't have access to this project",
        )

    return project, is_owner


def check_project_ownership(db: Session, project_id: UUID, user_id: int) -> Project:
    """
    Check if a user is the owner of a project.
    Returns the project if successful.
    Raises 403 if not owner.
    """
    # Get the project
    project = check_project_exists(db, project_id)

    # Check if user is owner
    if project.owner_id != user_id:
        raise HTTPException(
            status_code=HTTP_403_FORBIDDEN,
            detail="Only the project owner can perform this action",
        )

    return project


def get_invited_user(db: Session, username: str) -> User:
    """
    Find a user by username.
    Raises 404 if not found.
    """
    user = db.query(User).filter(User.username == username).first()

    if not user:
        raise HTTPException(
            status_code=HTTP_404_NOT_FOUND, detail=f"User '{username}' not found"
        )

    return user


def check_existing_share(
    db: Session, project_id: UUID, user_id: int
) -> Optional[ProjectShare]:
    """
    Check if a user is already invited to a project.
    Returns the share if it exists, None otherwise.
    """
    return (
        db.query(ProjectShare)
        .filter(ProjectShare.project_id == project_id, ProjectShare.user_id == user_id)
        .first()
    )


@router.get("/{project_id}", response_model=ProjectDetailResponse)
async def get_project(
    project_id: UUID = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get project metadata and files by ID.
    Available for the owner and shared users.
    """
    # Check access and get project
    project, _ = check_user_project_access(db, project_id, current_user.id)

    # Build response with files
    response = ProjectDetailResponse(
        id=project.id,
        title=project.title,
        description=project.description,
        created_at=project.created_at,
        owner=project.user,
        files=[FileResponse.from_orm(file) for file in project.files],
    )

    return response


@router.get("/{project_id}/shared-users", response_model=List[UserDetailResponse])
async def list_shared_users(
    project_id: UUID = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    List all users that the project is shared with.
    """
    # Check access
    check_user_project_access(db, project_id, current_user.id)

    # Get all users with whom the project is shared
    shared_users = (
        db.query(User)
        .join(ProjectShare, ProjectShare.user_id == User.id)
        .filter(ProjectShare.project_id == project_id)
        .all()
    )

    return shared_users


@router.post("/{project_id}/invite", status_code=HTTP_201_CREATED)
async def invite_user(
    project_id: UUID = Path(...),
    username: str = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Invite a user to the project.
    Can only be called by the project owner.
    """
    # Check if current user is the owner
    check_project_ownership(db, project_id, current_user.id)

    # Find the user to invite
    invited_user = get_invited_user(db, username)

    # Check if user is already the owner
    if invited_user.id == current_user.id:
        raise HTTPException(
            status_code=HTTP_400_BAD_REQUEST,
            detail="You can't invite yourself to your own project",
        )

    # Check if user is already invited
    existing_share = check_existing_share(db, project_id, invited_user.id)

    if existing_share:
        raise HTTPException(
            status_code=HTTP_400_BAD_REQUEST,
            detail=f"User '{username}' is already invited to this project",
        )

    # Create the project share
    new_share = ProjectShare(project_id=project_id, user_id=invited_user.id)

    db.add(new_share)
    db.commit()

    return {"message": f"User '{username}' has been invited to the project"}
