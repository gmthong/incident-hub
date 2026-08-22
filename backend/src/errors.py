import logging
from typing import Any, Callable

from fastapi import FastAPI, status
from fastapi.requests import Request
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError


logger = logging.getLogger(__name__)


class IncidentHubError(Exception):
    """Base class for expected IncidentHub application errors."""


class InvalidToken(IncidentHubError):
    pass


class RefreshTokenNotFound(IncidentHubError):
    pass


class RevokedToken(IncidentHubError):
    pass


class RevokedRefreshToken(IncidentHubError):
    pass


class AccessTokenRequired(IncidentHubError):
    pass


class RefreshTokenRequired(IncidentHubError):
    pass


class UserAlreadyExists(IncidentHubError):
    pass


class UsernameAlreadyExists(IncidentHubError):
    pass


class InvalidCredentials(IncidentHubError):
    pass


class InsufficientPermission(IncidentHubError):
    pass


class UserNotFound(IncidentHubError):
    pass


class AccountNotVerified(IncidentHubError):
    pass


class PasswordsDoNotMatch(IncidentHubError):
    pass


class IncidentNotFound(IncidentHubError):
    pass


class IncidentAnalysisNotFound(IncidentHubError):
    pass


class IncidentCategoryNotFound(IncidentHubError):
    pass


class IncidentCategoryAlreadyExists(IncidentHubError):
    pass


class InvalidIncidentState(IncidentHubError):
    pass


class InvalidAssignment(IncidentHubError):
    pass


def create_exception_handler(
    status_code: int,
    initial_detail: dict[str, Any],
) -> Callable[[Request, Exception], JSONResponse]:
    async def exception_handler(
        request: Request,
        exc: Exception,
    ) -> JSONResponse:
        return JSONResponse(content=initial_detail, status_code=status_code)

    return exception_handler


def register_all_errors(app: FastAPI) -> None:
    error_handlers: list[tuple[type[IncidentHubError], int, dict[str, str]]] = [
        (
            UserAlreadyExists,
            status.HTTP_409_CONFLICT,
            {"message": "A user with this email already exists", "error_code": "user_exists"},
        ),
        (
            UsernameAlreadyExists,
            status.HTTP_409_CONFLICT,
            {"message": "This username is already in use", "error_code": "username_exists"},
        ),
        (
            UserNotFound,
            status.HTTP_404_NOT_FOUND,
            {"message": "User not found", "error_code": "user_not_found"},
        ),
        (
            IncidentNotFound,
            status.HTTP_404_NOT_FOUND,
            {"message": "Incident not found", "error_code": "incident_not_found"},
        ),
        (
            IncidentAnalysisNotFound,
            status.HTTP_404_NOT_FOUND,
            {"message": "Incident analysis not found", "error_code": "analysis_not_found"},
        ),
        (
            IncidentCategoryNotFound,
            status.HTTP_404_NOT_FOUND,
            {"message": "Incident category not found", "error_code": "category_not_found"},
        ),
        (
            IncidentCategoryAlreadyExists,
            status.HTTP_409_CONFLICT,
            {"message": "Incident category already exists", "error_code": "category_exists"},
        ),
        (
            InvalidCredentials,
            status.HTTP_401_UNAUTHORIZED,
            {"message": "Invalid email or password", "error_code": "invalid_credentials"},
        ),
        (
            InvalidToken,
            status.HTTP_401_UNAUTHORIZED,
            {"message": "Token is invalid or expired", "error_code": "invalid_token"},
        ),
        (
            RevokedToken,
            status.HTTP_401_UNAUTHORIZED,
            {"message": "Token has been revoked", "error_code": "token_revoked"},
        ),
        (
            RevokedRefreshToken,
            status.HTTP_401_UNAUTHORIZED,
            {"message": "Refresh token has been revoked", "error_code": "refresh_token_revoked"},
        ),
        (
            AccessTokenRequired,
            status.HTTP_401_UNAUTHORIZED,
            {"message": "A valid access token is required", "error_code": "access_token_required"},
        ),
        (
            RefreshTokenRequired,
            status.HTTP_401_UNAUTHORIZED,
            {"message": "A valid refresh token is required", "error_code": "refresh_token_required"},
        ),
        (
            RefreshTokenNotFound,
            status.HTTP_401_UNAUTHORIZED,
            {"message": "Refresh token cookie was not found", "error_code": "refresh_token_not_found"},
        ),
        (
            InsufficientPermission,
            status.HTTP_403_FORBIDDEN,
            {"message": "You do not have permission to perform this action", "error_code": "insufficient_permissions"},
        ),
        (
            AccountNotVerified,
            status.HTTP_403_FORBIDDEN,
            {"message": "Account is not verified", "error_code": "account_not_verified"},
        ),
        (
            PasswordsDoNotMatch,
            status.HTTP_400_BAD_REQUEST,
            {"message": "New password and confirmation do not match", "error_code": "passwords_do_not_match"},
        ),
        (
            InvalidIncidentState,
            status.HTTP_400_BAD_REQUEST,
            {"message": "The requested incident state is invalid", "error_code": "invalid_incident_state"},
        ),
        (
            InvalidAssignment,
            status.HTTP_400_BAD_REQUEST,
            {"message": "The selected user cannot be assigned", "error_code": "invalid_assignment"},
        ),
    ]

    for exception_class, status_code, detail in error_handlers:
        app.add_exception_handler(
            exception_class,
            create_exception_handler(status_code, detail),
        )

    @app.exception_handler(SQLAlchemyError)
    async def database_error(
        request: Request,
        exc: SQLAlchemyError,
    ) -> JSONResponse:
        logger.exception("Database error while handling %s", request.url.path, exc_info=exc)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": "A database error occurred", "error_code": "database_error"},
        )

    @app.exception_handler(500)
    async def internal_server_error(
        request: Request,
        exc: Exception,
    ) -> JSONResponse:
        logger.exception("Unhandled error while handling %s", request.url.path, exc_info=exc)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": "Something went wrong", "error_code": "server_error"},
        )
