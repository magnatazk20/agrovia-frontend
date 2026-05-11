import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppBottomNav from '../components/AppBottomNav'
import './Dashboard.css'

interface User {
  id: number
  name: string
  phone: string
}

type CycleProduct = {
  id: number
  name: string
  description: string
  amount: number
  profit: number
  profitPercent: number
  cycleDays: number
  imageUrl: string
  isActive: boolean
  sortOrder: number
  stockQuantity?: number
}

type CommissionLevel = {
  id: number
  level: number
  name: string
  commissionPercent: number
  isActive: boolean
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

const formatBRL = (value: number) =>
  Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const BANNER_SLIDES = [
  'https://images.tridge.com/fit-in/filters:no_upscale()/200x200/company-logo/f1/a9/84/f1a9849a490c670cc5476c7647380b8fbbc4f02d/agrovia_logo.jpg',
  'https://scontent-lga3-2.xx.fbcdn.net/v/t39.30808-6/236337905_154313306749463_7290663697296708353_n.jpg?_nc_cat=101&ccb=1-7&_nc_sid=2a1932&_nc_ohc=EfxIMDX9VJoQ7kNvwGBAFPs&_nc_oc=AdpgIFIfZjSGsTSdpkxNs6_cn_UDv-_RI0XHt6VY1poUIEAq5wVCSccX3kRf1NLXvts&_nc_zt=23&_nc_ht=scontent-lga3-2.xx&_nc_gid=FuUk3dfMH9VRU0estQ1VNQ&_nc_ss=7b2a8&oh=00_Af49fqyuW3RxLK6fD2-RJ2-1-0SSYsxayquZaCopYB-JGw&oe=6A0763C0',
  'https://media.licdn.com/dms/image/v2/C4D1BAQGFqkIBWUwjSw/company-background_10000/company-background_10000/0/1583216418184?e=1779091200&v=beta&t=GSvAvQ2j8OyMmpLHE8fYTUsai6BOfk1qy9XQyK3YigQ',
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRMxDMNa1n9sxzzXumnxOdXiFu-47xtnOps7g&s',
]

export default function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [balance, setBalance] = useState(0)
  const [commissionBalance, setCommissionBalance] = useState(0)
  const [cyclePlans, setCyclePlans] = useState<CycleProduct[]>([])
  const [initialStock, setInitialStock] = useState<Record<number, number>>({})
  const [selectedPlan, setSelectedPlan] = useState<CycleProduct | null>(null)
  const [isBuying, setIsBuying] = useState(false)
  const [purchaseError, setPurchaseError] = useState<string | null>(null)
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null)
  const [showWelcomeModal, setShowWelcomeModal] = useState(true)
  const [commissionLevels, setCommissionLevels] = useState<CommissionLevel[]>([])
  const [bannerIndex, setBannerIndex] = useState(0)
  const bannerTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token') ?? sessionStorage.getItem('token')
    const raw = localStorage.getItem('user') ?? sessionStorage.getItem('user')

    if (!token || !raw) {
      navigate('/')
      return
    }

    try {
      setUser(JSON.parse(raw) as User)
    } catch {
      navigate('/')
    }
  }, [navigate])

  useEffect(() => {
    if (!user?.id) return

    const loadSummary = async () => {
      try {
        const response = await fetch(`${API_URL}/api/user/summary/${user.id}`)
        if (!response.ok) return
        const data = (await response.json()) as { balance?: number; commissionBalance?: number }
        setBalance(Number(data.balance ?? 0))
        setCommissionBalance(Number(data.commissionBalance ?? 0))
      } catch {
        // silencioso
      }
    }

    const loadCyclePlans = async () => {
      try {
        const response = await fetch(`${API_URL}/api/dashboard/cycle-products`)
        if (!response.ok) return
        const data = (await response.json()) as { ok?: boolean; products?: CycleProduct[] }
        if (!data?.ok || !Array.isArray(data.products)) return
        setCyclePlans(data.products)
        const stockMap: Record<number, number> = {}
        data.products.forEach((p) => { stockMap[p.id] = Number(p.stockQuantity ?? 0) })
        setInitialStock(stockMap)
      } catch {
        // silencioso
      }
    }

    const loadCommissionLevels = async () => {
      try {
        const response = await fetch(`${API_URL}/api/referral/commission-levels`)
        if (!response.ok) return
        const data = (await response.json()) as { ok?: boolean; levels?: CommissionLevel[] }
        if (!data?.ok || !Array.isArray(data.levels)) return
        setCommissionLevels(data.levels)
      } catch {
        // silencioso
      }
    }

    loadSummary()
    loadCyclePlans()
    loadCommissionLevels()
  }, [user?.id])

  // Banner auto-slide
  useEffect(() => {
    bannerTimerRef.current = setInterval(() => {
      setBannerIndex((prev) => (prev + 1) % BANNER_SLIDES.length)
    }, 4200)
    return () => {
      if (bannerTimerRef.current) clearInterval(bannerTimerRef.current)
    }
  }, [])

  const handleBuyCycle = (plan: CycleProduct) => {
    setPurchaseError(null)
    setPurchaseSuccess(null)
    setSelectedPlan(plan)
  }

  const closePurchaseModal = () => {
    if (isBuying) return
    setSelectedPlan(null)
  }

  const formatDateTime = (date: Date) =>
    date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  const confirmBuyCycle = async () => {
    if (!user?.id || !selectedPlan || isBuying) return

    const token = localStorage.getItem('token') ?? sessionStorage.getItem('token')

    setIsBuying(true)
    try {
      const response = await fetch(`${API_URL}/api/cycle-products/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          userId: user.id,
          cycleProductId: selectedPlan.id,
          investAmount: selectedPlan.amount,
        }),
      })

      const data = (await response.json()) as {
        ok?: boolean
        error?: string
        message?: string
        balanceAfter?: number
        required?: number
        available?: number
      }

      if (!response.ok || !data?.ok) {
        let errorMsg = data?.error ?? 'Não foi possível adquirir este ciclo.'
        if (data?.required !== undefined && data?.available !== undefined) {
          errorMsg += ` Necessário: ${formatBRL(data.required)}, disponível: ${formatBRL(data.available)}.`
        }
        setPurchaseError(errorMsg)
        return
      }

      setBalance(Number(data.balanceAfter ?? balance))
      setCyclePlans((prev) =>
        prev.map((p) =>
          p.id === selectedPlan.id
            ? { ...p, stockQuantity: Math.max(0, Number(p.stockQuantity ?? 0) - 1) }
            : p
        )
      )
      setPurchaseSuccess(data?.message ?? 'Ciclo adquirido com sucesso.')
    } catch {
      setPurchaseError('Erro de conexão ao adquirir ciclo.')
    } finally {
      setIsBuying(false)
    }
  }

  const tickerText = commissionLevels.length > 0
    ? `Bem-vindo à Agrovia • ${commissionLevels.map((l) => `${l.name}: ${Number(l.commissionPercent).toFixed(1)}%`).join(' • ')} • Convide amigos e ganhe comissão!`
    : 'Bem-vindo à Agrovia • Tecnologia avançada e eficiência para impulsionar sua produção • Resultados consistentes todos os dias'

  if (!user) return null

  return (
    <main className="av-page">

      {/* ── Banner slider ── */}
      <div className="av-banner-wrap">
        <div className="av-banner-stage">
          {BANNER_SLIDES.map((src, i) => (
            <img
              key={src}
              src={src}
              alt={`Banner ${i + 1}`}
              className={`av-banner-image${i === bannerIndex ? ' is-active' : ''}`}
            />
          ))}
        </div>

        {/* Announce ticker */}
        <div className="av-announce-ticker">
          <span className="av-announce-icon" aria-hidden="true">📢</span>
          <div className="av-announce-track">
            <span className="av-announce-text">{tickerText}</span>
          </div>
        </div>
      </div>

      {/* ── Action menu ── */}
      <div className="av-action-menu">
        {/* Roleta — large card spanning 2 rows */}
        <a className="av-action-card av-action-main av-action-roleta" href="/roleta" onClick={(e) => { e.preventDefault(); navigate('/roleta') }}>
          <span className="av-action-icon">
            <img src="/roletaa.png" alt="Roleta" className="av-roulette-img" />
          </span>
          <span className="av-action-label">Roleta</span>
        </a>

        {/* Código Bônus */}
        <a className="av-action-card av-action-bonus" href="/redeem-code" onClick={(e) => { e.preventDefault(); navigate('/redeem-code') }}>
          <span className="av-action-icon">
            <svg viewBox="0 0 24 24" fill="none">
              <rect x="2" y="7" width="20" height="14" rx="3" fill="rgba(255,255,255,0.22)"/>
              <path d="M7 7V5a5 5 0 0 1 10 0v2" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="12" cy="14" r="2" fill="#fff"/>
            </svg>
          </span>
          <span className="av-action-label">Código Bônus</span>
        </a>

        {/* Check-in */}
        <a className="av-action-card av-action-checkin" href="/checkin" onClick={(e) => { e.preventDefault(); navigate('/checkin') }}>
          <span className="av-action-icon">
            <svg viewBox="0 0 24 24" fill="none">
              <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="4.4" fill="#4fd190"/>
              <path d="M8 12.4l2.8 2.8 5.2-5.2" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
          <span className="av-action-label">Check-in</span>
        </a>
      </div>

      {/* ── Brand links ── */}
      <div className="av-brand-links">
        <a className="av-brand-link" href="/cashin" onClick={(e) => { e.preventDefault(); navigate('/cashin') }}>
          <span className="av-brand-link-icon">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M5 20h14v-2H5v2zm6-18v11.17L7.41 9.59 6 11l6 6 6-6-1.41-1.41L13 13.17V2h-2z" fill="currentColor"/>
            </svg>
          </span>
          <span>Depositar</span>
        </a>
        <a className="av-brand-link" href="/about" onClick={(e) => { e.preventDefault(); navigate('/about') }}>
          <span className="av-brand-link-icon">
            <svg viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="8.2" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 10.7v5.2M12 7.7h.01" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
            </svg>
          </span>
          <span>Sobre a Agrovia</span>
        </a>
      </div>

      {/* ── Wallet row ── */}
      <div className="av-wallet-row">
        <div className="av-wallet-card">
          <div className="av-wallet-title">
            <svg className="av-wallet-icon" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="6" width="20" height="14" rx="3" stroke="currentColor" strokeWidth="1.8"/>
              <path d="M16 13a1 1 0 1 1 2 0 1 1 0 0 1-2 0z" fill="currentColor"/>
              <path d="M2 10h20" stroke="currentColor" strokeWidth="1.8"/>
            </svg>
            Saldo Normal
          </div>
          <div className="av-wallet-value">{formatBRL(balance)}</div>
        </div>
        <div className="av-wallet-card">
          <div className="av-wallet-title">
            <svg className="av-wallet-icon" viewBox="0 0 24 24" fill="none">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="16 7 22 7 22 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Saldo Comissão
          </div>
          <div className="av-wallet-value">{formatBRL(commissionBalance)}</div>
        </div>
      </div>

      {/* ── Product catalog ── */}
      <section className="av-catalog-head">
        <div className="av-catalog-copy">
          <div className="av-catalog-kicker">Catálogo Agrovia</div>
          <h2 className="av-catalog-title">Planos para ativar sua produção</h2>
        </div>
        <div className="av-catalog-note">{cyclePlans.length} planos</div>
      </section>

      <div className="av-products-grid">
        {cyclePlans.length === 0 ? (
          <div className="av-products-empty">
            <p>Nenhum plano disponível no momento.</p>
          </div>
        ) : (
          cyclePlans.map((plan, idx) => {
            const estoque = Math.max(0, Number(plan.stockQuantity ?? 0))
            const dailyProfit = plan.profitPercent > 0
              ? plan.amount * (plan.profitPercent / 100)
              : plan.cycleDays > 0 ? plan.profit / plan.cycleDays : 0
            const totalProfit = plan.profitPercent > 0
              ? dailyProfit * plan.cycleDays
              : plan.profit

            return (
              <article key={plan.id} className="av-product-card">
                <div className="av-product-layout">

                  {/* Image */}
                  <div className="av-product-media">
                    <img
                      src={plan.imageUrl}
                      alt={plan.name}
                      className="av-product-image"
                      loading={idx < 2 ? 'eager' : 'lazy'}
                      onError={(e) => {
                        const t = e.currentTarget
                        t.onerror = null
                        t.src = '/trk-banner.png'
                      }}
                    />
                  </div>

                  {/* Details */}
                  <div className="av-product-details">
                    <div className="av-product-header">
                      <div>
                        <div className="av-product-name">{plan.name}</div>
                        <div className="av-product-cycle">Validade: {plan.cycleDays} dias</div>
                      </div>
                      <div className="av-product-price">
                        <span className="av-product-price-label">Ativação</span>
                        <strong className="av-product-price-value">{formatBRL(plan.amount)}</strong>
                      </div>
                    </div>

                    <div className="av-product-stats">
                      <div className="av-stat-item av-stat-daily">
                        <div className="av-stat-label">Renda diária</div>
                        <div className="av-stat-value">{formatBRL(dailyProfit)}</div>
                      </div>
                      <div className="av-stat-item">
                        <div className="av-stat-label">Renda total</div>
                        <div className="av-stat-value">{formatBRL(totalProfit)}</div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="av-purchase-btn"
                    disabled={estoque <= 0 || isBuying}
                    onClick={() => handleBuyCycle(plan)}
                  >
                    <span>{estoque <= 0 ? 'Esgotado' : 'Ativar lote'}</span>
                    {estoque > 0 && <span className="av-purchase-btn-price">{formatBRL(plan.amount)}</span>}
                  </button>
                </div>
              </article>
            )
          })
        )}
      </div>

      {/* ── Purchase confirmation modal ── */}
      {selectedPlan && (
        <div className="av-modal-backdrop" onClick={closePurchaseModal}>
          <div className="av-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="av-modal-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M3.5 5.5h2.4L8 14.3a1.9 1.9 0 0 0 1.9 1.5h7.5a1.9 1.9 0 0 0 1.8-1.4L21 8H7.1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="10.2" cy="19" r="1.6" fill="#fff"/>
                <circle cx="16.9" cy="19" r="1.6" fill="#fff"/>
              </svg>
            </div>
            <h3 className="av-modal-title">Confirmar compra</h3>
            <p className="av-modal-subtitle">Confira os dados do plano antes de concluir.</p>

            <div className="av-modal-summary">
              <div className="av-modal-row">
                <span>Plano</span>
                <strong>{selectedPlan.name}</strong>
              </div>
              <div className="av-modal-row">
                <span>Valor</span>
                <strong className="av-modal-price">{formatBRL(selectedPlan.amount)}</strong>
              </div>
              <div className="av-modal-row">
                <span>Validade</span>
                <strong>{selectedPlan.cycleDays} dias</strong>
              </div>
              <div className="av-modal-row">
                <span>Início</span>
                <strong>{formatDateTime(new Date())}</strong>
              </div>
              <div className="av-modal-row">
                <span>Renda total</span>
                <strong>{formatBRL(selectedPlan.profit)}</strong>
              </div>
            </div>

            {purchaseError && (
              <div className="av-modal-feedback av-modal-feedback--error">
                <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                {purchaseError}
              </div>
            )}

            {purchaseSuccess && (
              <div className="av-modal-feedback av-modal-feedback--success">
                <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                  <path d="M8 12l2.5 2.5L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {purchaseSuccess}
              </div>
            )}

            <div className="av-modal-actions">
              {purchaseSuccess ? (
                <button type="button" className="av-modal-btn-confirm" style={{ gridColumn: '1 / -1' }} onClick={closePurchaseModal}>
                  Fechar
                </button>
              ) : (
                <>
                  <button type="button" className="av-modal-btn-cancel" onClick={closePurchaseModal} disabled={isBuying}>
                    Cancelar
                  </button>
                  <button type="button" className="av-modal-btn-confirm" onClick={confirmBuyCycle} disabled={isBuying}>
                    {isBuying ? 'Processando...' : 'Confirmar'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Welcome modal ── */}
      {showWelcomeModal && (
        <div className="av-welcome-backdrop" onClick={() => setShowWelcomeModal(false)}>
          <div className="av-welcome-card" onClick={(e) => e.stopPropagation()}>
            <div className="av-welcome-head">
              <img src="/favicon.svg" alt="Agrovia" className="av-welcome-logo" />
            </div>
            <div className="av-welcome-title">Ganhe no primeiro passo</div>
            <p className="av-welcome-desc">Ative um plano e comece a gerar renda diária na plataforma.</p>

            <div className="av-welcome-kpis">
              <div className="av-welcome-kpi">
                <span>Depósito mín.</span>
                <strong>R$ 20,00</strong>
              </div>
              <div className="av-welcome-kpi">
                <span>Saque mín.</span>
                <strong>R$ 5,00</strong>
              </div>
              <div className="av-welcome-kpi">
                <span>Planos</span>
                <strong>{cyclePlans.length || '—'}</strong>
              </div>
            </div>

            {commissionLevels.length > 0 && (
              <div className="av-welcome-commission">
                <strong>Comissão por indicação</strong>
                {commissionLevels.map((lvl) => (
                  <div key={lvl.id} className="av-welcome-commission-row">
                    <span>{lvl.name}</span>
                    <span>{Number(lvl.commissionPercent).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            )}

            <button type="button" className="av-welcome-btn" onClick={() => setShowWelcomeModal(false)}>
              Continuar
            </button>
          </div>
        </div>
      )}
      {/* ── Bottom navigation ── */}
      <AppBottomNav />

    </main>
  )
}
