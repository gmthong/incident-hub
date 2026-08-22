from celery import Celery
from asgiref.sync import async_to_sync

from src.email import create_message, get_mail_client

celery_app = Celery("incidenthub")
celery_app.config_from_object("src.config")


@celery_app.task(name="incidenthub.send_email")
def send_email(recipients:list[str], subject:str, body:str):
    message = create_message(recipients=recipients, subject=subject, body=body)
    mail = get_mail_client()
    async_to_sync(mail.send_message)(message) # use async_to_sync to call the async send_message function
