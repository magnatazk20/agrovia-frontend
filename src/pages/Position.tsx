import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppBottomNav from '../components/AppBottomNav'
import './Position.css'

type StoredUser = {
  id: number
  name: string
  phone: string
}

type Depositor = {
  id: number
  name: string
  phone: string
  level: number
  createdAt?: string
  totalDeposits: number
  hasDeposit: boolean
  vipLevelName?: string | null
  vipPrice?: number | null
  vipStartedAt?: string | null
  vipExpiresAt?: string | null
}

type LevelSummary = {
  level: number
  totalMembers: number
  depositedMembers: number
  totalDeposited: number
  totalCommission: number
}

type DepositorsResponse = {
  ok?: boolean
  level: number
  total: number
  members?: Depositor[]
}

type SummaryResponse = {
  ok?: boolean
  levels?: LevelSummary[]
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

const formatBRL = (value: number) =>
  Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const ICON_BACK = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 6l-6 6l6 6" />
  </svg>
)

const ICON_PERSON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

const ICON_DEPOSIT = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
)

const ICON_NETWORK = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="5" r="3" />
    <circle cx="5" cy="19" r="3" />
    <circle cx="19" cy="19" r="3" />
    <line x1="12" y1="8" x2="5" y2="16" />
    <line x1="12" y1="8" x2="19" y2="16" />
  </svg>
)

const ICON_CHECK = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const ICON_STAR = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
)

const ICON_TROPHY = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 22V8a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v14" />
    <path d="M6 9v4a6 6 0 0 0 6 6 6 6 0 0 0 6-6V9" />
  </svg>
)

export default function Position() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [fetching, setFetching] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [activeLevel, setActiveLevel] = useState<1 | 2 | 3>(1)
  const [summary, setSummary] = useState<LevelSummary[]>([])
  const [depositors, setDepositors] = useState<Depositor[]>([])

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

  const loadSummary = async () => {
    if (!user?.id) return
    try {
      const res = await fetch(`${API_URL}/api/team/report/${user.id}`)
      const data = (await res.json()) as SummaryResponse
      if (!res.ok || !data?.ok) return
      setSummary(Array.isArray(data.levels) ? data.levels : [])
    } catch {
      // silent
    }
  }

  const loadDepositors = async (level: 1 | 2 | 3) => {
    if (!user?.id) return
    setFetching(true)
    try {
      const res = await fetch(`${API_URL}/api/team/members/${user.id}?level=${level}`)
      const data = (await res.json()) as DepositorsResponse
      if (!res.ok || !data?.ok) return
      setDepositors(Array.isArray(data.members) ? data.members : [])
    } catch {
      // silent
    } finally {
      setFetching(false)
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user?.id) {
      navigate('/')
      return
    }
    loadSummary()
    loadDepositors(1)
  }, [navigate, user?.id])

  const handleLevelChange = (level: 1 | 2 | 3) => {
    setActiveLevel(level)
    setLoading(true)
    loadDepositors(level)
  }

  const currentSummary = summary.find(s => s.level === activeLevel)
  const levelTotalMembers = currentSummary?.totalMembers ?? 0
  const levelDeposited = currentSummary?.depositedMembers ?? 0

  return (
    <main className="pos-page">
      {/* Header */}
      <header className="pos-header">
        <button type="button" className="pos-back-btn" onClick={() => navigate('/profile')} aria-label="Voltar">
          {ICON_BACK}
        </button>
        <div className="pos-header-text">
          <h1>Depositantes da Rede</h1>
          <p>Veja quem depositou na sua rede</p>
        </div>
        <div className="pos-header-spacer" />
      </header>

      <div className="pos-content">
        {/* Hero card */}
        <div className={`pos-hero-card ${mounted ? 'pos-hero-card--visible' : ''}`}>
          <div className="pos-hero-glow" aria-hidden="true" />
          <div className="pos-hero-icon-wrap">
            <div className="pos-hero-icon">{ICON_NETWORK}</div>
            <div className="pos-hero-icon-ring" aria-hidden="true" />
          </div>
          <h2 className="pos-hero-title">Minha Rede</h2>
          <p className="pos-hero-text">Visualize os depositantes organizados por nível da sua rede</p>
          <div className="pos-hero-shine" aria-hidden="true" />
        </div>

        {/* Summary cards */}
        <div className={`pos-summary-grid ${mounted ? 'pos-summary-grid--visible' : ''}`}
          style={{ transitionDelay: '100ms' }}>
          {[1, 2, 3].map((lv) => {
            const s = summary.find(x => x.level === lv)
            return (
              <button
                key={lv}
                type="button"
                className={`pos-summary-card ${activeLevel === lv ? 'active' : ''}`}
                onClick={() => handleLevelChange(lv as 1 | 2 | 3)}
              >
                <div className="pos-summary-card-level">
                  <span className="pos-summary-level-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M12 2l3 7h7l-5.5 4.5 2 7L12 16l-6.5 4.5 2-7L2 9h7z" />
                    </svg>
                  </span>
                  Nível {lv}
                </div>
                <div className="pos-summary-card-stats">
                  <div className="pos-summary-stat">
                    <span className="pos-stat-label">Total</span>
                    <span className="pos-stat-value">{s?.totalMembers ?? 0}</span>
                  </div>
                  <div className="pos-summary-stat">
                    <span className="pos-stat-label">Depositantes</span>
                    <span className="pos-stat-value pos-stat-green">{s?.depositedMembers ?? 0}</span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Level detail card */}
        <div className={`pos-level-card ${mounted ? 'pos-level-card--visible' : ''}`}
          style={{ transitionDelay: '200ms' }}>
          <div className="pos-level-card-header">
            <div className="pos-level-header-left">
              <span className="pos-level-badge">Nível {activeLevel}</span>
            </div>
            <div className="pos-level-header-right">
              <span className="pos-level-depositors">{levelDeposited} depositantes</span>
            </div>
          </div>

          <div className="pos-level-stats-row">
            <div className="pos-level-stat-item">
              <span className="pos-level-stat-icon">{ICON_PERSON}</span>
              <div>
                <span className="pos-level-stat-label">Total membros</span>
                <span className="pos-level-stat-value">{levelTotalMembers}</span>
              </div>
            </div>
            <div className="pos-level-stat-item">
              <span className="pos-level-stat-icon pos-level-stat-icon--green">{ICON_DEPOSIT}</span>
              <div>
                <span className="pos-level-stat-label">Volume depositado</span>
                <span className="pos-level-stat-value pos-level-stat-value--green">
                  {formatBRL(currentSummary?.totalDeposited ?? 0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Depositors list */}
        <div className={`pos-depositors-section ${mounted ? 'pos-depositors-section--visible' : ''}`}
          style={{ transitionDelay: '300ms' }}>
          <div className="pos-depositors-header">
            <span className="pos-depositors-title">Depositantes - Nível {activeLevel}</span>
            <span className="pos-depositors-count">{depositors.length} membros</span>
          </div>

          {loading || fetching ? (
            <div className="pos-loading">
              <div className="pos-spinner" />
              <p>Carregando depositantes...</p>
            </div>
          ) : depositors.length === 0 ? (
            <div className="pos-empty-card">
              <div className="pos-empty-icon">{ICON_PERSON}</div>
              <p className="pos-empty-title">Nenhum depositante</p>
              <p className="pos-empty-text">Nenhum usuário deste nível realizou depósitos ainda.</p>
            </div>
          ) : (
            <div className="pos-depositors-list">
              {depositors.map((member) => (
                <div key={member.id} className="pos-depositor-card">
                  <div className="pos-depositor-left">
                    <div className="pos-depositor-avatar">
                      <span className="pos-depositor-avatar-icon">{ICON_PERSON}</span>
                    </div>
                    <div className="pos-depositor-info">
                      <h4 className="pos-depositor-name">{member.name}</h4>
                      <p className="pos-depositor-phone">{member.phone}</p>
                      {member.createdAt && (
                        <p className="pos-depositor-date">
                          Desde {new Date(member.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="pos-depositor-right">
                    {member.vipLevelName ? (
                      <div className="pos-depositor-vip">
                        <span className="pos-depositor-vip-badge">
                          <span className="pos-vip-icon">{ICON_STAR}</span>
                          {member.vipLevelName}
                        </span>
                        <span className="pos-depositor-deposit-amount">
                          {formatBRL(member.vipPrice ?? 0)}
                        </span>
                      </div>
                    ) : (
                      <div className="pos-depositor-no-vip">
                        <span className="pos-depositor-no-vip-badge">
                          <span className="pos-no-vip-icon">{ICON_CHECK}</span>
                          Cadastrado
                        </span>
                      </div>
                    )}
                    <div className="pos-depositor-total">
                      <span className="pos-depositor-total-label">Total depositado</span>
                      <span className="pos-depositor-total-value">
                        {formatBRL(member.totalDeposits)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info card */}
        <div className={`pos-info-card ${mounted ? 'pos-info-card--visible' : ''}`}
          style={{ transitionDelay: '400ms' }}>
          <div className="pos-info-row">
            <span className="pos-info-icon">{ICON_TROPHY}</span>
            <div>
              <p className="pos-info-title">Como funciona</p>
              <p className="pos-info-text">
                Cada nível representa a profundidade da sua rede. Seus indicações diretos são Nível 1, os indicados deles são Nível 2, e assim por diante.
              </p>
            </div>
          </div>
        </div>

        {/* Decorative floating icons */}
        <div className="pos-float-deco" aria-hidden="true">
          <span className="pos-deco pos-deco-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="12" cy="5" r="3" /><circle cx="5" cy="19" r="3" /><circle cx="19" cy="19" r="3" />
              <line x1="12" y1="8" x2="5" y2="16" /><line x1="12" y1="8" x2="19" y2="16" />
            </svg>
          </span>
          <span className="pos-deco pos-deco-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </span>
        </div>
      </div>

      <AppBottomNav />
    </main>
  )
}