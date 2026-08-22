from fastapi import FastAPI
from fastapi.requests import Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
import time
import logging

from src.config import settings

logger = logging.getLogger("uvicorn.access")
logger.disabled = True # disable the default logging unvicorn logger that FastAPI uses

def register_middleware(app:FastAPI):
    @app.middleware("http")
    async def custom_logging(request:Request, call_next):
        # middleware operation BEFORE every request is processed / response is generated
        start_time = time.time()

        response = await call_next(request)

        # middleware operation AFTER every request is processed / response is generated
        process_time = time.time() - start_time
        message = f"{request.client.host}:{request.client.port} - {request.method} - {request.url.path} - {response.status_code} completed in {process_time:.4f}s"
        print(message)

        return response

    # register built-in CORS middleware to allow cross-origin requests, and filter out unallowed domains
    app.add_middleware(
        CORSMiddleware,      
        allow_origins=settings.CORS_ORIGINS,
        allow_methods=["*"],      
        allow_headers=["*"],        
        allow_credentials=True,
    )

    # register bulit-in TrustedHostMiddleware to allow requests from trusted hosts only, and filter out untrusted hosts
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=settings.TRUSTED_HOSTS,
    )
