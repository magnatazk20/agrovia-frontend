import { useEffect, useMemo, useState } from 'react'
import AdminSidebar from '../components/AdminSidebar'
import './Admin.css'
import './AdminUserWithdrawals.css'

type AdminWithdrawalRow = {
  id: number
  amount: number
  status: string
  holderName?: string
  holderCpf?: string
  pixKeyType?: string
  pixKey?: string
  externalId?: string | null
  providerTransactionId?: string | null
  createdAt?: string | null
  paidAt?: string | null
  user: {
    id: number
    name: string
    phone: string
  }
}

type ApiResponse = {
  ok?: boolean
  error?: string
  withdrawals?: AdminWithdrawalRow[]
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

const isNonPendingStatus = (status: string) => {
  const normalized = String(status ?? '').toLowerCase().trim()
  return normalized !== 'pending'
}

const mapStatusClass = (status: string) => {
  const normalized = String(status ?? '').toLowerCase().trim()
  if (normalized === 'paid' || normalized === 'payment.paid') return 'paid'
  if (normalized === 'processing') return 'pending'
  if (normalized === 'failed' || normalized === 'canceled' || normalized === 'cancelled') return 'danger'
  return 'pending'
}

const mapStatusLabel = (status: string) => {
  const normalized = String(status ?? '').toLowerCase().trim()
  if (normalized === 'paid' || normalized === 'payment.paid') return 'Pago'
  if (normalized === 'processing') return 'Processando'
  if (normalized === 'failed') return 'Falhou'
  if (normalized === 'canceled' || normalized === 'cancelled') return 'Cancelado'
  return String(status ?? '-').toUpperCase()
}

const maskCpf = (cpf: string) => {
  const digits = String(cpf ?? '').replace(/\D/g, '')
  if (digits.length !== 11) return cpf || '-'
  return `${digits.slice(0, 3)}.***.***-${digits.slice(9)}`
}

const mapPixTypeLabel = (type: string) => {
  const t = String(type ?? '').toUpperCase()
  if (t === 'CPF') return 'CPF'
  if (t === 'CNPJ') return 'CNPJ'
  if (t === 'EMAIL') return 'E-mail'
  if (t === 'TELEFONE') return 'Telefone'
  if (t === 'CHAVE_ALEATORIA') return 'Chave Aleatória'
  return type || '-'
}

function WithdrawalDetailModal({
  row,
  onClose,
}: {
  row: AdminWithdrawalRow
  onClose: () => void
}) {
  return (
    <div className="auw-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="auw-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auw-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="auw-modal-header">
          <h3 id="auw-modal-title">Detalhes do Saque #{row.id}</h3>
          <button className="auw-modal-close" type="button" onClick={onClose} aria-label="Fechar">✕</button>
        </div>

        <div className="auw-modal-body">
          <div className="auw-modal-section">
            <p className="auw-modal-section-title">Usuário</p>
            <div className="auw-modal-grid">
              <div className="auw-modal-field">
                <span className="auw-modal-label">Nome</span>
                <span className="auw-modal-value">{row.user?.name || `Usuário #${row.user?.id ?? ''}`}</span>
              </div>
              <div className="auw-modal-field">
                <span className="auw-modal-label">Telefone</span>
                <span className="auw-modal-value">{row.user?.phone || '-'}</span>
              </div>
              <div className="auw-modal-field">
                <span className="auw-modal-label">ID do Usuário</span>
                <span className="auw-modal-value">#{row.user?.id}</span>
              </div>
            </div>
          </div>

          <div className="auw-modal-section">
            <p className="auw-modal-section-title">Dados do Saque</p>
            <div className="auw-modal-grid">
              <div className="auw-modal-field">
                <span className="auw-modal-label">Valor</span>
                <span className="auw-modal-value auw-value-highlight">{formatBRL(row.amount)}</span>
              </div>
              <div className="auw-modal-field">
                <span className="auw-modal-label">Status</span>
                <span className={`status ${mapStatusClass(row.status)}`}>{mapStatusLabel(row.status)}</span>
              </div>
              <div className="auw-modal-field">
                <span className="auw-modal-label">Solicitado em</span>
                <span className="auw-modal-value">{formatDateTime(row.createdAt)}</span>
              </div>
              <div className="auw-modal-field">
                <span className="auw-modal-label">Pago em</span>
                <span className="auw-modal-value">{formatDateTime(row.paidAt)}</span>
              </div>
            </div>
          </div>

          <div className="auw-modal-section">
            <p className="auw-modal-section-title">Dados PIX</p>
            <div className="auw-modal-grid">
              <div className="auw-modal-field">
                <span className="auw-modal-label">Titular</span>
                <span className="auw-modal-value">{row.holderName || '-'}</span>
              </div>
              <div className="auw-modal-field">
                <span className="auw-modal-label">CPF</span>
                <span className="auw-modal-value">{maskCpf(row.holderCpf ?? '')}</span>
              </div>
              <div className="auw-modal-field">
                <span className="auw-modal-label">Tipo de chave</span>
                <span className="auw-modal-value">{mapPixTypeLabel(row.pixKeyType ?? '')}</span>
              </div>
              <div className="auw-modal-field auw-modal-field--full">
                <span className="auw-modal-label">Chave PIX</span>
                <span className="auw-modal-value auw-mono">{row.pixKey || '-'}</span>
              </div>
            </div>
          </div>

          <div className="auw-modal-section">
            <p className="auw-modal-section-title">Rastreamento</p>
            <div className="auw-modal-grid">
              <div className="auw-modal-field auw-modal-field--full">
                <span className="auw-modal-label">ID Externo</span>
                <span className="auw-modal-value auw-mono">{row.externalId || '-'}</span>
              </div>
              <div className="auw-modal-field auw-modal-field--full">
                <span className="auw-modal-label">ID Transação (provedor)</span>
                <span className="auw-modal-value auw-mono">{row.providerTransactionId || '-'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="auw-modal-footer">
          <button type="button" className="auw-modal-btn-close" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  )
}

export default function AdminUserWithdrawals() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rows, setRows] = useState<AdminWithdrawalRow[]>([])
  const [selected, setSelected] = useState<AdminWithdrawalRow | null>(null)

  // filtros
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const token = useMemo(
    () => localStorage.getItem('token') ?? sessionStorage.getItem('token') ?? '',
    []
  )

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')

      try {
        const res = await fetch(`${API_URL}/api/admin/withdrawals/latest?limit=500`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })

        const data = (await res.json()) as ApiResponse
        if (!res.ok || !data?.ok) {
          setError(data?.error ?? 'Falha ao carregar saques dos usuários.')
          setRows([])
          return
        }

        const allRows = Array.isArray(data.withdrawals) ? data.withdrawals : []
        const nonPending = allRows.filter((item) => isNonPendingStatus(item.status))
        setRows(nonPending)
      } catch {
        setError('Erro de conexão ao carregar saques dos usuários.')
        setRows([])
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [token])

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase()

    return rows.filter((row) => {
      // filtro de status
      if (statusFilter !== 'all') {
        const normalized = String(row.status ?? '').toLowerCase().trim()
        const isPaid = normalized === 'paid' || normalized === 'payment.paid'
        const isProcessing = normalized === 'processing'
        const isFailed = normalized === 'failed' || normalized === 'canceled' || normalized === 'cancelled'
        if (statusFilter === 'paid' && !isPaid) return false
        if (statusFilter === 'processing' && !isProcessing) return false
        if (statusFilter === 'failed' && !isFailed) return false
      }

      // filtro de busca
      if (!q) return true
      const haystack = [
        row.user?.name,
        row.user?.phone,
        String(row.user?.id ?? ''),
        String(row.id),
        String(row.amount),
        row.pixKey,
        row.holderName,
        row.externalId,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [rows, query, statusFilter])

  // KPIs
  const kpis = useMemo(() => {
    const paid = rows.filter((r) => {
      const n = String(r.status ?? '').toLowerCase()
      return n === 'paid' || n === 'payment.paid'
    })
    const failed = rows.filter((r) => {
      const n = String(r.status ?? '').toLowerCase()
      return n === 'failed' || n === 'canceled' || n === 'cancelled'
    })
    const processing = rows.filter((r) => String(r.status ?? '').toLowerCase() === 'processing')

    const totalPaid = paid.reduce((acc, r) => acc + Number(r.amount ?? 0), 0)
    const totalFailed = failed.reduce((acc, r) => acc + Number(r.amount ?? 0), 0)
    const totalProcessing = processing.reduce((acc, r) => acc + Number(r.amount ?? 0), 0)

    return {
      paidCount: paid.length,
      totalPaid,
      failedCount: failed.length,
      totalFailed,
      processingCount: processing.length,
      totalProcessing,
    }
  }, [rows])

  return (
    <main className="admin-page">
      <AdminSidebar />
      <section className="admin-content admin-users-page">
        <header className="admin-header">
          <div>
            <h1>Saques Usuários</h1>
            <p className="admin-subtitle">Histórico de saques dos usuários (exceto pendentes).</p>
          </div>
          <div className="admin-header-meta">
            <span className="admin-chip">Total: {rows.length}</span>
            <span className="admin-chip soft">Filtrados: {filteredRows.length}</span>
          </div>
        </header>

        {/* KPI Cards */}
        <div className="admin-kpi-grid" style={{ marginBottom: '1.5rem' }}>
          <div className="admin-kpi-card">
            <span className="admin-kpi-label">✅ Pagos</span>
            <strong className="admin-kpi-value" style={{ color: '#4ade80' }}>
              {kpis.paidCount} saque{kpis.paidCount !== 1 ? 's' : ''}
            </strong>
            <span className="admin-kpi-sub">{formatBRL(kpis.totalPaid)}</span>
          </div>
          <div className="admin-kpi-card">
            <span className="admin-kpi-label">⏳ Processando</span>
            <strong className="admin-kpi-value" style={{ color: '#facc15' }}>
              {kpis.processingCount} saque{kpis.processingCount !== 1 ? 's' : ''}
            </strong>
            <span className="admin-kpi-sub">{formatBRL(kpis.totalProcessing)}</span>
          </div>
          <div className="admin-kpi-card">
            <span className="admin-kpi-label">❌ Falhou/Cancelado</span>
            <strong className="admin-kpi-value" style={{ color: '#f87171' }}>
              {kpis.failedCount} saque{kpis.failedCount !== 1 ? 's' : ''}
            </strong>
            <span className="admin-kpi-sub">{formatBRL(kpis.totalFailed)}</span>
          </div>
        </div>

        {/* Filtros */}
        <section className="admin-panel admin-users-panel">
          <div className="admin-panel-head">
            <h2>Filtros</h2>
            <span>Busca e status</span>
          </div>
          <div className="admin-balance-adjust-grid">
            <label>
              Buscar
              <input
                className="admin-users-input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Nome, telefone, ID, valor, chave PIX..."
              />
            </label>
            <label>
              Status
              <select
                className="admin-users-input"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Todos</option>
                <option value="paid">Pago</option>
                <option value="processing">Processando</option>
                <option value="failed">Falhou / Cancelado</option>
              </select>
            </label>
          </div>
        </section>

        <section className="admin-panel admin-panel-wide">
          <div className="admin-panel-head">
            <h2>Saques (Não Pendentes)</h2>
            <span>
              {filteredRows.length} resultado{filteredRows.length !== 1 ? 's' : ''} —
              Total filtrado: {formatBRL(filteredRows.reduce((a, r) => a + Number(r.amount ?? 0), 0))}
            </span>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Usuário</th>
                  <th>Telefone</th>
                  <th>Valor</th>
                  <th>Status</th>
                  <th>Data</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7}>Carregando saques...</td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={7}>{error}</td>
                  </tr>
                ) : filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={7}>Nenhum saque encontrado com os filtros aplicados.</td>
                  </tr>
                ) : (
                  filteredRows.map((row) => (
                    <tr key={row.id}>
                      <td>#{row.id}</td>
                      <td>{row.user?.name || `Usuário #${row.user?.id ?? ''}`}</td>
                      <td>{row.user?.phone || '-'}</td>
                      <td>{formatBRL(row.amount)}</td>
                      <td>
                        <span className={`status ${mapStatusClass(row.status)}`}>{mapStatusLabel(row.status)}</span>
                      </td>
                      <td>{formatDateTime(row.paidAt ?? row.createdAt)}</td>
                      <td>
                        <button
                          type="button"
                          className="auw-detail-btn"
                          onClick={() => setSelected(row)}
                        >
                          Ver detalhes
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="admin-withdraw-cards">
            {loading ? (
              <p>Carregando saques...</p>
            ) : error ? (
              <p>{error}</p>
            ) : filteredRows.length === 0 ? (
              <p>Nenhum saque encontrado com os filtros aplicados.</p>
            ) : (
              filteredRows.map((row) => (
                <div key={row.id} className="admin-withdraw-card">
                  <div className="admin-withdraw-row">
                    <strong>ID</strong>
                    <span>#{row.id}</span>
                  </div>
                  <div className="admin-withdraw-row">
                    <strong>Usuário</strong>
                    <span>{row.user?.name || `Usuário #${row.user?.id ?? ''}`}</span>
                  </div>
                  <div className="admin-withdraw-row">
                    <strong>Telefone</strong>
                    <span>{row.user?.phone || '-'}</span>
                  </div>
                  <div className="admin-withdraw-row">
                    <strong>Valor</strong>
                    <span>{formatBRL(row.amount)}</span>
                  </div>
                  <div className="admin-withdraw-row">
                    <strong>Status</strong>
                    <span className={`status ${mapStatusClass(row.status)}`}>{mapStatusLabel(row.status)}</span>
                  </div>
                  <div className="admin-withdraw-row">
                    <strong>Data</strong>
                    <span>{formatDateTime(row.paidAt ?? row.createdAt)}</span>
                  </div>
                  <button
                    type="button"
                    className="auw-detail-btn auw-detail-btn--full"
                    onClick={() => setSelected(row)}
                  >
                    Ver detalhes
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      </section>

      {selected ? (
        <WithdrawalDetailModal row={selected} onClose={() => setSelected(null)} />
      ) : null}
    </main>
  )
}
