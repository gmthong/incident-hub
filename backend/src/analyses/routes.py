import uuid

from fastapi import APIRouter, Depends, status
from sqlmodel.ext.asyncio.session import AsyncSession

from src.analyses.schemas import IncidentAnalysisModel, IncidentAnalysisUpdateModel
from src.analyses.service import IncidentAnalysisService
from src.auth.dependencies import RoleChecker, get_current_user
from src.db.enums import UserRole
from src.db.main import get_session
from src.db.models import IncidentAnalysis, User
from src.errors import IncidentAnalysisNotFound


analysis_router = APIRouter()
analysis_service = IncidentAnalysisService()
user_role_checker = Depends(RoleChecker([UserRole.ENGINEER, UserRole.LEADER, UserRole.ADMIN]))
admin_role_checker = Depends(RoleChecker([UserRole.ADMIN]))


@analysis_router.get("/", response_model=list[IncidentAnalysisModel], dependencies=[admin_role_checker])
async def get_all_analyses(session:AsyncSession = Depends(get_session)) -> list[IncidentAnalysis]:
    return await analysis_service.get_all_analyses(session)


@analysis_router.get("/{analysis_uid}", response_model=IncidentAnalysisModel, dependencies=[user_role_checker])
async def get_analysis(analysis_uid:uuid.UUID, session:AsyncSession = Depends(get_session)) -> IncidentAnalysis:
    analysis = await analysis_service.get_analysis(analysis_uid, session)
    if analysis is None:
        raise IncidentAnalysisNotFound()
    return analysis


@analysis_router.patch("/{analysis_uid}", response_model=IncidentAnalysisModel, dependencies=[user_role_checker])
async def update_analysis(analysis_uid:uuid.UUID, update_data:IncidentAnalysisUpdateModel, current_user:User = Depends(get_current_user), session:AsyncSession = Depends(get_session)) -> IncidentAnalysis:
    return await analysis_service.update_analysis(analysis_uid, update_data, current_user, session)


@analysis_router.delete("/{analysis_uid}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[user_role_checker])
async def delete_analysis(analysis_uid: uuid.UUID, current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)) -> None:
    await analysis_service.delete_analysis(analysis_uid, current_user, session)
