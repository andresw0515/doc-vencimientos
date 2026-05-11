export default function StatCard({ label, value, icon: Icon, color = '#6366f1', bg = '#eef2ff' }) {
  return (
    <div style={{
      background: 'var(--surface)',
      borderRadius: 'var(--radius)',
      padding: '24px',
      boxShadow: 'var(--shadow)',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
    }}>
      <div style={{
        width: 52,
        height: 52,
        borderRadius: 12,
        background: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={24} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>{label}</div>
      </div>
    </div>
  )
}
