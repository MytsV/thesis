import datetime
import uuid
from typing import List, Optional, Dict, Any, Union

from sqlalchemy import (
    String,
    Integer,
    DateTime,
    ForeignKey,
    Text,
    func,
    JSON,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship, Mapped, mapped_column, validates
from app.sqla.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String, unique=True, index=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String)
    avatar_url: Mapped[Optional[str]] = mapped_column(String)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    projects: Mapped[List["Project"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )

    shared_projects: Mapped[List["ProjectShare"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)

    user: Mapped["User"] = relationship(back_populates="projects")
    files: Mapped[List["File"]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )

    shared_users: Mapped[List["ProjectShare"]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )

    views: Mapped[List["View"]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )


class ProjectShare(Base):
    __tablename__ = "project_shares"

    project_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("projects.id"), primary_key=True
    )
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), primary_key=True)

    project: Mapped["Project"] = relationship("Project", back_populates="shared_users")
    user: Mapped["User"] = relationship("User", back_populates="shared_projects")


class File(Base):
    __tablename__ = "files"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("projects.id"), nullable=False
    )
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    storage_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(512), nullable=False)
    file_size: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    file_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    uploaded_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    project: Mapped["Project"] = relationship(back_populates="files")
    columns: Mapped[List["FileColumn"]] = relationship(
        back_populates="file", cascade="all, delete-orphan"
    )
    rows: Mapped[List["FileRow"]] = relationship(
        back_populates="file", cascade="all, delete-orphan"
    )


class FileColumn(Base):
    __tablename__ = "file_columns"

    id: Mapped[int] = mapped_column(primary_key=True)
    file_id: Mapped[int] = mapped_column(ForeignKey("files.id"), nullable=False)
    column_name: Mapped[str] = mapped_column(String(255), nullable=False)
    column_type: Mapped[str] = mapped_column(String(100), nullable=False)

    file: Mapped["File"] = relationship(back_populates="columns")

    __table_args__ = (
        UniqueConstraint("file_id", "column_name", name="uq_file_column_name"),
    )


class FileRow(Base):
    __tablename__ = "file_rows"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    file_id: Mapped[int] = mapped_column(ForeignKey("files.id"), nullable=False)
    row_data: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=False)
    version: Mapped[int] = mapped_column(default=1, nullable=False)

    file: Mapped["File"] = relationship(back_populates="rows")


class View(Base):
    """Base class for all view types in the project."""

    __tablename__ = "views"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("projects.id"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    view_type: Mapped[str] = mapped_column(String(50), nullable=False)

    project: Mapped["Project"] = relationship(back_populates="views")

    __mapper_args__ = {
        "polymorphic_identity": "view",
        "polymorphic_on": view_type,
    }


class SimpleTableView(View):
    """A simple table view that displays data from a file."""

    __tablename__ = "simple_table_views"

    id: Mapped[uuid.UUID] = mapped_column(ForeignKey("views.id"), primary_key=True)
    file_id: Mapped[int] = mapped_column(ForeignKey("files.id"), nullable=False)
    file: Mapped["File"] = relationship()
    filter_model: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=True)
    sort_model: Mapped[List[Dict[str, Any]]] = mapped_column(
        JSON,
        nullable=True,
    )

    __mapper_args__ = {
        "polymorphic_identity": "simple_table",
    }


class DiscreteColumnChartView(View):
    """A chart view that displays frequency distribution of discrete values from a single column."""

    __tablename__ = "discrete_column_chart_views"

    id: Mapped[uuid.UUID] = mapped_column(ForeignKey("views.id"), primary_key=True)
    file_id: Mapped[int] = mapped_column(ForeignKey("files.id"), nullable=False)
    file: Mapped["File"] = relationship()
    column_id: Mapped[int] = mapped_column(
        ForeignKey("file_columns.id"), nullable=False
    )
    column: Mapped["FileColumn"] = relationship()

    __mapper_args__ = {
        "polymorphic_identity": "discrete_column_chart",
    }


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    project_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("projects.id"), nullable=False
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    view_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("views.id"), nullable=True
    )

    user: Mapped["User"] = relationship("User")
    project: Mapped["Project"] = relationship("Project")
    view: Mapped[Optional["View"]] = relationship("View")
