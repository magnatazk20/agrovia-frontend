import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Checkin.css'

type StoredUser = {
  id: number
  name: string
  phone: string
}

type CheckinStatusResponse = {
  ok?: boolean
  canClaim?: boolean
  currentDay?: number
  claimedToday?: boolean
  rewards?: number[]
  history?: Array<{
    day?: number
    rewardAmount?: number
    checkinDate?: string
  }>
  error?: string
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

const formatBRL = (value: number) =>
  Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function Checkin() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(false)
  const [canClaim, setCanClaim] = useState(false)
  const [currentDay, setCurrentDay] = useState(1)
  const [rewards, setRewards] = useState<number[]>([2, 2, 3, 3, 4, 4, 5, 5, 6, 10])
  const [historyDays, setHistoryDays] = useState<number[]>([])
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const progressPercent = Math.min(100, Math.max(0, (historyDays.length / 10) * 100))

  const user = useMemo(() => {
    const raw = localStorage.getItem('user') ?? sessionStorage.getItem('user')
    if (!raw) return null
    try {
      return JSON.parse(raw) as StoredUser
    } catch {
      return null
    }
  }, [])

  const loadStatus = async () => {
    if (!user?.id) return

    try {
      const res = await fetch(`${API_URL}/api/checkin/status/${user.id}`)
      const data = (await res.json()) as CheckinStatusResponse

      if (!res.ok || !data?.ok) {
        setFeedback({ type: 'error', message: data?.error ?? 'Erro ao carregar check-in.' })
        return
      }

      setCanClaim(Boolean(data.canClaim))
      setCurrentDay(Math.min(Math.max(Number(data.currentDay ?? 1), 1), 10))
      if (Array.isArray(data.rewards) && data.rewards.length === 10) {
        setRewards(data.rewards.map((v) => Number(v ?? 0)))
      }

      const days = Array.isArray(data.history)
        ? data.history.map((item) => Number(item.day ?? 0)).filter((d) => d >= 1 && d <= 10)
        : []
      setHistoryDays(days)
    } catch {
      setFeedback({ type: 'error', message: 'Falha de conexão ao carregar check-in.' })
    }
  }

  useEffect(() => {
    if (!user?.id) {
      navigate('/')
      return
    }

    const run = async () => {
      setLoading(true)
      await loadStatus()
      setLoading(false)
    }

    run()
  }, [navigate, user?.id])

  const handleClaim = async () => {
    if (!user?.id || claiming || !canClaim) return

    setClaiming(true)
    const token = localStorage.getItem('token') ?? sessionStorage.getItem('token') ?? ''
    try {
      const res = await fetch(`${API_URL}/api/checkin/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ userId: user.id }),
      })

      const data = await res.json().catch(() => ({})) as {
        ok?: boolean
        error?: string
        message?: string
        claim?: { day?: number; rewardAmount?: number }
      }

      if (!res.ok || !data?.ok) {
        setFeedback({ type: 'error', message: data?.error ?? 'Não foi possível resgatar o check-in.' })
        return
      }

      const reward = Number(data?.claim?.rewardAmount ?? 0)
      setFeedback({
        type: 'success',
        message: data?.message ?? `Check-in resgatado! Você recebeu ${formatBRL(reward)}.`,
      })

      await loadStatus()
    } catch {
      setFeedback({ type: 'error', message: 'Erro de conexão ao resgatar check-in.' })
    } finally {
      setClaiming(false)
    }
  }

  return (
    <main className="ck-page">
      <header className="ck-header">
        <button
          type="button"
          className="ck-back-btn"
          onClick={() => navigate('/dashboard')}
          aria-label="Voltar"
        >
          ←
        </button>
        <div className="ck-header-text">
          <h1>Check-in Diário</h1>
          <p>Resgate sua recompensa todos os dias</p>
        </div>
        <div className="ck-header-spacer" />
      </header>

      <div className="ck-content">
        {loading ? (
          <div className="ck-loading">
            <div className="ck-spinner" />
            <p>Carregando...</p>
          </div>
        ) : (
          <>
            {/* Main card */}
            <div className="ck-main-card">
              <div className="ck-main-icon">📅</div>
              <div className="ck-main-day-badge">Dia {currentDay} de 10</div>

              <div className="ck-days-dots">
                {Array.from({ length: 10 }).map((_, i) => {
                  const day = i + 1
                  const isDone = historyDays.includes(day)
                  const isCurrent = currentDay === day && !isDone
                  return (
                    <div
                      key={day}
                      className={`ck-dot ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}`}
                    />
                  )
                })}
              </div>

              <div className="ck-main-reward">
                <div className="ck-main-reward-label">Recompensa de hoje</div>
                <div className="ck-main-reward-value">{formatBRL(Number(rewards[currentDay - 1] ?? 0))}</div>
              </div>

              <div className="ck-status-badge">
                {canClaim ? (
                  <span className="ck-status-badge--ok">✨ Prêmio disponível</span>
                ) : (
                  <span className="ck-status-badge--done">✓ Já resgatado hoje</span>
                )}
              </div>

              <button
                type="button"
                className={`ck-claim-btn ${canClaim ? 'active' : ''}`}
                onClick={handleClaim}
                disabled={!canClaim || claiming}
              >
                {claiming ? (
                  <span>Resgatando...</span>
                ) : canClaim ? (
                  <span>Resgatar Recompensa</span>
                ) : (
                  <span>Retorne amanhã ✓</span>
                )}
              </button>
            </div>

            {/* Days grid */}
            <div className="ck-grid-title">Recompensas dos 10 dias</div>
            <div className="ck-grid">
              {Array.from({ length: 10 }).map((_, index) => {
                const day = index + 1
                const isDone = historyDays.includes(day)
                const isCurrent = currentDay === day && !isDone
                return (
                  <article
                    key={day}
                    className={`ck-day ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}`}
                  >
                    <div className="ck-day-num">Dia {day}</div>
                    <div className="ck-day-value">{formatBRL(Number(rewards[index] ?? 0))}</div>
                    <div className="ck-day-status-icon">
                      {isDone ? (
                        <span className="icon-done">✓</span>
                      ) : isCurrent ? (
                        <span className="icon-today">●</span>
                      ) : (
                        <span className="icon-lock">○</span>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          </>
        )}
      </div>

      {feedback ? (
        <div
          className="ck-modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => setFeedback(null)}
        >
          <div className="ck-modal" onClick={(e) => e.stopPropagation()}>
            {feedback.type === 'success' ? (
              <>
                <div className="ck-modal-confetti" aria-hidden="true">
                  <span className="confetti-piece" style={{ '--i': 0 } as any}>🎉</span>
                  <span className="confetti-piece" style={{ '--i': 1 } as any}>✨</span>
                  <span className="confetti-piece" style={{ '--i': 2 } as any}>🌟</span>
                  <span className="confetti-piece" style={{ '--i': 3 } as any}>💰</span>
                  <span className="confetti-piece" style={{ '--i': 4 } as any}>🎊</span>
                </div>
                <div className="ck-modal-icon-success">✅</div>
                <h2 className="ck-modal-title">Parabéns!</h2>
                <p className="ck-modal-message">{feedback.message}</p>
              </>
            ) : (
              <>
                <div className="ck-modal-icon-error">❌</div>
                <p className="ck-modal-message">{feedback.message}</p>
              </>
            )}
            <button
              type="button"
              className={`ck-modal-button ${feedback.type === 'success' ? 'success' : 'error'}`}
              onClick={() => setFeedback(null)}
            >
              {feedback.type === 'success' ? 'Continuar' : 'Tentar novamente'}
            </button>
          </div>
        </div>
      ) : null}
    </main>
  )
}