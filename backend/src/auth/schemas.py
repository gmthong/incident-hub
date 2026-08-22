import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from src.db.enums import UserRole


class UserCreateModel(BaseModel):
    username:str = Field(min_length=1, max_length=50)
    first_name:str = Field(min_length=1, max_length=50)
    last_name:str = Field(min_length=1, max_length=50)
    email:EmailStr = Field(max_length=100)
    password:str = Field(min_length=6, max_length=100)

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
    new_password:str = Field(min_length=6, max_length=100)
    confirm_password:str = Field(min_length=6, max_length=100)
