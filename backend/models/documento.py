from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
from core.database import Base
import enum


class EstadoEnum(str, enum.Enum):
    vigente = "vigente"
    por_vencer = "por_vencer"
    vencido = "vencido"


class CategoriaEnum(str, enum.Enum):
    contrato = "contrato"
    licencia = "licencia"
    certificado = "certificado"
    permiso = "permiso"
    poliza = "poliza"
    otro = "otro"


class Documento(Base):
    __tablename__ = "documentos"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(300), nullable=False)
    descripcion = Column(Text, nullable=True)
    categoria = Column(String(50), default="otro", nullable=False)
    fecha_vencimiento = Column(Date, nullable=False)
    fecha_emision = Column(Date, nullable=True)
    numero_referencia = Column(String(200), nullable=True)
    estado = Column(String(20), default="vigente", nullable=False)

    # Responsable directo del documento
    responsable_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    responsable = relationship("Usuario", back_populates="documentos", foreign_keys=[responsable_id])

    # Dueño del proceso (recibe copia de alertas)
    dueno_proceso_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    dueno_proceso = relationship("Usuario", back_populates="documentos_dueno", foreign_keys=[dueno_proceso_id])

    # Metadatos
    activo = Column(Boolean, default=True)
    creado_en = Column(DateTime, default=datetime.utcnow)
    actualizado_en = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    notificaciones_enviadas = Column(String(200), default="")  # "30,15,7" días ya notificados
