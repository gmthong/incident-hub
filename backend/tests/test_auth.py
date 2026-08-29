from unittest.mock import AsyncMock, Mock

import pytest

from src.db.enums import UserRole


AUTH_PREFIX = "/api/v1/auth"
SIGNUP_BODY = {
    "username":"engineer",
    "first_name":"Incident",
    "last_name":"Engineer",
    "email":"engineer@example.com",
    "password":"Secret123",
}


def test_signup_creates_user_and_sends_verification(
    client,
    auth_service,
    make_user,
    monkeypatch,
):
    """Happy path: signup creates an engineer and queues verification email."""
    user = make_user(
        role=UserRole.ENGINEER,
        is_verified=False,
        username="engineer",
        email="engineer@example.com",
    )
    auth_service.is_user_exists.return_value = (False, False)
    auth_service.create_user.return_value = user
    send_email = Mock()
    monkeypatch.setattr("src.auth.routes.create_email_verification_token", lambda email: "verify-token")
    monkeypatch.setattr("src.auth.routes.send_email_to_users", send_email)
    monkeypatch.setattr("src.auth.routes.settings.FRONTEND_URL", "http://frontend.test")

    response = client.post(f"{AUTH_PREFIX}/signup", json=SIGNUP_BODY)

    assert response.status_code == 201
    assert response.json()["user"]["email"] == "engineer@example.com"
    auth_service.create_user.assert_awaited_once()
    send_email.assert_called_once()
    assert 'href="http://frontend.test/verify-account/verify-token"' in send_email.call_args.kwargs["body"]


def test_signup_rejects_duplicate_email(client, auth_service):
    """Unhappy path: signup reports a conflict for an existing email."""
    auth_service.is_user_exists.return_value = (True, False)

    response = client.post(f"{AUTH_PREFIX}/signup", json=SIGNUP_BODY)

    assert response.status_code == 409
    assert response.json()["error_code"] == "user_exists"


def test_signup_rejects_duplicate_username(client, auth_service):
    """Unhappy path: signup reports a conflict for an existing username."""
    auth_service.is_user_exists.return_value = (False, True)

    response = client.post(f"{AUTH_PREFIX}/signup", json=SIGNUP_BODY)

    assert response.status_code == 409
    assert response.json()["error_code"] == "username_exists"


def test_signup_rejects_invalid_payload(client):
    """Unhappy path: signup validates email and password input."""
    response = client.post(
        f"{AUTH_PREFIX}/signup",
        json={**SIGNUP_BODY, "email":"invalid", "password":"short"},
    )

    assert response.status_code == 422


@pytest.mark.parametrize("password", ["lowercase1", "UPPERCASE1", "NoNumberHere"])
def test_signup_rejects_password_without_required_character_types(client, password):
    """Unhappy path: signup requires lowercase, uppercase, and numeric characters."""
    response = client.post(
        f"{AUTH_PREFIX}/signup",
        json={**SIGNUP_BODY, "password":password},
    )

    assert response.status_code == 422


def test_verify_account_marks_user_verified(client, auth_service, make_user, monkeypatch):
    """Happy path: a valid verification token marks its user verified."""
    user = make_user(is_verified=False)
    auth_service.get_user_by_email.return_value = user
    auth_service.update_user.return_value = user
    monkeypatch.setattr(
        "src.auth.routes.decode_email_verification_token",
        lambda token: {"email":user.email},
    )

    response = client.get(f"{AUTH_PREFIX}/verify/valid-token")

    assert response.status_code == 200
    assert auth_service.update_user.await_args.args[:2] == (
        user,
        {"is_verified":True},
    )


def test_verify_account_rejects_invalid_token(client, monkeypatch):
    """Unhappy path: an invalid verification token returns 401."""
    monkeypatch.setattr(
        "src.auth.routes.decode_email_verification_token",
        lambda token: None,
    )

    response = client.get(f"{AUTH_PREFIX}/verify/invalid-token")

    assert response.status_code == 401
    assert response.json()["error_code"] == "invalid_token"


def test_login_returns_token_pair(client, auth_service, make_user, monkeypatch):
    """Happy path: valid credentials return access and refresh tokens."""
    user = make_user(role=UserRole.ENGINEER, email="engineer@example.com")
    auth_service.get_user_by_email.return_value = user
    monkeypatch.setattr("src.auth.routes.verify_password", lambda password, password_hash: True)
    create_token = Mock(side_effect=["access-token", "refresh-token"])
    monkeypatch.setattr("src.auth.routes.create_token", create_token)

    response = client.post(
        f"{AUTH_PREFIX}/login",
        json={"email":user.email, "password":"secret123"},
    )

    assert response.status_code == 200
    assert response.json()["access_token"] == "access-token"
    assert response.json()["refresh_token"] == "refresh-token"
    assert response.cookies["refresh_token"] == "refresh-token"


def test_login_rejects_bad_credentials(client, auth_service, monkeypatch):
    """Unhappy path: an unknown user or wrong password returns 401."""
    auth_service.get_user_by_email.return_value = None
    monkeypatch.setattr("src.auth.routes.verify_password", lambda password, password_hash: False)

    response = client.post(
        f"{AUTH_PREFIX}/login",
        json={"email":"missing@example.com", "password":"secret123"},
    )

    assert response.status_code == 401
    assert response.json()["error_code"] == "invalid_credentials"


def test_refresh_uses_current_database_user(client, auth_service, make_user, monkeypatch):
    """Happy path: refresh reloads current identity and role before issuing access."""
    user = make_user(role=UserRole.LEADER)
    auth_service.get_user_by_uid.return_value = user
    monkeypatch.setattr(
        "src.auth.routes.decode_token",
        lambda token: {
            "jti":"refresh-jti",
            "is_refresh_token":True,
            "user":{"uid":str(user.uid), "role":"engineer", "email":user.email},
        },
    )
    monkeypatch.setattr(
        "src.auth.routes.is_token_in_blocklist",
        AsyncMock(return_value=False),
    )
    create_token = Mock(return_value="new-access-token")
    monkeypatch.setattr("src.auth.routes.create_token", create_token)
    client.cookies.set("refresh_token", "refresh-token")

    response = client.get(f"{AUTH_PREFIX}/refresh_token")

    assert response.status_code == 200
    assert response.json() == {"access_token":"new-access-token"}
    assert auth_service.get_user_by_uid.await_args.args[0] == user.uid
    assert create_token.call_args.kwargs["user_data"]["role"] == "leader"


def test_refresh_requires_cookie(client):
    """Unhappy path: refresh without its cookie returns 401."""
    client.cookies.clear()

    response = client.get(f"{AUTH_PREFIX}/refresh_token")

    assert response.status_code == 401
    assert response.json()["error_code"] == "refresh_token_not_found"


def test_me_returns_authenticated_profile(client, current_user):
    """Happy path: a verified user can retrieve their profile."""
    response = client.get(f"{AUTH_PREFIX}/me")

    assert response.status_code == 200
    assert response.json()["uid"] == str(current_user.uid)


def test_me_rejects_unverified_user(client, current_user):
    """Unhappy path: an unverified account cannot use protected endpoints."""
    current_user.is_verified = False

    response = client.get(f"{AUTH_PREFIX}/me")

    assert response.status_code == 403
    assert response.json()["error_code"] == "account_not_verified"


def test_logout_revokes_access_and_refresh_tokens(client, monkeypatch):
    """Happy path: logout blocklists both tokens and clears the cookie."""
    add_to_blocklist = AsyncMock()
    monkeypatch.setattr("src.auth.routes.add_jti_to_blocklist", add_to_blocklist)
    monkeypatch.setattr("src.auth.routes.get_token_ttl", lambda expiry: 60)
    monkeypatch.setattr(
        "src.auth.routes.decode_token",
        lambda token: {"jti":"refresh-jti", "exp":9999999999},
    )
    client.cookies.set("refresh_token", "refresh-token")

    response = client.post(f"{AUTH_PREFIX}/logout")

    assert response.status_code == 200
    assert response.json()["message"] == "Logged out successfully"
    assert add_to_blocklist.await_count == 2


def test_logout_rejects_invalid_access_token(client):
    """Unhappy path: logout rejects an invalid bearer token."""
    response = client.post(
        f"{AUTH_PREFIX}/logout",
        headers={"Authorization":"Bearer invalid-token"},
    )

    assert response.status_code == 401
    assert response.json()["error_code"] == "invalid_token"


def test_password_reset_request_is_non_enumerating(
    client,
    auth_service,
    make_user,
    monkeypatch,
):
    """Happy path: reset requests return the same response for existing users."""
    user = make_user(email="engineer@example.com")
    auth_service.get_user_by_email.return_value = user
    send_email = Mock()
    monkeypatch.setattr("src.auth.routes.create_password_reset_token", lambda email: "reset-token")
    monkeypatch.setattr("src.auth.routes.send_email_to_users", send_email)
    monkeypatch.setattr("src.auth.routes.settings.FRONTEND_URL", "http://frontend.test")

    response = client.post(
        f"{AUTH_PREFIX}/password_reset_request",
        json={"email":user.email},
    )

    assert response.status_code == 200
    send_email.assert_called_once()
    assert 'href="http://frontend.test/reset-password/reset-token"' in send_email.call_args.kwargs["body"]


def test_password_reset_request_hides_unknown_email(client, auth_service, monkeypatch):
    """Unhappy-safe path: an unknown email gets the same generic response."""
    auth_service.get_user_by_email.return_value = None
    send_email = Mock()
    monkeypatch.setattr("src.auth.routes.send_email_to_users", send_email)

    response = client.post(
        f"{AUTH_PREFIX}/password_reset_request",
        json={"email":"missing@example.com"},
    )

    assert response.status_code == 200
    send_email.assert_not_called()


def test_password_reset_confirm_updates_hash(client, auth_service, make_user, monkeypatch):
    """Happy path: a valid reset token stores the newly generated hash."""
    user = make_user(email="engineer@example.com")
    auth_service.get_user_by_email.return_value = user
    auth_service.update_user.return_value = user
    monkeypatch.setattr(
        "src.auth.routes.decode_password_reset_token",
        lambda token: {"email":user.email},
    )
    monkeypatch.setattr("src.auth.routes.generate_password_hash", lambda password: "new-hash")

    response = client.post(
        f"{AUTH_PREFIX}/password_reset_confirm/valid-token",
        json={"new_password":"NewSecret1", "confirm_password":"NewSecret1"},
    )

    assert response.status_code == 200
    assert auth_service.update_user.await_args.args[1] == {"password_hash":"new-hash"}


def test_password_reset_confirm_rejects_mismatch(client):
    """Unhappy path: mismatched password confirmation returns 400."""
    response = client.post(
        f"{AUTH_PREFIX}/password_reset_confirm/valid-token",
        json={"new_password":"NewSecret1", "confirm_password":"Different1"},
    )

    assert response.status_code == 400
    assert response.json()["error_code"] == "passwords_do_not_match"


def test_password_reset_confirm_rejects_wrong_token_purpose(client, monkeypatch):
    """Unhappy path: a non-reset token cannot change a password."""
    monkeypatch.setattr(
        "src.auth.routes.decode_password_reset_token",
        lambda token: None,
    )

    response = client.post(
        f"{AUTH_PREFIX}/password_reset_confirm/wrong-token",
        json={"new_password":"NewSecret1", "confirm_password":"NewSecret1"},
    )

    assert response.status_code == 401
    assert response.json()["error_code"] == "invalid_token"


def test_password_reset_confirm_rejects_weak_new_password(client):
    """Unhappy path: reset cannot replace a password with a weak value."""
    response = client.post(
        f"{AUTH_PREFIX}/password_reset_confirm/valid-token",
        json={"new_password":"weakpass1", "confirm_password":"weakpass1"},
    )

    assert response.status_code == 422
