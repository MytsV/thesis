from typing import List

from fastapi import FastAPI, Depends

from sqlalchemy.orm import Session

from app.models.user_models import UserResponse
from app.routes import auth
from app.sqla.database import get_db
import app.sqla.models as models

app = FastAPI()

app.include_router(auth.router)


@app.get("/", response_model=List[UserResponse])
async def root(db: Session = Depends(get_db)):
    users = db.query(models.User).all()
    return users
