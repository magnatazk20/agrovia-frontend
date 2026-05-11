import { useEffect, useMemo, useState } from 'react'
import AdminSidebar from '../components/AdminSidebar'
import './Admin.css'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

type AdminLogRow = {
  id: number
  userId?: number | null
  oldBalance?: number | null
  newBalance?: number | null
  amount?: number | null
  level?: string
  source?: string
  action?: string
  message?: string
  createdAt?: string
  metadata?: Record<string, unknown> | null
  user?: {
    id?: number
    name?: string
    phone?: string
  } | null
}

type LogsResponse = {
  ok?: boolean
  logs?: AdminLogRow[]
  error?: string
}

const formatDateTime = (value?: string) => {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString('pt-BR')
}

const formatMoney = (value?: number | null) => {
  if (value == null || Number.isNaN(Number(value))) return '-'
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const mapLevelClass = (level?: string) => {
  const normalized = String(level ?? '').toLowerCase()
  if (normalized === 'error') return 'pending'
  if (normalized === 'warn' || normalized === 'warning') return 'processing'
  if (normalized === 'info') return 'paid'
  return 'pending'
}

export default function AdminLogs() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [logs, setLogs] = useState<AdminLogRow[]>([])
  const [query, setQuery] = useState('')
  const [levelFilter, setLevelFilter] = useState('all')
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

        const res = await fetch(`${API_URL}/api/admin/logs`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })

        const data = (await res.json()) as LogsResponse

        if (!res.ok || !data?.ok) {
          setError(data?.error ?? 'Falha ao carregar logs.')
          setLogs([])
          return
        }

        setLogs(Array.isArray(data.logs) ? data.logs : [])
      } catch {
        setError('Erro de conexão ao carregar logs.')
        setLogs([])
      } finally {
        setLoading(false)
      }
    }

    loadLogs()
  }, [])

  const filteredLogs = useMemo(() => {
    const q = query.trim().toLowerCase()

    return logs.filter((row) => {
      const levelOk = levelFilter === 'all' || String(row.level ?? '').toLowerCase() === levelFilter
      if (!levelOk) return false
      if (!q) return true

      const haystack = [
        row.message,
        row.action,
        row.source,
        row.level,
        row.user?.name,
        row.user?.phone,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(q)
    })
  }, [logs, query, levelFilter])

  return (
    <main className="admin-page">
      <AdminSidebar />
      <section className="admin-content admin-users-page">
        <header className="admin-header">
          <div>
            <h1>Logs do Sistema</h1>
            <p className="admin-subtitle">
              Visualização organizada dos eventos registrados no banco.
            </p>
          </div>
          <div className="admin-header-meta">
            <span className="admin-chip">Total: {filteredLogs.length}</span>
            <span className="admin-chip soft">Fonte: phpMyAdmin/API</span>
          </div>
        </header>

        <section className="admin-panel admin-users-panel">
          <div className="admin-panel-head">
            <h2>Filtros</h2>
            <span>Busca e nível de log</span>
          </div>

          <div className="admin-balance-adjust-grid">
            <label>
              Buscar
              <input
                className="admin-users-input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Mensagem, ação, fonte, usuário..."
              />
            </label>
            <label>
              Nível
              <select
                className="admin-users-input"
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
              >
                <option value="all">Todos</option>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="warn">Warn</option>
                <option value="error">Error</option>
              </select>
            </label>
          </div>
        </section>

        {loading ? <p className="admin-kpi-error">Carregando logs...</p> : null}
        {error ? <p className="admin-kpi-error">{error}</p> : null}

        <section className="admin-panel admin-panel-wide">
          <div className="admin-panel-head">
            <h2>Lista de Logs</h2>
            <span>Ordenação por carregamento atual</span>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Data</th>
                  <th>Nível</th>
                  <th>Ação</th>
                  <th>Mensagem</th>
                  <th>Usuário</th>
                  <th>Origem</th>
                  <th>Metadata</th>
                </tr>
              </thead>
              <tbody>
                {!loading && filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={8}>Nenhum log encontrado.</td>
                  </tr>
                ) : (
                  filteredLogs.map((row) => (
                    <tr key={row.id}>
                      <td>#{row.id}</td>
                      <td>{formatDateTime(row.createdAt)}</td>
                      <td>
                        <span className={`status ${mapLevelClass(row.level)}`}>
                          {row.level ?? '-'}
                        </span>
                      </td>
                      <td>{row.action ?? '-'}</td>
                      <td>
                        <div style={{ display: 'grid', gap: 2 }}>
                          <small><strong>{row.message ?? row.action ?? '-'}</strong></small>
                          <small>Saldo antigo: {formatMoney(row.oldBalance)}</small>
                          <small>Saldo novo: {formatMoney(row.newBalance)}</small>
                          <small>Valor: {formatMoney(row.amount)}</small>
                        </div>
                      </td>
                      <td>{row.userId ?? row.user?.id ?? row.user?.name ?? row.user?.phone ?? '-'}</td>
                      <td>{row.source ?? 'db'}</td>
                      <td>
                        <button
                          type="button"
                          className="admin-toggle-logs-btn"
                          onClick={() =>
                            setSelectedMetadata({
                              id: row.id,
                              metadata: row.metadata,
                            })
                          }
                        >
                          Ver metadata
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
        {selectedMetadata ? (
          <div
            onClick={() => setSelectedMetadata(null)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(2, 6, 23, 0.66)',
              zIndex: 1200,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
          >
            <section
              className="admin-panel admin-panel-wide"
              onClick={(event) => event.stopPropagation()}
              style={{
                marginTop: 0,
                width: '100%',
                maxWidth: 760,
                maxHeight: '80vh',
                overflow: 'auto',
              }}
            >
              <div className="admin-panel-head">
                <h2>Metadata do log #{selectedMetadata.id}</h2>
                <button
                  type="button"
                  className="admin-toggle-logs-btn"
                  onClick={() => setSelectedMetadata(null)}
                >
                  Fechar
                </button>
              </div>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {selectedMetadata.metadata
                  ? JSON.stringify(selectedMetadata.metadata, null, 2)
                  : 'Sem metadata'}
              </pre>
            </section>
          </div>
        ) : null}
      </section>
    </main>
  )
}
