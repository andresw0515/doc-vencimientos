from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from services.document_service import check_and_send_alerts
import logging

logger = logging.getLogger(__name__)


def start_scheduler() -> BackgroundScheduler:
    scheduler = BackgroundScheduler(timezone="America/Bogota")

    # Ejecutar todos los días a las 8:00 AM hora Colombia
    scheduler.add_job(
        check_and_send_alerts,
        trigger=CronTrigger(hour=8, minute=0),
        id="check_vencimientos",
        name="Revisar vencimientos de documentos",
        replace_existing=True,
    )

    scheduler.start()
    logger.info("⏰ Scheduler iniciado — revisión diaria a las 8:00 AM (Bogotá)")
    return scheduler
