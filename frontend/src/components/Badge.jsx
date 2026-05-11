export default function Badge({ estado }) {
  const map = {
    vigente:    { label: 'Vigente',     color: '#10b981', bg: '#d1fae5' },
    por_vencer: { label: 'Por vencer',  color: '#f59e0b', bg: '#fef3c7' },
    vencido:    { label: 'Vencido',     color: '#ef4444', bg: '#fee2e2' },
  }
  const cfg = map[estado] || { label: estado, color: '#94a3b8', bg: '#f1f5f9' }

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      padding: '3px 10px',
      borderRadius: 99,
      fontSize: 12,
      fontWeight: 600,
      color: cfg.color,
      background: cfg.bg,
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.color, display: 'inline-block' }} />
      {cfg.label}
    </span>
  )
}
