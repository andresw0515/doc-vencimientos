from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
from core.database import Base
import enum


class RolEnum(str, enum.Enum):
    admin = "admin"
    usuario = "usuario"


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(150), nullable=False)
    email = Column(String(200), unique=True, index=True, nullable=False)
    password_hash = Column(String(300), nullable=False)
    rol = Column(String(20), default="usuario", nullable=False)
    activo = Column(Boolean, default=True)
    creado_en = Column(DateTime, default=datetime.utcnow)

    # Documentos donde este usuario es el responsable
    documentos = relationship("Documento", back_populates="responsable", foreign_keys="Documento.responsable_id")
    # Documentos donde este usuario es el dueño del proceso
    documentos_dueno = relationship("Documento", back_populates="dueno_proceso", foreign_keys="Documento.dueno_proceso_id")
