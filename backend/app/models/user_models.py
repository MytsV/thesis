from datetime import datetime

from fastapi_camelcase import CamelModel
from pydantic import EmailStr, Field, field_validator
import re


class UserBase(CamelModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)


class UserCreateRequest(UserBase):
    password: str = Field(..., min_length=8)

    @field_validator("username")
    def username_alphanumeric(cls, value):
        if not re.match(r"^[a-zA-Z0-9_-]+$", value):
            raise ValueError(
                "Username must contain only letters, numbers, underscores, and hyphens"
            )
        return value

    @field_validator("password")
    def password_strength(cls, value):
        if not re.search(r"[A-Z]", value):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", value):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"[0-9]", value):
            raise ValueError("Password must contain at least one digit")
        if not re.search(r"[^a-zA-Z0-9]", value):
            raise ValueError("Password must contain at least one special character")
        return value


class UserCreateResponse(UserBase):
    id: int

    class Config:
        from_attributes = True


class UserLoginRequest(CamelModel):
    username: str
    password: str


class UserLoginResponse(CamelModel):
    username: str
    email: str
