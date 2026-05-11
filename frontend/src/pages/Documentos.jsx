import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { documentosAPI } from '../utils/api'
import Badge from '../components/Badge'
import { Plus, Search, Trash2, Pencil, Filter } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import toast from 'react-hot-toast'

const CATEGORIAS = ['', 'contrato', 'licencia', 'certificado', 'permiso', 'poliza', 'otro']
const ESTADOS = ['', 'vigente', 'por_vencer', 'vencido']

export default function Documentos() {
  const navigate = useNavigate()
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [eliminando, setEliminando] = useState(null)

  const cargar = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filtroEstado) params.estado = filtroEstado
      if (filtroCategoria) params.categoria = filtroCategoria
      const res = await documentosAPI.listar(params)
      setDocs(res.data)
    } catch { toast.error('Error cargando documentos') }
    finally { setLoading(false) }
  }

  useEffect(() => { cargar() }, [filtroEstado, filtroCategoria])

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar este documento?')) return
    setEliminando(id)
    try {
      await documentosAPI.eliminar(id)
      toast.success('Documento eliminado')
      cargar()
    } catch { toast.error('Error al eliminar') }
    finally { setEliminando(null) }
  }

  const filtrados = docs.filter(d =>
    d.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (d.numero_referencia || '').toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>Documentos</h1>
          <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>{docs.length} documentos registrados</p>
        </div>
        <button onClick={() => navigate('/documentos/nuevo')} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--primary)', color: 'white', border: 'none',
          borderRadius: 8, padding: '10px 18px', fontSize: 13, fontWeight: 600,
        }}>
          <Plus size={16} /> Nuevo documento
        </button>
      </div>

      {/* Filters */}
      <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', padding: '16px 20px', boxShadow: 'var(--shadow)', marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 220px' }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o referencia..."
            style={{ ...inputStyle, paddingLeft: 36, width: '100%' }}
          />
        </div>
        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} style={{ ...inputStyle, minWidth: 140 }}>
          <option value="">Todos los estados</option>
          {ESTADOS.filter(Boolean).map(e => <option key={e} value={e}>{e.replace('_', ' ')}</option>)}
        </select>
        <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)} style={{ ...inputStyle, minWidth: 140 }}>
          <option value="">Todas las categorías</option>
          {CATEGORIAS.filter(Boolean).map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text3)' }}>Cargando...</div>
        ) : filtrados.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text3)' }}>
            No hay documentos que coincidan con la búsqueda.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--surface2)' }}>
                {['Nombre', 'Categoría', 'Referencia', 'Vencimiento', 'Días', 'Estado', 'Acciones'].map(h => (
                  <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.map(doc => (
                <tr key={doc.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '14px 20px', fontWeight: 600, fontSize: 14, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.nombre}</td>
                  <td style={{ padding: '14px 20px', fontSize: 13, color: 'var(--text2)', textTransform: 'capitalize' }}>{doc.categoria}</td>
                  <td style={{ padding: '14px 20px', fontSize: 13, color: 'var(--text2)' }}>{doc.numero_referencia || '—'}</td>
                  <td style={{ padding: '14px 20px', fontSize: 13, color: 'var(--text2)', whiteSpace: 'nowrap' }}>{format(parseISO(doc.fecha_vencimiento), 'dd/MM/yyyy')}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{
                      fontWeight: 700, fontSize: 13,
                      color: doc.dias_restantes < 0 ? 'var(--red)' : doc.dias_restantes <= 7 ? 'var(--red)' : doc.dias_restantes <= 30 ? 'var(--yellow)' : 'var(--green)',
                    }}>
                      {doc.dias_restantes < 0 ? `${Math.abs(doc.dias_restantes)}d vencido` : `${doc.dias_restantes}d`}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px' }}><Badge estado={doc.estado} /></td>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => navigate(`/documentos/${doc.id}/editar`)} style={iconBtnStyle('#6366f1', '#eef2ff')}>
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => eliminar(doc.id)} disabled={eliminando === doc.id} style={iconBtnStyle('#ef4444', '#fee2e2')}>
                        <Trash2 size={14} />
                      </button>
                    </div>
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

const inputStyle = {
  padding: '9px 12px', border: '1.5px solid var(--border)', borderRadius: 8,
  fontSize: 13, color: 'var(--text)', background: 'var(--surface2)', outline: 'none',
}

const iconBtnStyle = (color, bg) => ({
  background: bg, border: 'none', borderRadius: 6,
  width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
  color, cursor: 'pointer',
})
