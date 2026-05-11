import httpx
import logging
from core.config import settings
from datetime import date

logger = logging.getLogger(__name__)

RESEND_API_URL = "https://api.resend.com/emails"


def _days_label(days: int) -> str:
    if days == 1:
        return "mañana"
    elif days == 0:
        return "hoy"
    else:
        return f"en {days} días"


def _build_html(documento_nombre: str, fecha_vencimiento: date, dias_restantes: int, destinatario_nombre: str, es_dueno: bool) -> str:
    dias_texto = _days_label(dias_restantes)
    color = "#dc2626" if dias_restantes <= 3 else "#ea580c" if dias_restantes <= 7 else "#d97706"
    rol_texto = "como <strong>Dueño del Proceso</strong>" if es_dueno else "como <strong>Responsable del Documento</strong>"

    return f"""
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Alerta de Vencimiento</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e293b 0%,#334155 100%);padding:32px 40px;">
              <table width="100%">
                <tr>
                  <td>
                    <div style="font-size:11px;font-weight:700;letter-spacing:3px;color:#94a3b8;text-transform:uppercase;margin-bottom:8px;">Sistema de Vencimientos</div>
                    <div style="font-size:24px;font-weight:700;color:#f1f5f9;">⚠️ Alerta de Vencimiento</div>
                  </td>
                  <td align="right">
                    <div style="background:{color};border-radius:50px;padding:8px 16px;display:inline-block;">
                      <span style="color:white;font-size:13px;font-weight:700;">{dias_restantes} días</span>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="color:#475569;font-size:16px;margin:0 0 24px;">Hola <strong>{destinatario_nombre}</strong>,</p>
              <p style="color:#475569;font-size:15px;margin:0 0 28px;">
                Te notificamos {rol_texto} que el siguiente documento vence <strong style="color:{color};">{dias_texto}</strong>:
              </p>
              <!-- Document Card -->
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-left:4px solid {color};border-radius:8px;padding:24px;margin-bottom:28px;">
                <div style="font-size:18px;font-weight:700;color:#1e293b;margin-bottom:12px;">📄 {documento_nombre}</div>
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:4px 16px 4px 0;color:#94a3b8;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Vencimiento</td>
                    <td style="color:#1e293b;font-size:15px;font-weight:600;">{fecha_vencimiento.strftime('%d/%m/%Y')}</td>
                  </tr>
                  <tr>
                    <td style="padding:4px 16px 4px 0;color:#94a3b8;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Días restantes</td>
                    <td style="color:{color};font-size:15px;font-weight:700;">{dias_restantes} días</td>
                  </tr>
                </table>
              </div>
              <p style="color:#64748b;font-size:14px;margin:0 0 28px;">
                Por favor toma las acciones necesarias para renovar o actualizar este documento antes de su vencimiento.
              </p>
              <div style="text-align:center;">
                <a href="{settings.APP_URL}/documentos" style="background:#1e293b;color:white;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:14px;font-weight:600;display:inline-block;">
                  Ver Documento →
                </a>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;text-align:center;">
              <p style="color:#94a3b8;font-size:12px;margin:0;">
                Este es un mensaje automático del Sistema de Gestión de Vencimientos.<br>
                Por favor no respondas a este correo.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""


async def send_alert_email(
    to_email: str,
    to_name: str,
    documento_nombre: str,
    fecha_vencimiento: date,
    dias_restantes: int,
    es_dueno: bool = False,
) -> bool:
    dias_texto = _days_label(dias_restantes)
    subject = f"⚠️ Vencimiento {dias_texto}: {documento_nombre}"

    html = _build_html(documento_nombre, fecha_vencimiento, dias_restantes, to_name, es_dueno)

    payload = {
        "from": f"{settings.EMAIL_FROM_NAME} <{settings.EMAIL_FROM}>",
        "to": [to_email],
        "subject": subject,
        "html": html,
    }

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                RESEND_API_URL,
                headers={
                    "Authorization": f"Bearer {settings.RESEND_API_KEY}",
                    "Content-Type": "application/json",
                },
                json=payload,
                timeout=15,
            )
            if resp.status_code in (200, 201):
                logger.info(f"✅ Email enviado a {to_email} para documento '{documento_nombre}'")
                return True
            else:
                logger.error(f"❌ Error Resend {resp.status_code}: {resp.text}")
                return False
    except Exception as e:
        logger.error(f"❌ Excepción enviando email: {e}")
        return False
