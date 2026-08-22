from fastapi import FastAPI

from src.analyses.routes import analysis_router
from src.auth.routes import auth_router
from src.categories.routes import category_router
from src.errors import register_all_errors
from src.incidents.routes import incident_router
from src.middleware import register_middleware
from src.users.routes import user_router


API_VERSION = "v1"

app = FastAPI(
    title="IncidentHub",
    description=(
        "Internal production incident tracking and postmortem management API"
    ),
    version="1.0.0",
)

register_all_errors(app)
register_middleware(app)

app.include_router(auth_router, prefix=f"/api/{API_VERSION}/auth", tags=["auth"])
app.include_router(incident_router, prefix=f"/api/{API_VERSION}/incidents", tags=["incidents"])
app.include_router(analysis_router, prefix=f"/api/{API_VERSION}/analyses", tags=["incident analyses"])
app.include_router(category_router, prefix=f"/api/{API_VERSION}/categories", tags=["incident categories"])
app.include_router(user_router, prefix=f"/api/{API_VERSION}/users", tags=["user administration"])


@app.get("/health", tags=["health"])
async def health_check() -> dict[str, str]:
    return {"status": "healthy", "service": "incidenthub-api"}
