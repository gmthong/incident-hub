"""Create incident analyses with incident cascade deletion.

Revision ID: 0003_analyses
Revises: 0002_incidents
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql


revision: str = "0003_analyses"
down_revision: Union[str, Sequence[str], None] = "0002_incidents"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


analysis_severity_enum = postgresql.ENUM(
    "LOW",
    "MEDIUM",
    "HIGH",
    "CRITICAL",
    name="analysis_severity",
    create_type=False,
)


def upgrade() -> None:
    analysis_severity_enum.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "incident_analyses",
        sa.Column("uid", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("severity", analysis_severity_enum, nullable=False),
        sa.Column("analysis_text", sa.Text(), nullable=False),
        sa.Column("user_uid", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("incident_uid", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["user_uid"],
            ["users_accounts.uid"],
            name="fk_incident_analyses_user_uid_users_accounts",
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["incident_uid"],
            ["incidents.uid"],
            name="fk_incident_analyses_incident_uid_incidents",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("uid", name="pk_incident_analyses"),
    )
    op.create_index(
        "ix_incident_analyses_severity",
        "incident_analyses",
        ["severity"],
    )
    op.create_index(
        "ix_incident_analyses_user_uid",
        "incident_analyses",
        ["user_uid"],
    )
    op.create_index(
        "ix_incident_analyses_incident_uid",
        "incident_analyses",
        ["incident_uid"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_incident_analyses_incident_uid",
        table_name="incident_analyses",
    )
    op.drop_index(
        "ix_incident_analyses_user_uid",
        table_name="incident_analyses",
    )
    op.drop_index(
        "ix_incident_analyses_severity",
        table_name="incident_analyses",
    )
    op.drop_table("incident_analyses")
    analysis_severity_enum.drop(op.get_bind(), checkfirst=True)
