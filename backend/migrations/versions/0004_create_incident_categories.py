"""Create incident categories and their many-to-many association.

Revision ID: 0004_categories
Revises: 0003_analyses
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql


revision: str = "0004_categories"
down_revision: Union[str, Sequence[str], None] = "0003_analyses"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "incident_categories",
        sa.Column("uid", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=50), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("uid", name="pk_incident_categories"),
        sa.UniqueConstraint("name", name="uq_incident_categories_name"),
    )
    op.create_table(
        "incident_category_association",
        sa.Column("incident_uid", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("category_uid", postgresql.UUID(as_uuid=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["incident_uid"],
            ["incidents.uid"],
            name="fk_incident_category_incident_uid",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["category_uid"],
            ["incident_categories.uid"],
            name="fk_incident_category_category_uid",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint(
            "incident_uid",
            "category_uid",
            name="pk_incident_category_association",
        ),
    )


def downgrade() -> None:
    op.drop_table("incident_category_association")
    op.drop_table("incident_categories")
