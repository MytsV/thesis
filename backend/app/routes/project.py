import pathlib
from typing import List, Tuple, Optional
from uuid import UUID

import redis
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
from sqlalchemy import desc, exists, select
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
from app.redis.models import UserPresenceResponse
from app.redis.storage import get_redis
from app.redis.users import get_active_users
from app.sqla.project_auth import check_user_project_access, check_project_ownership
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
from app.sqla.models import Project, User, ProjectShare, File, FileColumn, FileRow
from app.utils.parsing import ParsedFile, parse_csv, parse_excel


def get_storage_service():
    return LocalFileStorageService(base_upload_dir="./uploads")


def get_file_repository(
    db: Session = Depends(get_db),
    storage_service: FileStorageService = Depends(get_storage_service),
):
    return FileRepository(db_session=db, storage_service=storage_service)


router = APIRouter(prefix="/projects")

MAX_FILES = 3


async def process_file(upload_file: UploadFile) -> ParsedFile:
    """Process an uploaded file and parse its content."""
    await upload_file.seek(0)
    content = await upload_file.read()

    file_extension = pathlib.Path(upload_file.filename).suffix.lower()

    try:
        if file_extension == ".csv":
            return parse_csv(content.decode("utf-8"))
        elif file_extension in [".xls", ".xlsx"]:
            return parse_excel(content)
        else:
            raise ValueError(f"Unsupported file type: {file_extension}")
    except Exception as e:
        raise ValueError(f"Error parsing file {upload_file.filename}: {str(e)}")


async def save_parsed_file_data(db: Session, file_id: int, parsed_file: ParsedFile):
    """Save parsed file data (columns and rows) to the database."""
    for column in parsed_file.columns:
        db_column = FileColumn(
            file_id=file_id,
            column_name=column.column_name,
            column_type=column.column_type,
        )
        db.add(db_column)

    for row_data in parsed_file.rows:
        db_row = FileRow(file_id=file_id, row_data=row_data)
        db.add(db_row)

    db.flush()


async def cleanup_saved_files(
    storage_service: FileStorageService, file_paths: List[str]
):
    """Delete all files in the provided paths list."""
    for file_path in file_paths:
        try:
            await storage_service.delete_file(file_path)
        except Exception as e:
            print(f"Failed to delete file {file_path}: {str(e)}")


@router.post("/", response_model=ProjectCreateResponse)
async def create_project(
    title: str = Form(..., min_length=3, max_length=100),
    description: str = Form(None),
    files: List[UploadFile] = FastAPIFile(..., max_items=MAX_FILES),
    db: Session = Depends(get_db),
    file_repository: FileRepository = Depends(get_file_repository),
    user: User = Depends(get_current_user),
):
    saved_file_paths = []  # Track files saved to storage for cleanup on error

    try:
        if len(files) > MAX_FILES:
            raise HTTPException(
                status_code=HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Maximum 3 files allowed per project",
            )

        if title.strip() == "":
            raise HTTPException(
                status_code=HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Title cannot be empty",
            )

        project = Project(title=title, description=description, owner_id=user.id)
        db.add(project)

        db.flush()

        processed_files = []
        file_errors = []

        # TODO: process files in a background task, mark project as unavailable before the processing is finished
        for file in files:
            try:
                db_file = await file_repository.create_file(project.id, file)
                saved_file_paths.append(db_file.file_path)

                parsed_file = await process_file(file)
                await save_parsed_file_data(db, db_file.id, parsed_file)

                processed_files.append(db_file)
            except Exception as e:
                file_errors.append({"filename": file.filename, "error": str(e)})

        if file_errors:
            db.rollback()

            await cleanup_saved_files(file_repository.storage_service, saved_file_paths)

            raise HTTPException(
                status_code=HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Failed to process all files: {file_errors}",
            )

        db.commit()

        return project
    except Exception as _:
        db.rollback()

        await cleanup_saved_files(file_repository.storage_service, saved_file_paths)

        raise


@router.get(path="", response_model=PaginatedResponse[ProjectListResponse])
async def list_user_projects(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    redis_client: redis.Redis = Depends(get_redis),
):
    offset = (page - 1) * page_size

    subquery = (
        select(ProjectShare.project_id)
        .where(ProjectShare.project_id == Project.id)
        .exists()
        .label("is_shared")
    )

    query = (
        db.query(Project, subquery)
        .filter(Project.owner_id == current_user.id)
        .order_by(desc(Project.created_at))
        .offset(offset)
        .limit(page_size + 1)
    )

    results = query.all()
    has_next_page = len(results) > page_size

    # Trim the extra result used for pagination
    if has_next_page:
        results = results[:page_size]

    # Create response objects directly from query results
    projects = []

    for project, is_shared in results:
        active_users = await get_active_users(redis_client, str(project.id))
        projects.append(
            ProjectListResponse(
                id=project.id,
                title=project.title,
                description=project.description,
                created_at=project.created_at,
                owner_id=project.owner_id,
                is_shared=is_shared,
                active_user_count=len(active_users),
            )
        )

    return PaginatedResponse(data=projects, has_next_page=has_next_page)


@router.get("/shared-with-me", response_model=PaginatedResponse[ProjectListResponse])
async def list_shared_projects(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    redis_client: redis.Redis = Depends(get_redis),
):
    """
    Get all projects that are shared with the current user.
    """
    offset = (page - 1) * page_size

    query = (
        db.query(Project, User.username.label("owner_username"))
        .join(ProjectShare, ProjectShare.project_id == Project.id)
        .join(User, User.id == Project.owner_id)
        .filter(ProjectShare.user_id == current_user.id)
        .order_by(desc(Project.created_at))
        .offset(offset)
        .limit(page_size + 1)
    )

    results = query.all()

    has_next_page = len(results) > page_size

    if has_next_page:
        results = results[:page_size]

    shared_projects = []

    for project, owner_username in results:
        active_users = await get_active_users(redis_client, str(project.id))
        shared_projects.append(
            ProjectListResponse(
                id=project.id,
                title=project.title,
                description=project.description,
                created_at=project.created_at,
                owner_id=project.owner_id,
                owner_username=owner_username,
                is_shared=True,
                active_user_count=len(active_users),
            )
        )

    return PaginatedResponse(data=shared_projects, has_next_page=has_next_page)


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


@router.get("/{project_id}/active-users", response_model=List[UserPresenceResponse])
async def get_project_active_users(
    project_id: UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    redis_client: redis.Redis = Depends(get_redis),
):
    """
    Get list of active users in a project.
    This REST endpoint is useful for getting the user list before connecting via WebSocket.
    """
    check_user_project_access(db, project_id, user.id)
    active_users = await get_active_users(redis_client, str(project_id))
    return active_users
