import { useEffect, useState } from 'react'
import { usuariosAPI } from '../utils/api'
import { useAuth } from '../hooks/useAuth'
import { Trash2, ShieldCheck, User } from 'lucide-react'
import toast from 'react-hot-toast'
import { format, parseISO } from 'date-fns'

export default function Usuarios() {
  const { usuario: me } = useAuth()
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)

  const cargar = async () => {
    try {
      const res = await usuariosAPI.listar()
      setUsuarios(res.data)
    } catch { toast.error('Error cargando usuarios') }
    finally { setLoading(false) }
  }

  useEffect(() => { cargar() }, [])

  const cambiarRol = async (id, rolActual) => {
    const nuevoRol = rolActual === 'admin' ? 'usuario' : 'admin'
    try {
      await usuariosAPI.actualizar(id, { rol: nuevoRol })
      toast.success(`Rol cambiado a ${nuevoRol}`)
      cargar()
    } catch { toast.error('Error cambiando rol') }
  }

  const eliminar = async (id) => {
    if (!confirm('¿Desactivar este usuario?')) return
    try {
      await usuariosAPI.eliminar(id)
      toast.success('Usuario desactivado')
      cargar()
    } catch { toast.error('Error eliminando usuario') }
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Usuarios</h1>
        <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>Gestión de usuarios del sistema</p>
      </div>

      <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text3)' }}>Cargando...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--surface2)' }}>
                {['Usuario', 'Email', 'Rol', 'Acciones'].map(h => (
                  <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {usuarios.map(u => (
                <tr key={u.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: '50%',
                        background: u.rol === 'admin' ? 'linear-gradient(135deg,#6366f1,#818cf8)' : 'linear-gradient(135deg,#334155,#475569)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontSize: 13, fontWeight: 700, flexShrink: 0,
                      }}>
                        {u.nombre[0].toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{u.nombre}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: 13, color: 'var(--text2)' }}>{u.email}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600,
                      color: u.rol === 'admin' ? '#6366f1' : '#475569',
                      background: u.rol === 'admin' ? '#eef2ff' : '#f1f5f9',
                    }}>
                      {u.rol === 'admin' ? <ShieldCheck size={12} /> : <User size={12} />}
                      {u.rol}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    {me?.rol === 'admin' && u.id !== me?.id && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => cambiarRol(u.id, u.rol)} style={{
                          background: '#eef2ff', border: 'none', borderRadius: 6,
                          padding: '6px 10px', fontSize: 12, fontWeight: 600, color: '#6366f1', cursor: 'pointer',
                        }}>
                          {u.rol === 'admin' ? '→ Usuario' : '→ Admin'}
                        </button>
                        <button onClick={() => eliminar(u.id)} style={{
                          background: '#fee2e2', border: 'none', borderRadius: 6,
                          width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#ef4444', cursor: 'pointer',
                        }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                    {u.id === me?.id && (
                      <span style={{ fontSize: 12, color: 'var(--text3)' }}>Tú</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
