from fastapi import APIRouter, Path, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.models.view_models import TableSchemaResponse
from app.sqla.database import get_db
from app.sqla.models import User, FileColumn, ProjectShare, Project, File

router = APIRouter(prefix="/files")


@router.get("/{file_id}/schema", response_model=TableSchemaResponse)
async def get_file_schema(
    file_id: int = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    file = db.query(File).filter(File.id == file_id).first()
    if not file:
        raise HTTPException(status_code=404, detail="File not found")

    project = db.query(Project).filter(Project.id == file.project_id).first()

    is_owner = project.owner_id == current_user.id

    is_shared_with_user = (
        db.query(ProjectShare)
        .filter(
            ProjectShare.project_id == project.id,
            ProjectShare.user_id == current_user.id,
        )
        .first()
        is not None
    )

    if not (is_owner or is_shared_with_user):
        raise HTTPException(
            status_code=403, detail="You don't have permission to access this file"
        )

    columns = db.query(FileColumn).filter(FileColumn.file_id == file_id).all()

    return TableSchemaResponse(
        columns=columns,
    )
