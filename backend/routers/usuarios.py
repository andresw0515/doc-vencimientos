from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from core.database import get_db
from core.security import get_current_user, get_current_admin, hash_password
from models.usuario import Usuario

router = APIRouter()


class UsuarioOut(BaseModel):
    id: int
    nombre: str
    email: str
    rol: str
    activo: bool

    class Config:
        from_attributes = True


class UsuarioUpdate(BaseModel):
    nombre: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    rol: Optional[str] = None
    activo: Optional[bool] = None


@router.get("/", response_model=List[UsuarioOut])
def listar_usuarios(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return db.query(Usuario).filter(Usuario.activo == True).all()


@router.get("/{usuario_id}", response_model=UsuarioOut)
def obtener_usuario(usuario_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    user = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user


@router.put("/{usuario_id}", response_model=UsuarioOut)
def actualizar_usuario(
    usuario_id: int,
    data: UsuarioUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    # Solo admin puede modificar otros usuarios
    if current_user.id != usuario_id and current_user.rol != "admin":
        raise HTTPException(status_code=403, detail="Sin permisos")

    user = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if data.nombre:
        user.nombre = data.nombre
    if data.email:
        user.email = data.email
    if data.password:
        user.password_hash = hash_password(data.password)
    if data.rol and current_user.rol == "admin":
        user.rol = data.rol
    if data.activo is not None and current_user.rol == "admin":
        user.activo = data.activo

    db.commit()
    db.refresh(user)
    return user


@router.delete("/{usuario_id}")
def eliminar_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    user = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    user.activo = False
    db.commit()
    return {"mensaje": "Usuario desactivado correctamente"}
