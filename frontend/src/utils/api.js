import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Interceptor: inyectar token JWT automáticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Interceptor: redirigir al login si el token expira
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('usuario')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ── Auth ──────────────────────────────────────────────
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
}

// ── Documentos ────────────────────────────────────────
export const documentosAPI = {
  listar: (params) => api.get('/documentos', { params }),
  obtener: (id) => api.get(`/documentos/${id}`),
  crear: (data) => api.post('/documentos', data),
  actualizar: (id, data) => api.put(`/documentos/${id}`, data),
  eliminar: (id) => api.delete(`/documentos/${id}`),
  stats: () => api.get('/documentos/stats/resumen'),
  triggerAlertas: () => api.post('/documentos/admin/trigger-alerts'),
}

// ── Usuarios ──────────────────────────────────────────
export const usuariosAPI = {
  listar: () => api.get('/usuarios'),
  obtener: (id) => api.get(`/usuarios/${id}`),
  actualizar: (id, data) => api.put(`/usuarios/${id}`, data),
  eliminar: (id) => api.delete(`/usuarios/${id}`),
}

export default api
