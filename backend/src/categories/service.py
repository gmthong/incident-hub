import uuid
from typing import Optional

from sqlalchemy import func
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from src.categories.schemas import IncidentCategoryCreateModel, IncidentCategoryUpdateModel
from src.db.models import IncidentCategory
from src.errors import (
    IncidentCategoryAlreadyExists,
    IncidentCategoryNotFound,
)


class IncidentCategoryService:
    @staticmethod
    def normalize_name(name: str) -> str:
        return " ".join(name.strip().split())

    async def get_all_categories(self, session: AsyncSession) -> list[IncidentCategory]:
        result = await session.exec(select(IncidentCategory).order_by(IncidentCategory.name))
        return list(result.all())

    async def get_category_by_uid(self, category_uid: uuid.UUID, session: AsyncSession) -> Optional[IncidentCategory]:
        result = await session.exec(select(IncidentCategory).where(IncidentCategory.uid == category_uid))
        return result.first()

    async def get_category_by_name(self, name: str, session: AsyncSession) -> Optional[IncidentCategory]:
        normalized_name = self.normalize_name(name)
        result = await session.exec(
            select(IncidentCategory).where(func.lower(IncidentCategory.name) == normalized_name.lower())
        )
        return result.first()

    async def create_category(self, category_data: IncidentCategoryCreateModel, session: AsyncSession) -> IncidentCategory:
        name = self.normalize_name(category_data.name)
        if await self.get_category_by_name(name, session):
            raise IncidentCategoryAlreadyExists()

        category = IncidentCategory(name=name)
        session.add(category)
        await session.commit()
        await session.refresh(category)
        return category

    async def update_category(self, category_uid: uuid.UUID, update_data: IncidentCategoryUpdateModel, session: AsyncSession) -> IncidentCategory:
        category = await self.get_category_by_uid(category_uid, session)
        if category is None:
            raise IncidentCategoryNotFound()

        values = update_data.model_dump(exclude_unset=True)
        if not values:
            return category
        name = self.normalize_name(values["name"])
        
        exist = await self.get_category_by_name(name, session)
        if exist is not None and exist.uid != category.uid:
            raise IncidentCategoryAlreadyExists()

        category.name = name
        await session.commit()
        await session.refresh(category)
        return category

    async def delete_category(self, category_uid: uuid.UUID, session: AsyncSession) -> None:
        category = await self.get_category_by_uid(category_uid, session)
        if category is None:
            raise IncidentCategoryNotFound()

        await session.delete(category)
        await session.commit()
