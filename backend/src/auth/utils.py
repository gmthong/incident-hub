import logging
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

import jwt
from itsdangerous import BadData, URLSafeTimedSerializer
from passlib.context import CryptContext

from src.config import settings


logger = logging.getLogger(__name__)

ACCESS_TOKEN_EXPIRE_SECONDS = 3600
URL_TOKEN_MAX_AGE_SECONDS = 3600

password_context = CryptContext(schemes=["bcrypt"])
email_verification_serializer = URLSafeTimedSerializer(secret_key=settings.JWT_SECRET_KEY, salt="incidenthub-email-verification")
password_reset_serializer = URLSafeTimedSerializer(secret_key=settings.JWT_SECRET_KEY, salt="incidenthub-password-reset")


def generate_password_hash(password:str) -> str:
    return password_context.hash(password)


def verify_password(password:str, password_hash:str) -> bool:
    return password_context.verify(password, password_hash)


def create_token(user_data:dict[str, Any], expiry:Optional[timedelta] = None, is_refresh_token:bool = False) -> str:
    expires_at = datetime.now(timezone.utc) + (expiry or timedelta(seconds=ACCESS_TOKEN_EXPIRE_SECONDS))

    payload = {
        "user":user_data,
        "exp":expires_at,
        "jti":str(uuid.uuid4()),
        "is_refresh_token":is_refresh_token,
    }

    token = jwt.encode(
        payload=payload,
        key=settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )
    return token


# this decode function is used to decode access and refresh tokens. 
# it can also be used to verify if the token is valid, returning the decoded token data if the token is valid, else None.
def decode_token(token:str) -> Optional[dict[str, Any]]:
    try:
        token_data = jwt.decode(
            jwt=token,
            key=settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        return token_data
    
    except jwt.PyJWTError: # notice it will raise ExpiredSignatureError (which subclass of PyJWTError) if the token is expired based on the "exp" claim in token payload
        logger.info("Rejected an invalid or expired JWT")
        return None


def create_email_verification_token(email:str) -> str:
    token = email_verification_serializer.dumps({"email":email}) # turn string/dict into object
    return token


def decode_email_verification_token(token:str, max_age:int = URL_TOKEN_MAX_AGE_SECONDS) -> Optional[dict[str, Any]]:
    return _decode_url_token(email_verification_serializer, token, max_age)


def create_password_reset_token(email:str) -> str:
    token = password_reset_serializer.dumps({"email":email})
    return token


def decode_password_reset_token(token:str, max_age:int = URL_TOKEN_MAX_AGE_SECONDS) -> Optional[dict[str, Any]]:
    return _decode_url_token(password_reset_serializer, token, max_age)


def _decode_url_token(serializer:URLSafeTimedSerializer, token:str, max_age:int) -> Optional[dict[str, Any]]:
    try:
        token_data = serializer.loads(token, max_age=max_age)  # turn object back to string/dict
        return token_data
    except BadData:
        logger.info("Rejected an invalid or expired URL token")
        return None