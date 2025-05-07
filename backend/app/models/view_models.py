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
