import uuid
from datetime import datetime
from typing import Optional

from sqlmodel import desc, select
from sqlmodel.ext.asyncio.session import AsyncSession

from src.auth.service import UserService
from src.categories.schemas import IncidentCategoryAssignmentModel
from src.db.enums import IncidentStatus, UserRole
from src.db.models import Incident, IncidentCategory, User, utc_now
from src.errors import (
    IncidentCategoryNotFound,
    IncidentNotFound,
    InsufficientPermission,
    InvalidAssignment,
    InvalidIncidentState,
    UserNotFound,
)
from src.incidents.schemas import (
    IncidentAssignmentModel,
    IncidentCreateModel,
    IncidentUpdateModel,
)
from src.notifications import notify_incident_created, notify_assigned_user


user_service = UserService()


class IncidentService:
    async def get_all_incidents(self, session:AsyncSession) -> list[Incident]:
        result = await session.exec(select(Incident).order_by(desc(Incident.created_at)))
        return list(result.all())

    async def get_incident(self, incident_uid:uuid.UUID, session:AsyncSession) -> Optional[Incident]:
        result = await session.exec(select(Incident).where(Incident.uid == incident_uid))
        return result.first()

    async def get_incidents_by_user(self, user_uid:uuid.UUID, session:AsyncSession) -> list[Incident]:
        if await user_service.get_user_by_uid(user_uid, session) is None:
            raise UserNotFound()

        result = await session.exec(
            select(Incident)
            .where(Incident.reporter_uid == user_uid)
            .order_by(desc(Incident.created_at))
        )
        return list(result.all())

    async def create_incident(self, incident_data:IncidentCreateModel, current_user:User, session:AsyncSession) -> Incident:
        if incident_data.status == IncidentStatus.RESOLVED:
            raise InvalidIncidentState()

        incident = Incident(**incident_data.model_dump(), reporter_uid=current_user.uid)
        session.add(incident)
        await session.commit()
        await session.refresh(incident, attribute_names=["categories", "analyses"])
        await notify_incident_created(incident, session)
        return incident

    @staticmethod
    def can_manage(incident:Incident, current_user:User) -> None:
        if current_user.role in {UserRole.LEADER, UserRole.ADMIN}:
            return
        if current_user.uid in {incident.reporter_uid, incident.assigned_user_uid}:
            return
        raise InsufficientPermission()

    @staticmethod
    def validate_resolution_times(occurred_at:datetime, resolved_at:Optional[datetime]) -> None:
        if resolved_at is not None and resolved_at < occurred_at:
            raise InvalidIncidentState()

    async def update_incident(self, incident_uid:uuid.UUID, update_data:IncidentUpdateModel, current_user:User, session:AsyncSession) -> Incident:
        incident = await self.get_incident(incident_uid, session)
        if incident is None:
            raise IncidentNotFound()
        self.can_manage(incident, current_user)

        values = update_data.model_dump(exclude_unset=True)
        requested_status = values.pop("status", None)
        resolution_was_supplied = "resolved_at" in values
        requested_resolution = values.pop("resolved_at", None)

        for key, value in values.items():
            setattr(incident, key, value)

        if requested_status is not None:
            incident.status = requested_status
            if requested_status == IncidentStatus.RESOLVED:
                incident.resolved_at = (requested_resolution or incident.resolved_at or utc_now())
            else:
                if resolution_was_supplied and requested_resolution is not None:
                    raise InvalidIncidentState()
                incident.resolved_at = None
        elif resolution_was_supplied:
            if incident.status != IncidentStatus.RESOLVED or requested_resolution is None:
                raise InvalidIncidentState()
            incident.resolved_at = requested_resolution

        self.validate_resolution_times(incident.occurred_at, incident.resolved_at)
        await session.commit()
        await session.refresh(incident)
        return incident

    async def assign_user(self, incident_uid:uuid.UUID, assignment_data:IncidentAssignmentModel, current_user:User, session:AsyncSession) -> Incident:
        if current_user.role not in {UserRole.LEADER, UserRole.ADMIN}:
            raise InsufficientPermission()

        incident = await self.get_incident(incident_uid, session)
        if incident is None:
            raise IncidentNotFound()

        previous_assigned_user_uid = incident.assigned_user_uid
        assigned_user:Optional[User] = None
        if assignment_data.user_email is not None:
            assigned_user = await user_service.get_user_by_email(str(assignment_data.user_email), session)
            if assigned_user is None:
                raise UserNotFound()
            if not assigned_user.is_verified:
                raise InvalidAssignment()
            is_engineer = assigned_user.role == UserRole.ENGINEER
            is_privileged_self_assignment = (
                assigned_user.uid == current_user.uid
                and current_user.role in {UserRole.LEADER, UserRole.ADMIN}
            )
            if not is_engineer and not is_privileged_self_assignment:
                raise InvalidAssignment()
            incident.assigned_user_uid = assigned_user.uid

        else:
            incident.assigned_user_uid = None

        await session.commit()
        await session.refresh(incident)
        if (assigned_user is not None and assigned_user.uid != previous_assigned_user_uid):
            notify_assigned_user(incident, assigned_user)
        return incident

    async def replace_categories(self, incident_uid:uuid.UUID, category_data:IncidentCategoryAssignmentModel, current_user:User, session:AsyncSession) -> Incident:
        incident = await self.get_incident(incident_uid, session)
        if incident is None:
            raise IncidentNotFound()
        self.can_manage(incident, current_user)

        unique_category_uids = list(dict.fromkeys(category_data.category_uids))
        categories:list[IncidentCategory] = []
        if unique_category_uids:
            result = await session.exec(
                select(IncidentCategory).where(
                    IncidentCategory.uid.in_(unique_category_uids)
                )
            )
            categories = list(result.all())
            if len(categories) != len(unique_category_uids):
                raise IncidentCategoryNotFound()

        incident.categories = categories
        session.add(incident)
        await session.commit()
        await session.refresh(incident, attribute_names=["categories"])
        return incident

    async def delete_incident(self, incident_uid:uuid.UUID, session:AsyncSession) -> None:
        incident = await self.get_incident(incident_uid, session)
        if incident is None:
            raise IncidentNotFound()

        await session.delete(incident)
        await session.commit()
