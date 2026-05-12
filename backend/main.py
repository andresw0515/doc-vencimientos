from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from core.database import create_tables
from routers import documentos, usuarios, auth
from services.scheduler import start_scheduler
import logging
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 Iniciando aplicación...")
    create_tables()
    scheduler = start_scheduler()
    yield
    scheduler.shutdown()
    logger.info("🛑 Aplicación detenida.")


app = FastAPI(
    title="Doc Vencimientos API",
    description="API para gestión y alertas de vencimiento de documentos",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Desarrollo local
        "https://doc-vencimientos.vercel.app",  # Tu dominio en Vercel
        "https://doc-vencimientos-cyzuso8r6-pipewong92-3358s-projects.vercel.app",  # Preview de Vercel
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Autenticación"])
app.include_router(usuarios.router, prefix="/api/usuarios", tags=["Usuarios"])
app.include_router(documentos.router, prefix="/api/documentos", tags=["Documentos"])


@app.get("/")
def root():
    return {"mensaje": "Doc Vencimientos API activa ✅", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "ok"}
