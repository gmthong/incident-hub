import uuid
from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy import CheckConstraint, Column, ForeignKey, Text, UniqueConstraint, func
from sqlalchemy.dialects import postgresql as pg
from sqlmodel import Field, Relationship, SQLModel

from src.db.enums import AnalysisSeverity, IncidentStatus, UserRole


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def enum_values(enum_class:type) -> list[str]:
    return [member.value for member in enum_class]


user_role_enum = pg.ENUM(UserRole, name="user_role", values_callable=enum_values)
incident_status_enum = pg.ENUM(IncidentStatus, name="incident_status", values_callable=enum_values)
analysis_severity_enum = pg.ENUM(AnalysisSeverity, name="analysis_severity", values_callable=enum_values)


class User(SQLModel, table=True):
    __tablename__ = "users_accounts"
    __table_args__ = (
        UniqueConstraint("username", name="uq_users_accounts_username"),
        UniqueConstraint("email", name="uq_users_accounts_email"),
    )

    uid:uuid.UUID = Field(
        sa_column=Column(
            pg.UUID(as_uuid=True),
            primary_key=True,
            nullable=False,
            default=uuid.uuid4,
        )
    )
    username:str = Field(sa_column=Column(pg.VARCHAR(50), nullable=False))
    first_name:Optional[str] = Field(default=None,sa_column=Column(pg.VARCHAR(50), nullable=True))
    last_name:Optional[str] = Field(default=None,sa_column=Column(pg.VARCHAR(50), nullable=True))
    role:UserRole = Field(
        default=UserRole.ENGINEER,
        sa_column=Column(
            user_role_enum,
            nullable=False,
            server_default=UserRole.ENGINEER.value,
        ),
    )
    is_verified:bool = Field(
        default=False,
        sa_column=Column(
            pg.BOOLEAN,
            nullable=False,
            server_default="false",
        ),
    )
    email:str = Field(sa_column=Column(pg.VARCHAR(100), nullable=False))
    password_hash:str = Field(sa_column=Column(pg.VARCHAR(100), nullable=False))
    created_at:datetime = Field(
        default_factory=utc_now,
        sa_column=Column(
            pg.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=func.now(),
        ),
    )
    updated_at:datetime = Field(
        default_factory=utc_now,
        sa_column=Column(
            pg.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=func.now(),
            onupdate=func.now(),
        ),
    )

    reported_incidents:List["Incident"] = Relationship(
        back_populates="reporter",
        sa_relationship_kwargs={
            "foreign_keys": "[Incident.reporter_uid]",
            "lazy": "selectin",
        },
    )
    assigned_incidents:List["Incident"] = Relationship(
        back_populates="assigned_user",
        sa_relationship_kwargs={
            "foreign_keys": "[Incident.assigned_user_uid]",
            "lazy": "selectin",
        },
    )
    incident_analyses:List["IncidentAnalysis"] = Relationship(
        back_populates="user",
        sa_relationship_kwargs={"lazy": "selectin"},
    )

    def __repr__(self) -> str:
        return f"<User {self.username}>"


class IncidentCategoryAssociation(SQLModel, table=True):
    __tablename__ = "incident_category_association"

    incident_uid:uuid.UUID = Field(
        sa_column=Column(
            pg.UUID(as_uuid=True),
            ForeignKey(
                "incidents.uid",
                name="fk_incident_category_incident_uid",
                ondelete="CASCADE",
            ),
            primary_key=True,
            nullable=False,
        )
    )
    category_uid:uuid.UUID = Field(
        sa_column=Column(
            pg.UUID(as_uuid=True),
            ForeignKey(
                "incident_categories.uid",
                name="fk_incident_category_category_uid",
                ondelete="CASCADE",
            ),
            primary_key=True,
            nullable=False,
        )
    )


class Incident(SQLModel, table=True):
    __tablename__ = "incidents"

    uid:uuid.UUID = Field(
        sa_column=Column(
            pg.UUID(as_uuid=True),
            primary_key=True,
            nullable=False,
            default=uuid.uuid4,
        )
    )
    title:str = Field(sa_column=Column(pg.VARCHAR(50), nullable=False))
    affected_service:str = Field(sa_column=Column(pg.VARCHAR(50), nullable=False))
    environment:str = Field(sa_column=Column(pg.VARCHAR(50), nullable=False))
    occurred_at: datetime = Field(sa_column=Column(pg.TIMESTAMP(timezone=True), nullable=False, index=True))
    status:IncidentStatus = Field(
        default=IncidentStatus.OPEN,
        sa_column=Column(
            incident_status_enum,
            nullable=False,
            server_default=IncidentStatus.OPEN.value,
            index=True,
        ),
    )
    reporter_uid:uuid.UUID = Field(
        sa_column=Column(
            pg.UUID(as_uuid=True),
            ForeignKey(
                "users_accounts.uid",
                name="fk_incidents_reporter_uid_users_accounts",
                ondelete="RESTRICT",
            ),
            nullable=False,
            index=True,
        )
    )
    assigned_user_uid:Optional[uuid.UUID] = Field(
        default=None,
        sa_column=Column(
            pg.UUID(as_uuid=True),
            ForeignKey(
                "users_accounts.uid",
                name="fk_incidents_assigned_user_uid_users_accounts",
                ondelete="SET NULL",
            ),
            nullable=True,
            index=True,
        ),
    )
    resolved_at:Optional[datetime] = Field(
        default=None,
        sa_column=Column(pg.TIMESTAMP(timezone=True), nullable=True),
    )
    created_at:datetime = Field(
        default_factory=utc_now,
        sa_column=Column(
            pg.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=func.now(),
        ),
    )
    updated_at:datetime = Field(
        default_factory=utc_now,
        sa_column=Column(
            pg.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=func.now(),
            onupdate=func.now(),
        ),
    )

    reporter:User = Relationship(
        back_populates="reported_incidents",
        sa_relationship_kwargs={
            "foreign_keys": "[Incident.reporter_uid]",
            "lazy": "selectin",
        },
    )
    assigned_user:Optional[User] = Relationship(
        back_populates="assigned_incidents",
        sa_relationship_kwargs={
            "foreign_keys": "[Incident.assigned_user_uid]",
            "lazy": "selectin",
        },
    )
    analyses:List["IncidentAnalysis"] = Relationship(
        back_populates="incident",
        sa_relationship_kwargs={
            "cascade": "all, delete-orphan",
            "lazy": "selectin",
            "passive_deletes": True,
        },
    )
    categories:List["IncidentCategory"] = Relationship(
        back_populates="incidents",
        link_model=IncidentCategoryAssociation,
        sa_relationship_kwargs={
            "lazy": "selectin",
            "passive_deletes": True,
        },
    )

    def __repr__(self) -> str:
        return f"<Incident {self.title}>"


class IncidentAnalysis(SQLModel, table=True):
    __tablename__ = "incident_analyses"
    __table_args__ = (
        CheckConstraint(
            "char_length(analysis_text) BETWEEN 1 AND 5000",
            name="ck_incident_analyses_analysis_text_length",
        ),
    )

    uid:uuid.UUID = Field(
        sa_column=Column(
            pg.UUID(as_uuid=True),
            primary_key=True,
            nullable=False,
            default=uuid.uuid4,
        )
    )
    severity:AnalysisSeverity = Field(sa_column=Column(analysis_severity_enum, nullable=False, index=True))
    analysis_text:str = Field(sa_column=Column(Text, nullable=False))
    user_uid:uuid.UUID = Field(
        sa_column=Column(
            pg.UUID(as_uuid=True),
            ForeignKey(
                "users_accounts.uid",
                name="fk_incident_analyses_user_uid_users_accounts",
                ondelete="RESTRICT",
            ),
            nullable=False,
            index=True,
        )
    )
    incident_uid:uuid.UUID = Field(
        sa_column=Column(
            pg.UUID(as_uuid=True),
            ForeignKey(
                "incidents.uid",
                name="fk_incident_analyses_incident_uid_incidents",
                ondelete="CASCADE",
            ),
            nullable=False,
            index=True,
        )
    )
    created_at:datetime = Field(
        default_factory=utc_now,
        sa_column=Column(
            pg.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=func.now(),
        ),
    )
    updated_at:datetime = Field(
        default_factory=utc_now,
        sa_column=Column(
            pg.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=func.now(),
            onupdate=func.now(),
        ),
    )

    user:User = Relationship(
        back_populates="incident_analyses",
        sa_relationship_kwargs={"lazy": "selectin"},
    )
    incident:Incident = Relationship(
        back_populates="analyses",
        sa_relationship_kwargs={"lazy": "selectin"},
    )

    def __repr__(self) -> str:
        return (
            f"<IncidentAnalysis {self.uid} for incident {self.incident_uid}>"
        )


class IncidentCategory(SQLModel, table=True):
    __tablename__ = "incident_categories"
    __table_args__ = (
        UniqueConstraint("name", name="uq_incident_categories_name"),
    )

    uid:uuid.UUID = Field(
        sa_column=Column(
            pg.UUID(as_uuid=True),
            primary_key=True,
            nullable=False,
            default=uuid.uuid4,
        )
    )
    name:str = Field(sa_column=Column(pg.VARCHAR(50), nullable=False))
    created_at:datetime = Field(
        default_factory=utc_now,
        sa_column=Column(
            pg.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=func.now(),
        ),
    )

    incidents:List[Incident] = Relationship(
        back_populates="categories",
        link_model=IncidentCategoryAssociation,
        sa_relationship_kwargs={
            "lazy": "selectin",
            "passive_deletes": True,
        },
    )

    def __repr__(self) -> str:
        return f"<IncidentCategory {self.name}>"
