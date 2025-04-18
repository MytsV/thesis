from typing import List, Optional

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.utils.file_storage import FileStorageService
from app.sqla.models import File


class FileRepository:
    """Repository for file operations."""

    def __init__(self, db_session: Session, storage_service: FileStorageService):
        self.db = db_session
        self.storage_service = storage_service

    async def create_file(self, project_id: int, upload_file: UploadFile) -> File:
        """Create a new file record associated with a project."""
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
        self.db.commit()
        self.db.refresh(file)

        return file

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
