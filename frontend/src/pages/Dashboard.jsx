import { useEffect, useState } from 'react'
import { documentosAPI } from '../utils/api'
import { useAuth } from '../hooks/useAuth'
import StatCard from '../components/StatCard'
import Badge from '../components/Badge'
import { FileText, CheckCircle, AlertTriangle, XCircle, RefreshCw, Calendar } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useNavigate } from 'react-router-dom'

const COLORS = { vigente: '#10b981', por_vencer: '#f59e0b', vencido: '#ef4444' }

export default function Dashboard() {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [proximos, setProximos] = useState([])
  const [loading, setLoading] = useState(true)
  const [triggering, setTriggering] = useState(false)

  const cargar = async () => {
    try {
      const [statsRes, docsRes] = await Promise.all([
        documentosAPI.stats(),
        documentosAPI.listar(),
      ])
      setStats(statsRes.data)
      // Proximos 10 a vencer (no vencidos)
      const proxs = docsRes.data
        .filter(d => d.dias_restantes >= 0)
        .sort((a, b) => a.dias_restantes - b.dias_restantes)
        .slice(0, 8)
      setProximos(proxs)
    } catch {
      toast.error('Error cargando datos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const triggerAlertas = async () => {
    setTriggering(true)
    try {
      await documentosAPI.triggerAlertas()
      toast.success('Alertas enviadas correctamente')
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Error disparando alertas')
    } finally {
      setTriggering(false)
    }
  }

  const pieData = stats ? [
    { name: 'Vigentes', value: stats.vigentes, key: 'vigente' },
    { name: 'Por vencer', value: stats.por_vencer, key: 'por_vencer' },
    { name: 'Vencidos', value: stats.vencidos, key: 'vencido' },
  ].filter(d => d.value > 0) : []

  if (loading) return <div style={{ color: 'var(--text2)', padding: 40 }}>Cargando dashboard...</div>

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)' }}>
            Hola, {usuario?.nombre?.split(' ')[0]} 👋
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text2)', marginTop: 4 }}>
            {format(new Date(), "EEEE d 'de' MMMM, yyyy", { locale: es })}
          </p>
        </div>
        {usuario?.rol === 'admin' && (
          <button onClick={triggerAlertas} disabled={triggering} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--primary)', color: 'white', border: 'none',
            borderRadius: 8, padding: '10px 18px', fontSize: 13, fontWeight: 600,
            opacity: triggering ? .7 : 1, cursor: triggering ? 'not-allowed' : 'pointer',
          }}>
            <RefreshCw size={15} className={triggering ? 'spin' : ''} />
            {triggering ? 'Enviando...' : 'Disparar alertas'}
          </button>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        <StatCard label="Total documentos" value={stats?.total ?? 0} icon={FileText} color="#6366f1" bg="#eef2ff" />
        <StatCard label="Vigentes" value={stats?.vigentes ?? 0} icon={CheckCircle} color="#10b981" bg="#d1fae5" />
        <StatCard label="Por vencer" value={stats?.por_vencer ?? 0} icon={AlertTriangle} color="#f59e0b" bg="#fef3c7" />
        <StatCard label="Vencidos" value={stats?.vencidos ?? 0} icon={XCircle} color="#ef4444" bg="#fee2e2" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
        {/* Próximos a vencer */}
        <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Calendar size={18} color="var(--accent)" />
            <h2 style={{ fontSize: 15, fontWeight: 700 }}>Próximos a vencer</h2>
          </div>
          {proximos.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text3)' }}>No hay documentos próximos a vencer</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--surface2)' }}>
                  {['Documento', 'Categoría', 'Vence', 'Días', 'Estado'].map(h => (
                    <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {proximos.map((doc, i) => (
                  <tr key={doc.id}
                    onClick={() => navigate(`/documentos/${doc.id}/editar`)}
                    style={{ borderTop: '1px solid var(--border)', cursor: 'pointer', transition: 'background .1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '12px 20px', fontSize: 14, fontWeight: 600, color: 'var(--text)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.nombre}</td>
                    <td style={{ padding: '12px 20px', fontSize: 13, color: 'var(--text2)', textTransform: 'capitalize' }}>{doc.categoria}</td>
                    <td style={{ padding: '12px 20px', fontSize: 13, color: 'var(--text2)' }}>{format(parseISO(doc.fecha_vencimiento), 'dd/MM/yyyy')}</td>
                    <td style={{ padding: '12px 20px' }}>
                      <span style={{
                        fontWeight: 700,
                        fontSize: 13,
                        color: doc.dias_restantes <= 7 ? 'var(--red)' : doc.dias_restantes <= 30 ? 'var(--yellow)' : 'var(--green)',
                      }}>
                        {doc.dias_restantes}d
                      </span>
                    </td>
                    <td style={{ padding: '12px 20px' }}><Badge estado={doc.estado} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pie chart */}
        <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', padding: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Distribución</h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                  {pieData.map((entry) => (
                    <Cell key={entry.key} fill={COLORS[entry.key]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [v, n]} />
                <Legend iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text3)', paddingTop: 60 }}>Sin datos</div>
          )}
        </div>
      </div>
    </div>
  )
}
