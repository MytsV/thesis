from typing import TypeVar, Generic, List

from pydantic import BaseModel

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    data: List[T]
    has_next_page: bool
