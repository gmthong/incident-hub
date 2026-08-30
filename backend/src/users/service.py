import uuid
from typing import Optional

from sqlalchemy import String, cast, func, or_
from sqlmodel import desc, select
from sqlmodel.ext.asyncio.session import AsyncSession

from src.auth.service import UserService
from src.db.enums import UserRole
from src.db.models import User
from src.errors import UserNotFound, UsernameAlreadyExists
from src.users.schemas import UserUpdateModel


auth_user_service = UserService()


class AdminUserService:
    async def get_all_users(
        self,
        session:AsyncSession,
        page:int,
        page_size:int,
        search:Optional[str]=None,
        role:Optional[UserRole]=None,
        is_verified:Optional[bool]=None,
    ) -> dict:
        conditions = []
        normalized_search = search.strip() if search else ""
        if normalized_search:
            pattern = f"%{normalized_search}%"
            conditions.append(
                or_(
                    User.username.ilike(pattern),
                    User.first_name.ilike(pattern),
                    User.last_name.ilike(pattern),
                    User.email.ilike(pattern),
                    cast(User.uid, String).ilike(pattern),
                )
            )
        if role is not None:
            conditions.append(User.role == role)
        if is_verified is not None:
            conditions.append(User.is_verified == is_verified)

        count_result = await session.exec(
            select(func.count()).select_from(User).where(*conditions)
        )
        total = count_result.one()
        result = await session.exec(
            select(User)
            .where(*conditions)
            .order_by(desc(User.created_at), desc(User.uid))
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        return {
            "items":list(result.all()),
            "page":page,
            "page_size":page_size,
            "total":total,
            "total_pages":(total + page_size - 1) // page_size,
        }


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
