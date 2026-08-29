import asyncio
import uuid
from unittest.mock import AsyncMock

import pytest

import src.incidents.service as incident_service_module
from src.db.enums import IncidentStatus, UserRole
from src.errors import (
    IncidentCategoryNotFound,
    IncidentNotFound,
    InsufficientPermission,
    InvalidAssignment,
    InvalidIncidentState,
    UserNotFound,
)
from src.incidents.schemas import IncidentAssignmentModel
from src.incidents.service import IncidentService


INCIDENT_PREFIX = "/api/v1/incidents"
INCIDENT_BODY = {
    "title":"Database connection exhaustion",
    "affected_service":"billing-api",
    "environment":"production",
    "occurred_at":"2026-08-22T10:00:00Z",
    "status":"OPEN",
}


def test_get_all_incidents_returns_incidents(client, incident_service, make_incident):
    """Happy path: verified users can list incidents."""
    incident = make_incident()
    incident_service.get_all_incidents.return_value = [incident]

    response = client.get(f"{INCIDENT_PREFIX}/")

    assert response.status_code == 200
    assert response.json()[0]["uid"] == str(incident.uid)


def test_get_all_incidents_rejects_unverified_user(client, current_user):
    """Unhappy path: unverified users cannot list incidents."""
    current_user.is_verified = False

    response = client.get(f"{INCIDENT_PREFIX}/")

    assert response.status_code == 403


def test_get_incidents_by_user_returns_reported_items(
    client,
    incident_service,
    make_incident,
    current_user,
):
    """Happy path: a user's reported incidents are returned."""
    incident = make_incident()
    incident_service.get_incidents_by_user.return_value = [incident]

    response = client.get(f"{INCIDENT_PREFIX}/users/{current_user.uid}")

    assert response.status_code == 200
    assert response.json()[0]["reporter_uid"] == str(current_user.uid)


def test_get_incidents_by_user_handles_missing_user(client, incident_service):
    """Unhappy path: listing incidents for an unknown user returns 404."""
    incident_service.get_incidents_by_user.side_effect = UserNotFound()

    response = client.get(f"{INCIDENT_PREFIX}/users/{uuid.uuid4()}")

    assert response.status_code == 404
    assert response.json()["error_code"] == "user_not_found"


def test_get_incident_returns_details(client, incident_service, make_incident):
    """Happy path: a known incident includes categories and analyses."""
    incident = make_incident()
    incident_service.get_incident.return_value = incident

    response = client.get(f"{INCIDENT_PREFIX}/{incident.uid}")

    assert response.status_code == 200
    assert response.json()["title"] == incident.title
    assert response.json()["analyses"] == []


def test_get_incident_handles_missing_incident(client, incident_service):
    """Unhappy path: an unknown incident returns 404."""
    incident_service.get_incident.return_value = None

    response = client.get(f"{INCIDENT_PREFIX}/{uuid.uuid4()}")

    assert response.status_code == 404
    assert response.json()["error_code"] == "incident_not_found"


def test_create_incident_uses_authenticated_reporter(
    client,
    incident_service,
    make_incident,
    current_user,
):
    """Happy path: a verified user creates an incident as its reporter."""
    incident = make_incident()
    incident_service.create_incident.return_value = incident

    response = client.post(f"{INCIDENT_PREFIX}/", json=INCIDENT_BODY)

    assert response.status_code == 201
    assert response.json()["reporter_uid"] == str(current_user.uid)
    assert incident_service.create_incident.await_args.args[1] is current_user


def test_create_incident_rejects_naive_timestamp(client):
    """Unhappy path: an occurrence time without timezone is rejected."""
    response = client.post(
        f"{INCIDENT_PREFIX}/",
        json={**INCIDENT_BODY, "occurred_at":"2026-08-22T10:00:00"},
    )

    assert response.status_code == 422


def test_create_incident_rejects_resolved_initial_state(client, incident_service):
    """Unhappy path: an incident cannot be created already resolved."""
    incident_service.create_incident.side_effect = InvalidIncidentState()

    response = client.post(
        f"{INCIDENT_PREFIX}/",
        json={**INCIDENT_BODY, "status":"RESOLVED"},
    )

    assert response.status_code == 400
    assert response.json()["error_code"] == "invalid_incident_state"


def test_update_incident_returns_updated_record(client, incident_service, make_incident):
    """Happy path: an authorized update returns the changed incident."""
    incident = make_incident(title="Updated incident")
    incident_service.update_incident.return_value = incident

    response = client.patch(
        f"{INCIDENT_PREFIX}/{incident.uid}",
        json={"title":"Updated incident", "status":"INVESTIGATING"},
    )

    assert response.status_code == 200
    assert response.json()["title"] == "Updated incident"


def test_update_incident_handles_missing_record(client, incident_service):
    """Unhappy path: updating an unknown incident returns 404."""
    incident_service.update_incident.side_effect = IncidentNotFound()

    response = client.patch(
        f"{INCIDENT_PREFIX}/{uuid.uuid4()}",
        json={"status":"INVESTIGATING"},
    )

    assert response.status_code == 404


def test_update_incident_enforces_object_permission(client, incident_service):
    """Unhappy path: a non-owner/non-assignee update returns 403."""
    incident_service.update_incident.side_effect = InsufficientPermission()

    response = client.patch(
        f"{INCIDENT_PREFIX}/{uuid.uuid4()}",
        json={"status":"INVESTIGATING"},
    )

    assert response.status_code == 403


def test_assign_user_updates_incident(client, incident_service, make_incident, make_user):
    """Happy path: a leader or admin assigns a verified engineer by email."""
    assignee = make_user(
        role=UserRole.ENGINEER,
        username="assignee",
        email="assignee@example.com",
    )
    incident = make_incident()
    incident.assigned_user_uid = assignee.uid
    incident_service.assign_user.return_value = incident

    response = client.patch(
        f"{INCIDENT_PREFIX}/{incident.uid}/assignment",
        json={"user_email":assignee.email},
    )

    assert response.status_code == 200
    assert response.json()["assigned_user_uid"] == str(assignee.uid)


def test_assign_user_rejects_engineer_actor(client, current_user):
    """Unhappy path: engineers cannot assign incidents."""
    current_user.role = UserRole.ENGINEER

    response = client.patch(
        f"{INCIDENT_PREFIX}/{uuid.uuid4()}/assignment",
        json={"user_email":"assignee@example.com"},
    )

    assert response.status_code == 403


def test_assign_user_handles_unknown_assignee(client, incident_service):
    """Unhappy path: an unknown assignment email returns user-not-found."""
    incident_service.assign_user.side_effect = UserNotFound()

    response = client.patch(
        f"{INCIDENT_PREFIX}/{uuid.uuid4()}/assignment",
        json={"user_email":"missing@example.com"},
    )

    assert response.status_code == 404
    assert response.json()["error_code"] == "user_not_found"


def test_assignment_service_raises_user_not_found_for_unknown_email(
    make_incident,
    current_user,
    monkeypatch,
):
    """Service rule: a missing assignment email raises UserNotFound."""
    current_user.role = UserRole.LEADER
    service = IncidentService()
    service.get_incident = AsyncMock(return_value=make_incident())
    monkeypatch.setattr(
        incident_service_module.user_service,
        "get_user_by_email",
        AsyncMock(return_value=None),
    )

    with pytest.raises(UserNotFound):
        asyncio.run(
            service.assign_user(
                uuid.uuid4(),
                IncidentAssignmentModel(user_email="missing@example.com"),
                current_user,
                AsyncMock(),
            )
        )


def test_assign_user_rejects_ineligible_assignee(client, incident_service):
    """Unhappy path: an existing but ineligible assignee returns 400."""
    incident_service.assign_user.side_effect = InvalidAssignment()

    response = client.patch(
        f"{INCIDENT_PREFIX}/{uuid.uuid4()}/assignment",
        json={"user_email":"unverified@example.com"},
    )

    assert response.status_code == 400
    assert response.json()["error_code"] == "invalid_assignment"


def test_replace_incident_categories_returns_new_set(
    client,
    incident_service,
    make_incident,
    make_category,
):
    """Happy path: an authorized user replaces an incident's categories."""
    category = make_category()
    incident = make_incident()
    incident.categories = [category]
    incident_service.replace_categories.return_value = incident

    response = client.put(
        f"{INCIDENT_PREFIX}/{incident.uid}/categories",
        json={"category_uids":[str(category.uid)]},
    )

    assert response.status_code == 200
    assert response.json()["categories"][0]["uid"] == str(category.uid)


def test_replace_incident_categories_handles_unknown_category(client, incident_service):
    """Unhappy path: assigning a missing category returns 404."""
    incident_service.replace_categories.side_effect = IncidentCategoryNotFound()

    response = client.put(
        f"{INCIDENT_PREFIX}/{uuid.uuid4()}/categories",
        json={"category_uids":[str(uuid.uuid4())]},
    )

    assert response.status_code == 404
    assert response.json()["error_code"] == "category_not_found"


def test_get_incident_analyses_returns_nested_items(
    client,
    analysis_service,
    make_analysis,
):
    """Happy path: verified users can list analyses for an incident."""
    analysis = make_analysis()
    analysis_service.get_incident_analyses.return_value = [analysis]

    response = client.get(f"{INCIDENT_PREFIX}/{analysis.incident_uid}/analyses")

    assert response.status_code == 200
    assert response.json()[0]["uid"] == str(analysis.uid)


def test_get_incident_analyses_handles_missing_incident(client, analysis_service):
    """Unhappy path: nested analysis listing rejects an unknown incident."""
    analysis_service.get_incident_analyses.side_effect = IncidentNotFound()

    response = client.get(f"{INCIDENT_PREFIX}/{uuid.uuid4()}/analyses")

    assert response.status_code == 404


def test_create_incident_analysis_returns_created_item(
    client,
    analysis_service,
    make_analysis,
):
    """Happy path: a verified user adds analysis to an incident."""
    analysis = make_analysis()
    analysis_service.create_analysis.return_value = analysis

    response = client.post(
        f"{INCIDENT_PREFIX}/{analysis.incident_uid}/analyses",
        json={"severity":"HIGH", "analysis_text":"Connection pool exhausted."},
    )

    assert response.status_code == 201
    assert response.json()["severity"] == "HIGH"


def test_create_incident_analysis_rejects_empty_text(client):
    """Unhappy path: analysis text cannot be empty."""
    response = client.post(
        f"{INCIDENT_PREFIX}/{uuid.uuid4()}/analyses",
        json={"severity":"HIGH", "analysis_text":""},
    )

    assert response.status_code == 422


def test_create_incident_analysis_rejects_text_over_maximum(client):
    """Unhappy path: analysis creation rejects text over 5,000 characters."""
    response = client.post(
        f"{INCIDENT_PREFIX}/{uuid.uuid4()}/analyses",
        json={"severity":"HIGH", "analysis_text":"a" * 5001},
    )

    assert response.status_code == 422


def test_delete_incident_returns_no_content(client, incident_service):
    """Happy path: an admin can delete an incident."""
    incident_uid = uuid.uuid4()

    response = client.delete(f"{INCIDENT_PREFIX}/{incident_uid}")

    assert response.status_code == 204
    incident_service.delete_incident.assert_awaited_once()


def test_delete_incident_rejects_non_admin(client, current_user):
    """Unhappy path: non-admin users cannot delete incidents."""
    current_user.role = UserRole.LEADER

    response = client.delete(f"{INCIDENT_PREFIX}/{uuid.uuid4()}")

    assert response.status_code == 403


def test_delete_incident_handles_missing_record(client, incident_service):
    """Unhappy path: deleting an unknown incident returns 404."""
    incident_service.delete_incident.side_effect = IncidentNotFound()

    response = client.delete(f"{INCIDENT_PREFIX}/{uuid.uuid4()}")

    assert response.status_code == 404
