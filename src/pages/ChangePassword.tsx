import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './ChangePassword.css'

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

const ICON_KEY = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="7.5" cy="15.5" r="5.5" />
    <path d="M11.5 11.5L22 1" />
    <path d="M22 1l-4.5 4.5" />
    <path d="M22 1l-2 2" />
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

export default function ChangePassword() {
  const navigate = useNavigate()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [mounted, setMounted] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
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

  const saveNewPassword = async () => {
    if (!user?.id) {
      setErrorMessage('Usuário não autenticado.')
      setShowErrorModal(true)
      return
    }

    if (!currentPassword) {
      setErrorMessage('Informe sua senha atual.')
      setShowErrorModal(true)
      return
    }

    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('A nova senha deve ter no mínimo 6 caracteres.')
      setShowErrorModal(true)
      return
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('As senhas não conferem.')
      setShowErrorModal(true)
      return
    }

    setLoading(true)

    const token = localStorage.getItem('token') ?? sessionStorage.getItem('token') ?? ''
    try {
      const res = await fetch(`${API_URL}/api/user/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          userId: user.id,
          currentPassword,
          newPassword,
        }),
      })

      const data = await res.json() as { ok?: boolean; error?: string; message?: string }

      if (!res.ok || !data?.ok) {
        setErrorMessage(data?.error ?? 'Não foi possível alterar a senha.')
        setShowErrorModal(true)
        return
      }

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setShowSuccessModal(true)
    } catch {
      setErrorMessage('Erro de conexão ao alterar senha.')
      setShowErrorModal(true)
    } finally {
      setLoading(false)
    }
  }

  const allFilled = currentPassword.length >= 6 && newPassword.length >= 6 && confirmPassword.length >= 6

  return (
    <main className="cp-page">
      {/* Header */}
      <header className="cp-header">
        <button type="button" className="cp-back-btn" onClick={() => navigate('/profile')} aria-label="Voltar">
          {ICON_BACK}
        </button>
        <div className="cp-header-text">
          <h1>Alterar Senha</h1>
          <p>Mantenha sua conta segura</p>
        </div>
        <div className="cp-header-spacer" />
      </header>

      <div className="cp-content">
        {/* Hero card */}
        <div className={`cp-hero-card ${mounted ? 'cp-hero-card--visible' : ''}`}>
          <div className="cp-hero-glow" aria-hidden="true" />
          <div className="cp-hero-icon-wrap">
            <div className="cp-hero-icon">{ICON_LOCK}</div>
            <div className="cp-hero-icon-ring" aria-hidden="true" />
          </div>
          <h2 className="cp-hero-title">Segurança</h2>
          <p className="cp-hero-text">Altere sua senha para manter sua conta protegida</p>
          <div className="cp-hero-shine" aria-hidden="true" />
        </div>

        {/* Form card */}
        <div className={`cp-form-card ${mounted ? 'cp-form-card--visible' : ''}`}
          style={{ transitionDelay: '100ms' }}>
          <div className="cp-form-header">
            <span className="cp-form-icon">{ICON_SHIELD}</span>
            <span className="cp-form-title">Dados da senha</span>
          </div>

          <div className="cp-form-fields">
            {/* Senha atual */}
            <div className="cp-field">
              <label className="cp-label">Senha atual</label>
              <div className="cp-input-wrap">
                <span className="cp-input-icon">{ICON_KEY}</span>
                <input
                  type={showCurrent ? 'text' : 'password'}
                  className="cp-input"
                  placeholder="Digite sua senha atual"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="cp-toggle-visibility"
                  onClick={() => setShowCurrent(!showCurrent)}
                  aria-label={showCurrent ? 'Ocultar' : 'Mostrar'}
                >
                  {showCurrent ? (
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

            {/* Nova senha */}
            <div className="cp-field">
              <label className="cp-label">Nova senha <span className="cp-hint-label">(mín. 6 caracteres)</span></label>
              <div className="cp-input-wrap">
                <span className="cp-input-icon">{ICON_LOCK}</span>
                <input
                  type={showNew ? 'text' : 'password'}
                  className="cp-input"
                  placeholder="Digite a nova senha"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="cp-toggle-visibility"
                  onClick={() => setShowNew(!showNew)}
                  aria-label={showNew ? 'Ocultar' : 'Mostrar'}
                >
                  {showNew ? (
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
            <div className="cp-field">
              <label className="cp-label">Confirmar nova senha</label>
              <div className="cp-input-wrap">
                <span className="cp-input-icon">{ICON_LOCK}</span>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  className="cp-input"
                  placeholder="Repita a nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="cp-toggle-visibility"
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
              {confirmPassword && newPassword && (
                <div className={`cp-match-indicator ${newPassword === confirmPassword ? 'match' : 'no-match'}`}>
                  {newPassword === confirmPassword ? (
                    <>
                      <span className="cp-match-icon">{ICON_CHECK}</span>
                      Senhas coincidem
                    </>
                  ) : (
                    <span className="cp-match-icon">
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
            className={`cp-submit-btn ${allFilled ? 'active' : ''}`}
            onClick={saveNewPassword}
            disabled={loading}
          >
            {loading ? (
              <span className="cp-btn-loading">
                <span className="cp-spinner" />
                Salvando...
              </span>
            ) : (
              <span className="cp-btn-content">
                <span className="cp-btn-icon">{ICON_CHECK}</span>
                Salvar nova senha
              </span>
            )}
            {!loading && allFilled && <span className="cp-btn-glow" aria-hidden="true" />}
          </button>
        </div>

        {/* Security tips card */}
        <div className={`cp-info-card ${mounted ? 'cp-info-card--visible' : ''}`}
          style={{ transitionDelay: '200ms' }}>
          <div className="cp-info-row">
            <span className="cp-info-icon">{ICON_SHIELD}</span>
            <div>
              <p className="cp-info-title">Dicas de segurança</p>
              <p className="cp-info-text">
                Use uma senha forte com letras, números e símbolos. Não reuse senhas de outras contas.
              </p>
            </div>
          </div>
        </div>

        {/* Decorative floating icons */}
        <div className="cp-float-deco" aria-hidden="true">
          <span className="cp-deco cp-deco-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </span>
          <span className="cp-deco cp-deco-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="7.5" cy="15.5" r="5.5" />
              <path d="M11.5 11.5L22 1" />
            </svg>
          </span>
        </div>
      </div>

      {/* Success modal */}
      {showSuccessModal && (
        <div className="cp-modal-overlay" role="dialog" aria-modal="true" onClick={() => setShowSuccessModal(false)}>
          <div className="cp-modal cp-modal--success" onClick={(e) => e.stopPropagation()}>
            <div className="cp-modal-confetti" aria-hidden="true">
              {[1, 2, 3, 4, 5, 6, 7].map(i => (
                <span key={i} className={`cp-confetti-${i}`} style={{ animationDelay: `${(i - 1) * 0.07}s` }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke={i % 2 === 0 ? '#4caf50' : '#f59e0b'} strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                </span>
              ))}
            </div>
            <div className="cp-modal-icon-success">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div className="cp-modal-title">Senha alterada!</div>
            <p className="cp-modal-message">Sua senha foi atualizada com sucesso.</p>
            <button type="button" className="cp-modal-btn success" onClick={() => setShowSuccessModal(false)}>
              Continuar
            </button>
          </div>
        </div>
      )}

      {/* Error modal */}
      {showErrorModal && (
        <div className="cp-modal-overlay" role="dialog" aria-modal="true" onClick={() => setShowErrorModal(false)}>
          <div className="cp-modal cp-modal--error" onClick={(e) => e.stopPropagation()}>
            <div className="cp-modal-icon-error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <div className="cp-modal-title-error">Ops!</div>
            <p className="cp-modal-message">{errorMessage}</p>
            <button type="button" className="cp-modal-btn error" onClick={() => setShowErrorModal(false)}>
              Tentar novamente
            </button>
          </div>
        </div>
      )}
    </main>
  )
}