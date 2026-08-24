import uuid
from datetime import timedelta

from fastapi import APIRouter, Depends, Request, status
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from sqlmodel.ext.asyncio.session import AsyncSession

from src.auth.dependencies import AccessTokenBearer, RoleChecker, get_current_user
from src.auth.schemas import (
    PasswordResetConfirmModel,
    PasswordResetModel,
    UserCreateModel,
    UserLoginModel,
    UserModel,
)
from src.auth.service import UserService
from src.auth.utils import (
    create_email_verification_token,
    create_password_reset_token,
    create_token,
    decode_email_verification_token,
    decode_password_reset_token,
    decode_token,
    generate_password_hash,
    verify_password,
)
from src.config import settings
from src.db.enums import UserRole
from src.db.main import get_session
from src.db.models import User
from src.db.redis import add_jti_to_blocklist, get_token_ttl, is_token_in_blocklist
from src.errors import (
    InvalidCredentials,
    InvalidToken,
    PasswordsDoNotMatch,
    RefreshTokenNotFound,
    RevokedRefreshToken,
    UserAlreadyExists,
    UserNotFound,
    UsernameAlreadyExists,
)
from src.notifications import send_email_to_users


auth_router = APIRouter()
user_service = UserService()
all_roles = RoleChecker([UserRole.ADMIN, UserRole.LEADER, UserRole.ENGINEER])

REFRESH_TOKEN_EXPIRE_DAYS = 1


def frontend_url(path:str) -> str:
    return f"{settings.FRONTEND_URL.rstrip('/')}/{path.lstrip('/')}"


@auth_router.post("/signup", status_code=status.HTTP_201_CREATED)
async def create_user_account(user_data:UserCreateModel, session:AsyncSession = Depends(get_session)) -> JSONResponse:
    email_exists, username_exists = await user_service.is_user_exists(str(user_data.email), user_data.username, session)
    if email_exists:
        raise UserAlreadyExists()
    if username_exists:
        raise UsernameAlreadyExists()

    new_user = await user_service.create_user(user_data, session)
    token = create_email_verification_token(new_user.email)
    link = frontend_url(f"/verify-account/{token}")

    send_email_to_users(
        recipients=[new_user.email],
        subject="Verify your IncidentHub account",
        body=(
            "<h1>Verify your IncidentHub account</h1>"
            f'<p>Please click <a href="{link}">this link</a> to verify your email.</p>'
        ),
    )

    return JSONResponse(
        status_code=status.HTTP_201_CREATED,
        content={
            "message":"Account created. Check your email to verify your account.",
            "user":jsonable_encoder(UserModel.model_validate(new_user, from_attributes=True)) # notice we need  extra encode here bc user object is ORM model (not pyadantic) in a JSONResponse
        }
    )


@auth_router.get("/verify/{token}")
async def verify_user_account(token:str, session:AsyncSession = Depends(get_session)) -> JSONResponse:
    token_data = decode_email_verification_token(token)
    if not token_data or not token_data["email"]:
        raise InvalidToken()

    user = await user_service.get_user_by_email(token_data["email"], session)
    if user is None:
        raise UserNotFound()

    await user_service.update_user(user, {"is_verified":True}, session)
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={"message":"Account verified successfully"},
    )


@auth_router.post("/login")
async def login_user(login_data:UserLoginModel, session:AsyncSession = Depends(get_session)) -> JSONResponse:
    user = await user_service.get_user_by_email(str(login_data.email), session)
    
    if user is None or not verify_password(login_data.password, user.password_hash):
        raise InvalidCredentials()

    user_token = {
        "email":user.email,
        "uid":str(user.uid),
        "role":user.role.value,
    }

    # access token is used to access protected routes and resources.
    access_token = create_token(user_data=user_token)

    # refresh token is used to request for a new access token when the current access token expires.
    refresh_token = create_token(
        user_data=user_token,
        is_refresh_token=True,
        expiry=timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
    )

    response = JSONResponse(
        content={
            "message":"Login successful",
            "access_token":access_token,
            "refresh_token":refresh_token,
            "user":{
                "email":user.email,
                "uid":str(user.uid),
                "role":user.role.value,
            },
        }
    )

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=settings.COOKIE_SECURE, # secure = False for development only, set to True for real production
        samesite="lax",
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
    )

    return response


@auth_router.get("/refresh_token")
async def get_new_access_token(request:Request, session:AsyncSession = Depends(get_session)) -> JSONResponse:
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise RefreshTokenNotFound()

    refresh_token_details = decode_token(refresh_token) # notice this decode_token function already check token expiry internally
    
    if not refresh_token_details or refresh_token_details["is_refresh_token"] is not True:
        raise InvalidToken()

    if await is_token_in_blocklist(refresh_token_details["jti"]):
        raise RevokedRefreshToken()

    try:
        user_uid = uuid.UUID(refresh_token_details["user"]["uid"])
    except (KeyError, TypeError, ValueError):
        raise InvalidToken()

    user = await user_service.get_user_by_uid(user_uid, session)
    if user is None:
        raise InvalidToken()

    user_data = {
        "email":user.email,
        "uid":str(user.uid),
        "role":user.role.value,
    }
    new_access_token = create_token(user_data=user_data)    
    return JSONResponse(content={"access_token":new_access_token})


@auth_router.get("/me", response_model=UserModel, dependencies=[Depends(all_roles)])
async def get_current_user_details(user:User = Depends(get_current_user)) -> User:
    return user


@auth_router.post("/logout")
async def revoke_token(request:Request, token_details:dict = Depends(AccessTokenBearer())) -> JSONResponse:
    await add_jti_to_blocklist(
        token_details["jti"],
        get_token_ttl(token_details["exp"]),
    )

    refresh_token = request.cookies.get("refresh_token")
    if refresh_token:
        refresh_details = decode_token(refresh_token)
        if refresh_details and refresh_details.get("jti"):
            await add_jti_to_blocklist(
                refresh_details["jti"],
                get_token_ttl(refresh_details["exp"]),
            )

    response = JSONResponse(content={"message":"Logged out successfully"})
    response.delete_cookie(key="refresh_token")
    return response


@auth_router.post("/password_reset_request")
async def password_reset_request(email_data:PasswordResetModel, session:AsyncSession = Depends(get_session)) -> JSONResponse:
    user = await user_service.get_user_by_email(str(email_data.email), session)

    if user is not None:
        token = create_password_reset_token(user.email)
        link = frontend_url(f"/reset-password/{token}")
        send_email_to_users(
            recipients=[user.email],
            subject="Reset your IncidentHub password",
            body=(
                "<h1>Reset your IncidentHub password</h1>"
                f'<p>Please click <a href="{link}">this link</a> to reset your password.</p>'
            ),
        )

    return JSONResponse(
        content={"message":"Password reset link sent to your email. Please check your email"}
    )


@auth_router.post("/password_reset_confirm/{token}")
async def reset_password_account(token:str, password_data:PasswordResetConfirmModel, session:AsyncSession = Depends(get_session)) -> JSONResponse:
    new_password = password_data.new_password
    confirm_password = password_data.confirm_password

    if new_password != confirm_password:
        raise PasswordsDoNotMatch()

    token_data = decode_password_reset_token(token)
    user_email = token_data["email"] if token_data else None

    if not token_data or not user_email:
        raise InvalidToken()

    user = await user_service.get_user_by_email(user_email, session)
    if user is None:
        raise UserNotFound()

    password_hash = generate_password_hash(new_password)
    await user_service.update_user(user, {"password_hash":password_hash}, session)
    return JSONResponse(content={"message":"Password reset successfully"})
