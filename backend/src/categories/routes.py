import uuid

from fastapi import APIRouter, Depends, status
from sqlmodel.ext.asyncio.session import AsyncSession

from src.auth.dependencies import RoleChecker
from src.categories.schemas import (
    IncidentCategoryCreateModel,
    IncidentCategoryModel,
    IncidentCategoryUpdateModel,
)
from src.categories.service import IncidentCategoryService
from src.db.enums import UserRole
from src.db.main import get_session
from src.db.models import IncidentCategory
from src.errors import IncidentCategoryNotFound


category_router = APIRouter()
category_service = IncidentCategoryService()
verified_user = Depends(RoleChecker([UserRole.ENGINEER, UserRole.LEADER, UserRole.ADMIN]))
admin_user = Depends(RoleChecker([UserRole.ADMIN]))


@category_router.get("/", response_model=list[IncidentCategoryModel], dependencies=[verified_user])
async def get_all_categories(session: AsyncSession = Depends(get_session)) -> list[IncidentCategory]:
    return await category_service.get_all_categories(session)


@category_router.get("/{category_uid}", response_model=IncidentCategoryModel, dependencies=[verified_user])
async def get_category_by_uid(category_uid: uuid.UUID, session: AsyncSession = Depends(get_session)) -> IncidentCategory:
    category = await category_service.get_category_by_uid(category_uid, session)
    if category is None:
        raise IncidentCategoryNotFound()
    return category


@category_router.post("/", response_model=IncidentCategoryModel, status_code=status.HTTP_201_CREATED, dependencies=[admin_user])
async def create_category(category_data: IncidentCategoryCreateModel, session: AsyncSession = Depends(get_session)) -> IncidentCategory:
    return await category_service.create_category(category_data, session)


@category_router.patch("/{category_uid}", response_model=IncidentCategoryModel, dependencies=[admin_user])
async def update_category(category_uid: uuid.UUID, update_data: IncidentCategoryUpdateModel, session: AsyncSession = Depends(get_session)) -> IncidentCategory:
    return await category_service.update_category(category_uid, update_data, session)


@category_router.delete("/{category_uid}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[admin_user])
async def delete_category(category_uid: uuid.UUID, session: AsyncSession = Depends(get_session)) -> None:
    await category_service.delete_category(category_uid, session)
