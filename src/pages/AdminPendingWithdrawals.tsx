import { useEffect, useMemo, useState } from 'react'
import AdminSidebar from '../components/AdminSidebar'
import './Admin.css'

type PendingWithdrawal = {
  id: number
  amount: number
  status: string
  createdAt: string | null
  updatedAt: string | null
  paidAt: string | null
  feePercent?: number
  feeAmount?: number
  netAmount?: number
  holderCpf?: string
  pixKeyType?: string
  pixKey?: string
  holderName?: string
  user: {
    id: number
    name: string
    phone: string
  }
}

type CancelModalState = {
  open: boolean
  withdrawalId: number | null
}

type ApproveModalState = {
  open: boolean
  withdrawalId: number | null
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

const formatBRL = (value: number) =>
  Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const formatDate = (value?: string | null) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('pt-BR')
}

export default function AdminPendingWithdrawals() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [actionSuccess, setActionSuccess] = useState('')
  const [withdrawals, setWithdrawals] = useState<PendingWithdrawal[]>([])
  const [actingIds, setActingIds] = useState<number[]>([])
  const [cancelModal, setCancelModal] = useState<CancelModalState>({ open: false, withdrawalId: null })
  const [approveModal, setApproveModal] = useState<ApproveModalState>({ open: false, withdrawalId: null })
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'processing'>('all')
  const [minAmountFilter, setMinAmountFilter] = useState('')
  const [maxAmountFilter, setMaxAmountFilter] = useState('')

  const filteredWithdrawals = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    const minValue = Number(String(minAmountFilter).replace(',', '.'))
    const maxValue = Number(String(maxAmountFilter).replace(',', '.'))

    return withdrawals.filter((item) => {
      const matchesTerm = !term
        ? true
        : String(item.user?.name ?? '').toLowerCase().includes(term) ||
          String(item.user?.phone ?? '').toLowerCase().includes(term) ||
          String(item.id).includes(term)

      const normalizedStatus = String(item.status ?? '').toLowerCase()
      const matchesStatus = statusFilter === 'all' ? true : normalizedStatus === statusFilter

      const amount = Number(item.amount ?? 0)
      const matchesMin = !Number.isFinite(minValue) || minAmountFilter === '' ? true : amount >= minValue
      const matchesMax = !Number.isFinite(maxValue) || maxAmountFilter === '' ? true : amount <= maxValue

      return matchesTerm && matchesStatus && matchesMin && matchesMax
    })
  }, [withdrawals, searchTerm, statusFilter, minAmountFilter, maxAmountFilter])

  const pendingCount = useMemo(() => filteredWithdrawals.length, [filteredWithdrawals])

  const totalAmount = useMemo(
    () => filteredWithdrawals.reduce((acc, item) => acc + Number(item.amount ?? 0), 0),
    [filteredWithdrawals]
  )

  const totalAmountAll = useMemo(
    () => withdrawals.reduce((acc, item) => acc + Number(item.amount ?? 0), 0),
    [withdrawals]
  )

  const fetchPending = async () => {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('token') ?? sessionStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/admin/withdrawals/pending`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data?.ok) {
        const msg = String(data?.error ?? 'Não foi possível carregar os saques pendentes.')
        setError(msg)
        window.alert(msg)
        setWithdrawals([])
        return
      }

      setWithdrawals(Array.isArray(data.withdrawals) ? data.withdrawals : [])
    } catch {
      const msg = 'Falha de conexão ao carregar saques pendentes.'
      setError(msg)
      window.alert(msg)
      setWithdrawals([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPending()
  }, [])

  const setActing = (withdrawalId: number, value: boolean) => {
    setActingIds((prev) => {
      if (value) return prev.includes(withdrawalId) ? prev : [...prev, withdrawalId]
      return prev.filter((id) => id !== withdrawalId)
    })
  }

  const processAction = async (
    withdrawalId: number,
    action: 'approve' | 'cancel',
    refundOnCancel: boolean,
    provider?: 'syncpay' | 'connectpay'
  ) => {
    setActionError('')
    setActionSuccess('')
    setActing(withdrawalId, true)

    try {
      const token = localStorage.getItem('token') ?? sessionStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/admin/withdrawals/${withdrawalId}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action, refundOnCancel, provider }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data?.ok) {
        const msg = String(data?.error ?? 'Não foi possível processar a ação no saque.')
        setActionError(msg)
        window.alert(msg)
        return
      }

      const msg = String(data?.message ?? 'Ação executada com sucesso.')
      setActionSuccess(msg)
      window.alert(msg)
      await fetchPending()
    } catch (err) {
      const msg = `Falha de conexão ao processar ação do saque. (${String((err as Error)?.message ?? err)})`
      setActionError(msg)
      window.alert(msg)
    } finally {
      setActing(withdrawalId, false)
    }
  }

  return (
    <main className="admin-page">
      <AdminSidebar />
      <section className="admin-content admin-users-page">
        <header className="admin-header">
          <div>
            <h1>Saques Pendentes</h1>
            <p className="admin-subtitle">Lista de solicitações de saque aguardando processamento.</p>
          </div>
        </header>

        <section className="admin-panel admin-panel-wide">
          <div className="admin-panel-head">
            <h2>Fila de Saques</h2>
            <span>
              exibindo {pendingCount} de {withdrawals.length}
            </span>
          </div>

          <div className="apw-summary">
            <div className="apw-summary-card">
              <span className="apw-summary-label">Saques pendentes</span>
              <strong className="apw-summary-value">{withdrawals.length}</strong>
              {pendingCount !== withdrawals.length ? (
                <small className="apw-summary-sub">{pendingCount} com filtros</small>
              ) : null}
            </div>
            <div className="apw-summary-card apw-summary-card--amount">
              <span className="apw-summary-label">Total a pagar</span>
              <strong className="apw-summary-value">{formatBRL(totalAmountAll)}</strong>
              {pendingCount !== withdrawals.length ? (
                <small className="apw-summary-sub">{formatBRL(totalAmount)} com filtros</small>
              ) : null}
            </div>
          </div>

          <div className="admin-withdraw-filters">
            <div className="admin-withdraw-filter-field admin-withdraw-filter-search">
              <label htmlFor="pending-withdraw-search">Busca</label>
              <input
                id="pending-withdraw-search"
                type="text"
                className="admin-withdraw-filter-input"
                placeholder="Telefone, nome ou ID"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>

            <div className="admin-withdraw-filter-field">
              <label htmlFor="pending-withdraw-status">Status</label>
              <select
                id="pending-withdraw-status"
                className="admin-withdraw-filter-input"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as 'all' | 'pending' | 'processing')}
              >
                <option value="all">Todos</option>
                <option value="pending">Pendente</option>
                <option value="processing">Processando</option>
              </select>
            </div>

            <div className="admin-withdraw-filter-field">
              <label htmlFor="pending-withdraw-min">Valor mín.</label>
              <input
                id="pending-withdraw-min"
                type="text"
                className="admin-withdraw-filter-input"
                placeholder="0,00"
                value={minAmountFilter}
                onChange={(event) => setMinAmountFilter(event.target.value)}
              />
            </div>

            <div className="admin-withdraw-filter-field">
              <label htmlFor="pending-withdraw-max">Valor máx.</label>
              <input
                id="pending-withdraw-max"
                type="text"
                className="admin-withdraw-filter-input"
                placeholder="0,00"
                value={maxAmountFilter}
                onChange={(event) => setMaxAmountFilter(event.target.value)}
              />
            </div>

            <div className="admin-withdraw-filter-actions">
              <button
                type="button"
                className="btn ghost"
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('all')
                  setMinAmountFilter('')
                  setMaxAmountFilter('')
                }}
              >
                Limpar filtros
              </button>
            </div>
          </div>

          {loading ? <p className="admin-log-hint">Carregando saques pendentes...</p> : null}
          {!loading && error ? <p className="admin-log-hint">{error}</p> : null}
          {!loading && !error && withdrawals.length === 0 ? (
            <p className="admin-log-hint">Não há saques pendentes no momento.</p>
          ) : null}
          {!loading && !error && withdrawals.length > 0 && filteredWithdrawals.length === 0 ? (
            <p className="admin-log-hint">Nenhum saque encontrado com os filtros aplicados.</p>
          ) : null}

          {!loading && actionError ? <p className="admin-log-hint">{actionError}</p> : null}
          {!loading && actionSuccess ? <p className="admin-log-hint">{actionSuccess}</p> : null}

          {!loading && !error && filteredWithdrawals.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Usuário</th>
                    <th>Telefone</th>
                    <th>CPF</th>
                    <th>Chave PIX</th>
                    <th>Tipo PIX</th>
                    <th>Valor bruto</th>
                    <th>Taxa</th>
                    <th>Valor líquido</th>
                    <th>Status</th>
                    <th>Criado em</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWithdrawals.map((item) => {
                    const isActing = actingIds.includes(item.id)
                    return (
                      <tr key={item.id}>
                        <td>#{item.id}</td>
                        <td>{item.user?.name ?? '-'}</td>
                        <td>{item.user?.phone ?? '-'}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: 13 }}>
                          {item.holderCpf ? item.holderCpf : '-'}
                        </td>
                        <td style={{ fontFamily: 'monospace', fontSize: 12, maxWidth: 180, wordBreak: 'break-all' }}>
                          {item.pixKey ? item.pixKey : '-'}
                        </td>
                        <td style={{ fontSize: 12 }}>
                          {item.pixKeyType ? item.pixKeyType : '-'}
                        </td>
                        <td>{formatBRL(item.amount)}</td>
                        <td>
                          {typeof item.feeAmount === 'number'
                            ? `${formatBRL(item.feeAmount)} (${Number(item.feePercent ?? 0)}%)`
                            : '-'}
                        </td>
                        <td>{typeof item.netAmount === 'number' ? formatBRL(item.netAmount) : '-'}</td>
                        <td>{String(item.status ?? 'pending').toUpperCase()}</td>
                        <td>{formatDate(item.createdAt)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              className="btn primary"
                              disabled={isActing}
                              onClick={() => {
                                setApproveModal({ open: true, withdrawalId: item.id })
                              }}
                            >
                              {isActing ? 'Processando...' : 'Aprovar'}
                            </button>
                            <button
                              type="button"
                              className="btn ghost"
                              disabled={isActing}
                              onClick={() => setCancelModal({ open: true, withdrawalId: item.id })}
                            >
                              Cancelar
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : null}

          {approveModal.open ? (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(15, 23, 42, 0.52)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: 16,
              }}
            >
              <div
                style={{
                  width: '100%',
                  maxWidth: 440,
                  background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
                  borderRadius: 14,
                  border: '1px solid #dbe4f0',
                  boxShadow: '0 20px 40px rgba(2, 6, 23, 0.18)',
                  padding: 18,
                }}
              >
                <h3 style={{ margin: 0, color: '#0f172a', fontSize: 18 }}>Aprovar saque</h3>
                <p style={{ marginTop: 10, color: '#475569', lineHeight: 1.45 }}>
                  Confirme a aprovação deste saque para iniciar o processamento.
                </p>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 18 }}>
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={() => setApproveModal({ open: false, withdrawalId: null })}
                  >
                    Fechar
                  </button>
                  <button
                    type="button"
                    className="btn primary"
                    onClick={async () => {
                      if (!approveModal.withdrawalId) return
                      await processAction(approveModal.withdrawalId, 'approve', false, 'connectpay')
                      setApproveModal({ open: false, withdrawalId: null })
                    }}
                  >
                    Aprovar
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {cancelModal.open ? (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(15, 23, 42, 0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: 16,
              }}
            >
              <div
                style={{
                  width: '100%',
                  maxWidth: 440,
                  background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
                  borderRadius: 14,
                  border: '1px solid #dbe4f0',
                  boxShadow: '0 20px 40px rgba(2, 6, 23, 0.18)',
                  padding: 18,
                }}
              >
                <h3 style={{ margin: 0, color: '#0f172a', fontSize: 18 }}>Cancelar saque</h3>
                <p style={{ marginTop: 10, color: '#475569', lineHeight: 1.45 }}>
                  Deseja estornar o valor para o saldo do usuário?
                </p>

                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 14, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn ghost"
                    style={{
                      background: '#e2e8f0',
                      color: '#0f172a',
                      borderColor: '#cbd5e1',
                    }}
                    onClick={() => setCancelModal({ open: false, withdrawalId: null })}
                  >
                    Fechar
                  </button>
                  <button
                    type="button"
                    className="btn ghost"
                    style={{
                      background: '#fef3c7',
                      color: '#7c2d12',
                      borderColor: '#fcd34d',
                    }}
                    onClick={async () => {
                      if (!cancelModal.withdrawalId) return
                      await processAction(cancelModal.withdrawalId, 'cancel', false)
                      setCancelModal({ open: false, withdrawalId: null })
                    }}
                  >
                    Cancelar sem estorno
                  </button>
                  <button
                    type="button"
                    className="btn primary"
                    style={{
                      background: '#dc2626',
                      color: '#ffffff',
                      borderColor: '#b91c1c',
                    }}
                    onClick={async () => {
                      if (!cancelModal.withdrawalId) return
                      await processAction(cancelModal.withdrawalId, 'cancel', true)
                      setCancelModal({ open: false, withdrawalId: null })
                    }}
                  >
                    Cancelar e estornar
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </section>
      </section>
    </main>
  )
}
