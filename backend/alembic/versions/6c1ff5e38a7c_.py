"""empty message

Revision ID: 6c1ff5e38a7c
Revises: b8a367a7b493
Create Date: 2025-04-25 19:40:10.640503

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6c1ff5e38a7c'
down_revision: Union[str, None] = 'b8a367a7b493'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('views',
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('project_id', sa.Uuid(), nullable=False),
    sa.Column('name', sa.String(length=255), nullable=False),
    sa.Column('view_type', sa.String(length=50), nullable=False),
    sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('simple_table_views',
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('file_id', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['file_id'], ['files.id'], ),
    sa.ForeignKeyConstraint(['id'], ['views.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('simple_table_views')
    op.drop_table('views')
    # ### end Alembic commands ###
