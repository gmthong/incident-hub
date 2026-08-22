import uuid
from typing import Optional

from sqlmodel import desc, select
from sqlmodel.ext.asyncio.session import AsyncSession

from src.auth.service import UserService
from src.db.models import User
from src.errors import UserNotFound, UsernameAlreadyExists
from src.users.schemas import UserUpdateModel


auth_user_service = UserService()


class AdminUserService:
    async def get_all_users(self, session:AsyncSession) -> list[User]:
        result = await session.exec(select(User).order_by(desc(User.created_at)))
        return list(result.all())

    async def get_user(self, user_uid:uuid.UUID, session:AsyncSession) -> Optional[User]:
        return await auth_user_service.get_user_by_uid(user_uid, session)

    async def update_user(self, user_uid:uuid.UUID, update_data:UserUpdateModel, session:AsyncSession) -> User:
        user = await self.get_user(user_uid, session)
        if user is None:
            raise UserNotFound()

        values = update_data.model_dump(exclude_unset=True)
        if "username" in values:
            username = values["username"].strip()
            existing = await auth_user_service.get_user_by_username(username, session)
            if existing is not None and existing.uid != user.uid:
                raise UsernameAlreadyExists()
            values["username"] = username

        for field_name in ("first_name", "last_name"):
            if values.get(field_name) is not None:
                values[field_name] = values[field_name].strip()

        return await auth_user_service.update_user(user, values, session)
