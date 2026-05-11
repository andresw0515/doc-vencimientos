import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { documentosAPI, usuariosAPI } from '../utils/api'
import { ArrowLeft, Save } from 'lucide-react'
import toast from 'react-hot-toast'

const CATEGORIAS = ['contrato', 'licencia', 'certificado', 'permiso', 'poliza', 'otro']

export default function DocumentoForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      try {
        const usersRes = await usuariosAPI.listar()
        setUsuarios(usersRes.data)
        if (isEdit) {
          const docRes = await documentosAPI.obtener(id)
          const doc = docRes.data
          reset({
            nombre: doc.nombre,
            descripcion: doc.descripcion || '',
            categoria: doc.categoria,
            fecha_vencimiento: doc.fecha_vencimiento,
            fecha_emision: doc.fecha_emision || '',
            numero_referencia: doc.numero_referencia || '',
            responsable_id: doc.responsable_id,
            dueno_proceso_id: doc.dueno_proceso_id || '',
          })
        }
      } catch { toast.error('Error cargando datos') }
      finally { setLoading(false) }
    }
    init()
  }, [id])

  const onSubmit = async (data) => {
    setSaving(true)
    try {
      const payload = {
        ...data,
        responsable_id: parseInt(data.responsable_id),
        dueno_proceso_id: data.dueno_proceso_id ? parseInt(data.dueno_proceso_id) : null,
        fecha_emision: data.fecha_emision || null,
      }
      if (isEdit) {
        await documentosAPI.actualizar(id, payload)
        toast.success('Documento actualizado')
      } else {
        await documentosAPI.crear(payload)
        toast.success('Documento creado')
      }
      navigate('/documentos')
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Error guardando documento')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div style={{ color: 'var(--text2)', padding: 40 }}>Cargando...</div>

  return (
    <div style={{ maxWidth: 720 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <button onClick={() => navigate('/documentos')} style={{
          background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 8,
          width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>{isEdit ? 'Editar documento' : 'Nuevo documento'}</h1>
          <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>
            {isEdit ? 'Modifica los datos del documento' : 'Completa el formulario para registrar un documento'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', padding: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Nombre */}
          <Field label="Nombre del documento *" error={errors.nombre}>
            <input style={inputStyle} placeholder="Ej: Contrato de arrendamiento oficina principal"
              {...register('nombre', { required: 'El nombre es requerido' })} />
          </Field>

          {/* Descripción */}
          <Field label="Descripción">
            <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
              placeholder="Descripción opcional del documento..."
              {...register('descripcion')} />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Categoría */}
            <Field label="Categoría *" error={errors.categoria}>
              <select style={inputStyle} {...register('categoria', { required: true })}>
                {CATEGORIAS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </Field>

            {/* Referencia */}
            <Field label="Número de referencia">
              <input style={inputStyle} placeholder="Ej: CON-2025-001"
                {...register('numero_referencia')} />
            </Field>

            {/* Fecha emisión */}
            <Field label="Fecha de emisión">
              <input style={inputStyle} type="date" {...register('fecha_emision')} />
            </Field>

            {/* Fecha vencimiento */}
            <Field label="Fecha de vencimiento *" error={errors.fecha_vencimiento}>
              <input style={inputStyle} type="date"
                {...register('fecha_vencimiento', { required: 'La fecha de vencimiento es requerida' })} />
            </Field>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Responsable */}
            <Field label="Responsable del documento *" error={errors.responsable_id}>
              <select style={inputStyle} {...register('responsable_id', { required: 'Selecciona un responsable' })}>
                <option value="">Seleccionar usuario</option>
                {usuarios.map(u => <option key={u.id} value={u.id}>{u.nombre} ({u.email})</option>)}
              </select>
            </Field>

            {/* Dueño del proceso */}
            <Field label="Dueño del proceso (copia de alertas)">
              <select style={inputStyle} {...register('dueno_proceso_id')}>
                <option value="">Sin dueño de proceso</option>
                {usuarios.map(u => <option key={u.id} value={u.id}>{u.nombre} ({u.email})</option>)}
              </select>
            </Field>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'flex-end' }}>
          <button type="button" onClick={() => navigate('/documentos')} style={{
            background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 8,
            padding: '11px 20px', fontSize: 14, fontWeight: 600, color: 'var(--text2)', cursor: 'pointer',
          }}>
            Cancelar
          </button>
          <button type="submit" disabled={saving} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--primary)', color: 'white', border: 'none',
            borderRadius: 8, padding: '11px 24px', fontSize: 14, fontWeight: 600,
            opacity: saving ? .7 : 1, cursor: saving ? 'not-allowed' : 'pointer',
          }}>
            <Save size={15} />
            {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear documento'}
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({ label, error, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>{label}</label>
      {children}
      {error && <span style={{ fontSize: 12, color: 'var(--red)', marginTop: 4, display: 'block' }}>{error.message}</span>}
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '10px 12px', border: '1.5px solid var(--border)',
  borderRadius: 8, fontSize: 14, color: 'var(--text)', background: 'var(--surface2)', outline: 'none',
}
