import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppBottomNav from '../components/AppBottomNav'
import './RedeemCode.css'

type StoredUser = {
  id: number
  name: string
  phone: string
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

const formatBRL = (value: number) =>
  Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const ICON_GIFT = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 12v9H4v-9" />
    <rect x="2" y="7" width="20" height="5" rx="1.5" />
    <path d="M12 22V7" />
    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
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

const ICON_SPIN = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
)

const ICON_INFO = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4" />
    <path d="M12 8h.01" />
  </svg>
)

const ICON_CHECK = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const ICON_GIFT_OUTLINE = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

export default function RedeemCode() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [mounted, setMounted] = useState(false)
  const [shaking, setShaking] = useState(false)

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

  const handleRedeem = async () => {
    const normalized = code.trim().toUpperCase()
    if (!normalized) {
      setShaking(true)
      setTimeout(() => setShaking(false), 500)
      return
    }

    if (!user?.id) {
      setFeedback({ type: 'error', message: 'Usuário não autenticado.' })
      return
    }

    setLoading(true)
    const token = localStorage.getItem('token') ?? sessionStorage.getItem('token') ?? ''
    try {
      const res = await fetch(`${API_URL}/api/gift-codes/redeem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ userId: user.id, code: normalized }),
      })

      const data = await res.json().catch(() => ({})) as {
        ok?: boolean
        error?: string
        message?: string
        rewardType?: string
        rewardValue?: number
        balance?: number
      }

      if (!res.ok || !data?.ok) {
        setFeedback({ type: 'error', message: data?.error ?? 'Não foi possível resgatar o código.' })
        return
      }

      const reward = Number(data?.rewardValue ?? 0)
      const successMsg = data?.message
        ?? (reward > 0
          ? `Código resgatado! Você recebeu ${formatBRL(reward)}.`
          : 'Código resgatado com sucesso.')

      setFeedback({ type: 'success', message: successMsg })
      setCode('')
    } catch {
      setFeedback({ type: 'error', message: 'Erro de conexão ao resgatar código.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="rc-page">
      <header className="rc-header">
        <button
          type="button"
          className="rc-back-btn"
          onClick={() => navigate('/dashboard')}
          aria-label="Voltar"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 6l-6 6l6 6" />
          </svg>
        </button>
        <div className="rc-header-text">
          <h1>Resgatar Código</h1>
          <p>Insira seu código promocional</p>
        </div>
        <div className="rc-header-spacer" />
      </header>

      <div className="rc-content">
        {/* Hero card */}
        <div className={`rc-hero-card ${mounted ? 'rc-hero-card--visible' : ''}`}>
          <div className="rc-hero-glow" aria-hidden="true" />
          <div className="rc-hero-icon-wrap">
            <div className="rc-hero-icon">{ICON_GIFT}</div>
            <div className="rc-hero-icon-ring" aria-hidden="true" />
          </div>
          <h2 className="rc-hero-title">Gift Code</h2>
          <p className="rc-hero-text">
            Tem um código promocional? Insira abaixo para receber sua recompensa.
          </p>
          <div className="rc-hero-shine" aria-hidden="true" />
        </div>

        {/* Input card */}
        <div className={`rc-input-card ${mounted ? 'rc-input-card--visible' : ''}`}
          style={{ transitionDelay: '100ms' }}>
          <div className="rc-input-top">
            <span className="rc-input-label">Código</span>
            {code.length > 0 && (
              <span className="rc-char-count">
                <span className={`rc-char-dot ${code.trim() ? 'active' : ''}`} />
                {code.length}/32
              </span>
            )}
          </div>
          <div className={`rc-input-wrap ${shaking ? 'shake' : ''}`}>
            <span className="rc-input-icon" aria-hidden="true">{ICON_KEY}</span>
            <input
              type="text"
              className="rc-input"
              placeholder="Digite seu código aqui..."
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              autoComplete="off"
              maxLength={32}
              onKeyDown={(e) => e.key === 'Enter' && handleRedeem()}
            />
            {code && (
              <button
                type="button"
                className="rc-clear-btn"
                onClick={() => setCode('')}
                aria-label="Limpar"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Submit button */}
        <div className={`rc-btn-wrap ${mounted ? 'rc-btn-wrap--visible' : ''}`}
          style={{ transitionDelay: '200ms' }}>
          <button
            type="button"
            className={`rc-claim-btn ${code.trim() ? 'active' : ''}`}
            onClick={handleRedeem}
            disabled={loading}
          >
            {loading ? (
              <span className="rc-btn-loading">
                <span className="rc-spinner" />
                Resgatando...
              </span>
            ) : (
              <span className="rc-btn-content">
                <span className="rc-btn-icon">{ICON_SPIN}</span>
                Resgatar Código
              </span>
            )}
            {code.trim() && !loading && <span className="rc-btn-glow" aria-hidden="true" />}
          </button>
        </div>

        {/* Info card */}
        <div className={`rc-info-card ${mounted ? 'rc-info-card--visible' : ''}`}
          style={{ transitionDelay: '300ms' }}>
          <div className="rc-info-header">
            <span className="rc-info-icon">{ICON_INFO}</span>
            <h3 className="rc-info-title">Como funciona</h3>
          </div>
          <div className="rc-info-list">
            {[
              'Códigos são válidos por tempo limitado',
              'Cada código pode ser usado apenas uma vez',
              'Valor adicionado automaticamente ao saldo',
            ].map((text, i) => (
              <div key={i} className="rc-info-item">
                <div className="rc-info-bullet">
                  <div className="rc-info-check">{ICON_CHECK}</div>
                  <div className="rc-info-trail" aria-hidden="true" />
                </div>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Decorative floating icons */}
        <div className="rc-float-deco" aria-hidden="true">
          <span className="rc-deco rc-deco-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
          </span>
          <span className="rc-deco rc-deco-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
          </span>
          <span className="rc-deco rc-deco-3">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
          </span>
        </div>
      </div>

      {/* Modal */}
      {feedback ? (
        <div
          className="rc-modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => setFeedback(null)}
        >
          <div className={`rc-modal ${feedback.type === 'success' ? 'rc-modal--success' : 'rc-modal--error'}`} onClick={(e) => e.stopPropagation()}>
            {feedback.type === 'success' ? (
              <>
                <div className="rc-modal-confetti" aria-hidden="true">
                  {[
                    <svg key="c1" viewBox="0 0 24 24" fill="none" stroke="#4caf50" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>,
                    <svg key="c2" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>,
                    <svg key="c3" viewBox="0 0 24 24" fill="none" stroke="#4caf50" strokeWidth="2" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>,
                    <svg key="c4" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>,
                    <svg key="c5" viewBox="0 0 24 24" fill="none" stroke="#4caf50" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>,
                    <svg key="c6" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>,
                    <svg key="c7" viewBox="0 0 24 24" fill="none" stroke="#4caf50" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /></svg>,
                  ].map((icon, i) => (
                    <span key={i} className={`rc-confetti-${(i % 7) + 1}`} style={{ animationDelay: `${i * 0.07}s` }}>
                      {icon}
                    </span>
                  ))}
                </div>
                <div className="rc-modal-icon-success">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <div className="rc-modal-title">Parabéns!</div>
                <p className="rc-modal-message">{feedback.message}</p>
              </>
            ) : (
              <>
                <div className="rc-modal-icon-error">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                </div>
                <div className="rc-modal-title-error">Ops!</div>
                <p className="rc-modal-message">{feedback.message}</p>
              </>
            )}
            <button
              type="button"
              className={`rc-modal-btn ${feedback.type === 'success' ? 'success' : 'error'}`}
              onClick={() => setFeedback(null)}
            >
              {feedback.type === 'success' ? 'Maravilhoso!' : 'Tentar novamente'}
            </button>
          </div>
        </div>
      ) : null}

      <AppBottomNav />
    </main>
  )
}