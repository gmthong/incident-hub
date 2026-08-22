import uuid
from typing import Optional

from fastapi import Depends, Request
from fastapi.security import HTTPBearer
from fastapi.security.http import HTTPAuthorizationCredentials
from sqlmodel.ext.asyncio.session import AsyncSession

from src.auth.service import UserService
from src.auth.utils import decode_token
from src.db.enums import UserRole
from src.db.main import get_session
from src.db.models import User
from src.db.redis import is_token_in_blocklist
from src.errors import (
    AccessTokenRequired,
    AccountNotVerified,
    InsufficientPermission,
    InvalidToken,
    RefreshTokenRequired,
    RevokedToken,
)


user_service = UserService()


class TokenBearer(HTTPBearer):
    # override the original __init__ method from HTTPBearer
    def __init__(self, auto_error:bool = False):
        super().__init__(auto_error=auto_error)

    #override the original __call__ method from HTTPBearer
    async def __call__(self,request:Request,) -> Optional[dict]:
        creds = await super().__call__(request)
        if creds is None:
            raise InvalidToken()

        token_data = decode_token(creds.credentials) # notice this decode_token function already check token expiry internally
        if not token_data:# if token is invalid or expired
            raise InvalidToken()
        
        if await is_token_in_blocklist(token_data["jti"]):
            raise RevokedToken()

        self.verify_token_data(token_data)
        return token_data

    def verify_token_data(self, token_data:dict) -> None:
        raise NotImplementedError("Please override this method on child classes")


class AccessTokenBearer(TokenBearer):
    def verify_token_data(self, token_data:dict) -> None:
        if token_data["is_refresh_token"] is True:
            raise AccessTokenRequired()


class RefreshTokenBearer(TokenBearer):
    def verify_token_data(self, token_data:dict) -> None:
        if token_data["is_refresh_token"] is False:
            raise RefreshTokenRequired()


async def get_current_user(token_data:dict = Depends(AccessTokenBearer()),session:AsyncSession = Depends(get_session)) -> User:
    try:
        user_uid = uuid.UUID(token_data["user"]["uid"])
    except (KeyError, TypeError, ValueError):
        raise InvalidToken()

    user = await user_service.get_user_by_uid(user_uid, session)
    if user is None:
        raise InvalidToken()
    return user


class RoleChecker:
    def __init__(self, allowed_roles:list[UserRole]):
        self.allowed_roles = allowed_roles

    async def __call__(self,current_user:User = Depends(get_current_user)) -> User:

        if not current_user.is_verified:
            raise AccountNotVerified()
        
        if current_user.role not in self.allowed_roles:
            raise InsufficientPermission()
        
        return True
