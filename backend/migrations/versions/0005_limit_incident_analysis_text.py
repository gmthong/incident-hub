"""Limit stored incident analysis text to 1–5,000 characters.

Revision ID: 0005_analysis_text_length
Revises: 0004_categories
"""

from typing import Sequence, Union

from alembic import op


revision: str = "0005_analysis_text_length"
down_revision: Union[str, Sequence[str], None] = "0004_categories"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_check_constraint(
        "ck_incident_analyses_analysis_text_length",
        "incident_analyses",
        "char_length(analysis_text) BETWEEN 1 AND 5000",
    )


def downgrade() -> None:
    op.drop_constraint(
        "ck_incident_analyses_analysis_text_length",
        "incident_analyses",
        type_="check",
    )
