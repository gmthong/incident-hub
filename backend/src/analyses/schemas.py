import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

from src.db.enums import AnalysisSeverity


class IncidentAnalysisModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    uid:uuid.UUID
    severity:AnalysisSeverity
    analysis_text:str
    user_uid:uuid.UUID
    incident_uid:uuid.UUID
    created_at:datetime
    updated_at:datetime


class IncidentAnalysisCreateModel(BaseModel):
    severity:AnalysisSeverity
    analysis_text:str = Field(min_length=1)


class IncidentAnalysisUpdateModel(BaseModel):
    severity:Optional[AnalysisSeverity] = None
    analysis_text:Optional[str] = Field(default=None, min_length=1)

    @field_validator("severity", "analysis_text", mode="before")
    @classmethod
    def reject_null_updates(cls, value:object) -> object:
        if value is None:
            raise ValueError("analysis fields cannot be null")
        return value
