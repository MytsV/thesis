from pathlib import Path
from typing import List, Optional
from uuid import UUID

from fastapi import UploadFile, HTTPException
from sqlalchemy.orm import Session
from starlette.status import HTTP_422_UNPROCESSABLE_ENTITY

from app.utils.file_storage import FileStorageService
from app.sqla.models import File


class FileRepository:
    """Repository for file operations."""

    def __init__(self, db_session: Session, storage_service: FileStorageService):
        self.db = db_session
        self.storage_service = storage_service

    async def create_file(self, project_id: UUID, upload_file: UploadFile) -> File:
        """Create a new file record associated with a project."""
        await self._validate_file(upload_file)

        # Save the file using the storage service
        storage_filename, file_path, file_type, file_size = (
            await self.storage_service.save_file(upload_file, project_id)
        )

        # Create file record in database
        file = File(
            project_id=project_id,
            original_filename=upload_file.filename,
            storage_filename=storage_filename,
            file_path=file_path,
            file_type=file_type,
            file_size=file_size,
        )

        self.db.add(file)
        self.db.flush()

        return file

    async def _validate_file(self, upload_file: UploadFile):
        file_extension = Path(upload_file.filename).suffix.lower()
        valid_extensions = [".csv", ".xls", ".xlsx"]

        if file_extension not in valid_extensions:
            raise HTTPException(
                status_code=HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Unsupported file type. Supported types: {', '.join(valid_extensions)}",
            )

    def get_project_files(self, project_id: int) -> List[File]:
        """Get all files for a project."""
        return self.db.query(File).filter(File.project_id == project_id).all()

    def get_file(self, file_id: int) -> Optional[File]:
        """Get a file by ID."""
        return self.db.query(File).filter(File.id == file_id).first()

    async def delete_file(self, file_id: int) -> bool:
        """Delete a file."""
        file = self.get_file(file_id)
        if not file:
            return False

        await self.storage_service.delete_file(file.file_path)

        self.db.delete(file)
        self.db.commit()

        return True
