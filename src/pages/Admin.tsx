import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { io as socketIO } from 'socket.io-client'
import AdminSidebar from '../components/AdminSidebar'
import './Admin.css'

type AdminUser = {
  id?: number
  name?: string
  phone?: string
  is_admin?: number
  isAdmin?: number | boolean
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

const formatBRL = (value: number) =>
  Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const formatDateTime = (value?: string | null) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('pt-BR')
}

type AdminWithdrawalRow = {
  id: number
  amount: number
  status: string
  createdAt?: string
  paidAt?: string
  user: {
    id: number
    name: string
    phone: string
  }
}

export default function Admin() {
  const navigate = useNavigate()

  const adminUser = useMemo(() => {
    const raw = localStorage.getItem('user') ?? sessionStorage.getItem('user')
    if (!raw) return null
    try {
      return JSON.parse(raw) as AdminUser
    } catch {
      return null
    }
  }, [])

  const adminLevel = useMemo(() => {
    if (!adminUser) return 0
    if (typeof adminUser.isAdmin === 'boolean') return adminUser.isAdmin ? 1 : 0
    return Number(adminUser.is_admin ?? adminUser.isAdmin ?? 0)
  }, [adminUser])

  const [kpiLoading, setKpiLoading] = useState(false)
  const [kpiError, setKpiError] = useState('')
  const [kpi, setKpi] = useState({
    activeUsers: 0,
    registrationsToday: 0,
    depositsToday: 0,
    depositsTodayCount: 0,
    depositsMonthAmount: 0,
    depositsMonthCount: 0,
    withdrawalsTodayCount: 0,
    withdrawalsTodayAmount: 0,
    withdrawalsMonthCount: 0,
    withdrawalsMonthAmount: 0,
    pendingWithdrawals: 0,
    netRevenue: 0,
  })
  const [onlineCount, setOnlineCount] = useState<number | null>(null)
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(false)
  const [withdrawalsError, setWithdrawalsError] = useState('')
  const [latestWithdrawals, setLatestWithdrawals] = useState<AdminWithdrawalRow[]>([])

  const today = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  useEffect(() => {
    const loadOverview = async () => {
      setKpiLoading(true)
      setKpiError('')

      try {
        const token =
          localStorage.getItem('token') ??
          sessionStorage.getItem('token') ??
          ''

        const res = await fetch(`${API_URL}/api/admin/overview`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })

        const data = (await res.json()) as {
          ok?: boolean
          summary?: {
            activeUsers?: number
            registrationsToday?: number
            depositsToday?: number
            depositsTodayCount?: number
            depositsMonthAmount?: number
            depositsMonthCount?: number
            withdrawalsTodayCount?: number
            withdrawalsTodayAmount?: number
            withdrawalsMonthCount?: number
            withdrawalsMonthAmount?: number
            pendingWithdrawals?: number
            netRevenue?: number
          }
          error?: string
        }

        if (!res.ok || !data?.ok) {
          setKpiError(data?.error ?? 'Falha ao carregar indicadores do admin.')
          return
        }

        const s = data.summary ?? {}
        setKpi({
          activeUsers: Number(s.activeUsers ?? 0),
          registrationsToday: Number(s.registrationsToday ?? 0),
          depositsToday: Number(s.depositsToday ?? 0),
          depositsTodayCount: Number(s.depositsTodayCount ?? 0),
          depositsMonthAmount: Number(s.depositsMonthAmount ?? 0),
          depositsMonthCount: Number(s.depositsMonthCount ?? 0),
          withdrawalsTodayCount: Number(s.withdrawalsTodayCount ?? 0),
          withdrawalsTodayAmount: Number(s.withdrawalsTodayAmount ?? 0),
          withdrawalsMonthCount: Number(s.withdrawalsMonthCount ?? 0),
          withdrawalsMonthAmount: Number(s.withdrawalsMonthAmount ?? 0),
          pendingWithdrawals: Number(s.pendingWithdrawals ?? 0),
          netRevenue: Number(s.netRevenue ?? 0),
        })
      } catch {
        setKpiError('Erro de conexão ao carregar indicadores.')
      } finally {
        setKpiLoading(false)
      }
    }

    loadOverview()
  }, [])

  const socketRef = useRef<ReturnType<typeof socketIO> | null>(null)

  useEffect(() => {
    // Busca REST imediato como fallback inicial enquanto o WS conecta
    fetch(`${API_URL}/api/presence/online-count`)
      .then((r) => r.json())
      .then((d: { ok?: boolean; onlineCount?: number }) => {
        if (d?.ok) setOnlineCount(Number(d.onlineCount ?? 0))
      })
      .catch(() => {})

    // Conecta via WebSocket e escuta atualizações em tempo real
    const socket = socketIO(API_URL, {
      transports: ['websocket', 'polling'],
      reconnectionDelay: 2000,
      reconnectionAttempts: 10,
    })
    socketRef.current = socket

    socket.on('online-count', (data: { onlineCount?: number }) => {
      setOnlineCount(Number(data?.onlineCount ?? 0))
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [])

  useEffect(() => {
    const loadLatestWithdrawals = async () => {
      setWithdrawalsLoading(true)
      setWithdrawalsError('')

      try {
        const token =
          localStorage.getItem('token') ??
          sessionStorage.getItem('token') ??
          ''

        const res = await fetch(`${API_URL}/api/admin/withdrawals/latest?limit=10`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })

        const data = (await res.json()) as {
          ok?: boolean
          error?: string
          withdrawals?: AdminWithdrawalRow[]
        }

        if (!res.ok || !data?.ok) {
          setWithdrawalsError(data?.error ?? 'Falha ao carregar últimos saques.')
          return
        }

        setLatestWithdrawals(Array.isArray(data.withdrawals) ? data.withdrawals : [])
      } catch {
        setWithdrawalsError('Erro de conexão ao carregar últimos saques.')
      } finally {
        setWithdrawalsLoading(false)
      }
    }

    loadLatestWithdrawals()
  }, [])

  const mapStatusClass = (status: string) => {
    const normalized = String(status ?? '').toLowerCase()
    if (normalized === 'paid' || normalized === 'payment.paid') return 'paid'
    if (normalized === 'processing') return 'processing'
    return 'pending'
  }

  const mapStatusLabel = (status: string) => {
    const normalized = String(status ?? '').toLowerCase()
    if (normalized === 'paid' || normalized === 'payment.paid') return 'Pago'
    if (normalized === 'processing') return 'Processando'
    return 'Pendente'
  }

  return (
    <main className="admin-page">
      <AdminSidebar />
      <section className="admin-content">
        <header className="admin-header">
          <div>
            <h1>Painel do Administrador</h1>
            <p className="admin-subtitle">
              Controle total da plataforma em um painel centralizado.
            </p>
          </div>
          <div className="admin-header-meta">
            <span className="admin-chip admin-chip--online">
              <span className="admin-online-dot" />
              {onlineCount === null ? '...' : onlineCount} online agora
            </span>
            <span className="admin-chip">Nível Admin: {adminLevel}</span>
            <span className="admin-chip soft">{today}</span>
          </div>
        </header>

        <section className="admin-kpis">
          <article className="admin-kpi-card">
            <h3>Total de Usuários</h3>
            <strong>{kpiLoading ? '...' : kpi.activeUsers.toLocaleString('pt-BR')}</strong>
            <p>Contas cadastradas no total</p>
          </article>
          <article className="admin-kpi-card admin-kpi-card--highlight">
            <h3>Cadastros Hoje</h3>
            <strong>{kpiLoading ? '...' : kpi.registrationsToday.toLocaleString('pt-BR')}</strong>
            <p>Novos usuários registrados hoje</p>
          </article>
          <article className="admin-kpi-card">
            <h3>Saques Pendentes</h3>
            <strong>{kpiLoading ? '...' : kpi.pendingWithdrawals.toLocaleString('pt-BR')}</strong>
            <p>Solicitações pendentes/processando</p>
          </article>
          <article className="admin-kpi-card">
            <h3>Receita Líquida</h3>
            <strong>{kpiLoading ? '...' : formatBRL(kpi.netRevenue)}</strong>
            <p>Depósitos pagos - saques pagos</p>
          </article>
        </section>

        <section className="admin-kpis admin-kpis--split">
          <article className="admin-kpi-card admin-kpi-card--deposit">
            <h3>Depósitos — Hoje</h3>
            <strong>{kpiLoading ? '...' : formatBRL(kpi.depositsToday)}</strong>
            <p>{kpiLoading ? '...' : `${kpi.depositsTodayCount} transação(ões) paga(s)`}</p>
          </article>
          <article className="admin-kpi-card admin-kpi-card--deposit">
            <h3>Depósitos — Mês</h3>
            <strong>{kpiLoading ? '...' : formatBRL(kpi.depositsMonthAmount)}</strong>
            <p>{kpiLoading ? '...' : `${kpi.depositsMonthCount} transação(ões) paga(s)`}</p>
          </article>
          <article className="admin-kpi-card admin-kpi-card--withdraw">
            <h3>Saques — Hoje</h3>
            <strong>{kpiLoading ? '...' : formatBRL(kpi.withdrawalsTodayAmount)}</strong>
            <p>{kpiLoading ? '...' : `${kpi.withdrawalsTodayCount} solicitação(ões)`}</p>
          </article>
          <article className="admin-kpi-card admin-kpi-card--withdraw">
            <h3>Saques — Mês</h3>
            <strong>{kpiLoading ? '...' : formatBRL(kpi.withdrawalsMonthAmount)}</strong>
            <p>{kpiLoading ? '...' : `${kpi.withdrawalsMonthCount} solicitação(ões)`}</p>
          </article>
        </section>

        {kpiError ? <p className="admin-kpi-error">{kpiError}</p> : null}

        <section className="admin-grid">
          <article className="admin-panel">
            <div className="admin-panel-head">
              <h2>Atalhos de Gestão</h2>
              <span>Ações rápidas</span>
            </div>
            <div className="admin-shortcuts">
              <button type="button" onClick={() => navigate('/dashboard')}>Visão do App</button>
              <button type="button" onClick={() => navigate('/team-report')}>Relatório de Equipe</button>
              <button type="button" onClick={() => navigate('/adf/mini-tasks')}>Mini Tasks</button>
              <button type="button" onClick={() => navigate('/adf/withdraw-config')}>Configuração de Saque</button>
              <button type="button" onClick={() => navigate('/withdraw-password')}>Segurança de Saque</button>
            </div>
          </article>

          <article className="admin-panel">
            <div className="admin-panel-head">
              <h2>Status do Sistema</h2>
              <span>Monitoramento</span>
            </div>
            <ul className="admin-status-list">
              <li><b>API:</b> Operacional</li>
              <li><b>Banco de Dados:</b> Estável</li>
              <li><b>Webhooks:</b> Sincronizando</li>
              <li><b>Fila de Saques:</b> 27 pendentes</li>
            </ul>
          </article>

          <article className="admin-panel admin-panel-wide">
            <div className="admin-panel-head">
              <h2>Últimas Solicitações de Saque</h2>
              <span>Auditoria rápida</span>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Usuário</th>
                    <th>Valor</th>
                    <th>Status</th>
                    <th>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawalsLoading ? (
                    <tr>
                      <td colSpan={5}>Carregando saques...</td>
                    </tr>
                  ) : withdrawalsError ? (
                    <tr>
                      <td colSpan={5}>{withdrawalsError}</td>
                    </tr>
                  ) : latestWithdrawals.length === 0 ? (
                    <tr>
                      <td colSpan={5}>Sem saques recentes.</td>
                    </tr>
                  ) : (
                    latestWithdrawals.map((row) => (
                      <tr key={row.id}>
                        <td>#{row.id}</td>
                        <td>{row.user?.name || `Usuário #${row.user?.id ?? ''}`}</td>
                        <td>{formatBRL(row.amount)}</td>
                        <td>
                          <span className={`status ${mapStatusClass(row.status)}`}>
                            {mapStatusLabel(row.status)}
                          </span>
                        </td>
                        <td>{formatDateTime(row.paidAt ?? row.createdAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="admin-withdraw-cards">
              {withdrawalsLoading ? (
                <div className="admin-withdraw-card">Carregando saques...</div>
              ) : withdrawalsError ? (
                <div className="admin-withdraw-card">{withdrawalsError}</div>
              ) : latestWithdrawals.length === 0 ? (
                <div className="admin-withdraw-card">Sem saques recentes.</div>
              ) : (
                latestWithdrawals.map((row) => (
                  <article key={`card-${row.id}`} className="admin-withdraw-card">
                    <div className="admin-withdraw-row">
                      <strong>ID</strong>
                      <span>#{row.id}</span>
                    </div>
                    <div className="admin-withdraw-row">
                      <strong>Usuário</strong>
                      <span>{row.user?.name || `Usuário #${row.user?.id ?? ''}`}</span>
                    </div>
                    <div className="admin-withdraw-row">
                      <strong>Valor</strong>
                      <span>{formatBRL(row.amount)}</span>
                    </div>
                    <div className="admin-withdraw-row">
                      <strong>Status</strong>
                      <span className={`status ${mapStatusClass(row.status)}`}>
                        {mapStatusLabel(row.status)}
                      </span>
                    </div>
                    <div className="admin-withdraw-row">
                      <strong>Data</strong>
                      <span>{formatDateTime(row.paidAt ?? row.createdAt)}</span>
                    </div>
                  </article>
                ))
              )}
            </div>
          </article>
        </section>
      </section>
    </main>
  )
}
