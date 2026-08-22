import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class IncidentCategoryModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    uid:uuid.UUID
    name:str
    created_at:datetime


class IncidentCategoryCreateModel(BaseModel):
    name:str = Field(min_length=1, max_length=50)


class IncidentCategoryUpdateModel(BaseModel):
    name:Optional[str] = Field(default=None, min_length=1, max_length=50)

    @field_validator("name", mode="before")
    @classmethod
    def reject_null_name(cls, value:object) -> object:
        if value is None:
            raise ValueError("name cannot be null")
        return value


class IncidentCategoryAssignmentModel(BaseModel):
    category_uids:list[uuid.UUID]
