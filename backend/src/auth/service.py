import uuid
from typing import Iterable, Optional

from sqlalchemy import func
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from src.auth.schemas import UserCreateModel
from src.auth.utils import generate_password_hash
from src.db.enums import UserRole
from src.db.models import User


class UserService:
    @staticmethod
    def normalize_email(email:str) -> str:
        return email.strip().lower()

    async def get_user_by_email(self, email:str, session:AsyncSession) -> Optional[User]:
        normalized_email = self.normalize_email(email)
        statement = select(User).where(func.lower(User.email) == normalized_email)
        result = await session.exec(statement)
        return result.first()

    async def get_user_by_uid(self, user_uid:uuid.UUID, session:AsyncSession) -> Optional[User]:
        result = await session.exec(select(User).where(User.uid == user_uid))
        return result.first()

    async def get_user_by_username(self, username:str, session:AsyncSession) -> Optional[User]:
        result = await session.exec(select(User).where(func.lower(User.username) == username.strip().lower()))
        return result.first()

    async def get_users_by_roles(self, roles:Iterable[UserRole], session:AsyncSession) -> list[User]:
        result = await session.exec(
            select(User).where(User.role.in_(list(roles)), User.is_verified.is_(True))
        )
        return list(result.all())

    async def is_user_exists(self, email:str, username:str, session:AsyncSession) -> tuple[bool, bool]:
        email_exists = await self.get_user_by_email(email, session) is not None
        username_exists = await self.get_user_by_username(username, session) is not None
        return email_exists, username_exists

    async def create_user(self, user_data:UserCreateModel, session:AsyncSession) -> User:
        user_values = user_data.model_dump()
        password = user_values.pop("password")
        user_values["email"] = self.normalize_email(str(user_values["email"]))
        user_values["username"] = user_values["username"].strip()

        new_user = User(
            **user_values,
            password_hash=generate_password_hash(password),
            role=UserRole.ENGINEER,
        )

        session.add(new_user)
        await session.commit()
        await session.refresh(new_user)
        return new_user

    async def update_user(self, user:User, user_data:dict, session:AsyncSession) -> User:
        for key, value in user_data.items():
            setattr(user, key, value)

        await session.commit()
        await session.refresh(user)
        return user
