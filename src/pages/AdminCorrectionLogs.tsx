import { useEffect, useMemo, useState } from 'react'
import AdminSidebar from '../components/AdminSidebar'
import './Admin.css'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

type CorrectionLogRow = {
  id: number
  userId: number | null
  userName: string | null
  userPhone: string | null
  currentBalance: number | null
  action: string
  oldBalance: number | null
  newBalance: number | null
  amount: number | null
  metadata: Record<string, unknown> | null
  createdAt: string | null
}

type CorrectionLogsResponse = {
  ok?: boolean
  total?: number
  logs?: CorrectionLogRow[]
  error?: string
}

const formatDateTime = (value?: string | null) => {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString('pt-BR')
}

const formatMoney = (value?: number | null) => {
  if (value == null || Number.isNaN(Number(value))) return '-'
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function AdminCorrectionLogs() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [logs, setLogs] = useState<CorrectionLogRow[]>([])
  const [query, setQuery] = useState('')
  const [selectedMetadata, setSelectedMetadata] = useState<{
    id: number
    metadata: Record<string, unknown> | null | undefined
  } | null>(null)

  useEffect(() => {
    const loadLogs = async () => {
      setLoading(true)
      setError('')
      try {
        const token =
          localStorage.getItem('token') ??
          sessionStorage.getItem('token') ??
          ''

        const res = await fetch(`${API_URL}/api/admin/correction-logs?limit=500`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })

        const data = (await res.json()) as CorrectionLogsResponse

        if (!res.ok || !data?.ok) {
          setError(data?.error ?? 'Falha ao carregar logs de correção.')
          setLogs([])
          return
        }

        setLogs(Array.isArray(data.logs) ? data.logs : [])
      } catch {
        setError('Erro de conexão ao carregar logs de correção.')
        setLogs([])
      } finally {
        setLoading(false)
      }
    }

    loadLogs()
  }, [])

  const filteredLogs = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return logs
    return logs.filter((row) => {
      const haystack = [
        row.userName,
        row.userPhone,
        String(row.userId ?? ''),
        String(row.amount ?? ''),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [logs, query])

  const totalDescontado = useMemo(
    () => filteredLogs.reduce((acc, row) => acc + Number(row.amount ?? 0), 0),
    [filteredLogs]
  )

  return (
    <main className="admin-page">
      <AdminSidebar />
      <section className="admin-content admin-users-page">
        <header className="admin-header">
          <div>
            <h1>🔧 Correções de Saldo</h1>
            <p className="admin-subtitle">
              Registros de usuários que receberam capital investido indevidamente ao encerrar ciclos.
            </p>
          </div>
          <div className="admin-header-meta">
            <span className="admin-chip">Total corrigidos: {filteredLogs.length}</span>
            <span className="admin-chip soft">Descontado: {formatMoney(totalDescontado)}</span>
          </div>
        </header>

        <section className="admin-panel admin-users-panel">
          <div className="admin-panel-head">
            <h2>Filtro</h2>
            <span>Busca por nome, telefone ou ID</span>
          </div>
          <div className="admin-balance-adjust-grid">
            <label>
              Buscar usuário
              <input
                className="admin-users-input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Nome, telefone, ID, valor..."
              />
            </label>
          </div>
        </section>

        {loading ? <p className="admin-kpi-error">Carregando logs de correção...</p> : null}
        {error ? <p className="admin-kpi-error">{error}</p> : null}

        {!loading && !error && filteredLogs.length === 0 ? (
          <section className="admin-panel">
            <p style={{ padding: '1.5rem', color: 'var(--text-muted, #888)', textAlign: 'center' }}>
              ✅ Nenhuma correção registrada. Ninguém recebeu capital indevido, ou o SQL de correção ainda não foi executado.
            </p>
          </section>
        ) : null}

        {filteredLogs.length > 0 ? (
          <section className="admin-panel admin-panel-wide">
            <div className="admin-panel-head">
              <h2>Lista de Correções</h2>
              <span>{filteredLogs.length} registro(s) encontrado(s)</span>
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Data Correção</th>
                    <th>Usuário</th>
                    <th>Telefone</th>
                    <th>Saldo Antes</th>
                    <th>Saldo Depois</th>
                    <th>Valor Descontado</th>
                    <th>Saldo Atual</th>
                    <th>Detalhes</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((row) => (
                    <tr key={row.id}>
                      <td>#{row.id}</td>
                      <td>{formatDateTime(row.createdAt)}</td>
                      <td>
                        <div style={{ display: 'grid', gap: 2 }}>
                          <strong>{row.userName ?? '-'}</strong>
                          <small style={{ color: 'var(--text-muted, #888)' }}>ID: {row.userId ?? '-'}</small>
                        </div>
                      </td>
                      <td>{row.userPhone ?? '-'}</td>
                      <td style={{ color: '#f87171' }}>{formatMoney(row.oldBalance)}</td>
                      <td style={{ color: '#4ade80' }}>{formatMoney(row.newBalance)}</td>
                      <td>
                        <span className="status pending">
                          -{formatMoney(row.amount)}
                        </span>
                      </td>
                      <td>{formatMoney(row.currentBalance)}</td>
                      <td>
                        <button
                          type="button"
                          className="admin-toggle-logs-btn"
                          onClick={() =>
                            setSelectedMetadata({ id: row.id, metadata: row.metadata })
                          }
                        >
                          Ver detalhes
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {selectedMetadata ? (
          <div
            onClick={() => setSelectedMetadata(null)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(2, 6, 23, 0.72)',
              zIndex: 1200,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
          >
            <section
              className="admin-panel admin-panel-wide"
              onClick={(e) => e.stopPropagation()}
              style={{
                marginTop: 0,
                width: '100%',
                maxWidth: 720,
                maxHeight: '80vh',
                overflow: 'auto',
              }}
            >
              <div className="admin-panel-head">
                <h2>Detalhes da correção #{selectedMetadata.id}</h2>
                <button
                  type="button"
                  className="admin-toggle-logs-btn"
                  onClick={() => setSelectedMetadata(null)}
                >
                  Fechar
                </button>
              </div>
              <pre style={{ margin: 0, padding: '1rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {selectedMetadata.metadata
                  ? JSON.stringify(selectedMetadata.metadata, null, 2)
                  : 'Sem detalhes disponíveis'}
              </pre>
            </section>
          </div>
        ) : null}
      </section>
    </main>
  )
}
