from typing import Tuple
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session
from starlette.status import HTTP_404_NOT_FOUND, HTTP_403_FORBIDDEN

from app.sqla.models import Project, ProjectShare


def check_project_exists(db: Session, project_id: UUID) -> Project:
    """
    Check if a project exists and return it.
    Raises 404 if not found.
    """
    project = db.query(Project).filter(Project.id == project_id).first()

    if not project:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Project not found")

    return project


def check_user_project_access(
    db: Session, project_id: UUID, user_id: int
) -> Tuple[Project, bool]:
    """
    Check if a user has access to a project.
    Returns tuple of (project, is_owner).
    Raises 403 if no access.
    """
    # Get the project
    project = check_project_exists(db, project_id)

    # Check if user is owner
    is_owner = project.owner_id == user_id

    # Check if user has shared access
    has_shared_access = False
    if not is_owner:
        shared_access = (
            db.query(ProjectShare)
            .filter(
                ProjectShare.project_id == project_id, ProjectShare.user_id == user_id
            )
            .first()
        )
        has_shared_access = shared_access is not None

    if not (is_owner or has_shared_access):
        raise HTTPException(
            status_code=HTTP_403_FORBIDDEN,
            detail="You don't have access to this project",
        )

    return project, is_owner


def check_project_ownership(db: Session, project_id: UUID, user_id: int) -> Project:
    """
    Check if a user is the owner of a project.
    Returns the project if successful.
    Raises 403 if not owner.
    """
    # Get the project
    project = check_project_exists(db, project_id)

    # Check if user is owner
    if project.owner_id != user_id:
        raise HTTPException(
            status_code=HTTP_403_FORBIDDEN,
            detail="Only the project owner can perform this action",
        )

    return project
