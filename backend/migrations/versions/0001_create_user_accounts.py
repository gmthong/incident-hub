"""Create the IncidentHub user accounts table.

Revision ID: 0001_user_accounts
Revises:
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql


revision: str = "0001_user_accounts"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


user_role_enum = postgresql.ENUM(
    "engineer",
    "leader",
    "admin",
    name="user_role",
    create_type=False,
)


def upgrade() -> None:
    user_role_enum.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "users_accounts",
        sa.Column("uid", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("username", sa.String(length=50), nullable=False),
        sa.Column("first_name", sa.String(length=50), nullable=True),
        sa.Column("last_name", sa.String(length=50), nullable=True),
        sa.Column(
            "role",
            user_role_enum,
            server_default="engineer",
            nullable=False,
        ),
        sa.Column(
            "is_verified",
            sa.Boolean(),
            server_default=sa.text("false"),
            nullable=False,
        ),
        sa.Column("email", sa.String(length=100), nullable=False),
        sa.Column("password_hash", sa.String(length=100), nullable=False),
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
        sa.PrimaryKeyConstraint("uid", name="pk_users_accounts"),
        sa.UniqueConstraint("username", name="uq_users_accounts_username"),
        sa.UniqueConstraint("email", name="uq_users_accounts_email"),
    )


def downgrade() -> None:
    op.drop_table("users_accounts")
    user_role_enum.drop(op.get_bind(), checkfirst=True)
