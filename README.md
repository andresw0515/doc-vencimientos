# 📄 Doc Vencimientos

Sistema web para gestión y alertas de vencimiento de documentos empresariales.

## 🏗️ Stack

| Capa | Tecnología |
|------|-----------|
| Backend | Python + FastAPI |
| Base de datos | PostgreSQL |
| Frontend | React + Vite |
| Email | Resend |
| Deploy | Render |

## ✨ Funcionalidades

- Registro de documentos con fecha de vencimiento
- Alertas automáticas por email **30, 15, 7, 3 y 1 día** antes del vencimiento
- Correo al **responsable del documento** y al **dueño del proceso**
- Dashboard con estadísticas y gráfica de distribución
- Filtros por estado, categoría y búsqueda
- Autenticación JWT con roles (admin / usuario)
- Scheduler diario automático a las 8:00 AM (hora Bogotá)
- Trigger manual de alertas para pruebas (solo admin)

---

## 🚀 Despliegue en Render (paso a paso)

### 1. Crear repositorio en GitHub

```bash
cd ~/Documentos/doc-vencimientos
git init
git add .
git commit -m "feat: initial commit"
# Crear repo en github.com y luego:
git remote add origin https://github.com/TU_USUARIO/doc-vencimientos.git
git push -u origin main
```

### 2. Crear cuenta en Render

Ve a [render.com](https://render.com) → **New Blueprint** → conecta tu repo de GitHub → selecciona el archivo `render.yaml`.

Render creará automáticamente:
- 🐘 Base de datos PostgreSQL
- 🐍 Web service para el backend
- ⚛️ Static site para el frontend

### 3. Configurar variables de entorno en Render

En el servicio **backend**, agrega manualmente:

| Variable | Valor |
|----------|-------|
| `RESEND_API_KEY` | Tu API key de [resend.com](https://resend.com) |
| `EMAIL_FROM` | Tu email verificado en Resend |
| `APP_URL` | URL del frontend (ej: `https://doc-vencimientos-frontend.onrender.com`) |

En el servicio **frontend**:

| Variable | Valor |
|----------|-------|
| `VITE_API_URL` | `https://doc-vencimientos-backend.onrender.com/api` |

### 4. Verificar dominio en Resend

1. Ve a [resend.com](https://resend.com) → registra cuenta gratuita
2. **Domains** → Add Domain → agrega tu dominio
3. Copia la API key y úsala en `RESEND_API_KEY`
4. Actualiza `EMAIL_FROM` con un email de ese dominio

> ⚠️ **Sin dominio propio:** Puedes usar `onboarding@resend.dev` como `EMAIL_FROM` durante pruebas (límite 100 emails/día al mismo email).

---

## 💻 Desarrollo local

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env      # Edita con tus credenciales
uvicorn main:app --reload
```

API disponible en: `http://localhost:8000`
Docs interactivos: `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
cp .env.example .env.local
# Edita VITE_API_URL=http://localhost:8000/api
npm install
npm run dev
```

Frontend en: `http://localhost:5173`

---

## 📁 Estructura del proyecto

```
doc-vencimientos/
├── render.yaml              # Configuración de despliegue Render
├── .gitignore
├── backend/
│   ├── main.py              # Entrada FastAPI
│   ├── requirements.txt
│   ├── Procfile
│   ├── .env.example
│   ├── core/
│   │   ├── config.py        # Variables de entorno
│   │   ├── database.py      # Conexión PostgreSQL + SQLAlchemy
│   │   └── security.py      # JWT + autenticación
│   ├── models/
│   │   ├── usuario.py       # Modelo Usuario
│   │   └── documento.py     # Modelo Documento
│   ├── routers/
│   │   ├── auth.py          # Login / Register / Me
│   │   ├── usuarios.py      # CRUD Usuarios
│   │   └── documentos.py    # CRUD Documentos + stats
│   └── services/
│       ├── email_service.py # Envío de emails con Resend
│       ├── document_service.py # Lógica de alertas
│       └── scheduler.py     # Scheduler diario
└── frontend/
    ├── vite.config.js
    ├── src/
    │   ├── App.jsx
    │   ├── main.jsx
    │   ├── index.css
    │   ├── hooks/
    │   │   └── useAuth.jsx  # Context de autenticación
    │   ├── utils/
    │   │   └── api.js       # Cliente Axios
    │   ├── components/
    │   │   ├── Layout.jsx   # Sidebar + navegación
    │   │   ├── Badge.jsx    # Badge de estado
    │   │   └── StatCard.jsx # Tarjeta de estadística
    │   └── pages/
    │       ├── Login.jsx
    │       ├── Dashboard.jsx
    │       ├── Documentos.jsx
    │       ├── DocumentoForm.jsx
    │       └── Usuarios.jsx
```

---

## 🔑 API Reference

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/login` | Iniciar sesión |
| POST | `/api/auth/register` | Registrar usuario |
| GET | `/api/auth/me` | Perfil actual |
| GET | `/api/documentos` | Listar documentos |
| POST | `/api/documentos` | Crear documento |
| PUT | `/api/documentos/{id}` | Actualizar documento |
| DELETE | `/api/documentos/{id}` | Eliminar documento |
| GET | `/api/documentos/stats/resumen` | Estadísticas |
| POST | `/api/documentos/admin/trigger-alerts` | Disparar alertas (admin) |
| GET | `/api/usuarios` | Listar usuarios |

Documentación completa en: `{backend_url}/docs`

---

## 📧 Lógica de alertas

Las alertas se envían a los **30, 15, 7, 3 y 1 día** antes del vencimiento:

- **Responsable del documento**: recibe la alerta directa
- **Dueño del proceso**: recibe copia (si está configurado y es diferente al responsable)

El scheduler revisa todos los días a las **8:00 AM hora Colombia**. Una vez enviada la alerta para un umbral de días, no se vuelve a enviar (evita duplicados). Si se actualiza la fecha de vencimiento, las notificaciones se reinician.
