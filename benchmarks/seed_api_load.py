import asyncio
import os
import uuid
from datetime import timedelta

from sqlmodel import select

from src.auth.utils import generate_password_hash
from src.db.enums import AnalysisSeverity, IncidentStatus, UserRole
from src.db.main import async_session_factory
from src.db.models import (
    Incident,
    IncidentAnalysis,
    IncidentCategory,
    IncidentCategoryAssociation,
    User,
    utc_now,
)


BENCHMARK_PASSWORD = "LoadTest1"
BENCHMARK_NAMESPACE = uuid.UUID("7a22bbf5-0324-43b5-ad83-f576137e1a9b")


def stable_uuid(label:str) -> uuid.UUID:
    return uuid.uuid5(BENCHMARK_NAMESPACE, label)


def positive_environment_integer(name:str, default:int) -> int:
    value = int(os.getenv(name, str(default)))
    if value < 1:
        raise ValueError(f"{name} must be greater than zero")
    return value


async def seed() -> None:
    user_count = positive_environment_integer("BENCHMARK_USERS", 500)
    incidents_per_user = positive_environment_integer("INCIDENTS_PER_USER", 2)
    analyses_per_incident = positive_environment_integer("ANALYSES_PER_INCIDENT", 1)
    category_count = 12

    async with async_session_factory() as session:
        first_user_uid = stable_uuid("user-1")
        existing_user = await session.get(User, first_user_uid)
        if existing_user is not None:
            print("Benchmark data already exists; seeding skipped.")
            return

        password_hash = generate_password_hash(BENCHMARK_PASSWORD)
        users = [
            User(
                uid=stable_uuid(f"user-{number}"),
                username=f"load_user_{number:04d}",
                first_name="Load",
                last_name=f"User {number:04d}",
                role=UserRole.ENGINEER,
                is_verified=True,
                email=f"load-user-{number:04d}@example.com",
                password_hash=password_hash,
            )
            for number in range(1, user_count + 1)
        ]
        session.add_all(users)

        categories = [
            IncidentCategory(
                uid=stable_uuid(f"category-{number}"),
                name=f"Benchmark Category {number:02d}",
            )
            for number in range(1, category_count + 1)
        ]
        session.add_all(categories)
        await session.commit()

        statuses = [
            IncidentStatus.OPEN,
            IncidentStatus.INVESTIGATING,
            IncidentStatus.RESOLVED,
        ]
        severities = [
            AnalysisSeverity.LOW,
            AnalysisSeverity.MEDIUM,
            AnalysisSeverity.HIGH,
            AnalysisSeverity.CRITICAL,
        ]
        now = utc_now()
        incidents:list[Incident] = []
        analyses:list[IncidentAnalysis] = []
        associations:list[IncidentCategoryAssociation] = []

        for user_number, user in enumerate(users, start=1):
            for incident_offset in range(incidents_per_user):
                incident_number = ((user_number - 1) * incidents_per_user) + incident_offset + 1
                status = statuses[(incident_number - 1) % len(statuses)]
                occurred_at = now - timedelta(minutes=incident_number)
                incident_uid = stable_uuid(f"incident-{incident_number}")
                incident = Incident(
                    uid=incident_uid,
                    title=f"Benchmark Incident {incident_number:05d}",
                    affected_service=f"service-{incident_number % 20:02d}",
                    environment=["production", "staging", "development"][incident_number % 3],
                    occurred_at=occurred_at,
                    status=status,
                    reporter_uid=user.uid,
                    assigned_user_uid=users[incident_number % user_count].uid,
                    resolved_at=(
                        occurred_at + timedelta(minutes=30)
                        if status == IncidentStatus.RESOLVED
                        else None
                    ),
                )
                incidents.append(incident)
                associations.append(
                    IncidentCategoryAssociation(
                        incident_uid=incident_uid,
                        category_uid=categories[(incident_number - 1) % category_count].uid,
                    )
                )

                for analysis_offset in range(analyses_per_incident):
                    analysis_number = ((incident_number - 1) * analyses_per_incident) + analysis_offset + 1
                    analyses.append(
                        IncidentAnalysis(
                            uid=stable_uuid(f"analysis-{analysis_number}"),
                            severity=severities[(analysis_number - 1) % len(severities)],
                            analysis_text=(
                                f"Synthetic benchmark analysis {analysis_number}. "
                                "This record provides representative incident detail data."
                            ),
                            user_uid=user.uid,
                            incident_uid=incident_uid,
                        )
                    )

        session.add_all(incidents)
        await session.commit()
        session.add_all(analyses)
        session.add_all(associations)
        await session.commit()

    print(
        "Seeded "
        f"{user_count} verified users, "
        f"{len(incidents)} incidents, "
        f"{len(analyses)} analyses, and "
        f"{category_count} categories."
    )


if __name__ == "__main__":
    asyncio.run(seed())
