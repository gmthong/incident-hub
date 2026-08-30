import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import func, or_
from sqlmodel import asc, desc, select
from sqlmodel.ext.asyncio.session import AsyncSession

from src.auth.service import UserService
from src.categories.schemas import IncidentCategoryAssignmentModel
from src.db.enums import IncidentStatus, UserRole
from src.db.models import (
    Incident,
    IncidentCategory,
    IncidentCategoryAssociation,
    User,
    utc_now,
)
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
    IncidentListSort,
    IncidentRelationship,
    IncidentUpdateModel,
)
from src.notifications import notify_incident_created, notify_assigned_user


user_service = UserService()


class IncidentService:
    @staticmethod
    def get_list_conditions(
        current_user_uid:uuid.UUID,
        search:Optional[str]=None,
        status:Optional[IncidentStatus]=None,
        environment:Optional[str]=None,
        category_uid:Optional[uuid.UUID]=None,
        incident_relationship:IncidentRelationship=IncidentRelationship.ALL,
        reporter_uid:Optional[uuid.UUID]=None,
    ) -> list:
        conditions = []
        normalized_search = search.strip() if search else ""
        if normalized_search:
            pattern = f"%{normalized_search}%"
            conditions.append(
                or_(
                    Incident.title.ilike(pattern),
                    Incident.affected_service.ilike(pattern),
                    Incident.environment.ilike(pattern),
                )
            )
        if status is not None:
            conditions.append(Incident.status == status)
        normalized_environment = environment.strip() if environment else ""
        if normalized_environment:
            conditions.append(Incident.environment.ilike(f"%{normalized_environment}%"))
        if category_uid is not None:
            category_incidents = select(IncidentCategoryAssociation.incident_uid).where(
                IncidentCategoryAssociation.category_uid == category_uid
            )
            conditions.append(Incident.uid.in_(category_incidents))
        if reporter_uid is not None:
            conditions.append(Incident.reporter_uid == reporter_uid)

        if incident_relationship == IncidentRelationship.REPORTED_BY_ME:
            conditions.append(Incident.reporter_uid == current_user_uid)
        elif incident_relationship == IncidentRelationship.ASSIGNED_TO_ME:
            conditions.append(Incident.assigned_user_uid == current_user_uid)
        elif incident_relationship == IncidentRelationship.UNASSIGNED:
            conditions.append(Incident.assigned_user_uid.is_(None))
        return conditions


    @staticmethod
    def get_list_order(sort:IncidentListSort):
        if sort == IncidentListSort.OCCURRED_ASC:
            return (asc(Incident.occurred_at), asc(Incident.uid))
        if sort == IncidentListSort.OCCURRED_DESC:
            return (desc(Incident.occurred_at), desc(Incident.uid))
        if sort == IncidentListSort.UPDATED_DESC:
            return (desc(Incident.updated_at), desc(Incident.uid))
        return (desc(Incident.created_at), desc(Incident.uid))


    async def get_paginated_incidents(
        self,
        current_user_uid:uuid.UUID,
        session:AsyncSession,
        page:int,
        page_size:int,
        search:Optional[str]=None,
        status:Optional[IncidentStatus]=None,
        environment:Optional[str]=None,
        category_uid:Optional[uuid.UUID]=None,
        incident_relationship:IncidentRelationship=IncidentRelationship.ALL,
        sort:IncidentListSort=IncidentListSort.CREATED_DESC,
        reporter_uid:Optional[uuid.UUID]=None,
    ) -> dict:
        conditions = self.get_list_conditions(
            current_user_uid=current_user_uid,
            search=search,
            status=status,
            environment=environment,
            category_uid=category_uid,
            incident_relationship=incident_relationship,
            reporter_uid=reporter_uid,
        )
        count_result = await session.exec(select(func.count()).select_from(Incident).where(*conditions))
        total = count_result.one()
        result = await session.exec(
            select(Incident)
            .where(*conditions)
            .order_by(*self.get_list_order(sort))
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


    async def get_all_incidents(
        # this function represents api of get all incidents, but this app requires that we must have pagination, seacrh, filter mechanisms in backend to improve app performance
        # so this function just simply delegate/call to get_paginated_incidents
        self,
        current_user_uid:uuid.UUID,
        session:AsyncSession,
        page:int,
        page_size:int,
        search:Optional[str]=None,
        status:Optional[IncidentStatus]=None,
        environment:Optional[str]=None,
        category_uid:Optional[uuid.UUID]=None,
        incident_relationship:IncidentRelationship=IncidentRelationship.ALL,
        sort:IncidentListSort=IncidentListSort.CREATED_DESC,
    ) -> dict:
        return await self.get_paginated_incidents(
            current_user_uid=current_user_uid,
            session=session,
            page=page,
            page_size=page_size,
            search=search,
            status=status,
            environment=environment,
            category_uid=category_uid,
            incident_relationship=incident_relationship,
            sort=sort,
        )


    async def get_incident(self, incident_uid:uuid.UUID, session:AsyncSession) -> Optional[Incident]:
        result = await session.exec(select(Incident).where(Incident.uid == incident_uid))
        return result.first()


    async def get_incidents_by_user(
        self,
        user_uid:uuid.UUID,
        current_user_uid:uuid.UUID,
        session:AsyncSession,
        page:int,
        page_size:int,
        search:Optional[str]=None,
        status:Optional[IncidentStatus]=None,
        environment:Optional[str]=None,
        category_uid:Optional[uuid.UUID]=None,
        relationship:IncidentRelationship=IncidentRelationship.ALL,
        sort:IncidentListSort=IncidentListSort.CREATED_DESC,
    ) -> dict:
        if await user_service.get_user_by_uid(user_uid, session) is None:
            raise UserNotFound()
        return await self.get_paginated_incidents(
            current_user_uid=current_user_uid,
            session=session,
            page=page,
            page_size=page_size,
            search=search,
            status=status,
            environment=environment,
            category_uid=category_uid,
            relationship=relationship,
            sort=sort,
            reporter_uid=user_uid,
        )


    async def get_incident_summary(self, current_user_uid:uuid.UUID, session:AsyncSession) -> dict:
        count_result = await session.exec(
            select(
                func.count(Incident.uid),
                func.count(Incident.uid).filter(Incident.status == IncidentStatus.OPEN),
                func.count(Incident.uid).filter(Incident.status == IncidentStatus.INVESTIGATING),
                func.count(Incident.uid).filter(Incident.status == IncidentStatus.RESOLVED),
                func.count(Incident.uid).filter(Incident.assigned_user_uid == current_user_uid),
                func.count(Incident.uid).filter(Incident.reporter_uid == current_user_uid),
            )
        )
        counts = count_result.one()
        recent_result = await session.exec(
            select(Incident)
            .order_by(desc(Incident.created_at), desc(Incident.uid))
            .limit(5)
        )
        return {
            "total":counts[0],
            "open":counts[1],
            "investigating":counts[2],
            "resolved":counts[3],
            "assigned_to_me":counts[4],
            "reported_by_me":counts[5],
            "recent_incidents":list(recent_result.all()),
        }


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
