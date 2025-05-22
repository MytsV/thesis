import os
import uuid
import shutil
from typing import BinaryIO, List, Optional, Tuple, Protocol
from fastapi import UploadFile
from pydantic import BaseModel


class FileStorageResult(BaseModel):
    storage_filename: str
    file_path: str
    file_type: str
    file_size: int
    file_url: Optional[str] = None
    etag: Optional[str] = None

    class Config:
        frozen = True


class FileStorageService(Protocol):
    """Abstract base class for file storage services."""

    async def save_file(
        self, file: UploadFile, project_id: uuid.UUID
    ) -> FileStorageResult:
        """
        Save a file and return storage details.

        Returns:
            Tuple containing (storage_filename, file_path, file_type, file_size)
        """
        pass

    async def get_file(self, file_path: str) -> BinaryIO:
        """Get a file by its storage path."""
        pass

    async def delete_file(self, file_path: str) -> bool:
        """Delete a file by its storage path."""
        pass


class LocalFileStorageService(FileStorageService):
    """Implementation of FileStorageService using local file system."""

    def __init__(self, base_upload_dir: str):
        self.base_upload_dir = base_upload_dir
        os.makedirs(self.base_upload_dir, exist_ok=True)

    async def save_file(
        self, file: UploadFile, project_id: uuid.UUID
    ) -> FileStorageResult:
        """Save file to local file system."""
        project_dir = os.path.join(self.base_upload_dir, f"project_{project_id}")
        os.makedirs(project_dir, exist_ok=True)

        file_ext = os.path.splitext(file.filename)[1]
        storage_filename = f"{uuid.uuid4().hex}{file_ext}"
        file_path = os.path.join(project_dir, storage_filename)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        file_size = os.path.getsize(file_path)

        return FileStorageResult(
            storage_filename=storage_filename,
            file_path=file_path,
            file_type=file.content_type,
            file_size=file_size,
        )

    async def get_file(self, file_path: str) -> BinaryIO:
        """Get a file from local file system."""
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")

        return open(file_path, "rb")

    async def delete_file(self, file_path: str) -> bool:
        """Delete a file from local file system."""
        if not os.path.exists(file_path):
            return False

        os.remove(file_path)
        return True
