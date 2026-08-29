import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, Mock

import pytest
from fastapi.testclient import TestClient

import src.analyses.routes as analysis_routes
import src.auth.dependencies as auth_dependencies
import src.auth.routes as auth_routes
import src.categories.routes as category_routes
import src.incidents.routes as incident_routes
import src.users.routes as user_routes
from src.auth.dependencies import get_current_user
from src.auth.utils import create_token
from src.db.enums import AnalysisSeverity, IncidentStatus, UserRole
from src.db.main import get_session
from src.db.models import Incident, IncidentAnalysis, IncidentCategory, User
from src.main import app


NOW = datetime(2026, 8, 22, 10, 0, tzinfo=timezone.utc)


@pytest.fixture
def make_user():
    def factory(
        role:UserRole=UserRole.ADMIN,
        is_verified:bool=True,
        username:str="admin",
        email:str="admin@example.com",
    ) -> User:
        return User(
            uid=uuid.uuid4(),
            username=username,
            first_name="Incident",
            last_name="User",
            role=role,
            is_verified=is_verified,
            email=email,
            password_hash="hashed-password",
            created_at=NOW,
            updated_at=NOW,
        )

    return factory


@pytest.fixture
def current_user(make_user) -> User:
    return make_user()


@pytest.fixture
def make_category():
    def factory(name:str="Database") -> IncidentCategory:
        return IncidentCategory(uid=uuid.uuid4(), name=name, created_at=NOW)

    return factory


@pytest.fixture
def make_incident(current_user):
    def factory(
        title:str="Database connection exhaustion",
        status:IncidentStatus=IncidentStatus.OPEN,
    ) -> Incident:
        incident = Incident(
            uid=uuid.uuid4(),
            title=title,
            affected_service="billing-api",
            environment="production",
            occurred_at=NOW,
            status=status,
            reporter_uid=current_user.uid,
            assigned_user_uid=None,
            resolved_at=NOW if status == IncidentStatus.RESOLVED else None,
            created_at=NOW,
            updated_at=NOW,
        )
        incident.categories = []
        incident.analyses = []
        return incident

    return factory


@pytest.fixture
def make_analysis(current_user, make_incident):
    def factory() -> IncidentAnalysis:
        incident = make_incident()
        return IncidentAnalysis(
            uid=uuid.uuid4(),
            severity=AnalysisSeverity.HIGH,
            analysis_text="A connection pool limit caused request failures.",
            user_uid=current_user.uid,
            incident_uid=incident.uid,
            created_at=NOW,
            updated_at=NOW,
        )

    return factory


def service_mock(method_names:list[str]) -> Mock:
    service = Mock()
    for method_name in method_names:
        setattr(service, method_name, AsyncMock())
    return service


@pytest.fixture
def auth_service(monkeypatch):
    service = service_mock(
        [
            "is_user_exists",
            "get_user_by_username",
            "get_user_by_email",
            "get_user_by_uid",
            "create_user",
            "update_user",
        ]
    )
    monkeypatch.setattr(auth_routes, "user_service", service)
    return service


@pytest.fixture
def incident_service(monkeypatch):
    service = service_mock(
        [
            "get_all_incidents",
            "get_incidents_by_user",
            "get_incident",
            "create_incident",
            "update_incident",
            "assign_user",
            "replace_categories",
            "delete_incident",
        ]
    )
    monkeypatch.setattr(incident_routes, "incident_service", service)
    return service


@pytest.fixture
def analysis_service(monkeypatch):
    service = service_mock(
        [
            "get_all_analyses",
            "get_analysis",
            "get_incident_analyses",
            "create_analysis",
            "update_analysis",
            "delete_analysis",
        ]
    )
    monkeypatch.setattr(analysis_routes, "analysis_service", service)
    monkeypatch.setattr(incident_routes, "analysis_service", service)
    return service


@pytest.fixture
def category_service(monkeypatch):
    service = service_mock(
        [
            "get_all_categories",
            "get_category_by_uid",
            "create_category",
            "update_category",
            "delete_category",
        ]
    )
    monkeypatch.setattr(category_routes, "category_service", service)
    return service


@pytest.fixture
def admin_user_service(monkeypatch):
    service = service_mock(["get_all_users", "get_user", "update_user"])
    monkeypatch.setattr(user_routes, "user_service", service)
    return service


@pytest.fixture
def fake_session() -> AsyncMock:
    return AsyncMock()


@pytest.fixture
def client(current_user, fake_session, monkeypatch):
    async def override_current_user() -> User:
        return current_user

    async def override_session():
        yield fake_session

    async def token_is_active(jti:str) -> bool:
        return False

    app.dependency_overrides[get_current_user] = override_current_user
    app.dependency_overrides[get_session] = override_session
    monkeypatch.setattr(auth_dependencies, "is_token_in_blocklist", token_is_active)

    token = create_token(
        {
            "email":current_user.email,
            "uid":str(current_user.uid),
            "role":current_user.role.value,
        }
    )
    with TestClient(
        app,
        base_url="http://localhost",
        headers={"Authorization":f"Bearer {token}"},
    ) as test_client:
        yield test_client

    app.dependency_overrides.clear()
