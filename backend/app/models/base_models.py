from typing import TypeVar, Generic, List

from fastapi_camelcase import CamelModel

T = TypeVar("T")


class PaginatedResponse(CamelModel, Generic[T]):
    data: List[T]
    has_next_page: bool
