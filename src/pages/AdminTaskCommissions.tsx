import { useEffect, useMemo, useState } from 'react'
import AdminSidebar from '../components/AdminSidebar'
import FloatingToast from '../components/FloatingToast'
import './Admin.css'
import './AdminMiniTasks.css'

/* ── Tipos ── */

type CommissionLevel = {
  id?: number
  level: number
  name: string
  commissionPercent: number
  isActive: boolean
}

type TaskPayout = {
  id: number
  taskProgressId: number
  taskUserId: number
  taskUserName: string
  taskUserPhone: string
  beneficiaryUserId: number
  beneficiaryName: string
  beneficiaryPhone: string
  referralLevel: number
  commissionPercent: number
  baseAmount: number
  commissionAmount: number
  progressDate: string
  createdAt: string | null
}

type LevelSummary = {
  referralLevel: number
  totalPayouts: number
  totalAmount: number
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

const formatBRL = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function AdminTaskCommissions() {
  /* ── State: config de níveis ── */
  const [levels, setLevels] = useState<CommissionLevel[]>([])
  const [loadingLevels, setLoadingLevels] = useState(true)
  const [savingLevels, setSavingLevels] = useState(false)

  /* ── State: payouts ── */
  const [payouts, setPayouts] = useState<TaskPayout[]>([])
  const [summary, setSummary] = useState<LevelSummary[]>([])
  const [loadingPayouts, setLoadingPayouts] = useState(true)

  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const token = useMemo(
    () => localStorage.getItem('token') ?? sessionStorage.getItem('token') ?? '',
    []
  )

  /* ── Carregar níveis ── */
  const loadLevels = async () => {
    setLoadingLevels(true)
    try {
      const res = await fetch(`${API_URL}/api/admin/commission-levels`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.ok) {
        setToast({ type: 'error', message: data?.error ?? 'Erro ao carregar níveis.' })
        return
      }
      const normalized: CommissionLevel[] = Array.isArray(data?.levels)
        ? data.levels
            .map((item: any) => ({
              id: Number(item?.id ?? 0) || undefined,
              level: Number(item?.level ?? 0),
              name: String(item?.name ?? ''),
              commissionPercent: Number(item?.commissionPercent ?? 0),
              isActive: Boolean(item?.isActive ?? true),
            }))
            .filter((item: CommissionLevel) => item.level > 0)
            .sort((a: CommissionLevel, b: CommissionLevel) => a.level - b.level)
        : []
      setLevels(normalized)
    } catch {
      setToast({ type: 'error', message: 'Falha ao carregar níveis.' })
    } finally {
      setLoadingLevels(false)
    }
  }

  /* ── Carregar payouts ── */
  const loadPayouts = async () => {
    setLoadingPayouts(true)
    try {
      const res = await fetch(`${API_URL}/api/admin/task-commission-payouts?limit=200`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.ok) {
        setToast({ type: 'error', message: data?.error ?? 'Erro ao carregar comissões.' })
        return
      }
      setPayouts(Array.isArray(data.payouts) ? data.payouts : [])
      setSummary(Array.isArray(data.summary) ? data.summary : [])
    } catch {
      setToast({ type: 'error', message: 'Falha ao carregar comissões.' })
    } finally {
      setLoadingPayouts(false)
    }
  }

  useEffect(() => {
    loadLevels()
    loadPayouts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ── Handlers de edição ── */
  const handleChange = (index: number, field: keyof CommissionLevel, value: string | boolean) => {
    setLevels((current) =>
      current.map((item, idx) => {
        if (idx !== index) return item
        if (field === 'level') {
          const n = Number(String(value).replace(',', '.'))
          return { ...item, level: Number.isFinite(n) ? n : 0 }
        }
        if (field === 'commissionPercent') {
          const n = Number(String(value).replace(',', '.'))
          return { ...item, commissionPercent: Number.isFinite(n) ? n : 0 }
        }
        if (field === 'isActive') return { ...item, isActive: Boolean(value) }
        return { ...item, [field]: String(value) }
      })
    )
  }

  const addLevel = () => {
    const next = levels.length > 0 ? Math.max(...levels.map((l) => l.level)) + 1 : 1
    setLevels((c) => [...c, { level: next, name: `Nível ${next}`, commissionPercent: 0, isActive: true }])
  }

  const removeLevel = (index: number) => {
    setLevels((c) => c.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    if (levels.length === 0) {
      setToast({ type: 'error', message: 'Adicione ao menos um nível.' })
      return
    }

    const normalized = levels.map((item) => ({
      id: item.id,
      level: Number(item.level),
      name: String(item.name ?? '').trim(),
      commissionPercent: Number(Number(item.commissionPercent).toFixed(2)),
      isActive: Boolean(item.isActive),
    }))

    const hasInvalid = normalized.some(
      (item) =>
        !Number.isInteger(item.level) ||
        item.level <= 0 ||
        !item.name ||
        item.commissionPercent < 0 ||
        item.commissionPercent > 100
    )

    if (hasInvalid) {
      setToast({ type: 'error', message: 'Nível inteiro positivo, comissão entre 0 e 100.' })
      return
    }

    const unique = new Set(normalized.map((i) => i.level))
    if (unique.size !== normalized.length) {
      setToast({ type: 'error', message: 'Níveis duplicados.' })
      return
    }

    setSavingLevels(true)
    try {
      const res = await fetch(`${API_URL}/api/admin/commission-levels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ levels: normalized }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.ok) {
        setToast({ type: 'error', message: data?.error ?? 'Erro ao salvar.' })
        return
      }
      setToast({ type: 'success', message: data?.message ?? 'Salvo com sucesso.' })
      await loadLevels()
    } catch {
      setToast({ type: 'error', message: 'Falha ao salvar.' })
    } finally {
      setSavingLevels(false)
    }
  }

  const totalComissoes = summary.reduce((acc, s) => acc + s.totalAmount, 0)
  const totalPayoutsCount = summary.reduce((acc, s) => acc + s.totalPayouts, 0)

  return (
    <main className="admin-page admin-mini-tasks-page">
      <AdminSidebar />
      <section className="admin-content admin-users-page">
        <header className="admin-users-header">
          <div>
            <h1>Comissões de Tarefas</h1>
            <p>Configure os níveis de comissão e veja os pagamentos gerados pelas tarefas dos indicados.</p>
          </div>
        </header>

        <div className="admin-mini-wrap">
          {/* ── Card: Configuração de Níveis ── */}
          <article className="admin-mini-card">
            <h2 className="admin-mini-card-title">Configuração de Níveis de Comissão</h2>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: '0 0 12px' }}>
              Esses níveis se aplicam tanto a comissões de depósito quanto de tarefas.
            </p>

            {loadingLevels ? (
              <p style={{ color: '#94a3b8' }}>Carregando...</p>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {levels.map((item, index) => (
                  <div
                    key={`${item.id ?? 'new'}-${index}`}
                    className="admin-mini-form-grid"
                    style={{ padding: 10, border: '1px solid rgba(148,163,184,0.18)', borderRadius: 10 }}
                  >
                    <div className="admin-mini-field">
                      <label>Nível</label>
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={item.level}
                        onChange={(e) => handleChange(index, 'level', e.target.value)}
                      />
                    </div>
                    <div className="admin-mini-field">
                      <label>Nome</label>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleChange(index, 'name', e.target.value)}
                        placeholder="Ex: Nível 1"
                      />
                    </div>
                    <div className="admin-mini-field">
                      <label>Comissão (%)</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.01}
                        value={item.commissionPercent}
                        onChange={(e) => handleChange(index, 'commissionPercent', e.target.value)}
                      />
                    </div>
                    <label className="admin-mini-field-checkbox">
                      <input
                        type="checkbox"
                        checked={item.isActive}
                        onChange={(e) => handleChange(index, 'isActive', e.target.checked)}
                      />
                      <span>Ativo</span>
                    </label>
                    <div style={{ alignSelf: 'end' }}>
                      <button type="button" className="btn ghost" onClick={() => removeLevel(index)}>
                        Remover
                      </button>
                    </div>
                  </div>
                ))}

                <div className="admin-mini-actions">
                  <button type="button" className="btn ghost" onClick={addLevel} disabled={savingLevels}>
                    Adicionar nível
                  </button>
                  <button type="button" className="btn primary" onClick={handleSave} disabled={savingLevels}>
                    {savingLevels ? 'Salvando...' : 'Salvar configuração'}
                  </button>
                  <button type="button" className="btn ghost" onClick={loadLevels} disabled={savingLevels}>
                    Recarregar
                  </button>
                </div>
              </div>
            )}
          </article>

          {/* ── Card: Resumo de Comissões ── */}
          <article className="admin-mini-card">
            <h2 className="admin-mini-card-title">Resumo de Comissões por Nível</h2>

            {loadingPayouts ? (
              <p style={{ color: '#94a3b8' }}>Carregando...</p>
            ) : summary.length === 0 ? (
              <p style={{ color: '#94a3b8' }}>Nenhuma comissão de tarefa registrada ainda.</p>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                  <div style={{ background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.25)', borderRadius: 12, padding: 14 }}>
                    <p style={{ margin: 0, color: '#94a3b8', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Total pago</p>
                    <strong style={{ color: '#38bdf8', fontSize: '1.3rem' }}>{formatBRL(totalComissoes)}</strong>
                  </div>
                  <div style={{ background: 'rgba(250,204,21,0.08)', border: '1px solid rgba(250,204,21,0.25)', borderRadius: 12, padding: 14 }}>
                    <p style={{ margin: 0, color: '#94a3b8', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Pagamentos</p>
                    <strong style={{ color: '#fde68a', fontSize: '1.3rem' }}>{totalPayoutsCount}</strong>
                  </div>
                </div>

                <div className="admin-mini-table-wrap">
                  <table className="admin-mini-table">
                    <thead>
                      <tr>
                        <th>Nível</th>
                        <th>Pagamentos</th>
                        <th>Total pago</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.map((s) => (
                        <tr key={s.referralLevel}>
                          <td><span className="admin-mini-badge">Nível {s.referralLevel}</span></td>
                          <td>{s.totalPayouts}</td>
                          <td style={{ fontWeight: 700 }}>{formatBRL(s.totalAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </article>

          {/* ── Card: Histórico de Pagamentos ── */}
          <article className="admin-mini-card">
            <h2 className="admin-mini-card-title">
              Histórico de Pagamentos ({payouts.length})
              <button type="button" className="btn ghost" style={{ marginLeft: 10, fontSize: 12 }} onClick={loadPayouts}>
                Atualizar
              </button>
            </h2>

            {loadingPayouts ? (
              <p style={{ color: '#94a3b8' }}>Carregando...</p>
            ) : payouts.length === 0 ? (
              <p style={{ color: '#94a3b8' }}>Nenhum pagamento de comissão por tarefa registrado.</p>
            ) : (
              <div className="admin-mini-table-wrap">
                <table className="admin-mini-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Quem fez a tarefa</th>
                      <th>Quem recebeu</th>
                      <th>Nível</th>
                      <th>%</th>
                      <th>Base (R$)</th>
                      <th>Comissão (R$)</th>
                      <th>Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payouts.map((p) => (
                      <tr key={p.id}>
                        <td>{p.id}</td>
                        <td title={p.taskUserPhone}>
                          {p.taskUserName || p.taskUserPhone || `#${p.taskUserId}`}
                        </td>
                        <td title={p.beneficiaryPhone}>
                          {p.beneficiaryName || p.beneficiaryPhone || `#${p.beneficiaryUserId}`}
                        </td>
                        <td><span className="admin-mini-badge">Nv {p.referralLevel}</span></td>
                        <td>{p.commissionPercent}%</td>
                        <td>{formatBRL(p.baseAmount)}</td>
                        <td style={{ fontWeight: 700, color: '#4ade80' }}>{formatBRL(p.commissionAmount)}</td>
                        <td>{p.progressDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </article>
        </div>
      </section>

      {toast ? (
        <FloatingToast
          open={Boolean(toast)}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      ) : null}
    </main>
  )
}
