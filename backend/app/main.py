from json import dumps

from fastapi import FastAPI, Depends
from typing import Dict

from sqlalchemy.orm import Session

from app.sqla.database import get_db
import app.sqla.models as models

app = FastAPI()


@app.get("/")
async def root(db: Session = Depends(get_db)):
    users = db.query(models.User).all()
    user_list = [
        {"id": user.id, "username": user.username, "email": user.email}
        for user in users
    ]
    return user_list
