import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppBottomNav from '../components/AppBottomNav'
import './Invite.css'

type StoredUser = {
  id?: number | string
  name?: string
  phone?: string
}

type CommissionLevel = {
  id: number
  level: number
  name: string
  commissionPercent: number
  isActive: boolean
}

type VipCommissionLevelStats = {
  level: number
  buyersCount: number
  totalCommission: number
  commissionPercent: number
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

const formatBRL = (value: number) =>
  Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const ICON_BACK = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 6l-6 6l6 6" />
  </svg>
)

const ICON_SHARE = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
)

const ICON_LINK = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
)

const ICON_COPY = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
)

const ICON_TEAM = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

const ICON_MONEY = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
)

const ICON_STAR = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
)

const ICON_USERS = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <line x1="19" y1="8" x2="19" y2="14" />
    <line x1="22" y1="11" x2="16" y2="11" />
  </svg>
)

const ICON_CROWN = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" />
    <path d="M4 18h16" />
  </svg>
)

const ICON_CHECK = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const ICON_AWARD = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="7" />
    <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
  </svg>
)

export default function Invite() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refCode, setRefCode] = useState('')
  const [referralLinkState, setReferralLinkState] = useState('')
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [commissionLevels, setCommissionLevels] = useState<CommissionLevel[]>([])
  const [vipStatsByLevel, setVipStatsByLevel] = useState<VipCommissionLevelStats[]>([])
  const [vipStatsTotal, setVipStatsTotal] = useState(0)
  const [mounted, setMounted] = useState(false)

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

  useEffect(() => {
    const loadReferral = async () => {
      try {
        const apiBase = String(API_URL ?? '').trim().replace(/\/+$/, '') || 'http://localhost:3333'
        const parsedUserId = Number(user?.id ?? 0)

        if (!Number.isFinite(parsedUserId) || parsedUserId <= 0) {
          setError('Usuário não autenticado.')
        } else {
          try {
            const referralResponse = await fetch(`${apiBase}/api/referral/${parsedUserId}`)
            if (referralResponse.ok) {
              const referralData = await referralResponse.json()
              if (referralData?.ok) {
                setRefCode(String(referralData.referralCode ?? ''))
                setReferralLinkState(String(referralData.referralLink ?? ''))
                setError('')
              }
            } else {
              setError('Não foi possível carregar seu link de convite.')
            }
          } catch {
            setError('Erro de conexão ao carregar convite.')
          }
        }

        try {
          const response = await fetch(`${apiBase}/api/referral/commission-levels`)
          if (response.ok) {
            const commissionData = await response.json()
            if (commissionData?.ok && Array.isArray(commissionData.levels)) {
              const mappedLevels = commissionData.levels
                .map((item: any) => ({
                  id: Number(item?.id ?? 0),
                  level: Number(item?.level ?? 0),
                  name: String(item?.name ?? ''),
                  commissionPercent: Number(item?.commissionPercent ?? item?.commission_percent ?? 0),
                  isActive:
                    item?.isActive !== undefined
                      ? Number(item.isActive) === 1 || item.isActive === true
                      : item?.is_active !== undefined
                        ? Number(item.is_active) === 1 || item.is_active === true
                        : true,
                }))
                .filter((item: CommissionLevel) => item.level > 0 && item.isActive)
                .sort((a: CommissionLevel, b: CommissionLevel) => a.level - b.level)
              setCommissionLevels(mappedLevels)
            }
          }
        } catch {
          // silencioso
        }

        if (Number.isFinite(parsedUserId) && parsedUserId > 0) {
          try {
            const vipStatsRes = await fetch(`${apiBase}/api/referral/vip-commissions/${parsedUserId}`)
            if (vipStatsRes.ok) {
              const vipStatsData = await vipStatsRes.json()
              if (vipStatsData?.ok && Array.isArray(vipStatsData.levels)) {
                setVipStatsByLevel(
                  vipStatsData.levels.map((item: any) => ({
                    level: Number(item?.level ?? 0),
                    buyersCount: Number(item?.buyersCount ?? 0),
                    totalCommission: Number(item?.totalCommission ?? 0),
                    commissionPercent: Number(item?.commissionPercent ?? 0),
                  }))
                )
                setVipStatsTotal(Number(vipStatsData.grandTotal ?? 0))
              }
            }
          } catch {
            // silencioso
          }
        }
      } catch {
        setError('Erro de conexão ao carregar convite.')
      } finally {
        setLoading(false)
      }
    }

    loadReferral()
  }, [user])

  const referralLink = useMemo(() => {
    if (referralLinkState) return referralLinkState
    const origin = window.location.origin
    if (!refCode) return ''
    return `${origin}/cadastro?ref=${encodeURIComponent(refCode)}`
  }, [refCode, referralLinkState])

  const copyCode = async () => {
    if (!refCode) return
    try {
      await navigator.clipboard.writeText(refCode)
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    } catch { /* */ }
  }

  const copyLink = async () => {
    if (!referralLink) return
    try {
      await navigator.clipboard.writeText(referralLink)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    } catch { /* */ }
  }

  const totalBuyers = vipStatsByLevel.reduce((sum, lv) => sum + Number(lv.buyersCount ?? 0), 0)

  return (
    <main className="inv-page">
      {/* Header */}
      <header className="inv-header">
        <button type="button" className="inv-back-btn" onClick={() => navigate('/profile')} aria-label="Voltar">
          {ICON_BACK}
        </button>
        <div className="inv-header-text">
          <h1>Convidar Amigos</h1>
          <p>Gere renda compartilhando</p>
        </div>
        <div className="inv-header-spacer" />
      </header>

      <div className="inv-content">
        {loading ? (
          <div className="inv-loading-card">
            <div className="inv-spinner" />
            <p>Carregando...</p>
          </div>
        ) : error ? (
          <div className="inv-error-card">
            <p>{error}</p>
          </div>
        ) : (
          <>
            {/* Hero card */}
            <div className={`inv-hero-card ${mounted ? 'inv-hero-card--visible' : ''}`}>
              <div className="inv-hero-glow" aria-hidden="true" />
              <div className="inv-hero-icon-wrap">
                <div className="inv-hero-icon">{ICON_SHARE}</div>
                <div className="inv-hero-icon-ring" aria-hidden="true" />
              </div>
              <h2 className="inv-hero-title">Indique e Ganhe</h2>
              <p className="inv-hero-text">
                Convide amigos para a plataforma. Cada depósito que eles fizerem gera comissões para você!
              </p>
              <div className="inv-hero-shine" aria-hidden="true" />
            </div>

            {/* Share card */}
            <div className={`inv-share-card ${mounted ? 'inv-share-card--visible' : ''}`}
              style={{ transitionDelay: '100ms' }}>
              <div className="inv-share-header">
                <span className="inv-share-icon">{ICON_LINK}</span>
                <span className="inv-share-title">Seu link de convite</span>
              </div>

              <div className="inv-code-display">
                <span className="inv-code-label">Código</span>
                <span className="inv-code-value">{refCode || '-'}</span>
              </div>

              <div className="inv-link-display">
                <span className="inv-link-text">{referralLink || '-'}</span>
              </div>

              <div className="inv-share-buttons">
                <button
                  type="button"
                  className={`inv-share-btn ${copiedCode ? 'copied' : ''}`}
                  onClick={copyCode}
                >
                  <span className="inv-share-btn-icon">{copiedCode ? ICON_CHECK : ICON_COPY}</span>
                  {copiedCode ? 'Código copiado!' : 'Copiar código'}
                </button>
                <button
                  type="button"
                  className={`inv-share-btn inv-share-btn--secondary ${copiedLink ? 'copied' : ''}`}
                  onClick={copyLink}
                >
                  <span className="inv-share-btn-icon">{copiedLink ? ICON_CHECK : ICON_LINK}</span>
                  {copiedLink ? 'Link copiado!' : 'Copiar link'}
                </button>
              </div>
            </div>

            {/* Stats cards */}
            <div className={`inv-stats-grid ${mounted ? 'inv-stats-grid--visible' : ''}`}
              style={{ transitionDelay: '200ms' }}>
              <div className="inv-stat-card">
                <div className="inv-stat-icon">{ICON_MONEY}</div>
                <div className="inv-stat-info">
                  <span className="inv-stat-label">Comissão VIP total</span>
                  <span className="inv-stat-value inv-stat-value--green">{formatBRL(vipStatsTotal)}</span>
                </div>
              </div>
              <div className="inv-stat-card">
                <div className="inv-stat-icon">{ICON_USERS}</div>
                <div className="inv-stat-info">
                  <span className="inv-stat-label">Indicados que compraram</span>
                  <span className="inv-stat-value">{totalBuyers}</span>
                </div>
              </div>
            </div>

            {/* Team button */}
            <button
              type="button"
              className={`inv-team-btn ${mounted ? 'inv-team-btn--visible' : ''}`}
              style={{ transitionDelay: '250ms' }}
              onClick={() => navigate('/position')}
            >
              <span className="inv-team-btn-icon">{ICON_TEAM}</span>
              Ver depositantes da rede
            </button>

            {/* Commission levels */}
            <div className={`inv-levels-section ${mounted ? 'inv-levels-section--visible' : ''}`}
              style={{ transitionDelay: '300ms' }}>
              <div className="inv-levels-header">
                <span className="inv-levels-title">Níveis de Comissão</span>
              </div>

              {commissionLevels.length === 0 ? (
                <div className="inv-empty-card">
                  <div className="inv-empty-icon">{ICON_AWARD}</div>
                  <p className="inv-empty-text">Carregando níveis de comissão...</p>
                </div>
              ) : (
                commissionLevels.map((lvl) => {
                  const stats = vipStatsByLevel.find((s) => s.level === lvl.level)
                  const buyersCount = Number(stats?.buyersCount ?? 0)
                  const totalCommission = Number(stats?.totalCommission ?? 0)
                  return (
                    <div key={lvl.id} className="inv-level-card">
                      <div className="inv-level-header">
                        <div className="inv-level-badge">
                          <span className="inv-level-badge-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                              <path d="M12 2l3 7h7l-5.5 4.5 2 7L12 16l-6.5 4.5 2-7L2 9h7z" />
                            </svg>
                          </span>
                          Nível {lvl.level}
                        </div>
                        <span className="inv-level-percent">{Number(lvl.commissionPercent).toFixed(0)}%</span>
                      </div>
                      <div className="inv-level-stats-row">
                        <div className="inv-level-stat">
                          <span className="inv-level-stat-icon">{ICON_USERS}</span>
                          <div>
                            <span className="inv-level-stat-label">Compraram VIP</span>
                            <span className="inv-level-stat-value">{buyersCount}</span>
                          </div>
                        </div>
                        <div className="inv-level-stat">
                          <span className="inv-level-stat-icon inv-level-stat-icon--green">{ICON_MONEY}</span>
                          <div>
                            <span className="inv-level-stat-label">Comissão recebida</span>
                            <span className="inv-level-stat-value inv-level-stat-value--green">{formatBRL(totalCommission)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* How it works info card */}
            <div className={`inv-info-card ${mounted ? 'inv-info-card--visible' : ''}`}
              style={{ transitionDelay: '400ms' }}>
              <div className="inv-info-row">
                <span className="inv-info-icon">{ICON_CROWN}</span>
                <div>
                  <p className="inv-info-title">Como funciona</p>
                  <p className="inv-info-text">
                    Compartilhe seu link. Quando alguém se cadastrar pelo seu link e comprar um plano VIP, você recebe uma comissão automática baseada no nível do indicado.
                  </p>
                </div>
              </div>
            </div>

            {/* Decorative floating icons */}
            <div className="inv-float-deco" aria-hidden="true">
              <span className="inv-deco inv-deco-1">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
              </span>
              <span className="inv-deco inv-deco-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </span>
            </div>
          </>
        )}
      </div>

      <AppBottomNav />
    </main>
  )
}