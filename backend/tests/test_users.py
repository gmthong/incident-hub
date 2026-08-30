import uuid

from src.db.enums import UserRole
from src.errors import UserNotFound, UsernameAlreadyExists


USER_PREFIX = "/api/v1/users"


def test_get_all_users_returns_profiles(client, admin_user_service, make_user):
    """Happy path: an admin receives paginated user profiles."""
    engineer = make_user(
        role=UserRole.ENGINEER,
        username="engineer",
        email="engineer@example.com",
    )
    admin_user_service.get_all_users.return_value = {
        "items":[engineer],
        "page":1,
        "page_size":50,
        "total":1,
        "total_pages":1,
    }

    response = client.get(f"{USER_PREFIX}/")

    assert response.status_code == 200
    assert response.json()["items"][0]["role"] == "engineer"
    assert response.json()["total_pages"] == 1


def test_get_all_users_rejects_non_admin(client, current_user):
    """Unhappy path: non-admin users cannot list accounts."""
    current_user.role = UserRole.LEADER

    response = client.get(f"{USER_PREFIX}/")

    assert response.status_code == 403


def test_get_all_users_rejects_invalid_page(client):
    """Unhappy path: page numbers must start at one."""
    response = client.get(f"{USER_PREFIX}/?page=0")

    assert response.status_code == 422


def test_get_user_returns_profile(client, admin_user_service, make_user):
    """Happy path: an admin can retrieve one user profile."""
    engineer = make_user(role=UserRole.ENGINEER)
    admin_user_service.get_user.return_value = engineer

    response = client.get(f"{USER_PREFIX}/{engineer.uid}")

    assert response.status_code == 200
    assert response.json()["uid"] == str(engineer.uid)


def test_get_user_handles_missing_profile(client, admin_user_service):
    """Unhappy path: an unknown user returns 404."""
    admin_user_service.get_user.return_value = None

    response = client.get(f"{USER_PREFIX}/{uuid.uuid4()}")

    assert response.status_code == 404


def test_update_user_returns_changed_profile(client, admin_user_service, make_user):
    """Happy path: an admin can update profile fields and role."""
    leader = make_user(role=UserRole.LEADER, username="team-lead")
    admin_user_service.update_user.return_value = leader

    response = client.patch(
        f"{USER_PREFIX}/{leader.uid}",
        json={"username":"team-lead", "role":"leader"},
    )

    assert response.status_code == 200
    assert response.json()["role"] == "leader"


def test_update_user_handles_missing_profile(client, admin_user_service):
    """Unhappy path: updating an unknown user returns 404."""
    admin_user_service.update_user.side_effect = UserNotFound()

    response = client.patch(
        f"{USER_PREFIX}/{uuid.uuid4()}",
        json={"role":"leader"},
    )

    assert response.status_code == 404


def test_update_user_rejects_duplicate_username(client, admin_user_service):
    """Unhappy path: changing to an existing username returns 409."""
    admin_user_service.update_user.side_effect = UsernameAlreadyExists()

    response = client.patch(
        f"{USER_PREFIX}/{uuid.uuid4()}",
        json={"username":"existing-user"},
    )

    assert response.status_code == 409
