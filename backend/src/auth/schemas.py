import re
import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from src.db.enums import UserRole


PASSWORD_MIN_LENGTH = 8
PASSWORD_MAX_LENGTH = 100
PASSWORD_REQUIREMENTS_MESSAGE = "Password must contain at least one lowercase letter, one uppercase letter, and one number"


def validate_new_password(password:str) -> str:
    has_lowercase = re.search(r"[a-z]", password) is not None
    has_uppercase = re.search(r"[A-Z]", password) is not None
    has_number = re.search(r"[0-9]", password) is not None
    if not has_lowercase or not has_uppercase or not has_number:
        raise ValueError(PASSWORD_REQUIREMENTS_MESSAGE)
    return password


class UserCreateModel(BaseModel):
    username:str = Field(min_length=1, max_length=50)
    first_name:str = Field(min_length=1, max_length=50)
    last_name:str = Field(min_length=1, max_length=50)
    email:EmailStr = Field(max_length=100)
    password:str = Field(
        min_length=PASSWORD_MIN_LENGTH,
        max_length=PASSWORD_MAX_LENGTH,
        description=PASSWORD_REQUIREMENTS_MESSAGE,
    )

    @field_validator("password")
    @classmethod
    def validate_password_requirements(cls, password:str) -> str:
        return validate_new_password(password)

class UserModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    uid:uuid.UUID
    username:str
    email:EmailStr
    first_name:Optional[str]
    last_name:Optional[str]
    role:UserRole
    is_verified:bool = False
    created_at:datetime 
    updated_at:datetime

class UserLoginModel(BaseModel):
    email:EmailStr = Field(max_length=100)
    password:str = Field(min_length=6, max_length=100)

class PasswordResetModel(BaseModel):
    email:EmailStr = Field(max_length=100)

class PasswordResetConfirmModel(BaseModel):
    new_password:str = Field(
        min_length=PASSWORD_MIN_LENGTH,
        max_length=PASSWORD_MAX_LENGTH,
        description=PASSWORD_REQUIREMENTS_MESSAGE,
    )
    confirm_password:str = Field(min_length=PASSWORD_MIN_LENGTH, max_length=PASSWORD_MAX_LENGTH)

    @field_validator("new_password")
    @classmethod
    def validate_password_requirements(cls, password:str) -> str:
        return validate_new_password(password)
