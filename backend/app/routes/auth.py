from typing import Any

from fastapi import APIRouter, status, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth.password import get_password_hash
from app.models.user_models import UserResponse, UserCreate
from app.sqla.database import get_db
from app.sqla.models import User

router = APIRouter(prefix="/auth")


@router.post(
    "/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED
)
async def register_user(request_user: UserCreate, db: Session = Depends(get_db)) -> Any:
    """
    Register a new user with email validation and password hashing.
    """
    if db.query(User).filter(User.email == request_user.email).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Email already registered"
        )

    if db.query(User).filter(User.username == request_user.username).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Username already taken"
        )

    try:
        new_user = User(
            username=request_user.username,
            email=request_user.email,
            hashed_password=get_password_hash(request_user.password),
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        return new_user
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration failed. Please try again.",
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}",
        )
