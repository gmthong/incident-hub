import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlmodel.ext.asyncio.session import AsyncSession

from src.auth.dependencies import RoleChecker
from src.auth.schemas import UserModel
from src.db.enums import UserRole
from src.db.main import get_session
from src.db.models import User
from src.errors import UserNotFound
from src.users.schemas import PaginatedUsersModel, UserUpdateModel
from src.users.service import AdminUserService


user_router = APIRouter()
user_service = AdminUserService()
admin_user = Depends(RoleChecker([UserRole.ADMIN]))


@user_router.get("/", response_model=PaginatedUsersModel, dependencies=[admin_user])
async def get_all_users(
    page:int = Query(default=1, ge=1),
    page_size:int = Query(default=50, ge=1, le=50),
    search:Optional[str] = Query(default=None, alias="q", max_length=100),
    role:Optional[UserRole] = Query(default=None),
    is_verified:Optional[bool] = Query(default=None),
    session:AsyncSession = Depends(get_session),
) -> PaginatedUsersModel:
    return await user_service.get_all_users(
        session=session,
        page=page,
        page_size=page_size,
        search=search,
        role=role,
        is_verified=is_verified,
    )


@user_router.get("/{user_uid}", response_model=UserModel, dependencies=[admin_user])
async def get_user(user_uid:uuid.UUID, session:AsyncSession = Depends(get_session)) -> User:
    user = await user_service.get_user(user_uid, session)
    if user is None:
        raise UserNotFound()
    return user


@user_router.patch("/{user_uid}", response_model=UserModel, dependencies=[admin_user])
async def update_user(user_uid:uuid.UUID, update_data:UserUpdateModel, session:AsyncSession = Depends(get_session)) -> User:
    return await user_service.update_user(user_uid, update_data, session)
