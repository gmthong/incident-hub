"""Create incidents with reporter and assignee relationships.

Revision ID: 0002_incidents
Revises: 0001_user_accounts
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql


revision: str = "0002_incidents"
down_revision: Union[str, Sequence[str], None] = "0001_user_accounts"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


incident_status_enum = postgresql.ENUM(
    "OPEN",
    "INVESTIGATING",
    "RESOLVED",
    name="incident_status",
    create_type=False,
)


def upgrade() -> None:
    incident_status_enum.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "incidents",
        sa.Column("uid", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(length=50), nullable=False),
        sa.Column("affected_service", sa.String(length=50), nullable=False),
        sa.Column("environment", sa.String(length=50), nullable=False),
        sa.Column("occurred_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "status",
            incident_status_enum,
            server_default="OPEN",
            nullable=False,
        ),
        sa.Column(
            "reporter_uid",
            postgresql.UUID(as_uuid=True),
            nullable=False,
        ),
        sa.Column(
            "assigned_user_uid",
            postgresql.UUID(as_uuid=True),
            nullable=True,
        ),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
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
            ["reporter_uid"],
            ["users_accounts.uid"],
            name="fk_incidents_reporter_uid_users_accounts",
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["assigned_user_uid"],
            ["users_accounts.uid"],
            name="fk_incidents_assigned_user_uid_users_accounts",
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("uid", name="pk_incidents"),
    )
    op.create_index("ix_incidents_occurred_at", "incidents", ["occurred_at"])
    op.create_index("ix_incidents_status", "incidents", ["status"])
    op.create_index("ix_incidents_reporter_uid", "incidents", ["reporter_uid"])
    op.create_index(
        "ix_incidents_assigned_user_uid",
        "incidents",
        ["assigned_user_uid"],
    )


def downgrade() -> None:
    op.drop_index("ix_incidents_assigned_user_uid", table_name="incidents")
    op.drop_index("ix_incidents_reporter_uid", table_name="incidents")
    op.drop_index("ix_incidents_status", table_name="incidents")
    op.drop_index("ix_incidents_occurred_at", table_name="incidents")
    op.drop_table("incidents")
    incident_status_enum.drop(op.get_bind(), checkfirst=True)
