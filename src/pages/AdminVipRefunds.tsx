import { useEffect, useMemo, useState } from 'react'
import AdminSidebar from '../components/AdminSidebar'
import './Admin.css'

type VipRefund = {
  id: number
  userId: number
  userName: string
  userPhone: string
  oldVipLevelId: number
  oldVipName: string
  oldVipPrice: number
  newVipLevelId: number
  newVipName: string
  newVipPrice: number
  refundAmount: number
  status: string
  adminNote: string | null
  reviewedBy: number | null
  reviewedByName: string | null
  reviewedAt: string | null
  createdAt: string | null
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

export default function AdminVipRefunds() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionMsg, setActionMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [refunds, setRefunds] = useState<VipRefund[]>([])
  const [actingIds, setActingIds] = useState<number[]>([])
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const token = useMemo(
    () => localStorage.getItem('token') ?? sessionStorage.getItem('token') ?? '',
    []
  )

  const filteredRefunds = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return refunds.filter((r) => {
      const matchStatus = statusFilter === 'all' || r.status === statusFilter
      const matchTerm = !term
        || r.userName.toLowerCase().includes(term)
        || r.userPhone.toLowerCase().includes(term)
        || String(r.userId).includes(term)
        || r.oldVipName.toLowerCase().includes(term)
        || r.newVipName.toLowerCase().includes(term)
      return matchStatus && matchTerm
    })
  }, [refunds, statusFilter, searchTerm])

  const pendingCount = useMemo(() => refunds.filter((r) => r.status === 'pending').length, [refunds])
  const totalPendingAmount = useMemo(
    () => refunds.filter((r) => r.status === 'pending').reduce((acc, r) => acc + r.refundAmount, 0),
    [refunds]
  )

  const fetchRefunds = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_URL}/api/admin/vip-refunds`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = await res.json()
      if (!res.ok || !data?.ok) {
        setError(data?.error ?? 'Erro ao carregar estornos.')
        return
      }
      setRefunds(Array.isArray(data.refunds) ? data.refunds : [])
    } catch {
      setError('Erro de conexão ao carregar estornos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRefunds()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleAction = async (refundId: number, action: 'approve' | 'reject') => {
    if (actingIds.includes(refundId)) return
    setActingIds((prev) => [...prev, refundId])
    setActionMsg(null)

    try {
      const res = await fetch(`${API_URL}/api/admin/vip-refunds/${refundId}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (!res.ok || !data?.ok) {
        setActionMsg({ text: data?.error ?? `Erro ao ${action === 'approve' ? 'aprovar' : 'rejeitar'} estorno.`, type: 'error' })
        return
      }
      setActionMsg({ text: data?.message ?? `Estorno ${action === 'approve' ? 'aprovado' : 'rejeitado'} com sucesso.`, type: 'success' })
      fetchRefunds()
    } catch {
      setActionMsg({ text: 'Erro de conexão.', type: 'error' })
    } finally {
      setActingIds((prev) => prev.filter((id) => id !== refundId))
    }
  }

  const statusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente'
      case 'approved': return 'Aprovado'
      case 'rejected': return 'Rejeitado'
      default: return status
    }
  }

  const statusClass = (status: string) => {
    switch (status) {
      case 'pending': return 'pending'
      case 'approved': return 'paid'
      case 'rejected': return 'processing'
      default: return ''
    }
  }

  return (
    <main className="admin-page">
      <AdminSidebar />
      <div className="admin-content">
        <div className="admin-header">
          <div>
            <h1>Estornos VIP</h1>
            <p className="admin-subtitle">
              Gerencie os estornos de planos VIP quando um usuário troca de plano.
            </p>
          </div>
        </div>

        {/* KPIs */}
        <div className="apw-summary">
          <div className="apw-summary-card">
            <span className="apw-summary-label">Pendentes</span>
            <span className="apw-summary-value">{pendingCount}</span>
          </div>
          <div className="apw-summary-card apw-summary-card--amount">
            <span className="apw-summary-label">Total Pendente</span>
            <span className="apw-summary-value">{formatBRL(totalPendingAmount)}</span>
          </div>
        </div>

        {/* Mensagens */}
        {error && <div className="admin-kpi-error">{error}</div>}
        {actionMsg && (
          <div
            className="admin-kpi-error"
            style={actionMsg.type === 'success' ? { color: '#7cf0ba', borderColor: 'rgba(45,122,58,0.4)', background: 'rgba(45,122,58,0.15)' } : {}}
          >
            {actionMsg.text}
          </div>
        )}

        {/* Filtros */}
        <div className="admin-withdraw-filters" style={{ gridTemplateColumns: '1.3fr 1fr auto' }}>
          <div className="admin-withdraw-filter-field">
            <label>Buscar</label>
            <input
              type="text"
              className="admin-withdraw-filter-input"
              placeholder="Nome, telefone, plano..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="admin-withdraw-filter-field">
            <label>Status</label>
            <select
              className="admin-withdraw-filter-input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            >
              <option value="all">Todos</option>
              <option value="pending">Pendentes</option>
              <option value="approved">Aprovados</option>
              <option value="rejected">Rejeitados</option>
            </select>
          </div>
          <div className="admin-withdraw-filter-actions">
            <button
              type="button"
              className="btn"
              style={{ background: '#22355f', color: '#e8efff', border: '1px solid #3b5a99', borderRadius: 10, padding: '10px 16px', fontWeight: 700, cursor: 'pointer' }}
              onClick={fetchRefunds}
            >
              Atualizar
            </button>
          </div>
        </div>

        {loading ? (
          <div className="admin-panel" style={{ textAlign: 'center', padding: 24 }}>Carregando...</div>
        ) : filteredRefunds.length === 0 ? (
          <div className="admin-panel" style={{ textAlign: 'center', padding: 24, color: '#9cb0df' }}>
            Nenhum estorno encontrado.
          </div>
        ) : (
          <>
            {/* Tabela desktop */}
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Usuário</th>
                    <th>Plano Antigo</th>
                    <th>Plano Novo</th>
                    <th>Valor Estorno</th>
                    <th>Status</th>
                    <th>Data</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRefunds.map((r) => (
                    <tr key={r.id}>
                      <td>{r.id}</td>
                      <td>
                        <div style={{ lineHeight: 1.3 }}>
                          <strong>{r.userName}</strong>
                          <br />
                          <small style={{ color: '#7c92c4' }}>{r.userPhone}</small>
                        </div>
                      </td>
                      <td>
                        <div style={{ lineHeight: 1.3 }}>
                          <span>{r.oldVipName}</span>
                          <br />
                          <small style={{ color: '#7c92c4' }}>{formatBRL(r.oldVipPrice)}</small>
                        </div>
                      </td>
                      <td>
                        <div style={{ lineHeight: 1.3 }}>
                          <span>{r.newVipName}</span>
                          <br />
                          <small style={{ color: '#7c92c4' }}>{formatBRL(r.newVipPrice)}</small>
                        </div>
                      </td>
                      <td style={{ color: '#fb923c', fontWeight: 800 }}>{formatBRL(r.refundAmount)}</td>
                      <td>
                        <span className={`status ${statusClass(r.status)}`}>
                          {statusLabel(r.status)}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.82rem' }}>
                        {formatDate(r.createdAt)}
                        {r.reviewedAt && (
                          <>
                            <br />
                            <small style={{ color: '#7c92c4' }}>
                              Revisado: {formatDate(r.reviewedAt)}
                              {r.reviewedByName ? ` por ${r.reviewedByName}` : ''}
                            </small>
                          </>
                        )}
                      </td>
                      <td>
                        {r.status === 'pending' ? (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              type="button"
                              disabled={actingIds.includes(r.id)}
                              onClick={() => handleAction(r.id, 'approve')}
                              style={{
                                background: '#153d2a',
                                color: '#7cf0ba',
                                border: '1px solid #2d6e2e',
                                borderRadius: 8,
                                padding: '7px 14px',
                                fontWeight: 700,
                                fontSize: '0.82rem',
                                cursor: 'pointer',
                                opacity: actingIds.includes(r.id) ? 0.5 : 1,
                              }}
                            >
                              {actingIds.includes(r.id) ? '...' : 'Aprovar'}
                            </button>
                            <button
                              type="button"
                              disabled={actingIds.includes(r.id)}
                              onClick={() => handleAction(r.id, 'reject')}
                              style={{
                                background: '#3a1515',
                                color: '#fca5a5',
                                border: '1px solid #7f1d1d',
                                borderRadius: 8,
                                padding: '7px 14px',
                                fontWeight: 700,
                                fontSize: '0.82rem',
                                cursor: 'pointer',
                                opacity: actingIds.includes(r.id) ? 0.5 : 1,
                              }}
                            >
                              {actingIds.includes(r.id) ? '...' : 'Rejeitar'}
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: '#7c92c4', fontSize: '0.82rem' }}>
                            {r.adminNote || '—'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cards mobile */}
            <div className="admin-withdraw-cards">
              {filteredRefunds.map((r) => (
                <div key={r.id} className="admin-withdraw-card">
                  <div className="admin-withdraw-row">
                    <strong>#{r.id}</strong>
                    <span className={`status ${statusClass(r.status)}`}>{statusLabel(r.status)}</span>
                  </div>
                  <div className="admin-withdraw-row">
                    <strong>Usuário</strong>
                    <span>{r.userName} ({r.userPhone})</span>
                  </div>
                  <div className="admin-withdraw-row">
                    <strong>De</strong>
                    <span>{r.oldVipName} ({formatBRL(r.oldVipPrice)})</span>
                  </div>
                  <div className="admin-withdraw-row">
                    <strong>Para</strong>
                    <span>{r.newVipName} ({formatBRL(r.newVipPrice)})</span>
                  </div>
                  <div className="admin-withdraw-row">
                    <strong>Estorno</strong>
                    <span style={{ color: '#fb923c', fontWeight: 800 }}>{formatBRL(r.refundAmount)}</span>
                  </div>
                  <div className="admin-withdraw-row">
                    <strong>Data</strong>
                    <span>{formatDate(r.createdAt)}</span>
                  </div>
                  {r.status === 'pending' && (
                    <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                      <button
                        type="button"
                        disabled={actingIds.includes(r.id)}
                        onClick={() => handleAction(r.id, 'approve')}
                        style={{
                          flex: 1,
                          background: '#153d2a',
                          color: '#7cf0ba',
                          border: '1px solid #2d6e2e',
                          borderRadius: 8,
                          padding: '10px',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          textAlign: 'center',
                        }}
                      >
                        Aprovar
                      </button>
                      <button
                        type="button"
                        disabled={actingIds.includes(r.id)}
                        onClick={() => handleAction(r.id, 'reject')}
                        style={{
                          flex: 1,
                          background: '#3a1515',
                          color: '#fca5a5',
                          border: '1px solid #7f1d1d',
                          borderRadius: 8,
                          padding: '10px',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          textAlign: 'center',
                        }}
                      >
                        Rejeitar
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  )
}
