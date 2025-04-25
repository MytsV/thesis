from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from fastapi.params import Path
from sqlalchemy.orm import Session
from starlette.status import HTTP_400_BAD_REQUEST, HTTP_404_NOT_FOUND, HTTP_201_CREATED

from app.auth.dependencies import get_current_user
from app.models.view_models import (
    ViewListResponse,
    TableSchemaResponse,
    TableRowsResponse,
    SimpleTableViewRead,
    SimpleTableViewCreate,
    FileRowResponse,
)
from app.sqla.database import get_db
from app.sqla.models import (
    User,
    View,
    SimpleTableView,
    FileColumn,
    FileRow,
    File,
    Project,
)
from app.sqla.project_auth import check_user_project_access

router = APIRouter(prefix="/views")


def check_view_exists_and_access(
    db: Session, view_id: UUID, user_id: int
) -> tuple[View, Project, bool]:
    """
    Check if a view exists and if the user has access to it.
    Returns tuple of (view, project, is_owner).
    Raises 404 if view not found, 403 if no access.
    """
    view = db.query(View).filter(View.id == view_id).first()

    if not view:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="View not found")

    # Check project access
    project, is_owner = check_user_project_access(db, view.project_id, user_id)

    return view, project, is_owner


@router.get("/project/{project_id}", response_model=ViewListResponse)
async def list_project_views(
    project_id: UUID = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get a list of all views for a project.
    Available for the owner and shared users.
    """
    project, _ = check_user_project_access(db, project_id, current_user.id)
    views = db.query(View).filter(View.project_id == project_id).all()
    return ViewListResponse(views=views)


@router.get("/{view_id}/schema", response_model=TableSchemaResponse)
async def get_view_schema(
    view_id: UUID = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get the schema for a simple table view.
    Available for the owner and shared users.
    """
    view, _, _ = check_view_exists_and_access(db, view_id, current_user.id)

    if view.view_type != "simple_table":
        raise HTTPException(
            status_code=HTTP_400_BAD_REQUEST,
            detail="Schema is only available for simple table views",
        )

    simple_view = (
        db.query(SimpleTableView).filter(SimpleTableView.id == view_id).first()
    )
    if not simple_view:
        raise HTTPException(
            status_code=HTTP_404_NOT_FOUND, detail="Simple table view not found"
        )

    columns = (
        db.query(FileColumn).filter(FileColumn.file_id == simple_view.file_id).all()
    )

    return TableSchemaResponse(
        columns=columns,
    )


# TODO: Implement pagination and filtering for rows
@router.get("/{view_id}/rows", response_model=TableRowsResponse)
async def get_view_rows(
    view_id: UUID = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get all rows for a simple table view.
    Available for the owner and shared users.
    """
    view, _, _ = check_view_exists_and_access(db, view_id, current_user.id)

    if view.view_type != "simple_table":
        raise HTTPException(
            status_code=HTTP_400_BAD_REQUEST,
            detail="Rows are only available for simple table views",
        )

    simple_view = (
        db.query(SimpleTableView).filter(SimpleTableView.id == view_id).first()
    )
    if not simple_view:
        raise HTTPException(
            status_code=HTTP_404_NOT_FOUND, detail="Simple table view not found"
        )

    rows = db.query(FileRow).filter(FileRow.file_id == simple_view.file_id).all()

    response_rows = [FileRowResponse(id=row.id, data=row.row_data) for row in rows]

    return TableRowsResponse(rows=response_rows)


@router.post(
    "/project/{project_id}/simple-table",
    response_model=SimpleTableViewRead,
    status_code=HTTP_201_CREATED,
)
async def create_simple_table_view(
    project_id: UUID,
    view_data: SimpleTableViewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create a new simple table view for a project.
    Available for the owner and shared users.
    """
    # Check access to the project
    project, _ = check_user_project_access(db, project_id, current_user.id)

    file = (
        db.query(File)
        .filter(File.id == view_data.file_id, File.project_id == project_id)
        .first()
    )

    if not file:
        raise HTTPException(
            status_code=HTTP_400_BAD_REQUEST,
            detail=f"File with ID {view_data.file_id} does not exist or does not belong to this project",
        )

    view = SimpleTableView(
        project_id=project_id,
        name=view_data.name,
        file_id=view_data.file_id,
    )

    db.add(view)
    db.commit()
    db.refresh(view)

    return view
