import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from src.analyses.schemas import IncidentAnalysisModel
from src.categories.schemas import IncidentCategoryModel
from src.db.enums import IncidentStatus


class IncidentModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    uid:uuid.UUID
    title:str
    affected_service:str
    environment:str
    occurred_at:datetime
    status:IncidentStatus
    reporter_uid:uuid.UUID
    assigned_user_uid:Optional[uuid.UUID]
    resolved_at:Optional[datetime]
    created_at:datetime
    updated_at:datetime
    categories:list[IncidentCategoryModel]


class IncidentDetailsModel(IncidentModel):
    analyses:list[IncidentAnalysisModel]


class IncidentCreateModel(BaseModel):
    title:str = Field(min_length=1, max_length=50)
    affected_service:str = Field(min_length=1, max_length=50)
    environment:str = Field(min_length=1, max_length=50)
    occurred_at:datetime
    status:IncidentStatus = IncidentStatus.OPEN

    @field_validator("occurred_at")
    @classmethod
    def require_timezone(cls, value:datetime) -> datetime:
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("occurred_at must include a timezone")
        return value


class IncidentUpdateModel(BaseModel):
    title:Optional[str] = Field(default=None, min_length=1, max_length=50)
    affected_service:Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=50,
    )
    environment:Optional[str] = Field(default=None, min_length=1, max_length=50)
    occurred_at:Optional[datetime] = None
    status:Optional[IncidentStatus] = None
    resolved_at:Optional[datetime] = None

    @field_validator(
        "title",
        "affected_service",
        "environment",
        "occurred_at",
        "status",
        mode="before",
    )
    @classmethod
    def reject_null_required_fields(cls, value:object) -> object:
        if value is None:
            raise ValueError("this incident field cannot be null")
        return value

    @field_validator("occurred_at", "resolved_at")
    @classmethod
    def require_timezone(cls, value:Optional[datetime]) -> Optional[datetime]:
        if value is not None and (value.tzinfo is None or value.utcoffset() is None):
            raise ValueError("incident timestamps must include a timezone")
        return value


class IncidentAssignmentModel(BaseModel):
    user_email:Optional[EmailStr] = Field(default=None, max_length=100)
