"""empty message

Revision ID: 915d7bee9e61
Revises: 6c1ff5e38a7c
Create Date: 2025-05-07 15:56:03.373307

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '915d7bee9e61'
down_revision: Union[str, None] = '6c1ff5e38a7c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('file_rows', sa.Column('version', sa.Integer(), server_default='1', nullable=False))
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('file_rows', 'version')
    # ### end Alembic commands ###
