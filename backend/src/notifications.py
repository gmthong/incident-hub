import logging
from html import escape

from sqlmodel.ext.asyncio.session import AsyncSession

from src.auth.service import UserService
from src.celery_tasks import send_email
from src.db.enums import UserRole
from src.db.models import Incident, User


logger = logging.getLogger(__name__)
user_service = UserService()


def send_email_to_users(recipients:list[str], subject:str, body:str) -> None:
    if not recipients:
        return

    try:
        send_email.delay(recipients=recipients, subject=subject, body=body)
    except Exception:
        logger.exception("Could not send IncidentHub email notification")


async def notify_incident_created(incident:Incident, session:AsyncSession) -> None:
    #send notification email of newly created incident to LEADERs and ADMINs
    recipients = await user_service.get_users_by_roles([UserRole.LEADER, UserRole.ADMIN],session)
    email_addresses = sorted({user.email for user in recipients})

    send_email_to_users(
        recipients=email_addresses,
        subject=f"New IncidentHub incident:{incident.title}",
        body=(
            "<h1>New incident reported!</h1>"
            f"<p><strong>{escape(incident.title)}</strong></p>"
            f"<p>Service:{escape(incident.affected_service)}</p>"
            f"<p>Environment:{escape(incident.environment)}</p>"
            f"<p>Status:{incident.status.value}</p>"
        ),
    )


def notify_assigned_user(incident:Incident, assigned_user:User) -> None:
    send_email_to_users(
        recipients=[assigned_user.email],
        subject=f"You were assigned an IncidentHub incident:{incident.title}",
        body=(
            "<h1>Incident assignment</h1>"
            f"<p>You were assigned to <strong>{escape(incident.title)}</strong>.</p>"
            f"<p>Service:{escape(incident.affected_service)}</p>"
            f"<p>Current status:{incident.status.value}</p>"
        ),
    )
