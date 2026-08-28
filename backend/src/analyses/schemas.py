import uuid
from datetime import datetime
from typing import Annotated, Optional

from pydantic import BaseModel, ConfigDict, StringConstraints, field_validator

from src.db.enums import AnalysisSeverity


ANALYSIS_TEXT_MIN_LENGTH = 1
ANALYSIS_TEXT_MAX_LENGTH = 5000
AnalysisText = Annotated[
    str,
    StringConstraints(
        strip_whitespace=True,
        min_length=ANALYSIS_TEXT_MIN_LENGTH,
        max_length=ANALYSIS_TEXT_MAX_LENGTH,
    ),
]


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
    analysis_text:AnalysisText


class IncidentAnalysisUpdateModel(BaseModel):
    severity:Optional[AnalysisSeverity] = None
    analysis_text:Optional[AnalysisText] = None

    @field_validator("severity", "analysis_text", mode="before")
    @classmethod
    def reject_null_updates(cls, value:object) -> object:
        if value is None:
            raise ValueError("analysis fields cannot be null")
        return value
