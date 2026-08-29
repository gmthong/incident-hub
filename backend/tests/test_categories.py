import uuid

from src.db.enums import UserRole
from src.errors import IncidentCategoryAlreadyExists, IncidentCategoryNotFound


CATEGORY_PREFIX = "/api/v1/categories"


def test_get_all_categories_returns_items(client, category_service, make_category):
    """Happy path: verified users can list incident categories."""
    category = make_category()
    category_service.get_all_categories.return_value = [category]

    response = client.get(f"{CATEGORY_PREFIX}/")

    assert response.status_code == 200
    assert response.json()[0]["name"] == category.name


def test_get_all_categories_rejects_unverified_user(client, current_user):
    """Unhappy path: unverified users cannot list categories."""
    current_user.is_verified = False

    response = client.get(f"{CATEGORY_PREFIX}/")

    assert response.status_code == 403


def test_get_category_returns_item(client, category_service, make_category):
    """Happy path: a verified user can retrieve a category."""
    category = make_category()
    category_service.get_category_by_uid.return_value = category

    response = client.get(f"{CATEGORY_PREFIX}/{category.uid}")

    assert response.status_code == 200
    assert response.json()["uid"] == str(category.uid)


def test_get_category_handles_missing_item(client, category_service):
    """Unhappy path: an unknown category returns 404."""
    category_service.get_category_by_uid.return_value = None

    response = client.get(f"{CATEGORY_PREFIX}/{uuid.uuid4()}")

    assert response.status_code == 404


def test_create_category_returns_created_item(client, category_service, make_category):
    """Happy path: an admin can create a normalized category."""
    category = make_category()
    category_service.create_category.return_value = category

    response = client.post(f"{CATEGORY_PREFIX}/", json={"name":"Database"})

    assert response.status_code == 201
    assert response.json()["name"] == "Database"


def test_create_category_rejects_non_admin(client, current_user):
    """Unhappy path: a non-admin cannot create categories."""
    current_user.role = UserRole.LEADER

    response = client.post(f"{CATEGORY_PREFIX}/", json={"name":"Database"})

    assert response.status_code == 403


def test_create_category_rejects_duplicate(client, category_service):
    """Unhappy path: a duplicate category returns 409."""
    category_service.create_category.side_effect = IncidentCategoryAlreadyExists()

    response = client.post(f"{CATEGORY_PREFIX}/", json={"name":"Database"})

    assert response.status_code == 409


def test_update_category_returns_changed_item(client, category_service, make_category):
    """Happy path: an admin can rename a category."""
    category = make_category(name="Data Storage")
    category_service.update_category.return_value = category

    response = client.patch(
        f"{CATEGORY_PREFIX}/{category.uid}",
        json={"name":"Data Storage"},
    )

    assert response.status_code == 200
    assert response.json()["name"] == "Data Storage"


def test_update_category_handles_missing_item(client, category_service):
    """Unhappy path: updating an unknown category returns 404."""
    category_service.update_category.side_effect = IncidentCategoryNotFound()

    response = client.patch(
        f"{CATEGORY_PREFIX}/{uuid.uuid4()}",
        json={"name":"Data Storage"},
    )

    assert response.status_code == 404


def test_update_category_rejects_null_name(client):
    """Unhappy path: a category name cannot be changed to null."""
    response = client.patch(
        f"{CATEGORY_PREFIX}/{uuid.uuid4()}",
        json={"name":None},
    )

    assert response.status_code == 422


def test_delete_category_returns_no_content(client, category_service):
    """Happy path: an admin can delete a category."""
    response = client.delete(f"{CATEGORY_PREFIX}/{uuid.uuid4()}")

    assert response.status_code == 204
    category_service.delete_category.assert_awaited_once()


def test_delete_category_rejects_non_admin(client, current_user):
    """Unhappy path: a non-admin cannot delete categories."""
    current_user.role = UserRole.ENGINEER

    response = client.delete(f"{CATEGORY_PREFIX}/{uuid.uuid4()}")

    assert response.status_code == 403


def test_delete_category_handles_missing_item(client, category_service):
    """Unhappy path: deleting an unknown category returns 404."""
    category_service.delete_category.side_effect = IncidentCategoryNotFound()

    response = client.delete(f"{CATEGORY_PREFIX}/{uuid.uuid4()}")

    assert response.status_code == 404
