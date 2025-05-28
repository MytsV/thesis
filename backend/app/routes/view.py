from datetime import datetime
from typing import Any, Counter
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
    SortModelResponse,
    SortModelItem,
    SortModelUpdate,
    FilterModelResponse,
    FilterModelUpdate,
    DiscreteColumnChartViewRead,
    DiscreteColumnChartViewCreate,
    DiscreteColumnChartDataResponse,
    ChartDataPoint,
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
    DiscreteColumnChartView,
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
            file_id=simple_view.file_id,
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


@router.get("/{view_id}/sort-model", response_model=SortModelResponse)
async def get_view_sort_model(
    view_id: UUID = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    view, _, _ = check_view_exists_and_access(db, view_id, current_user.id)

    if view.view_type != "simple_table":
        raise HTTPException(
            status_code=HTTP_400_BAD_REQUEST,
            detail="Sort model is only available for simple table views",
        )

    simple_view = (
        db.query(SimpleTableView).filter(SimpleTableView.id == view_id).first()
    )
    if not simple_view:
        raise HTTPException(
            status_code=HTTP_404_NOT_FOUND, detail="Simple table view not found"
        )

    sort_model = None
    if simple_view.sort_model:
        sort_model = [SortModelItem(**item) for item in simple_view.sort_model]

    return SortModelResponse(sort_model=sort_model)


@router.put("/{view_id}/sort-model", response_model=SortModelResponse)
async def update_view_sort_model(
    view_id: UUID = Path(...),
    sort_data: SortModelUpdate = ...,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update the sort model for a simple table view.
    Available for the owner and shared users.
    """
    view, _, _ = check_view_exists_and_access(db, view_id, current_user.id)

    if view.view_type != "simple_table":
        raise HTTPException(
            status_code=HTTP_400_BAD_REQUEST,
            detail="Sort model is only available for simple table views",
        )

    simple_view = (
        db.query(SimpleTableView).filter(SimpleTableView.id == view_id).first()
    )
    if not simple_view:
        raise HTTPException(
            status_code=HTTP_404_NOT_FOUND, detail="Simple table view not found"
        )

    # Validate column names exist
    columns = (
        db.query(FileColumn).filter(FileColumn.file_id == simple_view.file_id).all()
    )
    column_names = {col.column_name for col in columns}

    for sort_item in sort_data.sort_model:
        if sort_item.column_name not in column_names:
            raise HTTPException(
                status_code=HTTP_400_BAD_REQUEST,
                detail=f"Column '{sort_item.column_name}' not found in the table",
            )
        if sort_item.sort_direction and sort_item.sort_direction not in ["asc", "desc"]:
            raise HTTPException(
                status_code=HTTP_400_BAD_REQUEST,
                detail=f"Invalid sort direction '{sort_item.sort_direction}'. Must be 'asc' or 'desc'",
            )

    # Convert to dict for JSON storage
    sort_model_dict = [item.model_dump() for item in sort_data.sort_model]

    simple_view.sort_model = sort_model_dict
    db.commit()
    db.refresh(simple_view)

    return SortModelResponse(sort_model=sort_data.sort_model)


@router.get("/{view_id}/filter-model", response_model=FilterModelResponse)
async def get_view_filter_model(
    view_id: UUID = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get the filter model for a simple table view.
    Available for the owner and shared users.
    """
    view, _, _ = check_view_exists_and_access(db, view_id, current_user.id)

    if view.view_type != "simple_table":
        raise HTTPException(
            status_code=HTTP_400_BAD_REQUEST,
            detail="Filter model is only available for simple table views",
        )

    simple_view = (
        db.query(SimpleTableView).filter(SimpleTableView.id == view_id).first()
    )
    if not simple_view:
        raise HTTPException(
            status_code=HTTP_404_NOT_FOUND, detail="Simple table view not found"
        )

    return FilterModelResponse(filter_model=simple_view.filter_model)


@router.put("/{view_id}/filter-model", response_model=FilterModelResponse)
async def update_view_filter_model(
    view_id: UUID = Path(...),
    filter_data: FilterModelUpdate = ...,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update the filter model for a simple table view.
    Available for the owner and shared users.
    """
    view, _, _ = check_view_exists_and_access(db, view_id, current_user.id)

    if view.view_type != "simple_table":
        raise HTTPException(
            status_code=HTTP_400_BAD_REQUEST,
            detail="Filter model is only available for simple table views",
        )

    simple_view = (
        db.query(SimpleTableView).filter(SimpleTableView.id == view_id).first()
    )
    if not simple_view:
        raise HTTPException(
            status_code=HTTP_404_NOT_FOUND, detail="Simple table view not found"
        )

    # Store the filter model as-is since it's an arbitrary dictionary
    simple_view.filter_model = filter_data.filter_model
    db.commit()
    db.refresh(simple_view)

    return FilterModelResponse(filter_model=filter_data.filter_model)


@router.post(
    "/project/{project_id}/discrete-column-chart",
    response_model=DiscreteColumnChartViewRead,
    status_code=HTTP_201_CREATED,
)
async def create_discrete_column_chart_view(
    project_id: UUID,
    view_data: DiscreteColumnChartViewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create a new discrete column chart view for a project.
    Available for the owner and shared users.
    """
    # Check access to the project
    project, _ = check_user_project_access(db, project_id, current_user.id)

    # Verify file exists and belongs to the project
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

    # Verify column exists and belongs to the file
    column = (
        db.query(FileColumn)
        .filter(
            FileColumn.id == view_data.column_id,
            FileColumn.file_id == view_data.file_id,
        )
        .first()
    )

    if not column:
        raise HTTPException(
            status_code=HTTP_400_BAD_REQUEST,
            detail=f"Column with ID {view_data.column_id} does not exist or does not belong to this file",
        )

    view = DiscreteColumnChartView(
        project_id=project_id,
        name=view_data.name,
        file_id=view_data.file_id,
        column_id=view_data.column_id,
    )

    db.add(view)
    db.commit()
    db.refresh(view)

    return view


MAX_CHART_DATA_POINTS = 5


@router.get("/{view_id}/chart-data", response_model=DiscreteColumnChartDataResponse)
async def get_chart_data(
    view_id: UUID = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get the chart data for a discrete column chart view.
    Returns aggregated data with the top 5 values and an "Other" category.
    Available for the owner and shared users.
    """
    view, _, _ = check_view_exists_and_access(db, view_id, current_user.id)

    if view.view_type != "discrete_column_chart":
        raise HTTPException(
            status_code=HTTP_400_BAD_REQUEST,
            detail="Chart data is only available for discrete column chart views",
        )

    chart_view = (
        db.query(DiscreteColumnChartView)
        .filter(DiscreteColumnChartView.id == view_id)
        .first()
    )
    if not chart_view:
        raise HTTPException(
            status_code=HTTP_404_NOT_FOUND,
            detail="Discrete column chart view not found",
        )

    column = db.query(FileColumn).filter(FileColumn.id == chart_view.column_id).first()
    if not column:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Column not found")

    value_counts = {}
    for row in db.query(FileRow).filter(FileRow.file_id == chart_view.file_id):
        if column.column_name in row.row_data:
            value = (
                str(row.row_data[column.column_name])
                if row.row_data[column.column_name] is not None
                else "None"
            )
            value_counts[value] = value_counts.get(value, 0) + 1

    sorted_values = sorted(value_counts.items(), key=lambda x: x[1], reverse=True)
    top_values = sorted_values[:MAX_CHART_DATA_POINTS]

    other_count = (
        sum(count for _, count in sorted_values[MAX_CHART_DATA_POINTS:])
        if len(sorted_values) > MAX_CHART_DATA_POINTS
        else 0
    )

    chart_data = [
        ChartDataPoint(label=label, value=count) for label, count in top_values
    ]
    if other_count > 0:
        chart_data.append(ChartDataPoint(label="Other", value=other_count))

    return DiscreteColumnChartDataResponse(
        column_name=column.column_name, data=chart_data
    )
