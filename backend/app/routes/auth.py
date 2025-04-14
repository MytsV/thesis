from typing import Any

from fastapi import APIRouter, status, Depends, HTTPException, Response
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth.dependencies import create_access_token
from app.auth.password import get_password_hash, verify_password
from app.models.user_models import UserCreateResponse, UserCreateRequest, UserLoginRequest, UserLoginResponse
from app.sqla.database import get_db
from app.sqla.models import User

router = APIRouter(prefix="/auth")


@router.post(
    "/register", response_model=UserCreateResponse, status_code=status.HTTP_201_CREATED
)
async def register_user(request: UserCreateRequest, db: Session = Depends(get_db)) -> Any:
    """
    Register a new user with email validation and password hashing.
    """
    if db.query(User).filter(User.email == request.email).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Email already registered"
        )

    if db.query(User).filter(User.username == request.username).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Username already taken"
        )

    try:
        new_user = User(
            username=request.username,
            email=request.email,
            hashed_password=get_password_hash(request.password),
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


# TODO: check whether the cookie is set
@router.post("/login", response_model=UserLoginResponse)
async def login(
    request: UserLoginRequest, response: Response, db: Session = Depends(get_db)
) -> Any:
    user = db.query(User).filter(User.username == request.username).first()
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": user.username})

    # TODO: set secure=True in production
    response.set_cookie(
        key="session",
        value=access_token,
        httponly=True,
        secure=False,  # Set to True in production with HTTPS
        samesite="lax",  # Protects against CSRF
        max_age=None,
    )

    return {"username": user.username, "email": user.email}


# TODO: check whether the cookie is set
@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(key="session")
    return {"message": "Successfully logged out"}
