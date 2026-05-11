import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppSidebar from '../components/AppSidebar'
import './Profile.css'
import AppBottomNav from '../components/AppBottomNav'

type StoredUser = {
  id: number
  name: string
  phone: string
}

type SummaryResponse = {
  balance?: number
  totalDeposits?: number
  totalSpent?: number
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

type MetricsResponse = {
  ok?: boolean
  metrics?: {
    withdrawableBalance?: number
    totalWithdrawals?: number
    todayIncome?: number
    totalCommissionEarned?: number
  }
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

const formatBRL = (value: number) =>
  Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function Statement() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [balance, setBalance] = useState(0)
  const [totalDeposited, setTotalDeposited] = useState(0)
  const [totalWithdrawn, setTotalWithdrawn] = useState(0)
  const [totalEarned, setTotalEarned] = useState(0)
  const [totalCommission, setTotalCommission] = useState(0)
  const [vipLevel, setVipLevel] = useState('')
  const [vipExpires, setVipExpires] = useState('')

  const user = (() => {
    const raw = localStorage.getItem('user') ?? sessionStorage.getItem('user')
    if (!raw) return null
    try {
      return JSON.parse(raw) as StoredUser
    } catch {
      return null
    }
  })()

  useEffect(() => {
    if (!user?.id) {
      navigate('/')
      return
    }

    const load = async () => {
      const token = localStorage.getItem('token') ?? sessionStorage.getItem('token') ?? ''
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}

      try {
        const [summaryRes, vipRes, metricsRes] = await Promise.all([
          fetch(`${API_URL}/api/user/summary/${user.id}`, { headers }),
          fetch(`${API_URL}/api/vip/user/${user.id}`, { headers }),
          fetch(`${API_URL}/api/profile/metrics/${user.id}`, { headers }),
        ])

        if (summaryRes.ok) {
          const data = (await summaryRes.json()) as SummaryResponse
          setBalance(Number(data.balance ?? 0))
          setTotalDeposited(Number(data.totalDeposits ?? 0))
        }

        if (vipRes.ok) {
          const data = (await vipRes.json()) as VipResponse
          if (data?.ok && data?.hasVip && data.vip) {
            setVipLevel(String(data.vip.levelName ?? ''))
            if (data.vip.expiresAt) {
              const d = new Date(data.vip.expiresAt)
              setVipExpires(d.toLocaleDateString('pt-BR'))
            }
          } else {
            setVipLevel('Nenhum')
          }
        }

        if (metricsRes.ok) {
          const data = (await metricsRes.json()) as MetricsResponse
          const m = data?.metrics
          if (m) {
            setTotalWithdrawn(Number(m.totalWithdrawals ?? 0))
            setTotalCommission(Number(m.withdrawableBalance ?? 0))
            const earned = Number(m.todayIncome ?? 0)
            setTotalEarned(earned)
          }
        }
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [navigate, user?.id])

  return (
    <main className="dash-app profile-page">
      <section className="dash-main">
        <AppSidebar />
        <div className="dash-content">
          {loading ? (
            <div className="profile-loading">Carregando...</div>
          ) : (
            <>
              <div className="profile-banner-top">
                <img src="/trk-banner.png" alt="TRK Banner" className="profile-banner-img" />
              </div>

              <section className="profile-header-modern">
                <button type="button" onClick={() => navigate('/profile')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                  <span style={{ fontSize: 14 }}>Voltar</span>
                </button>
              </section>

              <h2 style={{ textAlign: 'center', margin: '16px 0 8px', fontSize: 20 }}>Meu Extrato</h2>

              <section className="profile-stats-grid">
                <div className="profile-stat-card">
                  <p className="profile-stat-value">{formatBRL(totalDeposited)}</p>
                  <p className="profile-stat-label">Saldo de recarga</p>
                </div>
                <div className="profile-stat-card">
                  <p className="profile-stat-value">{formatBRL(totalWithdrawn)}</p>
                  <p className="profile-stat-label">Total gasto</p>
                </div>
                <div className="profile-stat-card">
                  <p className="profile-stat-value">{formatBRL(balance)}</p>
                  <p className="profile-stat-label">Saldo atual</p>
                </div>
                <div className="profile-stat-card">
                  <p className="profile-stat-value">{formatBRL(totalCommission)}</p>
                  <p className="profile-stat-label">Saldo de comissão</p>
                </div>
                <div className="profile-stat-card">
                  <p className="profile-stat-value">{formatBRL(totalDeposited)}</p>
                  <p className="profile-stat-label">Saldo de recarga</p>
                </div>
                <div className="profile-stat-card">
                  <p className="profile-stat-value">{formatBRL(totalEarned)}</p>
                  <p className="profile-stat-label">Total faturado</p>
                </div>
                <div className="profile-stat-card">
                  <p className="profile-stat-value">{vipLevel || 'Nenhum'}</p>
                  <p className="profile-stat-label">VIP atual</p>
                </div>
                {vipExpires && (
                  <div className="profile-stat-card profile-stat-card-full">
                    <p className="profile-stat-value">{vipExpires}</p>
                    <p className="profile-stat-label">VIP expira em</p>
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </section>
      <AppBottomNav />
</main>
  )
}