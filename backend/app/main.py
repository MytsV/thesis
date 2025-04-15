from typing import List

from fastapi import FastAPI, Depends

from sqlalchemy.orm import Session

from app.models.user_models import UserCreateResponse
from app.routes import auth, test
from app.sqla.database import get_db
import app.sqla.models as models
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.include_router(auth.router)
app.include_router(test.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8603"],  # TODO: load from environmental variables
    allow_credentials=True,                   # Important for cookies
    allow_methods=["*"],                      # Allow all methods
    allow_headers=["*"],                      # Allow all headers
)

@app.get("/", response_model=List[UserCreateResponse])
async def root(db: Session = Depends(get_db)):
    users = db.query(models.User).all()
    return users
