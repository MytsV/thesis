import os
from datetime import datetime, timedelta
from typing import Optional, Any, Dict

from fastapi import Depends, HTTPException, status, Cookie, WebSocket
from fastapi.security import APIKeyCookie
from sqlalchemy.orm import Session
from pydantic import BaseModel
import jwt

from app.sqla.database import get_db
from app.sqla.models import User

# Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 day


# Token models
class TokenData(BaseModel):
    username: Optional[str] = None


# Cookie security
cookie_scheme = APIKeyCookie(name="session")


def create_access_token(
    data: Dict[str, Any], expires_delta: Optional[timedelta] = None
) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def get_current_user(
    session: str = Depends(cookie_scheme), db: Session = Depends(get_db)
) -> User:
    """Verify JWT token and return the current user."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(session, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except jwt.PyJWTError:
        raise credentials_exception

    user = db.query(User).filter(User.username == token_data.username).first()
    if user is None:
        raise credentials_exception
    return user


async def get_websocket_user(
    websocket: WebSocket, db: Session = Depends(get_db)
) -> Optional[User]:
    """Authenticate a WebSocket connection using cookies."""
    try:
        # Get the session cookie from the WebSocket headers
        cookies = websocket.cookies
        session = cookies.get("session")
        if not session:
            return None

        # Verify the token
        payload = jwt.decode(session, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return None

        # Get the user from the database
        user = db.query(User).filter(User.username == username).first()
        return user
    except Exception:
        return None
