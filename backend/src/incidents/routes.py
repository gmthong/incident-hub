import uuid

from fastapi import APIRouter, Depends, status
from sqlmodel.ext.asyncio.session import AsyncSession

from src.analyses.schemas import (
    IncidentAnalysisCreateModel,
    IncidentAnalysisModel,
)
from src.analyses.service import IncidentAnalysisService
from src.auth.dependencies import RoleChecker, get_current_user
from src.categories.schemas import IncidentCategoryAssignmentModel
from src.db.enums import UserRole
from src.db.main import get_session
from src.db.models import Incident, IncidentAnalysis, User
from src.errors import IncidentNotFound
from src.incidents.schemas import (
    IncidentAssignmentModel,
    IncidentCreateModel,
    IncidentDetailsModel,
    IncidentModel,
    IncidentUpdateModel,
)
from src.incidents.service import IncidentService


incident_router = APIRouter()
incident_service = IncidentService()
analysis_service = IncidentAnalysisService()
verified_user = Depends(RoleChecker([UserRole.ENGINEER, UserRole.LEADER, UserRole.ADMIN]))
leader_or_admin = Depends(RoleChecker([UserRole.LEADER, UserRole.ADMIN]))
admin_user = Depends(RoleChecker([UserRole.ADMIN]))


@incident_router.get("/", response_model=list[IncidentModel], dependencies=[verified_user])
async def get_all_incidents(session:AsyncSession = Depends(get_session)) -> list[Incident]:
    return await incident_service.get_all_incidents(session)


@incident_router.get("/users/{user_uid}", response_model=list[IncidentModel], dependencies=[verified_user])
async def get_incidents_by_user(user_uid:uuid.UUID, session:AsyncSession = Depends(get_session)) -> list[Incident]:
    return await incident_service.get_incidents_by_user(user_uid, session)


@incident_router.get("/{incident_uid}", response_model=IncidentDetailsModel, dependencies=[verified_user])
async def get_incident(incident_uid:uuid.UUID, session:AsyncSession = Depends(get_session)) -> Incident:
    incident = await incident_service.get_incident(incident_uid, session)
    if incident is None:
        raise IncidentNotFound()
    return incident


@incident_router.post("/", response_model=IncidentDetailsModel, status_code=status.HTTP_201_CREATED, dependencies=[verified_user])
async def create_incident(incident_data:IncidentCreateModel, current_user:User = Depends(get_current_user), session:AsyncSession = Depends(get_session)) -> Incident:
    return await incident_service.create_incident(
        incident_data,
        current_user,
        session,
    )


@incident_router.patch("/{incident_uid}", response_model=IncidentModel, dependencies=[verified_user])
async def update_incident(incident_uid:uuid.UUID, update_data:IncidentUpdateModel, current_user:User = Depends(get_current_user), session:AsyncSession = Depends(get_session)) -> Incident:
    return await incident_service.update_incident(
        incident_uid,
        update_data,
        current_user,
        session,
    )


@incident_router.patch("/{incident_uid}/assignment", response_model=IncidentModel, dependencies=[leader_or_admin])
async def assign_user(incident_uid:uuid.UUID, assignment_data:IncidentAssignmentModel, current_user:User = Depends(get_current_user), session:AsyncSession = Depends(get_session)) -> Incident:
    return await incident_service.assign_user(
        incident_uid,
        assignment_data,
        current_user,
        session,
    )


@incident_router.put("/{incident_uid}/categories", response_model=IncidentModel, dependencies=[verified_user])
async def replace_incident_categories(incident_uid:uuid.UUID, category_data:IncidentCategoryAssignmentModel, current_user:User = Depends(get_current_user), session:AsyncSession = Depends(get_session)) -> Incident:
    return await incident_service.replace_categories(
        incident_uid,
        category_data,
        current_user,
        session,
    )


@incident_router.get("/{incident_uid}/analyses", response_model=list[IncidentAnalysisModel], dependencies=[verified_user])
async def get_incident_analyses(incident_uid:uuid.UUID, session:AsyncSession = Depends(get_session)) -> list[IncidentAnalysis]:
    return await analysis_service.get_incident_analyses(incident_uid, session)


@incident_router.post("/{incident_uid}/analyses", response_model=IncidentAnalysisModel, status_code=status.HTTP_201_CREATED, dependencies=[verified_user])
async def create_incident_analysis(incident_uid:uuid.UUID, analysis_data:IncidentAnalysisCreateModel, current_user:User = Depends(get_current_user), session:AsyncSession = Depends(get_session)) -> IncidentAnalysis:
    return await analysis_service.create_analysis(
        incident_uid,
        analysis_data,
        current_user,
        session,
    )


@incident_router.delete("/{incident_uid}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[admin_user])
async def delete_incident(incident_uid:uuid.UUID, session:AsyncSession = Depends(get_session)) -> None:
    await incident_service.delete_incident(incident_uid, session)
