import os
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

origins_str = os.getenv("ALLOWED_ORIGINS")
allow_origins = origins_str.split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,  # Important for cookies
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)
