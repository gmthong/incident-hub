import uuid

from fastapi import APIRouter, Depends
from sqlmodel.ext.asyncio.session import AsyncSession

from src.auth.dependencies import RoleChecker
from src.auth.schemas import UserModel
from src.db.enums import UserRole
from src.db.main import get_session
from src.db.models import User
from src.errors import UserNotFound
from src.users.schemas import UserUpdateModel
from src.users.service import AdminUserService


user_router = APIRouter()
user_service = AdminUserService()
admin_user = Depends(RoleChecker([UserRole.ADMIN]))


@user_router.get("/", response_model=list[UserModel], dependencies=[admin_user])
async def get_all_users(session:AsyncSession = Depends(get_session)) -> list[User]:
    return await user_service.get_all_users(session)


@user_router.get("/{user_uid}", response_model=UserModel, dependencies=[admin_user])
async def get_user(user_uid:uuid.UUID, session:AsyncSession = Depends(get_session)) -> User:
    user = await user_service.get_user(user_uid, session)
    if user is None:
        raise UserNotFound()
    return user


@user_router.patch("/{user_uid}", response_model=UserModel, dependencies=[admin_user])
async def update_user(user_uid:uuid.UUID, update_data:UserUpdateModel, session:AsyncSession = Depends(get_session)) -> User:
    return await user_service.update_user(user_uid, update_data, session)
