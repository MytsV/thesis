import os

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.staticfiles import StaticFiles

from app.routes import auth, project, view, file
from fastapi.middleware.cors import CORSMiddleware
from starlette.status import HTTP_422_UNPROCESSABLE_ENTITY

from app.routes.websocket import collaborate, subscribe
from app.utils.config import allow_origins

app = FastAPI()


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    default_message = "Validation failed"

    if exc.errors():
        error = exc.errors()[0]
        message = error["msg"]
        field_location = error.get("loc", [])
        field_name = field_location[-1] if field_location else None

        if field_name and message:
            clean_message = message.replace("Value error, ", "")
            full_message = f"{field_name}: {clean_message}"
        else:
            full_message = default_message

        return JSONResponse(
            status_code=HTTP_422_UNPROCESSABLE_ENTITY,
            content={"detail": full_message},
        )
    else:
        return JSONResponse(
            status_code=HTTP_422_UNPROCESSABLE_ENTITY,
            content={"detail": default_message},
        )


app.include_router(auth.router)
app.include_router(project.router)
app.include_router(collaborate.router)
app.include_router(subscribe.router)
app.include_router(view.router)
app.include_router(file.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,  # Important for cookies
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
