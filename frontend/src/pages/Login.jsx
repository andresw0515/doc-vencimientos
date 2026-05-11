import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Bell, Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const { login, register: registerUser } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors }, reset } = useForm()

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      if (mode === 'login') {
        await login(data.email, data.password)
        toast.success('¡Bienvenido!')
      } else {
        await registerUser({ nombre: data.nombre, email: data.email, password: data.password })
        toast.success('¡Cuenta creada!')
      }
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  const switchMode = () => { setMode(m => m === 'login' ? 'register' : 'login'); reset() }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      padding: 20,
    }}>
      <div style={{
        width: '100%',
        maxWidth: 420,
        background: 'var(--surface)',
        borderRadius: 16,
        padding: 40,
        boxShadow: 'var(--shadow-md)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: 'linear-gradient(135deg,#1e293b,#334155)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <Bell size={26} color="#818cf8" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>DocVencimientos</h1>
          <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>
            {mode === 'login' ? 'Inicia sesión en tu cuenta' : 'Crea tu cuenta'}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {mode === 'register' && (
            <div>
              <label style={labelStyle}>Nombre completo</label>
              <input
                style={inputStyle}
                placeholder="Tu nombre"
                {...register('nombre', { required: 'Requerido' })}
              />
              {errors.nombre && <span style={errStyle}>{errors.nombre.message}</span>}
            </div>
          )}

          <div>
            <label style={labelStyle}>Correo electrónico</label>
            <input
              style={inputStyle}
              type="email"
              placeholder="correo@empresa.com"
              {...register('email', { required: 'Requerido' })}
            />
            {errors.email && <span style={errStyle}>{errors.email.message}</span>}
          </div>

          <div>
            <label style={labelStyle}>Contraseña</label>
            <div style={{ position: 'relative' }}>
              <input
                style={{ ...inputStyle, paddingRight: 40 }}
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                {...register('password', { required: 'Requerido', minLength: { value: 6, message: 'Mínimo 6 caracteres' } })}
              />
              <button type="button" onClick={() => setShowPass(s => !s)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text3)', display: 'flex' }}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <span style={errStyle}>{errors.password.message}</span>}
          </div>

          <button type="submit" disabled={loading} style={{
            background: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            padding: '13px',
            fontSize: 14,
            fontWeight: 600,
            marginTop: 4,
            opacity: loading ? .7 : 1,
            transition: 'opacity .15s',
          }}>
            {loading ? 'Cargando...' : mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--text2)' }}>
          {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
          <button onClick={switchMode} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
            {mode === 'login' ? 'Regístrate' : 'Inicia sesión'}
          </button>
        </p>
      </div>
    </div>
  )
}

const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }
const inputStyle = {
  width: '100%', padding: '11px 14px', border: '1.5px solid var(--border)',
  borderRadius: 8, fontSize: 14, color: 'var(--text)', background: 'var(--surface2)',
  outline: 'none', transition: 'border-color .15s',
}
const errStyle = { fontSize: 12, color: 'var(--red)', marginTop: 4, display: 'block' }
