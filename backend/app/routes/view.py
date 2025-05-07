from datetime import datetime
from typing import Any
from uuid import UUID

import redis
from fastapi import APIRouter, Depends, HTTPException
from fastapi.params import Path
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from starlette.status import (
    HTTP_400_BAD_REQUEST,
    HTTP_404_NOT_FOUND,
    HTTP_201_CREATED,
    HTTP_409_CONFLICT,
    HTTP_500_INTERNAL_SERVER_ERROR,
)

from app.auth.dependencies import get_current_user
from app.models.view_models import (
    ViewListResponse,
    TableSchemaResponse,
    TableRowsResponse,
    SimpleTableViewRead,
    SimpleTableViewCreate,
    FileRowResponse,
    CellUpdateRequest,
    CellUpdateResponse,
)
from app.redis.models import RowUpdateInfo
from app.redis.storage import get_redis
from app.redis.views import update_row
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

    response_rows = [
        FileRowResponse(id=row.id, data=row.row_data, version=row.version)
        for row in rows
    ]

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


def validate_cell_value(value: Any, column_type: str) -> Any:
    """
    Validate and convert the provided value to match the column's data type.
    Raises an exception if validation fails.
    """
    try:
        if column_type == "string":
            return str(value)
        elif column_type == "int":
            return int(value)
        elif column_type == "float":
            return float(value)
        elif column_type == "boolean":
            if isinstance(value, str):
                if value.lower() in ["true", "yes", "1"]:
                    return True
                elif value.lower() in ["false", "no", "0"]:
                    return False
                raise ValueError("Invalid boolean value")
            return bool(value)
        elif column_type == "datetime":
            if isinstance(value, str):
                return datetime.fromisoformat(value).isoformat()
            raise ValueError("Datetime must be a string in ISO format")
        else:
            # For unrecognized types, pass through the value
            return value
    except (ValueError, TypeError) as e:
        raise HTTPException(
            status_code=HTTP_400_BAD_REQUEST,
            detail=f"Invalid value for column type '{column_type}': {str(e)}",
        )


@router.put("/{view_id}/rows/{row_id}/cell", response_model=CellUpdateResponse)
async def update_cell(
    view_id: UUID = Path(...),
    row_id: UUID = Path(...),
    cell_data: CellUpdateRequest = ...,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    redis_client: redis.Redis = Depends(get_redis),
):
    """
    Update a single cell in a row with validation and concurrency control.
    """
    view, _, _ = check_view_exists_and_access(db, view_id, current_user.id)

    if view.view_type != "simple_table":
        raise HTTPException(
            status_code=HTTP_400_BAD_REQUEST,
            detail="Cell updates are only available for simple table views",
        )

    simple_view = (
        db.query(SimpleTableView).filter(SimpleTableView.id == view_id).first()
    )
    if not simple_view:
        raise HTTPException(
            status_code=HTTP_404_NOT_FOUND,
            detail="Simple table view not found",
        )

    # Find the row to update
    row = (
        db.query(FileRow)
        .filter(FileRow.id == row_id, FileRow.file_id == simple_view.file_id)
        .first()
    )

    if not row:
        raise HTTPException(
            status_code=HTTP_404_NOT_FOUND,
            detail="Row not found",
        )

    # Verify the row version matches to prevent concurrent updates
    if row.version != cell_data.row_version:
        raise HTTPException(
            status_code=HTTP_409_CONFLICT,
            detail="Row has been modified by another user. Please refresh and try again.",
        )

    # Get column information for type validation
    column = (
        db.query(FileColumn)
        .filter(
            FileColumn.file_id == simple_view.file_id,
            FileColumn.column_name == cell_data.column_name,
        )
        .first()
    )

    if not column:
        raise HTTPException(
            status_code=HTTP_400_BAD_REQUEST,
            detail=f"Column '{cell_data.column_name}' not found",
        )

    # Validate the value type
    validated_value = validate_cell_value(cell_data.value, column.column_type)

    row_data = dict(row.row_data)
    row_data[cell_data.column_name] = validated_value

    try:
        result = (
            db.query(FileRow)
            .filter(FileRow.id == row_id, FileRow.version == cell_data.row_version)
            .update(
                {
                    "row_data": row_data,
                    "version": FileRow.version + 1,
                }
            )
        )

        if result == 0:
            # No rows were updated - another concurrent update happened
            db.rollback()
            raise HTTPException(
                status_code=HTTP_409_CONFLICT,
                detail="Row was modified by another user while processing your request",
            )

        db.commit()

        event_info = RowUpdateInfo(
            row_id=str(row.id),
            column_name=cell_data.column_name,
            value=validated_value,
            row_version=row.version,
            view_id=str(view_id),
        )

        update_row(
            redis_client,
            event_info,
            simple_view.project_id,
        )

        return CellUpdateResponse(success=True)

    except IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status_code=HTTP_400_BAD_REQUEST,
            detail=f"Database integrity error: {str(e)}",
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}",
        )
