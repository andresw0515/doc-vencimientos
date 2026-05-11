from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime
from core.database import get_db
from core.security import get_current_user
from models.documento import Documento
from services.document_service import calcular_estado, check_and_send_alerts
import asyncio

router = APIRouter()


class DocumentoCreate(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    categoria: str = "otro"
    fecha_vencimiento: date
    fecha_emision: Optional[date] = None
    numero_referencia: Optional[str] = None
    responsable_id: int
    dueno_proceso_id: Optional[int] = None


class DocumentoUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    categoria: Optional[str] = None
    fecha_vencimiento: Optional[date] = None
    fecha_emision: Optional[date] = None
    numero_referencia: Optional[str] = None
    responsable_id: Optional[int] = None
    dueno_proceso_id: Optional[int] = None
    activo: Optional[bool] = None


class DocumentoOut(BaseModel):
    id: int
    nombre: str
    descripcion: Optional[str]
    categoria: str
    fecha_vencimiento: date
    fecha_emision: Optional[date]
    numero_referencia: Optional[str]
    estado: str
    responsable_id: int
    dueno_proceso_id: Optional[int]
    activo: bool
    creado_en: datetime
    dias_restantes: Optional[int] = None

    class Config:
        from_attributes = True


def enrich_documento(doc: Documento) -> dict:
    data = {
        "id": doc.id,
        "nombre": doc.nombre,
        "descripcion": doc.descripcion,
        "categoria": doc.categoria,
        "fecha_vencimiento": doc.fecha_vencimiento,
        "fecha_emision": doc.fecha_emision,
        "numero_referencia": doc.numero_referencia,
        "estado": doc.estado,
        "responsable_id": doc.responsable_id,
        "dueno_proceso_id": doc.dueno_proceso_id,
        "activo": doc.activo,
        "creado_en": doc.creado_en,
        "dias_restantes": (doc.fecha_vencimiento - date.today()).days,
    }
    return data


@router.post("/", status_code=201)
def crear_documento(
    data: DocumentoCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    estado = calcular_estado(data.fecha_vencimiento)
    doc = Documento(
        **data.model_dump(),
        estado=estado,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return enrich_documento(doc)


@router.get("/")
def listar_documentos(
    estado: Optional[str] = Query(None),
    categoria: Optional[str] = Query(None),
    responsable_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    q = db.query(Documento).filter(Documento.activo == True)

    if estado:
        q = q.filter(Documento.estado == estado)
    if categoria:
        q = q.filter(Documento.categoria == categoria)
    if responsable_id:
        q = q.filter(Documento.responsable_id == responsable_id)

    docs = q.order_by(Documento.fecha_vencimiento.asc()).all()
    return [enrich_documento(d) for d in docs]


@router.get("/stats/resumen")
def resumen_stats(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    total = db.query(Documento).filter(Documento.activo == True).count()
    vigentes = db.query(Documento).filter(Documento.activo == True, Documento.estado == "vigente").count()
    por_vencer = db.query(Documento).filter(Documento.activo == True, Documento.estado == "por_vencer").count()
    vencidos = db.query(Documento).filter(Documento.activo == True, Documento.estado == "vencido").count()
    return {
        "total": total,
        "vigentes": vigentes,
        "por_vencer": por_vencer,
        "vencidos": vencidos,
    }


@router.get("/{doc_id}")
def obtener_documento(doc_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    doc = db.query(Documento).filter(Documento.id == doc_id, Documento.activo == True).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    return enrich_documento(doc)


@router.put("/{doc_id}")
def actualizar_documento(
    doc_id: int,
    data: DocumentoUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    doc = db.query(Documento).filter(Documento.id == doc_id, Documento.activo == True).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")

    update_data = data.model_dump(exclude_unset=True)
    for key, val in update_data.items():
        setattr(doc, key, val)

    if data.fecha_vencimiento:
        doc.estado = calcular_estado(data.fecha_vencimiento)
        doc.notificaciones_enviadas = ""  # Resetear notificaciones

    db.commit()
    db.refresh(doc)
    return enrich_documento(doc)


@router.delete("/{doc_id}")
def eliminar_documento(doc_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    doc = db.query(Documento).filter(Documento.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    doc.activo = False
    db.commit()
    return {"mensaje": "Documento eliminado correctamente"}


@router.post("/admin/trigger-alerts")
def trigger_alerts_manual(current_user=Depends(get_current_user)):
    """Disparar revisión de alertas manualmente (para pruebas)."""
    if current_user.rol != "admin":
        raise HTTPException(status_code=403, detail="Solo administradores")
    check_and_send_alerts()
    return {"mensaje": "Revisión de alertas ejecutada correctamente"}
