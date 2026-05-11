from datetime import date, datetime
import asyncio
import logging
from sqlalchemy.orm import Session
from core.database import SessionLocal
from models.documento import Documento
from services.email_service import send_alert_email
from core.config import settings

logger = logging.getLogger(__name__)


def calcular_estado(fecha_vencimiento: date) -> str:
    hoy = date.today()
    diff = (fecha_vencimiento - hoy).days
    if diff < 0:
        return "vencido"
    elif diff <= 30:
        return "por_vencer"
    return "vigente"


def check_and_send_alerts():
    """Función principal del scheduler: revisa documentos y envía alertas."""
    logger.info("🔍 Revisando vencimientos...")
    db: Session = SessionLocal()
    try:
        documentos = db.query(Documento).filter(
            Documento.activo == True,
        ).all()

        hoy = date.today()
        alertas_enviadas = 0

        for doc in documentos:
            # Actualizar estado
            nuevo_estado = calcular_estado(doc.fecha_vencimiento)
            if doc.estado != nuevo_estado:
                doc.estado = nuevo_estado

            dias_restantes = (doc.fecha_vencimiento - hoy).days

            # Solo alertas para documentos que no han vencido aún
            if dias_restantes < 0:
                continue

            # Verificar si ya enviamos la alerta para estos días
            dias_notificados = set(
                int(d) for d in doc.notificaciones_enviadas.split(",") if d.strip().isdigit()
            ) if doc.notificaciones_enviadas else set()

            for umbral in settings.ALERT_DAYS_BEFORE:
                if dias_restantes <= umbral and umbral not in dias_notificados:
                    # Enviar al responsable
                    if doc.responsable:
                        asyncio.run(send_alert_email(
                            to_email=doc.responsable.email,
                            to_name=doc.responsable.nombre,
                            documento_nombre=doc.nombre,
                            fecha_vencimiento=doc.fecha_vencimiento,
                            dias_restantes=dias_restantes,
                            es_dueno=False,
                        ))
                        alertas_enviadas += 1

                    # Enviar al dueño del proceso (si es diferente)
                    if doc.dueno_proceso and doc.dueno_proceso_id != doc.responsable_id:
                        asyncio.run(send_alert_email(
                            to_email=doc.dueno_proceso.email,
                            to_name=doc.dueno_proceso.nombre,
                            documento_nombre=doc.nombre,
                            fecha_vencimiento=doc.fecha_vencimiento,
                            dias_restantes=dias_restantes,
                            es_dueno=True,
                        ))
                        alertas_enviadas += 1

                    # Registrar umbral como notificado
                    dias_notificados.add(umbral)
                    doc.notificaciones_enviadas = ",".join(str(d) for d in sorted(dias_notificados))
                    break  # Solo el umbral más cercano por ejecución

        db.commit()
        logger.info(f"✅ Revisión completa. Alertas enviadas: {alertas_enviadas}")
    except Exception as e:
        logger.error(f"❌ Error en check_and_send_alerts: {e}")
        db.rollback()
    finally:
        db.close()
