import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './WithdrawPassword.css'

type StoredUser = {
  id: number
  name: string
  phone: string
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

const ICON_BACK = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 6l-6 6l6 6" />
  </svg>
)

const ICON_LOCK = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)

const ICON_WALLET = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
    <path d="M18 12a2 2 0 0 0 0 4h4v-4z" />
  </svg>
)

const ICON_SHIELD = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
)

const ICON_CHECK = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

export default function WithdrawPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [mounted, setMounted] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50)
    return () => clearTimeout(t)
  }, [])

  const user = useMemo(() => {
    const raw = localStorage.getItem('user') ?? sessionStorage.getItem('user')
    if (!raw) return null
    try {
      return JSON.parse(raw) as StoredUser
    } catch {
      return null
    }
  }, [])

  const saveWithdrawPassword = async () => {
    if (!user?.id) {
      setErrorMessage('Usuário não autenticado.')
      setShowErrorModal(true)
      return
    }

    if (!password || password.length < 6) {
      setErrorMessage('A senha de saque deve ter no mínimo 6 caracteres.')
      setShowErrorModal(true)
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage('As senhas não conferem.')
      setShowErrorModal(true)
      return
    }

    setLoading(true)
    setShowErrorModal(false)

    const token = localStorage.getItem('token') ?? sessionStorage.getItem('token') ?? ''
    try {
      const res = await fetch(`${API_URL}/api/user/withdraw-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ userId: user.id, password }),
      })

      const data = await res.json() as { ok?: boolean; error?: string; message?: string }

      if (!res.ok || !data?.ok) {
        setErrorMessage(data?.error ?? 'Não foi possível salvar a senha.')
        setShowErrorModal(true)
        return
      }

      setPassword('')
      setConfirmPassword('')
      setShowSuccessModal(true)
    } catch {
      setErrorMessage('Erro de conexão ao salvar senha.')
      setShowErrorModal(true)
    } finally {
      setLoading(false)
    }
  }

  const allFilled = password.length >= 6 && confirmPassword.length >= 6

  return (
    <main className="wp-page">
      {/* Header */}
      <header className="wp-header">
        <button type="button" className="wp-back-btn" onClick={() => navigate('/profile')} aria-label="Voltar">
          {ICON_BACK}
        </button>
        <div className="wp-header-text">
          <h1>Senha do Fundo</h1>
          <p>Configure a senha de saque</p>
        </div>
        <div className="wp-header-spacer" />
      </header>

      <div className="wp-content">
        {/* Hero card */}
        <div className={`wp-hero-card ${mounted ? 'wp-hero-card--visible' : ''}`}>
          <div className="wp-hero-glow" aria-hidden="true" />
          <div className="wp-hero-icon-wrap">
            <div className="wp-hero-icon">{ICON_WALLET}</div>
            <div className="wp-hero-icon-ring" aria-hidden="true" />
          </div>
          <h2 className="wp-hero-title">Senha de Saque</h2>
          <p className="wp-hero-text">Configure uma senha separada para proteger seus saques</p>
          <div className="wp-hero-shine" aria-hidden="true" />
        </div>

        {/* Form card */}
        <div className={`wp-form-card ${mounted ? 'wp-form-card--visible' : ''}`}
          style={{ transitionDelay: '100ms' }}>
          <div className="wp-form-header">
            <span className="wp-form-icon">{ICON_SHIELD}</span>
            <span className="wp-form-title">Nova senha de fundo</span>
          </div>

          <div className="wp-form-fields">
            {/* Nova senha */}
            <div className="wp-field">
              <label className="wp-label">Senha de saque</label>
              <div className="wp-input-wrap">
                <span className="wp-input-icon">{ICON_LOCK}</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="wp-input"
                  placeholder="Digite a nova senha (mín. 6)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="wp-toggle-visibility"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar' : 'Mostrar'}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Confirmar senha */}
            <div className="wp-field">
              <label className="wp-label">Confirmar senha</label>
              <div className="wp-input-wrap">
                <span className="wp-input-icon">{ICON_LOCK}</span>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  className="wp-input"
                  placeholder="Repita a senha de saque"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="wp-toggle-visibility"
                  onClick={() => setShowConfirm(!showConfirm)}
                  aria-label={showConfirm ? 'Ocultar' : 'Mostrar'}
                >
                  {showConfirm ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {confirmPassword && password && (
                <div className={`wp-match-indicator ${password === confirmPassword ? 'match' : 'no-match'}`}>
                  {password === confirmPassword ? (
                    <>
                      <span className="wp-match-icon">{ICON_CHECK}</span>
                      Senhas coincidem
                    </>
                  ) : (
                    <span className="wp-match-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Submit button */}
          <button
            type="button"
            className={`wp-submit-btn ${allFilled ? 'active' : ''}`}
            onClick={saveWithdrawPassword}
            disabled={loading}
          >
            {loading ? (
              <span className="wp-btn-loading">
                <span className="wp-spinner" />
                Salvando...
              </span>
            ) : (
              <span className="wp-btn-content">
                <span className="wp-btn-icon">{ICON_CHECK}</span>
                Salvar senha do fundo
              </span>
            )}
            {!loading && allFilled && <span className="wp-btn-glow" aria-hidden="true" />}
          </button>
        </div>

        {/* Info card */}
        <div className={`wp-info-card ${mounted ? 'wp-info-card--visible' : ''}`}
          style={{ transitionDelay: '200ms' }}>
          <div className="wp-info-row">
            <span className="wp-info-icon">{ICON_SHIELD}</span>
            <div>
              <p className="wp-info-title">Importante</p>
              <p className="wp-info-text">
                A senha de saque é diferente da senha da sua conta. Ela é usada exclusivamente para confirmar saques.
              </p>
            </div>
          </div>
        </div>

        {/* Decorative floating icons */}
        <div className="wp-float-deco" aria-hidden="true">
          <span className="wp-deco wp-deco-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </span>
          <span className="wp-deco wp-deco-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
              <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
              <path d="M18 12a2 2 0 0 0 0 4h4v-4z" />
            </svg>
          </span>
        </div>
      </div>

      {/* Success modal */}
      {showSuccessModal && (
        <div className="wp-modal-overlay" role="dialog" aria-modal="true" onClick={() => setShowSuccessModal(false)}>
          <div className="wp-modal wp-modal--success" onClick={(e) => e.stopPropagation()}>
            <div className="wp-modal-confetti" aria-hidden="true">
              {[1, 2, 3, 4, 5, 6, 7].map(i => (
                <span key={i} className={`wp-confetti-${i}`} style={{ animationDelay: `${(i - 1) * 0.07}s` }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke={i % 2 === 0 ? '#4caf50' : '#f59e0b'} strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                </span>
              ))}
            </div>
            <div className="wp-modal-icon-success">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div className="wp-modal-title">Salvo!</div>
            <p className="wp-modal-message">Senha do fundo configurada com sucesso.</p>
            <button type="button" className="wp-modal-btn success" onClick={() => setShowSuccessModal(false)}>
              Continuar
            </button>
          </div>
        </div>
      )}

      {/* Error modal */}
      {showErrorModal && (
        <div className="wp-modal-overlay" role="dialog" aria-modal="true" onClick={() => setShowErrorModal(false)}>
          <div className="wp-modal wp-modal--error" onClick={(e) => e.stopPropagation()}>
            <div className="wp-modal-icon-error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <div className="wp-modal-title-error">Ops!</div>
            <p className="wp-modal-message">{errorMessage}</p>
            <button type="button" className="wp-modal-btn error" onClick={() => setShowErrorModal(false)}>
              Tentar novamente
            </button>
          </div>
        </div>
      )}
    </main>
  )
}