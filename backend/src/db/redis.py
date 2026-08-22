from redis.asyncio import Redis
from src.config import settings
from datetime import datetime

token_blocklist = Redis.from_url(settings.REDIS_URL, db=0)

def get_token_ttl(expiry_timestamp: int | float) -> int:
    # get time to live (TTL) of the token in seconds
    return int((datetime.fromtimestamp(expiry_timestamp) - datetime.now()).total_seconds())

async def add_jti_to_blocklist(jti: str, expiry_seconds: int) -> None:
    ttl = max(1, expiry_seconds)
    await token_blocklist.set(jti, "", ex=ttl) # set jti in blocklist until the token naturally expires

async def is_token_in_blocklist(jti:str) -> bool:
    jti = await token_blocklist.get(jti)
    return jti is not None
