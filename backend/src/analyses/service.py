import uuid
from typing import Optional

from sqlmodel import desc, select
from sqlmodel.ext.asyncio.session import AsyncSession

from src.analyses.schemas import IncidentAnalysisCreateModel, IncidentAnalysisUpdateModel
from src.db.enums import UserRole
from src.db.models import Incident, IncidentAnalysis, User
from src.errors import (
    IncidentAnalysisNotFound,
    IncidentNotFound,
    InsufficientPermission,
)


class IncidentAnalysisService:
    async def get_all_analyses(self, session:AsyncSession) -> list[IncidentAnalysis]:
        result = await session.exec(select(IncidentAnalysis).order_by(desc(IncidentAnalysis.created_at)))
        return list(result.all())

    async def get_analysis(self, analysis_uid:uuid.UUID, session:AsyncSession) -> Optional[IncidentAnalysis]:
        result = await session.exec(select(IncidentAnalysis).where(IncidentAnalysis.uid == analysis_uid))
        return result.first()

    async def get_incident_analyses(self, incident_uid:uuid.UUID, session:AsyncSession) -> list[IncidentAnalysis]:
        incident_result = await session.exec(select(Incident.uid).where(Incident.uid == incident_uid))
        if incident_result.first() is None:
            raise IncidentNotFound()

        result = await session.exec(
            select(IncidentAnalysis)
            .where(IncidentAnalysis.incident_uid == incident_uid)
            .order_by(IncidentAnalysis.created_at)
        )
        return list(result.all())

    async def create_analysis(self, incident_uid:uuid.UUID, analysis_data:IncidentAnalysisCreateModel, current_user:User, session:AsyncSession) -> IncidentAnalysis:
        incident_result = await session.exec(select(Incident.uid).where(Incident.uid == incident_uid))
        if incident_result.first() is None:
            raise IncidentNotFound()

        analysis = IncidentAnalysis(**analysis_data.model_dump(), user_uid=current_user.uid, incident_uid=incident_uid)
        session.add(analysis)
        await session.commit()
        await session.refresh(analysis)
        return analysis

    @staticmethod
    def ensure_can_modify(analysis:IncidentAnalysis, current_user:User) -> None:
        if current_user.role == UserRole.ADMIN:
            return
        if analysis.user_uid != current_user.uid:
            raise InsufficientPermission()

    async def update_analysis(self, analysis_uid:uuid.UUID, update_data:IncidentAnalysisUpdateModel, current_user:User, session:AsyncSession) -> IncidentAnalysis:
        analysis = await self.get_analysis(analysis_uid, session)
        if analysis is None:
            raise IncidentAnalysisNotFound()
        self.ensure_can_modify(analysis, current_user)

        for key, value in update_data.model_dump(exclude_unset=True).items():
            setattr(analysis, key, value)

        await session.commit()
        await session.refresh(analysis)
        return analysis

    async def delete_analysis(self, analysis_uid:uuid.UUID, current_user:User, session:AsyncSession) -> None:
        analysis = await self.get_analysis(analysis_uid, session)
        if analysis is None:
            raise IncidentAnalysisNotFound()
        self.ensure_can_modify(analysis, current_user)

        await session.delete(analysis)
        await session.commit()
