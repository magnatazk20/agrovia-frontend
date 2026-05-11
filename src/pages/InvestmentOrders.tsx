import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './InvestmentOrders.css'

type StoredUser = {
  id: number
  name: string
  phone: string
}

type OrderItem = {
  id: number
  userId: number
  cycleProductId: number
  productName: string
  amountPaid: number
  expectedProfit: number
  cycleDays: number
  status: string
  uiStatus: 'ongoing' | 'completed'
  startedAt: string | null
  endsAt: string | null
  dailyProfit: number
  totalEarnedSoFar: number
}

type OrdersResponse = {
  ok?: boolean
  orders?: OrderItem[]
  error?: string
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

const formatBRL = (value: number) =>
  Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const formatDate = (value: string | null) => {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('pt-BR')
}

function calcProgress(order: OrderItem): number {
  if (order.uiStatus === 'completed') return 100
  if (!order.startedAt || !order.endsAt) return 0
  const start = new Date(order.startedAt).getTime()
  const end = new Date(order.endsAt).getTime()
  const now = Date.now()
  if (now >= end) return 100
  if (now <= start) return 0
  return Math.round(((now - start) / (end - start)) * 100)
}

function calcDaysLeft(order: OrderItem): number {
  if (order.uiStatus === 'completed') return 0
  if (!order.endsAt) return order.cycleDays
  const diff = new Date(order.endsAt).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / 86_400_000))
}

type FilterType = 'all' | 'ongoing' | 'completed'

export default function InvestmentOrders() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<OrderItem[]>([])
  const [filter, setFilter] = useState<FilterType>('all')
  const [error, setError] = useState('')

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
    const loadOrders = async () => {
      if (!user?.id) {
        navigate('/')
        return
      }

      setLoading(true)
      setError('')

      try {
        const res = await fetch(`${API_URL}/api/cycles/orders/${user.id}`)
        const data = (await res.json()) as OrdersResponse

        if (!res.ok || !data?.ok) {
          setError(data?.error ?? 'Erro ao carregar pedidos.')
          setOrders([])
          return
        }

        setOrders(Array.isArray(data.orders) ? data.orders : [])
      } catch {
        setError('Erro de conexão ao carregar pedidos.')
        setOrders([])
      } finally {
        setLoading(false)
      }
    }

    loadOrders()
  }, [navigate, user?.id])

  const filteredOrders = useMemo(() => {
    if (filter === 'all') return orders
    if (filter === 'ongoing') return orders.filter((o) => o.uiStatus === 'ongoing')
    return orders.filter((o) => o.uiStatus === 'completed')
  }, [filter, orders])

  const summary = useMemo(() => {
    const ongoing = orders.filter((o) => o.uiStatus === 'ongoing')
    const completed = orders.filter((o) => o.uiStatus === 'completed')
    const totalInvested = orders.reduce((s, o) => s + o.amountPaid, 0)
    const totalProfit = completed.reduce((s, o) => s + o.expectedProfit, 0)
    return { ongoing: ongoing.length, completed: completed.length, totalInvested, totalProfit }
  }, [orders])

  return (
    <main className="orders-page">
      <div className="orders-wrap">
        {/* header */}
        <header className="orders-header">
          <button className="orders-back-btn" onClick={() => navigate('/dashboard')} type="button">
            ←
          </button>
          <div className="orders-header-text">
            <h1>Meus Investimentos</h1>
            <p>Acompanhe seus retornos</p>
          </div>
          <div className="orders-header-spacer" />
        </header>

        {/* resumo */}
        {!loading && !error && orders.length > 0 && (
          <div className="orders-summary-grid">
            <div className="orders-summary-card">
              <span className="orders-summary-label">Em andamento</span>
              <strong className="orders-summary-value green">{summary.ongoing}</strong>
            </div>
            <div className="orders-summary-card">
              <span className="orders-summary-label">Concluídos</span>
              <strong className="orders-summary-value">{summary.completed}</strong>
            </div>
            <div className="orders-summary-card">
              <span className="orders-summary-label">Total investido</span>
              <strong className="orders-summary-value">{formatBRL(summary.totalInvested)}</strong>
            </div>
            <div className="orders-summary-card highlight">
              <span className="orders-summary-label">Lucro recebido</span>
              <strong className="orders-summary-value green">{formatBRL(summary.totalProfit)}</strong>
            </div>
          </div>
        )}

        {/* filtros */}
        <div className="orders-filters-row">
          <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')} type="button">
            Todos
          </button>
          <button className={filter === 'ongoing' ? 'active' : ''} onClick={() => setFilter('ongoing')} type="button">
            Em Andamento
          </button>
          <button className={filter === 'completed' ? 'active' : ''} onClick={() => setFilter('completed')} type="button">
            Concluídos
          </button>
        </div>

        {/* conteúdo */}
        <div className="orders-content">
          {loading ? (
            <div className="orders-loading">
              <div className="orders-spinner" />
              <p>Carregando pedidos...</p>
            </div>
          ) : error ? (
            <div className="orders-error-card">
              <span>❌</span>
              <p>{error}</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="orders-empty-card">
              <span className="orders-empty-icon">📋</span>
              <h2>Nenhum pedido encontrado</h2>
              <p>Inicie seu primeiro investimento</p>
              <button type="button" onClick={() => navigate('/cycle-products')}>
                Ver planos
              </button>
            </div>
          ) : (
            <div className="orders-list">
              {filteredOrders.map((order) => {
                const progress = calcProgress(order)
                const daysLeft = calcDaysLeft(order)
                const isCompleted = order.uiStatus === 'completed'

                return (
                  <article key={order.id} className={`order-card ${isCompleted ? 'order-card--done' : ''}`}>
                    <div className="order-card-header">
                      <div className="order-card-info">
                        <h3 className="order-card-name">{order.productName}</h3>
                        <span className="order-card-id">#{order.id}</span>
                      </div>
                      <span className={`order-status ${order.uiStatus}`}>
                        {isCompleted ? '✓ Concluído' : '◷ Em Andamento'}
                      </span>
                    </div>

                    <div className="order-progress-wrap">
                      <div className="order-progress-header">
                        <span className="order-progress-label">Progresso do ciclo</span>
                        <span className="order-progress-pct">{progress}%</span>
                      </div>
                      <div className="order-progress-track">
                        <div
                          className={`order-progress-fill ${isCompleted ? 'done' : ''}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="order-progress-footer">
                        <span>{formatDate(order.startedAt)}</span>
                        <span>
                          {isCompleted
                            ? 'Ciclo encerrado'
                            : daysLeft === 0
                            ? 'Encerrando hoje'
                            : `${daysLeft} dia${daysLeft !== 1 ? 's' : ''} restante${daysLeft !== 1 ? 's' : ''}`}
                        </span>
                        <span>{formatDate(order.endsAt)}</span>
                      </div>
                    </div>

                    <div className="order-metrics">
                      <div className="order-metric">
                        <span className="order-metric-label">Investido</span>
                        <strong className="order-metric-value">{formatBRL(order.amountPaid)}</strong>
                      </div>
                      <div className="order-metric">
                        <span className="order-metric-label">Lucro por dia (24h)</span>
                        <strong className="order-metric-value green">
                          +{formatBRL(order.dailyProfit)}
                        </strong>
                      </div>
                      <div className="order-metric">
                        <span className="order-metric-label">Total acumulado</span>
                        <strong className={`order-metric-value ${isCompleted ? 'green' : ''}`}>
                          {formatBRL(order.totalEarnedSoFar)}
                        </strong>
                      </div>
                      <div className="order-metric">
                        <span className="order-metric-label">Lucro esperado total</span>
                        <strong className="order-metric-value">{formatBRL(order.expectedProfit)}</strong>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
