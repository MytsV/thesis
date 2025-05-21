from uuid import UUID

from fastapi_camelcase import CamelModel
from pydantic import UUID4, BaseModel
from typing import List, Dict, Any


# Base schema for all views
class ViewBase(CamelModel):
    name: str


class ViewCreate(ViewBase):
    # Base view creation model - abstract, should be extended by specific view types
    pass


class SimpleTableViewCreate(ViewCreate):
    view_type: str = "simple_table"
    file_id: int


class ViewRead(ViewBase):
    id: UUID4
    project_id: UUID4
    view_type: str

    class Config:
        from_attributes = True


class SimpleTableViewRead(ViewRead):
    file_id: int

    class Config:
        from_attributes = True


class ViewList(CamelModel):
    views: List[ViewRead]


class ViewListResponse(CamelModel):
    """Response model for listing views of a project"""

    views: List[ViewRead]


class FileColumnResponse(CamelModel):
    """Response model for a file column"""

    id: int
    column_name: str
    column_type: str

    class Config:
        from_attributes = True


class TableSchemaResponse(CamelModel):
    columns: List[FileColumnResponse]


class FileRowResponse(CamelModel):
    id: UUID4
    version: int
    data: Dict[str, Any]


class TableRowsResponse(CamelModel):
    rows: List[FileRowResponse]


class CellUpdateRequest(CamelModel):
    column_name: str
    value: Any
    row_version: int


class CellUpdateResponse(CamelModel):
    success: bool


class SortModelItem(CamelModel):
    column_name: str
    sort_direction: str | None = None


class SortModelUpdate(CamelModel):
    sort_model: List[SortModelItem]


class FilterModelUpdate(CamelModel):
    filter_model: Dict[str, Any]


class SortModelResponse(CamelModel):
    sort_model: List[SortModelItem] | None


class FilterModelResponse(CamelModel):
    filter_model: Dict[str, Any] | None


class DiscreteColumnChartViewCreate(CamelModel):
    name: str
    file_id: int
    column_id: int


class DiscreteColumnChartViewRead(CamelModel):
    id: UUID
    name: str
    view_type: str
    project_id: UUID
    file_id: int
    column_id: int

    class Config:
        from_attributes = True


class ChartDataPoint(CamelModel):
    label: str
    value: int


class DiscreteColumnChartDataResponse(CamelModel):
    column_name: str
    data: List[ChartDataPoint]
