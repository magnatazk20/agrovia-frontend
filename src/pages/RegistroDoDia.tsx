import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './RegistroDoDia.css'

interface User {
  id: number
  name: string
  phone: string
}

type RecordStatus = 'paid' | 'pending' | 'processing' | 'failed'

type Transaction = {
  id: number
  amount: number
  method: string
  status: RecordStatus
  type: 'deposit' | 'withdraw'
  createdAt: string | null
}

type EarningsResponse = {
  ok?: boolean
  records?: {
    deposits?: Array<{
      id: number
      amount: number
      status: RecordStatus
      method: string
      createdAt: string | null
      type?: 'deposit'
    }>
    withdrawals?: Array<{
      id: number
      amount: number
      status: RecordStatus
      createdAt: string | null
      type?: 'withdraw'
    }>
  }
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

const formatBRL = (value: number) =>
  Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const formatDateTime = (raw: string | null) => {
  if (!raw) return '-'
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const dateToISO = (d: Date) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

const todayISO = () => dateToISO(new Date())

const STATUS_LABEL: Record<RecordStatus, string> = {
  paid: 'Pago',
  pending: 'Pendente',
  processing: 'Processando',
  failed: 'Falhou',
}

type Filter = 'all' | 'deposit' | 'withdraw'

const ICON_BACK = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 6l-6 6l6 6" />
  </svg>
)

const ICON_DEPOSIT = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
)

const ICON_WITHDRAW = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
    <path d="M18 12a2 2 0 0 0 0 4h4v-4z" />
  </svg>
)

const ICON_LIST = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" />
    <line x1="3" y1="12" x2="3.01" y2="12" />
    <line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
)

const ICON_CHECK = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const ICON_CALENDAR = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
)

const ICON_UP = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="18 15 12 9 6 15" />
  </svg>
)

const ICON_DOWN = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

export default function RegistroDoDia() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [mounted, setMounted] = useState(false)
  const initialFrom = useMemo(() => {
    const past = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000)
    return dateToISO(past)
  }, [])
  const [from, setFrom] = useState(initialFrom)
  const [to, setTo] = useState(todayISO())
  const [filter, setFilter] = useState<Filter>('all')

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50)
    return () => clearTimeout(t)
  }, [])

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

    const loadTransactions = async () => {
      setLoading(true)
      setErrorMessage('')
      try {
        const token = localStorage.getItem('token') ?? sessionStorage.getItem('token') ?? ''
        const response = await fetch(`${API_URL}/api/earnings/records/${user.id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (!response.ok) {
          setTransactions([])
          setErrorMessage('Não foi possível carregar o histórico.')
          return
        }
        const data = (await response.json()) as EarningsResponse
        if (!data?.ok || !data.records) {
          setTransactions([])
          return
        }

        const deposits: Transaction[] = (data.records.deposits ?? []).map((row) => ({
          id: Number(row.id),
          amount: Number(row.amount ?? 0),
          method: String(row.method ?? 'pix'),
          status: (row.status ?? 'pending') as RecordStatus,
          type: 'deposit',
          createdAt: row.createdAt ?? null,
        }))

        const withdrawals: Transaction[] = (data.records.withdrawals ?? []).map((row) => ({
          id: Number(row.id),
          amount: Number(row.amount ?? 0),
          method: 'pix',
          status: (row.status ?? 'pending') as RecordStatus,
          type: 'withdraw',
          createdAt: row.createdAt ?? null,
        }))

        const merged = [...deposits, ...withdrawals].sort((a, b) => {
          const aT = new Date(String(a.createdAt ?? 0)).getTime()
          const bT = new Date(String(b.createdAt ?? 0)).getTime()
          if (bT !== aT) return bT - aT
          return Number(b.id) - Number(a.id)
        })

        setTransactions(merged)
      } catch {
        setTransactions([])
        setErrorMessage('Erro de conexão ao carregar histórico.')
      } finally {
        setLoading(false)
      }
    }

    loadTransactions()
  }, [user?.id])

  const filtered = useMemo(() => {
    const fromTs = from ? new Date(`${from}T00:00:00`).getTime() : null
    const toTs = to ? new Date(`${to}T23:59:59.999`).getTime() : null

    return transactions.filter((t) => {
      if (filter !== 'all' && t.type !== filter) return false
      if (!t.createdAt) return false
      const ts = new Date(t.createdAt).getTime()
      if (Number.isNaN(ts)) return false
      if (fromTs !== null && ts < fromTs) return false
      if (toTs !== null && ts > toTs) return false
      return true
    })
  }, [transactions, filter, from, to])

  const totals = useMemo(() => {
    const totalDeposits = filtered
      .filter((t) => t.type === 'deposit' && t.status === 'paid')
      .reduce((acc, t) => acc + Number(t.amount ?? 0), 0)
    const totalWithdrawals = filtered
      .filter((t) => t.type === 'withdraw' && t.status === 'paid')
      .reduce((acc, t) => acc + Number(t.amount ?? 0), 0)
    return { totalDeposits, totalWithdrawals, count: filtered.length }
  }, [filtered])

  const setQuickRange = (kind: 'today' | '7d' | '30d') => {
    const today = todayISO()
    if (kind === 'today') {
      setFrom(today)
      setTo(today)
      return
    }
    const days = kind === '7d' ? 6 : 29
    const past = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    setFrom(dateToISO(past))
    setTo(today)
  }

  if (!user) return null

  return (
    <main className="rdd-page">
      {/* Header */}
      <header className="rdd-header">
        <button type="button" className="rdd-back-btn" onClick={() => navigate('/profile')} aria-label="Voltar">
          {ICON_BACK}
        </button>
        <div className="rdd-header-text">
          <h1>Registro do Dia</h1>
          <p>Suas transações</p>
        </div>
        <div className="rdd-header-spacer" />
      </header>

      <div className="rdd-content">
        {/* Hero card */}
        <div className={`rdd-hero-card ${mounted ? 'rdd-hero-card--visible' : ''}`}>
          <div className="rdd-hero-glow" aria-hidden="true" />
          <div className="rdd-hero-icon-wrap">
            <div className="rdd-hero-icon">{ICON_LIST}</div>
            <div className="rdd-hero-icon-ring" aria-hidden="true" />
          </div>
          <h2 className="rdd-hero-title">Histórico</h2>
          <p className="rdd-hero-text">Visualize todos os seus depósitos e saques</p>
          <div className="rdd-hero-shine" aria-hidden="true" />
        </div>

        {/* Summary cards */}
        <div className={`rdd-stats-grid ${mounted ? 'rdd-stats-grid--visible' : ''}`}
          style={{ transitionDelay: '100ms' }}>
          <div className="rdd-stat-card rdd-stat-card--deposit">
            <div className="rdd-stat-icon">{ICON_UP}</div>
            <div className="rdd-stat-info">
              <span className="rdd-stat-label">Depósitos</span>
              <span className="rdd-stat-value">{formatBRL(totals.totalDeposits)}</span>
            </div>
          </div>
          <div className="rdd-stat-card rdd-stat-card--withdraw">
            <div className="rdd-stat-icon">{ICON_DOWN}</div>
            <div className="rdd-stat-info">
              <span className="rdd-stat-label">Saques</span>
              <span className="rdd-stat-value">{formatBRL(totals.totalWithdrawals)}</span>
            </div>
          </div>
          <div className="rdd-stat-card">
            <div className="rdd-stat-icon">{ICON_LIST}</div>
            <div className="rdd-stat-info">
              <span className="rdd-stat-label">Transações</span>
              <span className="rdd-stat-value">{totals.count}</span>
            </div>
          </div>
        </div>

        {/* Filters card */}
        <div className={`rdd-filter-card ${mounted ? 'rdd-filter-card--visible' : ''}`}
          style={{ transitionDelay: '200ms' }}>
          <div className="rdd-filter-header">
            <span className="rdd-filter-icon">{ICON_CALENDAR}</span>
            <span className="rdd-filter-title">Filtros</span>
          </div>

          <div className="rdd-date-row">
            <div className="rdd-date-field">
              <label className="rdd-date-label">De</label>
              <input
                type="date"
                className="rdd-date-input"
                value={from}
                max={to || undefined}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>
            <div className="rdd-date-sep">—</div>
            <div className="rdd-date-field">
              <label className="rdd-date-label">Até</label>
              <input
                type="date"
                className="rdd-date-input"
                value={to}
                min={from || undefined}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
          </div>

          <div className="rdd-quick-range">
            <button type="button" className="rdd-quick-btn" onClick={() => setQuickRange('today')}>Hoje</button>
            <button type="button" className="rdd-quick-btn" onClick={() => setQuickRange('7d')}>7 dias</button>
            <button type="button" className="rdd-quick-btn" onClick={() => setQuickRange('30d')}>30 dias</button>
          </div>

          <div className="rdd-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={filter === 'all'}
              className={`rdd-tab ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              Todos
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={filter === 'deposit'}
              className={`rdd-tab ${filter === 'deposit' ? 'active' : ''}`}
              onClick={() => setFilter('deposit')}
            >
              Depósitos
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={filter === 'withdraw'}
              className={`rdd-tab ${filter === 'withdraw' ? 'active' : ''}`}
              onClick={() => setFilter('withdraw')}
            >
              Saques
            </button>
          </div>
        </div>

        {/* Transactions list */}
        <div className={`rdd-list-section ${mounted ? 'rdd-list-section--visible' : ''}`}
          style={{ transitionDelay: '300ms' }}>
          <div className="rdd-list-header">
            <span className="rdd-list-title">Transações</span>
            <span className="rdd-list-count">{filtered.length} registro(s)</span>
          </div>

          {loading ? (
            <div className="rdd-loading-card">
              <div className="rdd-spinner" />
              <p>Carregando transações...</p>
            </div>
          ) : errorMessage ? (
            <div className="rdd-error-card">
              <p>{errorMessage}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="rdd-empty-card">
              <div className="rdd-empty-icon">{ICON_LIST}</div>
              <p className="rdd-empty-title">Nenhuma transação</p>
              <p className="rdd-empty-text">Nenhuma transação encontrada no período selecionado.</p>
            </div>
          ) : (
            <div className="rdd-transactions-list">
              {filtered.map((t) => {
                const isDeposit = t.type === 'deposit'
                return (
                  <div
                    key={`${t.type}-${t.id}`}
                    className={`rdd-transaction-card ${isDeposit ? 'rdd-transaction-card--deposit' : 'rdd-transaction-card--withdraw'}`}
                  >
                    <div className="rdd-transaction-left">
                      <div className={`rdd-transaction-icon ${isDeposit ? 'deposit' : 'withdraw'}`}>
                        {isDeposit ? ICON_UP : ICON_DOWN}
                      </div>
                      <div className="rdd-transaction-info">
                        <div className="rdd-transaction-name-row">
                          <span className="rdd-transaction-name">{isDeposit ? 'Depósito' : 'Saque'}</span>
                          <span className={`rdd-status-badge rdd-status-badge--${t.status}`}>
                            {STATUS_LABEL[t.status]}
                          </span>
                        </div>
                        <span className="rdd-transaction-date">{formatDateTime(t.createdAt)}</span>
                        <span className="rdd-transaction-id">ID #{t.id}</span>
                      </div>
                    </div>
                    <div className="rdd-transaction-right">
                      <span className={`rdd-transaction-amount ${isDeposit ? 'positive' : 'negative'}`}>
                        {isDeposit ? '+' : '-'} {formatBRL(t.amount)}
                      </span>
                      <span className="rdd-transaction-method">{(t.method ?? 'pix').toUpperCase()}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Decorative floating icons */}
        <div className="rdd-float-deco" aria-hidden="true">
          <span className="rdd-deco rdd-deco-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </span>
          <span className="rdd-deco rdd-deco-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </span>
        </div>
      </div>
    </main>
  )
}