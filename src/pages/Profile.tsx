import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppBottomNav from '../components/AppBottomNav'
import './Dashboard.css'
import './Profile.css'

type StoredUser = {
  id: number
  name: string
  phone: string
}

type VipResponse = {
  ok?: boolean
  hasVip?: boolean
  vip?: {
    levelName?: string
    vipPrice?: number
    expiresAt?: string | null
    avatarUrl?: string
  } | null
  balance?: number
}

type SummaryResponse = {
  balance?: number
  totalDeposits?: number
  monthlySalaryContract?: string | null
}

type ProfileMetricsResponse = {
  ok?: boolean
  metrics?: {
    teamTotal?: number
    withdrawableBalance?: number
    todayIncome?: number
    totalWithdrawals?: number
    hasActiveCyclePlan?: boolean
    activeCyclePlan?: {
      id?: number
      productName?: string
      amountPaid?: number
      expectedProfit?: number
      cycleDays?: number
      startedAt?: string | null
      endsAt?: string | null
    } | null
  }
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

const formatBRL = (value: number) =>
  Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const formatVipExpiry = (raw: string | null): { label: string; status: 'active' | 'expired' | 'none' } => {
  if (!raw) return { label: 'Sem VIP ativo', status: 'none' }
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return { label: 'Sem VIP ativo', status: 'none' }
  const now = new Date()
  const expired = date.getTime() < now.getTime()
  const formatted = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  if (expired) return { label: `Expirou em ${formatted}`, status: 'expired' }
  const diffMs = date.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  const suffix = diffDays === 1 ? '1 dia restante' : `${diffDays} dias restantes`
  return { label: `${formatted} • ${suffix}`, status: 'active' }
}

type MenuItem = {
  label: string
  path: string
  icon: 'clipboard' | 'calendar' | 'team' | 'chart' | 'graph' | 'wallet' | 'download' | 'invite' | 'checkin' | 'fund' | 'lock' | 'logout'
  danger?: boolean
}

const MENU_ITEMS: MenuItem[] = [
  { label: 'Registro do dia', path: '/registro-do-dia', icon: 'calendar' },
  { label: 'Equipe', path: '/position', icon: 'team' },
  { label: 'Centros de Crédito', path: '/bank-cards', icon: 'wallet' },
    { label: 'Resgatar Código', path: '/redeem-code', icon: 'download' },
  { label: 'Convidar', path: '/invite', icon: 'invite' },
  { label: 'Check-in', path: '/checkin', icon: 'checkin' },
  { label: 'Senha do Fundo', path: '/withdraw-password', icon: 'fund' },
  { label: 'Alterar Senha', path: '/change-password', icon: 'lock' },
]

const ICONS: Record<MenuItem['icon'], JSX.Element> = {
  clipboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21H7a2 2 0 0 1-2-2v-14a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" />
      <path d="M9 13h6M9 17h6" />
    </svg>
  ),
  calendar: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18" /><path d="M8 3v4M16 3v4" />
      <path d="M8 14h3M8 17h6" />
    </svg>
  ),
  team: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="9" cy="8" r="3" /><circle cx="16.5" cy="9" r="2.5" />
      <path d="M4 19a5 5 0 0 1 10 0M14 19a4.5 4.5 0 0 1 6 0" />
    </svg>
  ),
  chart: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 19h16" /><path d="M7 16V9" /><path d="M12 16V6" /><path d="M17 16v-4" />
    </svg>
  ),
  graph: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 17l4-8l5 6l3-4l4 6" /><path d="M3 20h18" />
    </svg>
  ),
  wallet: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="3" y="5" width="18" height="14" rx="3" /><path d="M3 10h18" /><path d="M7 15h.01M11 15h2" />
    </svg>
  ),
  download: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4v12M7 11l5 5 5-5M4 20h16" />
    </svg>
  ),
  invite: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M19 8v6M22 11h-6" />
    </svg>
  ),
  checkin: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="3" y="8" width="18" height="4" rx="1" /><path d="M12 8v13M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
      <path d="M7.5 8a2.5 2.5 0 0 1 0-5A5 5 0 0 1 12 8a5 5 0 0 1 4.5-5a2.5 2.5 0 0 1 0 5" />
    </svg>
  ),
  fund: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 3a11 11 0 0 0 8 3.5c0 6-2.8 11.2-8 14.5c-5.2-3.3-8-8.5-8-14.5A11 11 0 0 0 12 3z" />
    </svg>
  ),
  lock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20h4l10-10a2.1 2.1 0 1 0-3-3L5 17v3z" /><path d="M13.5 6.5l3 3" />
    </svg>
  ),
  logout: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 4h-7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7" /><path d="M10 12h10M17 8l4 4l-4 4" />
    </svg>
  ),
}

export default function Profile() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [balance, setBalance] = useState(0)
  const [totalDeposits, setTotalDeposits] = useState(0)
  const [withdrawableBalance, setWithdrawableBalance] = useState(0)
  const [todayIncome, setTodayIncome] = useState(0)
  const [teamTotal, setTeamTotal] = useState(0)
  const [totalWithdrawals, setTotalWithdrawals] = useState(0)
  const [userBadge, setUserBadge] = useState('Agrovia A')
  const [vipLevelName, setVipLevelName] = useState('')
  const [activeCyclePlanName, setActiveCyclePlanName] = useState('')
  const [vipExpiresAt, setVipExpiresAt] = useState<string | null>(null)
  const [vipImageUrl, setVipImageUrl] = useState('')
  const [copyFeedback, setCopyFeedback] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [giftCodeInput, setGiftCodeInput] = useState('')
  const [redeemLoading, setRedeemLoading] = useState(false)
  const [redeemFeedback, setRedeemFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [showRedeemSuccessModal, setShowRedeemSuccessModal] = useState(false)
  const [redeemSuccessData, setRedeemSuccessData] = useState<{ message: string; rewardValue: number; code: string } | null>(null)

  const normalizedBadge = useMemo(() => userBadge.toLowerCase(), [userBadge])

  const badgeTheme = useMemo(() => {
    if (normalizedBadge.includes('diam')) return 'diamond'
    if (normalizedBadge.includes('ouro') || normalizedBadge.includes('gold')) return 'gold'
    if (normalizedBadge.includes('prata') || normalizedBadge.includes('silver')) return 'silver'
    if (normalizedBadge.includes('bronze')) return 'bronze'
    if (normalizedBadge.includes('vip')) return 'vip'
    return 'regular'
  }, [normalizedBadge])

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
    if (!user?.id) {
      navigate('/')
      return
    }

    const loadProfile = async () => {
      setLoading(true)
      const token = localStorage.getItem('token') ?? sessionStorage.getItem('token') ?? ''
      const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}
      try {
        const [summaryRes, vipRes, metricsRes, referralRes] = await Promise.all([
          fetch(`${API_URL}/api/user/summary/${user.id}`, { headers: authHeaders }),
          fetch(`${API_URL}/api/vip/user/${user.id}`, { headers: authHeaders }),
          fetch(`${API_URL}/api/profile/metrics/${user.id}`, { headers: authHeaders }),
          fetch(`${API_URL}/api/referral/${user.id}`),
        ])

        if (summaryRes.ok) {
          const d = (await summaryRes.json()) as SummaryResponse
          setBalance(Number(d.balance ?? 0))
          setTotalDeposits(Number(d.totalDeposits ?? 0))
        }

        if (vipRes.ok) {
          const d = (await vipRes.json()) as VipResponse
          if (d?.ok && d?.hasVip && d.vip) {
            setVipLevelName(String(d.vip.levelName ?? '').trim())
            setUserBadge(d.vip.levelName || 'Agrovia A')
            setVipExpiresAt(d.vip.expiresAt ?? null)
            setVipImageUrl(String(d.vip.avatarUrl ?? ''))
          } else {
            setUserBadge('Agrovia A')
            setVipExpiresAt(null)
          }
        }

        if (metricsRes.ok) {
          const d = (await metricsRes.json()) as ProfileMetricsResponse
          const m = d?.metrics
          if (m) {
            setWithdrawableBalance(Number(m.withdrawableBalance ?? 0))
            setTodayIncome(Number(m.todayIncome ?? 0))
            setTeamTotal(Number(m.teamTotal ?? 0))
            setTotalWithdrawals(Number(m.totalWithdrawals ?? 0))
            if (m.activeCyclePlan?.productName) {
              setActiveCyclePlanName(String(m.activeCyclePlan.productName ?? ''))
            }
          }
        }

        if (referralRes.ok) {
          const d = await referralRes.json()
          if (d?.ok) setInviteCode(String(d.referralCode ?? ''))
        }
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [navigate, user?.id])

  const copyInviteCode = async () => {
    if (!inviteCode) { setCopyFeedback('Sem código'); setTimeout(() => setCopyFeedback(''), 1500); return }
    try {
      await navigator.clipboard.writeText(inviteCode)
      setCopyFeedback('Copiado!')
      setTimeout(() => setCopyFeedback(''), 1500)
    } catch {
      setCopyFeedback('Erro ao copiar')
      setTimeout(() => setCopyFeedback(''), 1500)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
    navigate('/')
  }

  const redeemGiftCode = async () => {
    if (!user?.id) { setRedeemFeedback({ type: 'error', message: 'Usuário não autenticado.' }); return }
    const code = giftCodeInput.trim().toUpperCase()
    if (!code) { setRedeemFeedback({ type: 'error', message: 'Informe um código válido.' }); return }
    setRedeemLoading(true)
    setRedeemFeedback(null)
    try {
      const token = localStorage.getItem('token') ?? sessionStorage.getItem('token')
      const res = await fetch(`${API_URL}/api/gift-codes/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ userId: user.id, code }),
      })
      const data = await res.json() as { ok?: boolean; error?: string; message?: string; balance?: number; rewardValue?: number }
      if (!res.ok || !data?.ok) {
        setRedeemFeedback({ type: 'error', message: data?.error || 'Erro ao resgatar.' })
        setTimeout(() => setRedeemFeedback(null), 2500)
        return
      }
      if (typeof data.balance === 'number') setBalance(Number(data.balance))
      setGiftCodeInput('')
      setRedeemSuccessData({ message: data?.message || 'Código resgatado!', rewardValue: typeof data.rewardValue === 'number' ? Number(data.rewardValue) : 0, code })
      setShowRedeemSuccessModal(true)
    } catch {
      setRedeemFeedback({ type: 'error', message: 'Erro de conexão.' })
      setTimeout(() => setRedeemFeedback(null), 2500)
    } finally {
      setRedeemLoading(false)
    }
  }

  return (
    <main className="pf-page">
      <header className="pf-header">
        <button type="button" className="pf-back-btn" onClick={() => navigate('/dashboard')}>←</button>
        <div className="pf-header-text">
          <h1>Meu Perfil</h1>
        </div>
        <button type="button" className="pf-logout-btn" onClick={handleLogout} aria-label="Sair">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 4h-7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7" /><path d="M10 12h10M17 8l4 4l-4 4" />
          </svg>
        </button>
      </header>

      <div className="pf-content">
        {loading ? (
          <div className="pf-loading">
            <div className="pf-spinner" />
            <p>Carregando...</p>
          </div>
        ) : (
          <>
            {/* Avatar card */}
            <div className="pf-avatar-card">
              <div className="pf-avatar-ring">
                <img
                  className="pf-avatar-img"
                  src={
                    vipImageUrl
                      ? (vipImageUrl.startsWith('http') ? vipImageUrl : `${API_URL}${vipImageUrl}`)
                      : `https://api.dicebear.com/7.x/personas/svg?seed=${user?.id ?? 'default'}-${user?.phone ?? user?.name ?? 'user'}`
                  }
                  alt="Avatar"
                />
              </div>
              <div className="pf-user-info">
                <h2 className="pf-user-name">{user?.phone ?? user?.name ?? 'Usuário'}</h2>
                <span className={`pf-badge pf-badge--${badgeTheme}`}>
                  {activeCyclePlanName || userBadge || 'Agrovia A'}
                </span>
              </div>
            </div>

            {/* Wallet balances */}
            <div className="pf-wallet-grid">
              <div className="pf-wallet-item">
                <span className="pf-wallet-label">Saldo</span>
                <span className="pf-wallet-value">{formatBRL(balance)}</span>
              </div>
              <div className="pf-wallet-item">
                <span className="pf-wallet-label">Comissão</span>
                <span className="pf-wallet-value">{formatBRL(withdrawableBalance)}</span>
              </div>
                          </div>

            {/* Withdraw button */}
            <button type="button" className="pf-withdraw-btn" onClick={() => navigate('/saque')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                <path d="M18 12a2 2 0 0 0 0 4h4v-4z" />
              </svg>
              Sacar
            </button>

            {/* Stats */}
            <div className="pf-stats-row">
              <div className="pf-stat">
                <span className="pf-stat-value">{formatBRL(todayIncome)}</span>
                <span className="pf-stat-label">Receita hoje</span>
              </div>
              <div className="pf-stat-divider" />
              <div className="pf-stat">
                <span className="pf-stat-value">{formatBRL(totalWithdrawals)}</span>
                <span className="pf-stat-label">Saques</span>
              </div>
              <div className="pf-stat-divider" />
              <div className="pf-stat">
                <span className="pf-stat-value">{teamTotal}</span>
                <span className="pf-stat-label">Equipe</span>
              </div>
              <div className="pf-stat-divider" />
              <div className="pf-stat">
                <span className="pf-stat-value">{formatBRL(totalDeposits)}</span>
                <span className="pf-stat-label">Depósitos</span>
              </div>
            </div>

            {/* Invite code */}
            <div className="pf-invite-card">
              <div className="pf-invite-info">
                <span className="pf-invite-label">Código de convite</span>
                <div className="pf-invite-code-row">
                  <span className="pf-invite-code">{inviteCode || '—'}</span>
                  {inviteCode && (
                    <button type="button" className="pf-copy-btn" onClick={copyInviteCode}>
                      {copyFeedback || (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M7 7m0 2.667a2.667 2.667 0 0 1 2.667 -2.667h8.666a2.667 2.667 0 0 1 2.667 2.667v8.666a2.667 2.667 0 0 1 -2.667 2.667h-8.666a2.667 2.667 0 0 1 -2.667 -2.667z" />
                          <path d="M4.012 16.737a2.005 2.005 0 0 1 -1.012 -1.737v-10c0 -1.1 .9 -2 2 -2h10c.75 0 1.158 .385 1.5 1" />
                        </svg>
                      )}
                    </button>
                  )}
                </div>
              </div>
              <button type="button" className="pf-invite-share-btn" onClick={() => navigate('/invite')}>
                Convidar
              </button>
            </div>

            {/* Menu grid */}
            <div className="pf-menu-grid">
              {MENU_ITEMS.map((item) => (
                <button
                  key={item.path}
                  type="button"
                  className="pf-menu-item"
                  onClick={() => navigate(item.path)}
                >
                  <div className="pf-menu-icon">{ICONS[item.icon]}</div>
                  <span className="pf-menu-label">{item.label}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {redeemFeedback ? (
        <div className={`pf-toast ${redeemFeedback.type === 'success' ? 'success' : 'error'}`} role="status">
          {redeemFeedback.message}
        </div>
      ) : null}

      {showRedeemSuccessModal && redeemSuccessData ? (
        <div className="pf-modal-overlay" role="dialog" aria-modal="true" onClick={() => setShowRedeemSuccessModal(false)}>
          <div className="pf-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pf-modal-confetti" aria-hidden="true">
              {Array.from({ length: 20 }).map((_, i) => (
                <span key={i} className={`pf-confetti-${(i % 5) + 1}`}>{['🎉', '✨', '🌟', '💰', '🎊'][i % 5]}</span>
              ))}
            </div>
            <div className="pf-modal-icon">✅</div>
            <h2 className="pf-modal-title">Parabéns!</h2>
            <p className="pf-modal-message">{redeemSuccessData.message}</p>
            <div className="pf-modal-reward">
              <span>Valor resgatado</span>
              <strong>{formatBRL(redeemSuccessData.rewardValue)}</strong>
            </div>
            <button type="button" className="pf-modal-btn" onClick={() => setShowRedeemSuccessModal(false)}>
              Continuar
            </button>
          </div>
        </div>
      ) : null}

      <AppBottomNav />
    </main>
  )
}