import { useEffect, useMemo, useState } from 'react'
import AdminSidebar from '../components/AdminSidebar'
import './Admin.css'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

type SecurityLog = {
  id: number
  eventType: string
  ip: string
  userAgent: string | null
  userId: number | null
  userName: string | null
  userPhone: string | null
  endpoint: string
  method: string
  attemptedUserId: number | null
  attemptedUserName: string | null
  attemptedUserPhone: string | null
  httpStatus: number
  reason: string
  extra: Record<string, unknown> | null
  createdAt: string | null
}

const formatDateTime = (value?: string | null) => {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString('pt-BR')
}

const EVENT_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  missing_token:       { label: 'Sem Token',         color: '#92400e', bg: '#fef3c7' },
  invalid_token:       { label: 'Token Inválido',    color: '#7c2d12', bg: '#fee2e2' },
  unauthorized_action: { label: 'Ação Não Permitida',color: '#991b1b', bg: '#fecaca' },
  rate_limit_exceeded: { label: 'Rate Limit',        color: '#1e3a5f', bg: '#dbeafe' },
}

const EventBadge = ({ eventType }: { eventType: string }) => {
  const cfg = EVENT_LABELS[eventType] ?? { label: eventType, color: '#475569', bg: '#f1f5f9' }
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 700,
      background: cfg.bg,
      color: cfg.color,
      whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  )
}

const StatusBadge = ({ status }: { status: number }) => {
  const color = status >= 500 ? '#991b1b' : status >= 400 ? '#92400e' : '#166534'
  const bg    = status >= 500 ? '#fee2e2' : status >= 400 ? '#fef3c7' : '#dcfce7'
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: 6,
      fontSize: 12,
      fontWeight: 800,
      background: bg,
      color,
    }}>
      {status}
    </span>
  )
}

export default function AdminSecurityLogs() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [logs, setLogs] = useState<SecurityLog[]>([])
  const [query, setQuery] = useState('')
  const [eventFilter, setEventFilter] = useState('all')
  const [selectedExtra, setSelectedExtra] = useState<{ id: number; extra: Record<string, unknown> | null } | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const token = localStorage.getItem('token') ?? sessionStorage.getItem('token') ?? ''
        const res = await fetch(`${API_URL}/api/admin/security-logs?limit=1000`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        const data = await res.json() as { ok?: boolean; logs?: SecurityLog[]; error?: string }
        if (!res.ok || !data?.ok) {
          setError(data?.error ?? 'Falha ao carregar logs de segurança.')
          setLogs([])
          return
        }
        setLogs(Array.isArray(data.logs) ? data.logs : [])
      } catch {
        setError('Erro de conexão ao carregar logs de segurança.')
        setLogs([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return logs.filter((row) => {
      if (eventFilter !== 'all' && row.eventType !== eventFilter) return false
      if (!q) return true
      return [row.ip, row.endpoint, row.reason, row.userName, row.userPhone, row.attemptedUserName, row.attemptedUserPhone, String(row.userId ?? ''), String(row.attemptedUserId ?? '')]
        .filter(Boolean).join(' ').toLowerCase().includes(q)
    })
  }, [logs, query, eventFilter])

  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    for (const row of logs) {
      c[row.eventType] = (c[row.eventType] ?? 0) + 1
    }
    return c
  }, [logs])

  return (
    <main className="admin-page">
      <AdminSidebar />
      <section className="admin-content admin-users-page">
        <header className="admin-header">
          <div>
            <h1>🛡️ Logs de Segurança</h1>
            <p className="admin-subtitle">Tentativas de acesso não autorizado, tokens inválidos e rate limit.</p>
          </div>
          <div className="admin-header-meta">
            <span className="admin-chip">Total: {filtered.length}</span>
          </div>
        </header>

        {/* KPIs */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', padding: '0 0 16px' }}>
          {Object.entries(EVENT_LABELS).map(([key, cfg]) => (
            <div key={key} style={{
              flex: '1 1 160px',
              background: cfg.bg,
              border: `1.5px solid ${cfg.color}33`,
              borderRadius: 12,
              padding: '12px 16px',
              cursor: 'pointer',
              outline: eventFilter === key ? `2px solid ${cfg.color}` : 'none',
            }} onClick={() => setEventFilter(eventFilter === key ? 'all' : key)}>
              <div style={{ fontSize: 22, fontWeight: 900, color: cfg.color }}>{counts[key] ?? 0}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: cfg.color, marginTop: 2 }}>{cfg.label}</div>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <section className="admin-panel admin-users-panel">
          <div className="admin-panel-head">
            <h2>Filtros</h2>
          </div>
          <div className="admin-balance-adjust-grid">
            <label>
              Buscar
              <input
                className="admin-users-input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="IP, endpoint, motivo, usuário..."
              />
            </label>
            <label>
              Tipo de Evento
              <select
                className="admin-users-input"
                value={eventFilter}
                onChange={(e) => setEventFilter(e.target.value)}
              >
                <option value="all">Todos</option>
                <option value="missing_token">Sem Token</option>
                <option value="invalid_token">Token Inválido</option>
                <option value="unauthorized_action">Ação Não Permitida</option>
                <option value="rate_limit_exceeded">Rate Limit</option>
              </select>
            </label>
            <label style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                type="button"
                className="btn ghost"
                onClick={() => { setQuery(''); setEventFilter('all') }}
              >
                Limpar filtros
              </button>
            </label>
          </div>
        </section>

        {loading ? <p className="admin-kpi-error">Carregando logs de segurança...</p> : null}
        {error ? <p className="admin-kpi-error">{error}</p> : null}

        <section className="admin-panel admin-panel-wide">
          <div className="admin-panel-head">
            <h2>Registros</h2>
            <span>{filtered.length} eventos</span>
          </div>
          <div className="admin-table-wrap" style={{ overflowX: 'auto' }}>
            <table className="admin-table" style={{ minWidth: 900 }}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Data/Hora</th>
                  <th>Evento</th>
                  <th>IP</th>
                  <th>Método</th>
                  <th>Endpoint</th>
                  <th>Status</th>
                  <th>Usuário Logado</th>
                  <th>Usuário Alvo</th>
                  <th>Motivo</th>
                  <th>Extra</th>
                </tr>
              </thead>
              <tbody>
                {!loading && filtered.length === 0 ? (
                  <tr><td colSpan={11} style={{ textAlign: 'center', padding: 24, color: '#94a3b8' }}>Nenhum evento encontrado.</td></tr>
                ) : (
                  filtered.map((row) => (
                    <tr key={row.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: 12 }}>#{row.id}</td>
                      <td style={{ whiteSpace: 'nowrap', fontSize: 12 }}>{formatDateTime(row.createdAt)}</td>
                      <td><EventBadge eventType={row.eventType} /></td>
                      <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{row.ip}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: 11, color: '#64748b' }}>{row.method}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: 11, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={row.endpoint}>{row.endpoint}</td>
                      <td><StatusBadge status={row.httpStatus} /></td>
                      <td style={{ fontSize: 12 }}>
                        {row.userId ? (
                          <div>
                            <div style={{ fontWeight: 600 }}>{row.userName ?? `#${row.userId}`}</div>
                            <div style={{ color: '#94a3b8', fontSize: 11 }}>{row.userPhone}</div>
                          </div>
                        ) : <span style={{ color: '#cbd5e1' }}>—</span>}
                      </td>
                      <td style={{ fontSize: 12 }}>
                        {row.attemptedUserId ? (
                          <div style={{ background: '#fef2f2', borderRadius: 6, padding: '2px 6px' }}>
                            <div style={{ fontWeight: 600, color: '#991b1b' }}>{row.attemptedUserName ?? `#${row.attemptedUserId}`}</div>
                            <div style={{ color: '#ef4444', fontSize: 11 }}>{row.attemptedUserPhone}</div>
                          </div>
                        ) : <span style={{ color: '#cbd5e1' }}>—</span>}
                      </td>
                      <td style={{ fontSize: 12, color: '#475569', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={row.reason}>{row.reason}</td>
                      <td>
                        {row.extra ? (
                          <button
                            type="button"
                            className="admin-toggle-logs-btn"
                            onClick={() => setSelectedExtra({ id: row.id, extra: row.extra })}
                          >
                            Ver
                          </button>
                        ) : <span style={{ color: '#cbd5e1', fontSize: 12 }}>—</span>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {selectedExtra ? (
          <div
            onClick={() => setSelectedExtra(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(2,6,23,0.66)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          >
            <section
              className="admin-panel admin-panel-wide"
              onClick={(e) => e.stopPropagation()}
              style={{ marginTop: 0, width: '100%', maxWidth: 600, maxHeight: '80vh', overflow: 'auto' }}
            >
              <div className="admin-panel-head">
                <h2>Extra — Log #{selectedExtra.id}</h2>
                <button type="button" className="admin-toggle-logs-btn" onClick={() => setSelectedExtra(null)}>Fechar</button>
              </div>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 13 }}>
                {JSON.stringify(selectedExtra.extra, null, 2)}
              </pre>
            </section>
          </div>
        ) : null}
      </section>
    </main>
  )
}
