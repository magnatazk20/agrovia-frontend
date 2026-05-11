
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppSidebar from '../components/AppSidebar'
import './Dashboard.css'
import './CycleProducts.css'
import AppBottomNav from '../components/AppBottomNav'

type StoredUser = {
  id: number
  name: string
  phone: string
}

type PlanCategory = 'normal' | 'vip' | 'vip_day'

type CycleProduct = {
  id: number
  name: string
  description: string
  amount: number
  profit: number
  cycleDays: number
  imageUrl: string
  isActive: boolean
  sortOrder: number
  planType: PlanCategory
  requireCommissionLevel1Count: number
  requireCommissionLevel2Count: number
  requireCommissionLevel3Count: number
  stockQuantity: number
  maxPurchasesPerUser: number
  expiresAt: string | null
  minAmount: number
  maxAmount: number
  profitPercent: number
}

const normalizePlanType = (value: unknown): PlanCategory => {
  const raw = String(value ?? '').trim().toLowerCase()
  if (raw === 'vip') return 'vip'
  if (raw === 'vip_day') return 'vip_day'
  return 'normal'
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

export default function CycleProducts() {
  const navigate = useNavigate()
  const [user, setUser] = useState<StoredUser | null>(null)
  const [cyclePlans, setCyclePlans] = useState<CycleProduct[]>([])
  const [initialStock, setInitialStock] = useState<Record<number, number>>({})
  const [loading, setLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<CycleProduct | null>(null)
  const [isBuying, setIsBuying] = useState(false)
  const [activeCategory, setActiveCategory] = useState<PlanCategory>('normal')
  const [userInviteCount, setUserInviteCount] = useState<{ level1: number; level2: number; level3: number } | null>(null)
  const [myPurchases, setMyPurchases] = useState<Record<number, number>>({})
  const [investAmounts, setInvestAmounts] = useState<Record<number, string>>({})

  useEffect(() => {
    const token = localStorage.getItem('token') ?? sessionStorage.getItem('token')
    const raw = localStorage.getItem('user') ?? sessionStorage.getItem('user')

    if (!token || !raw) {
      navigate('/')
      return
    }

    try {
      setUser(JSON.parse(raw) as StoredUser)
    } catch {
      navigate('/')
    }
  }, [navigate])

  useEffect(() => {
    if (!user?.id) return

    const loadCyclePlans = async () => {
      setLoading(true)
      try {
        const response = await fetch(`${API_URL}/api/dashboard/cycle-products`)
        if (!response.ok) {
          setCyclePlans([])
          return
        }
        const data = (await response.json()) as { ok?: boolean; products?: Array<Record<string, unknown>> }
        if (!data?.ok || !Array.isArray(data.products)) {
          setCyclePlans([])
          return
        }

        const mappedPlans: CycleProduct[] = data.products.map((item) => ({
          id: Number(item.id ?? 0),
          name: String(item.name ?? ''),
          description: String(item.description ?? ''),
          amount: Number(item.amount ?? 0),
          profit: Number(item.profit ?? 0),
          cycleDays: Number(item.cycleDays ?? 0),
          imageUrl: String(item.imageUrl ?? ''),
          isActive: Boolean(item.isActive),
          sortOrder: Number(item.sortOrder ?? 0),
          planType: normalizePlanType(item.planType),
          requireCommissionLevel1Count: Number(item.requireCommissionLevel1Count ?? 0),
          requireCommissionLevel2Count: Number(item.requireCommissionLevel2Count ?? 0),
          requireCommissionLevel3Count: Number(item.requireCommissionLevel3Count ?? 0),
          stockQuantity: Number(item.stockQuantity ?? 0),
          maxPurchasesPerUser: Number(item.maxPurchasesPerUser ?? 0),
          expiresAt: item.expiresAt == null ? null : String(item.expiresAt),
          minAmount: Number(item.minAmount ?? 0),
          maxAmount: Number(item.maxAmount ?? 0),
          profitPercent: Number(item.profitPercent ?? 0),
        }))

        setCyclePlans(mappedPlans)
        const stockMap: Record<number, number> = {}
        mappedPlans.forEach((p) => { stockMap[p.id] = p.stockQuantity })
        setInitialStock(stockMap)
      } catch {
        setCyclePlans([])
      } finally {
        setLoading(false)
      }
    }

    loadCyclePlans()

    const loadInviteCounts = async () => {
      try {
        const token = localStorage.getItem('token') ?? sessionStorage.getItem('token')
        const res = await fetch(`${API_URL}/api/user/invite-counts/${user.id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        const data = await res.json().catch(() => ({})) as {
          ok?: boolean
          level1?: number
          level2?: number
          level3?: number
        }
        if (res.ok && data?.ok) {
          setUserInviteCount({
            level1: Number(data.level1 ?? 0),
            level2: Number(data.level2 ?? 0),
            level3: Number(data.level3 ?? 0),
          })
        }
      } catch {
        // silencioso
      }
    }

    loadInviteCounts()

    const loadMyPurchases = async () => {
      try {
        const token = localStorage.getItem('token') ?? sessionStorage.getItem('token')
        if (!token) return
        const res = await fetch(`${API_URL}/api/cycle-products/my-purchases/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json().catch(() => ({})) as { ok?: boolean; purchases?: Record<number, number> }
        if (res.ok && data?.ok && data.purchases) {
          setMyPurchases(data.purchases)
        }
      } catch {
        // silencioso
      }
    }

    loadMyPurchases()
  }, [user?.id])

  const formatBRL = (value: number) =>
    Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const formatDateTime = (date: Date) =>
    date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })

  const closePurchaseModal = () => {
    if (isBuying) return
    setSelectedPlan(null)
  }

  const confirmBuyCycle = async () => {
    if (!user?.id || !selectedPlan || isBuying) return

    setIsBuying(true)
    const token = localStorage.getItem('token') ?? sessionStorage.getItem('token') ?? ''
    try {
      const userInvestAmount = Number(String(investAmounts[selectedPlan.id] ?? '0').replace(',', '.'))

      const response = await fetch(`${API_URL}/api/cycle-products/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          userId: user.id,
          cycleProductId: selectedPlan.id,
          investAmount: userInvestAmount,
        }),
      })

      const data = (await response.json()) as {
        ok?: boolean
        error?: string
        message?: string
      }

      if (!response.ok || !data?.ok) {
        alert(data?.error ?? 'Não foi possível adquirir este ciclo.')
        return
      }

      setCyclePlans((prev) =>
        prev.map((p) =>
          p.id === selectedPlan.id
            ? { ...p, stockQuantity: Math.max(0, p.stockQuantity - 1) }
            : p
        )
      )
      setMyPurchases((prev) => ({
        ...prev,
        [selectedPlan.id]: (prev[selectedPlan.id] ?? 0) + 1,
      }))

      alert(data?.message ?? 'Ciclo adquirido com sucesso.')
      setSelectedPlan(null)
    } catch {
      alert('Erro de conexão ao adquirir ciclo.')
    } finally {
      setIsBuying(false)
    }
  }

  const filteredCyclePlans = useMemo(
    () => cyclePlans.filter((plan) => plan.planType === activeCategory),
    [cyclePlans, activeCategory]
  )

  if (!user) return null

  return (
    <main className="dash-app">
      <section className="dash-main">
        <AppSidebar />

        <div className="dash-content">
          {/* ── Banner topo ── */}
          <div className="cycle-banner-wrap">
            <img src="/trkml.png" alt="TRK Banner" className="cycle-banner-img" />
          </div>

          <h2 className="cycle-storage-title">Período de armazenamento</h2>

          {/* ── Categoria tabs ── */}
          <div className="cycle-category-tabs" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
            <button
              type="button"
              className={`cycle-category-tab${activeCategory === 'normal' ? ' active' : ''}`}
              onClick={() => setActiveCategory('normal')}
            >
              Essencial
            </button>
            <button
              type="button"
              className={`cycle-category-tab${activeCategory === 'vip' ? ' active' : ''}`}
              onClick={() => setActiveCategory('vip')}
            >
              Fundo de ouro
            </button>
          </div>

          {loading ? (
            <p style={{ color: '#6b7280', textAlign: 'center', padding: 20 }}>Carregando produtos...</p>
          ) : filteredCyclePlans.length === 0 ? (
            <p style={{ color: '#6b7280', textAlign: 'center', padding: 20 }}>Nenhum plano disponível nesta categoria.</p>
          ) : (
            filteredCyclePlans.map((plan) => {
              const estoque = Math.max(0, Number(plan.stockQuantity ?? 0))
              const estoqueInicial = Math.max(1, initialStock[plan.id] ?? estoque)
              const vendidos = Math.max(0, estoqueInicial - estoque)
              const progresso = estoqueInicial > 0 ? Math.min(100, Math.round((vendidos / estoqueInicial) * 100)) : 0
              const limitPerUser = Number(plan.maxPurchasesPerUser ?? 0)
              const userPurchaseCount = Number(myPurchases[plan.id] ?? 0)
              const limitReached = limitPerUser > 0 && userPurchaseCount >= limitPerUser
              const isUnavailable = estoque <= 0 || limitReached
              const effectivePercent = plan.profitPercent > 0 ? plan.profitPercent : plan.profit
              const totalPercent = Number((effectivePercent * plan.cycleDays).toFixed(2))

              return (
                <article
                  key={plan.id}
                  className={`cycle-product-card${isUnavailable ? ' unavailable' : ''}`}
                  onClick={() => { if (!isUnavailable) setSelectedPlan(plan) }}
                >
                  {/* ── Imagem no topo com badges ── */}
                  <div className="cycle-product-image-wrap">
                    <img src={plan.imageUrl} alt={plan.name} />
                    <span className="cycle-percent-overlay">{totalPercent}%</span>
                    <span className="cycle-days-overlay">{plan.cycleDays} dias</span>
                  </div>

                  {/* ── Corpo do card ── */}
                  <div className="cycle-product-body">
                    <div className="cycle-product-title">{plan.name}</div>

                    <div className="cycle-details-list">
                      <div>Lucro diário: <strong>{effectivePercent}%</strong></div>
                      <div>Lucro total no final: <strong>{totalPercent}%</strong></div>
                      <div>Ciclo: <strong>{plan.cycleDays} dias</strong></div>
                      <div>Mín. depósito: <strong>{formatBRL(plan.minAmount)}</strong></div>
                    </div>

                    {/* ── Badge circular de progresso ── */}
                    <div className="cycle-percentage-badge">{progresso}%</div>

                    {/* ── Info compras / estoque ── */}
                    <div className="cycle-stock-info">
                      <span>Compras: <strong>{userPurchaseCount}</strong></span>
                      <span>Estoque: <strong>{estoque}</strong></span>
                    </div>

                    {/* ── Tag reinvestimento ── */}
                    <span className={`cycle-reinvest-tag${isUnavailable ? ' closed' : ''}`}>
                      {isUnavailable ? 'Não é mais possível investir' : 'Pode ser reinvestido'}
                    </span>

                    {/* ── Botão ── */}
                    {isUnavailable ? (
                      <button
                        type="button"
                        className="cycle-product-button disabled"
                        disabled
                        onClick={(e) => e.stopPropagation()}
                      >
                        Esgotado <span className="arrow">✕</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="cycle-product-button"
                        onClick={(e) => { e.stopPropagation(); setSelectedPlan(plan) }}
                      >
                        Invista agora <span className="arrow">➜</span>
                      </button>
                    )}
                  </div>
                </article>
              )
            })
          )}
        </div>
      </section>

      {/* ── Modal de investimento ── */}
      {selectedPlan ? (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            zIndex: 9999,
          }}
          onClick={closePurchaseModal}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 420,
              background: '#fff',
              borderRadius: 16,
              padding: 20,
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: 0, color: '#2d3b44', fontSize: 18 }}>Confirmar investimento</h3>
            <p style={{ marginTop: 6, color: '#4b5a64', fontSize: 14 }}>{selectedPlan.name}</p>

            {(() => {
              const modalInvestStr = investAmounts[selectedPlan.id] ?? ''
              const modalInvestNum = Number(String(modalInvestStr).replace(',', '.')) || 0
              const modalEffectivePercent = selectedPlan.profitPercent > 0 ? selectedPlan.profitPercent : selectedPlan.profit
              const modalTotalPercent = Number((modalEffectivePercent * selectedPlan.cycleDays).toFixed(2))
              const modalDailyProfit = modalEffectivePercent > 0
                ? Number((modalInvestNum * (modalEffectivePercent / 100)).toFixed(2))
                : 0
              const modalTotalProfit = modalEffectivePercent > 0
                ? Number((modalDailyProfit * selectedPlan.cycleDays).toFixed(2))
                : 0
              const modalTotalReturn = Number((modalInvestNum + modalTotalProfit).toFixed(2))
              return (
                <>
                  <div style={{ marginTop: 14, padding: '14px 16px', borderRadius: 12, background: '#f4fdff', border: '2px solid #66b8d7' }}>
                    <div style={{ color: '#0798cb', fontSize: 14, fontWeight: 700, marginBottom: 10 }}>
                      Escolha o valor do investimento ({formatBRL(selectedPlan.minAmount)} ~ {formatBRL(selectedPlan.maxAmount)})
                    </div>
                    <input
                      type="number"
                      min={selectedPlan.minAmount}
                      max={selectedPlan.maxAmount}
                      step="1"
                      value={modalInvestStr}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setInvestAmounts((prev) => ({ ...prev, [selectedPlan.id]: e.target.value }))}
                      placeholder={`Ex.: ${selectedPlan.minAmount}`}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        border: '2px solid #66b8d7',
                        borderRadius: 10,
                        fontSize: 18,
                        fontWeight: 700,
                        color: '#2d3b44',
                        background: '#fff',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                    <input
                      type="range"
                      min={selectedPlan.minAmount}
                      max={selectedPlan.maxAmount}
                      step="1"
                      value={modalInvestNum || selectedPlan.minAmount}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setInvestAmounts((prev) => ({ ...prev, [selectedPlan.id]: e.target.value }))}
                      style={{ width: '100%', marginTop: 8, accentColor: '#0798cb' }}
                    />
                    {modalInvestNum > 0 && modalEffectivePercent > 0 ? (
                      <div style={{ marginTop: 12, fontSize: 13, color: '#2f3f49', display: 'grid', gap: 6 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Lucro diário ({modalEffectivePercent}%):</span>
                          <strong style={{ color: '#0798cb' }}>{formatBRL(modalDailyProfit)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Lucro total ({modalTotalPercent}% em {selectedPlan.cycleDays} dias):</span>
                          <strong style={{ color: '#16a34a' }}>{formatBRL(modalTotalProfit)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #d0e8f0', paddingTop: 6 }}>
                          <span>Retorno total ao final do ciclo:</span>
                          <strong style={{ color: '#16a34a', fontSize: 15 }}>{formatBRL(modalTotalReturn)}</strong>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div style={{ marginTop: 14, display: 'grid', gap: 8, color: '#2f3f49', fontSize: 13 }}>
                    <div><strong>Montante investido:</strong> {formatBRL(modalInvestNum)}</div>
                    <div><strong>Lucro diário ({modalEffectivePercent}%):</strong> {formatBRL(modalDailyProfit)}</div>
                    <div><strong>Lucro total ({modalTotalPercent}% em {selectedPlan.cycleDays} dias):</strong> {formatBRL(modalTotalProfit)}</div>
                    <div><strong>Retorno total (investimento + lucro):</strong> <span style={{ color: '#16a34a', fontWeight: 700 }}>{formatBRL(modalTotalReturn)}</span></div>
                    <div><strong>Início do ciclo:</strong> {formatDateTime(new Date())}</div>
                    <div>
                      <strong>Fim do ciclo (retorno):</strong>{' '}
                      {formatDateTime(new Date(Date.now() + selectedPlan.cycleDays * 24 * 60 * 60 * 1000))}
                    </div>
                    <div><strong>Duração:</strong> {selectedPlan.cycleDays} dias</div>
                    <div style={{
                      marginTop: 6,
                      padding: '8px 12px',
                      borderRadius: 8,
                      background: '#e9f9ff',
                      border: '1px solid #5fb8d7',
                      color: '#038fc2',
                      fontSize: 12,
                      fontWeight: 700,
                    }}>
                      O lucro + investimento será retornado ao final do ciclo.
                    </div>
                  </div>
                </>
              )
            })()}

            {(selectedPlan.requireCommissionLevel1Count > 0 || selectedPlan.requireCommissionLevel2Count > 0 || selectedPlan.requireCommissionLevel3Count > 0) ? (
              <div style={{ marginTop: 14, padding: '10px 12px', borderRadius: 10, background: '#f4fdff', border: '1px solid #9ecde0', fontSize: 13 }}>
                <strong style={{ display: 'block', marginBottom: 6, color: '#2d3b44' }}>Requisitos para se tornar funcionario</strong>
                {selectedPlan.requireCommissionLevel1Count > 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    {userInviteCount !== null && userInviteCount.level1 >= selectedPlan.requireCommissionLevel1Count
                      ? <span style={{ color: '#16a34a', fontWeight: 700 }}>✓</span>
                      : <span style={{ color: '#dc2626', fontWeight: 700 }}>✗</span>}
                    <span>
                      Nível 1: {userInviteCount !== null ? `${userInviteCount.level1}/` : ''}{selectedPlan.requireCommissionLevel1Count} indicados com depósito
                    </span>
                  </div>
                ) : null}
                {selectedPlan.requireCommissionLevel2Count > 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    {userInviteCount !== null && userInviteCount.level2 >= selectedPlan.requireCommissionLevel2Count
                      ? <span style={{ color: '#16a34a', fontWeight: 700 }}>✓</span>
                      : <span style={{ color: '#dc2626', fontWeight: 700 }}>✗</span>}
                    <span>
                      Nível 2: {userInviteCount !== null ? `${userInviteCount.level2}/` : ''}{selectedPlan.requireCommissionLevel2Count} indicados com depósito
                    </span>
                  </div>
                ) : null}
                {selectedPlan.requireCommissionLevel3Count > 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {userInviteCount !== null && userInviteCount.level3 >= selectedPlan.requireCommissionLevel3Count
                      ? <span style={{ color: '#16a34a', fontWeight: 700 }}>✓</span>
                      : <span style={{ color: '#dc2626', fontWeight: 700 }}>✗</span>}
                    <span>
                      Nível 3: {userInviteCount !== null ? `${userInviteCount.level3}/` : ''}{selectedPlan.requireCommissionLevel3Count} indicados com depósito
                    </span>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div style={{ marginTop: 16, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={closePurchaseModal}
                disabled={isBuying}
                style={{
                  border: '1px solid #9ecde0',
                  background: '#fff',
                  color: '#4b5a64',
                  borderRadius: 8,
                  padding: '10px 16px',
                  fontWeight: 600,
                  cursor: isBuying ? 'not-allowed' : 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmBuyCycle}
                disabled={isBuying}
                style={{
                  border: '1px solid #0074a1',
                  background: 'linear-gradient(180deg, #0798cb 0%, #0b80b2 100%)',
                  color: '#fff',
                  borderRadius: 8,
                  padding: '10px 16px',
                  fontWeight: 700,
                  cursor: isBuying ? 'not-allowed' : 'pointer',
                }}
              >
                {isBuying ? 'Processando...' : 'Confirmar compra'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <AppBottomNav />
</main>
  )
}
