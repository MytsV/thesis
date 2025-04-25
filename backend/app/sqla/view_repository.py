from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.view_models import ViewCreate, SimpleTableViewCreate
from app.sqla.models import View, SimpleTableView, File


class ViewRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_project_views(self, project_id: str) -> List[View]:
        """Get all views for a project."""
        stmt = select(View).where(View.project_id == project_id)
        return list(self.db.execute(stmt).scalars().all())

    def get_view(self, view_id: str) -> Optional[View]:
        """Get a specific view by ID."""
        return self.db.get(View, view_id)

    def create_view(self, project_id: str, view_data: ViewCreate) -> View:
        """
        Factory method to create a view based on the view_type.
        This method dispatches to the appropriate create method.
        """
        if isinstance(view_data, SimpleTableViewCreate):
            return self.create_simple_table_view(project_id, view_data)
        else:
            raise ValueError(f"Unsupported view type: {type(view_data)}")

    def create_simple_table_view(
        self, project_id: str, view_data: SimpleTableViewCreate
    ) -> SimpleTableView:
        """Create a simple table view."""
        file = self.db.get(File, view_data.file_id)
        if not file or str(file.project_id) != project_id:
            raise ValueError(
                f"File {view_data.file_id} not found or does not belong to project {project_id}"
            )

        view = SimpleTableView(
            project_id=project_id,
            name=view_data.name,
            file_id=view_data.file_id,
        )

        self.db.add(view)
        self.db.commit()
        self.db.refresh(view)
        return view
