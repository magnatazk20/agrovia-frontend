import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import FloatingToast from '../components/FloatingToast'
import './Login.css'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

interface AuthResponse {
  message?: string
  error?: string
  token?: string
  user?: { id: number; name: string; phone: string; is_admin?: number; isAdmin?: number | boolean }
}

export default function Login() {
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [toastOpen, setToastOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')
  const [successModal, setSuccessModal] = useState(false)

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToastMessage(msg)
    setToastType(type)
    setToastOpen(true)
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password, remember }),
      })

      const data = (await response.json()) as AuthResponse

      if (!response.ok) {
        setError(data.error ?? 'Falha ao fazer login.')
        showToast(data.error ?? 'Falha ao fazer login.', 'error')
        return
      }

      const storage = remember ? localStorage : sessionStorage
      storage.setItem('token', data.token ?? '')
      storage.setItem('user', JSON.stringify(data.user ?? {}))

      setSuccessModal(true)
    } catch {
      setError('Não foi possível conectar ao servidor.')
      showToast('Não foi possível conectar ao servidor.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-orange" aria-labelledby="login-title">
      <div className="login-orange__hero">
        <img
          src="https://storage.googleapis.com/ecdt-logos/10302616000170/agrovia_comercio_e_transportes_10302616.webp"
          alt="Agrovia"
          className="login-orange__hero-logo"
        />
      </div>

      <h1 id="login-title" className="login-orange__title">
        Fazer login
      </h1>

      <form className="login-orange__form" onSubmit={onSubmit}>
        <div className="lo-field">
          <span className="lo-field__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.86 19.86 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </span>
          <span className="lo-field__prefix">
            <span className="lo-field__ddi">55</span>
            <span className="lo-field__ddi-arrow" aria-hidden="true">▾</span>
          </span>
          <input
            id="phone"
            type="tel"
            placeholder="Por favor, digite seu número de telefone"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^\d+()\s-]/g, ''))}
            inputMode="numeric"
            autoComplete="tel"
            required
          />
        </div>

        <div className="lo-field">
          <span className="lo-field__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="11" width="16" height="10" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
              <circle cx="12" cy="16" r="1.2" fill="currentColor" stroke="none" />
            </svg>
          </span>
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Por favor, digite a senha de login"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            className="lo-field__right-icon"
            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            onClick={() => setShowPassword((v) => !v)}
          >
            {showPassword ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a19.77 19.77 0 0 1 5.06-5.94" />
                <path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a19.77 19.77 0 0 1-3.17 4.19" />
                <path d="M1 1l22 22" />
                <path d="M14.12 14.12A3 3 0 0 1 9.88 9.88" />
              </svg>
            )}
          </button>
        </div>

        <label className="lo-check">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          <span className="lo-check__box" aria-hidden="true">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 8.5l3.2 3.2L13 5" />
            </svg>
          </span>
          <span className="lo-check__label">Lembrar nome de usuário/senha</span>
        </label>

        <div className="login-orange__actions">
          <button type="submit" className="lo-submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Fazer login agora'}
          </button>

          <p className="lo-register">
            Nenhuma conta?{' '}
            <Link to="/cadastro" className="lo-register__link">
              Registrar
            </Link>
          </p>
        </div>
      </form>

      {error ? <p className="lo-feedback lo-feedback--err">{error}</p> : null}

      {successModal ? (
        <div className="agrovia-modal-overlay">
          <div className="agrovia-modal">
            <div className="agrovia-modal__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="#2e7d32" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="agrovia-modal__title">Login realizado!</h2>
            <p className="agrovia-modal__text">Bem-vindo de volta. Você será redirecionado agora.</p>
            <button
              type="button"
              className="agrovia-modal__btn"
              onClick={() => {
                setSuccessModal(false)
                const returnTo = sessionStorage.getItem('loginReturnTo') ?? '/dashboard'
                sessionStorage.removeItem('loginReturnTo')
                navigate(returnTo)
              }}
            >
              Continuar
            </button>
          </div>
        </div>
      ) : null}

      <FloatingToast
        open={toastOpen}
        type={toastType}
        message={toastMessage}
        onClose={() => setToastOpen(false)}
      />
    </main>
  )
}
