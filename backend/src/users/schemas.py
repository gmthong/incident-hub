from typing import Optional

from pydantic import BaseModel, Field, field_validator

from src.auth.schemas import UserModel
from src.db.enums import UserRole


class PaginatedUsersModel(BaseModel):
    items:list[UserModel]
    page:int
    page_size:int
    total:int
    total_pages:int


class UserUpdateModel(BaseModel):
    username:Optional[str] = Field(default=None, min_length=1, max_length=50)
    first_name:Optional[str] = Field(default=None, min_length=1, max_length=50)
    last_name:Optional[str] = Field(default=None, min_length=1, max_length=50)
    role:Optional[UserRole] = None

    @field_validator("username", "role", mode="before")
    @classmethod
    def reject_null_required_fields(cls, value:object) -> object:
        if value is None:
            raise ValueError("username and role cannot be null")
        return value
