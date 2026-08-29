import uuid

from src.db.enums import UserRole
from src.errors import IncidentAnalysisNotFound, InsufficientPermission


ANALYSIS_PREFIX = "/api/v1/analyses"


def test_get_all_analyses_returns_items(client, analysis_service, make_analysis):
    """Happy path: an admin can list every incident analysis."""
    analysis = make_analysis()
    analysis_service.get_all_analyses.return_value = [analysis]

    response = client.get(f"{ANALYSIS_PREFIX}/")

    assert response.status_code == 200
    assert response.json()[0]["uid"] == str(analysis.uid)


def test_get_all_analyses_rejects_non_admin(client, current_user):
    """Unhappy path: non-admin users cannot list all analyses."""
    current_user.role = UserRole.LEADER

    response = client.get(f"{ANALYSIS_PREFIX}/")

    assert response.status_code == 403


def test_get_analysis_returns_item(client, analysis_service, make_analysis):
    """Happy path: a verified user can retrieve one analysis."""
    analysis = make_analysis()
    analysis_service.get_analysis.return_value = analysis

    response = client.get(f"{ANALYSIS_PREFIX}/{analysis.uid}")

    assert response.status_code == 200
    assert response.json()["analysis_text"] == analysis.analysis_text


def test_get_analysis_handles_missing_item(client, analysis_service):
    """Unhappy path: an unknown analysis returns 404."""
    analysis_service.get_analysis.return_value = None

    response = client.get(f"{ANALYSIS_PREFIX}/{uuid.uuid4()}")

    assert response.status_code == 404
    assert response.json()["error_code"] == "analysis_not_found"


def test_update_analysis_returns_changed_item(client, analysis_service, make_analysis):
    """Happy path: an author or admin can update an analysis."""
    analysis = make_analysis()
    analysis.analysis_text = "Updated root cause and remediation."
    analysis_service.update_analysis.return_value = analysis

    response = client.patch(
        f"{ANALYSIS_PREFIX}/{analysis.uid}",
        json={"analysis_text":analysis.analysis_text},
    )

    assert response.status_code == 200
    assert response.json()["analysis_text"] == analysis.analysis_text


def test_update_analysis_handles_missing_item(client, analysis_service):
    """Unhappy path: updating an unknown analysis returns 404."""
    analysis_service.update_analysis.side_effect = IncidentAnalysisNotFound()

    response = client.patch(
        f"{ANALYSIS_PREFIX}/{uuid.uuid4()}",
        json={"severity":"CRITICAL"},
    )

    assert response.status_code == 404


def test_update_analysis_enforces_ownership(client, analysis_service):
    """Unhappy path: a non-author engineer cannot update an analysis."""
    analysis_service.update_analysis.side_effect = InsufficientPermission()

    response = client.patch(
        f"{ANALYSIS_PREFIX}/{uuid.uuid4()}",
        json={"severity":"LOW"},
    )

    assert response.status_code == 403


def test_update_analysis_rejects_text_over_maximum(client, analysis_service):
    """Unhappy path: analysis updates reject text over 5,000 characters."""
    response = client.patch(
        f"{ANALYSIS_PREFIX}/{uuid.uuid4()}",
        json={"analysis_text":"a" * 5001},
    )

    assert response.status_code == 422
    analysis_service.update_analysis.assert_not_awaited()


def test_delete_analysis_returns_no_content(client, analysis_service):
    """Happy path: an author or admin can delete an analysis."""
    response = client.delete(f"{ANALYSIS_PREFIX}/{uuid.uuid4()}")

    assert response.status_code == 204
    analysis_service.delete_analysis.assert_awaited_once()


def test_delete_analysis_handles_missing_item(client, analysis_service):
    """Unhappy path: deleting an unknown analysis returns 404."""
    analysis_service.delete_analysis.side_effect = IncidentAnalysisNotFound()

    response = client.delete(f"{ANALYSIS_PREFIX}/{uuid.uuid4()}")

    assert response.status_code == 404


def test_delete_analysis_enforces_ownership(client, analysis_service):
    """Unhappy path: a non-author engineer cannot delete an analysis."""
    analysis_service.delete_analysis.side_effect = InsufficientPermission()

    response = client.delete(f"{ANALYSIS_PREFIX}/{uuid.uuid4()}")

    assert response.status_code == 403
