import { useEffect, useMemo, useState } from 'react'
import AdminSidebar from '../components/AdminSidebar'
import FloatingToast from '../components/FloatingToast'
import './Admin.css'

type CommissionLevel = {
  id?: number
  level: number
  name: string
  commissionPercent: number
  isActive: boolean
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

export default function AdminCommissionConfig() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [levels, setLevels] = useState<CommissionLevel[]>([])
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const token = useMemo(
    () => localStorage.getItem('token') ?? sessionStorage.getItem('token') ?? '',
    []
  )

  const loadLevels = async () => {
    if (!token) {
      setToast({ type: 'error', message: 'Token não encontrado. Faça login novamente.' })
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/admin/commission-levels`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data?.ok) {
        setToast({ type: 'error', message: String(data?.error ?? 'Erro ao carregar níveis de comissão.') })
        return
      }

      const normalized: CommissionLevel[] = Array.isArray(data?.levels)
        ? data.levels
            .map((item: any) => ({
              id: Number(item?.id ?? 0) || undefined,
              level: Number(item?.level ?? 0),
              name: String(item?.name ?? ''),
              commissionPercent: Number(item?.commissionPercent ?? item?.commission_percent ?? 0),
              isActive: Boolean(item?.isActive ?? item?.is_active ?? true),
            }))
            .filter((item: CommissionLevel) => Number.isFinite(item.level) && item.level > 0)
            .sort((a: CommissionLevel, b: CommissionLevel) => a.level - b.level)
        : []

      setLevels(normalized)
    } catch {
      setToast({ type: 'error', message: 'Falha de conexão ao carregar níveis de comissão.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLevels()
  }, [])

  const handleChange = (index: number, field: keyof CommissionLevel, value: string | boolean) => {
    setLevels((current) =>
      current.map((item, idx) => {
        if (idx !== index) return item
        if (field === 'level') {
          const numeric = Number(String(value).replace(',', '.'))
          return { ...item, level: Number.isFinite(numeric) ? numeric : 0 }
        }
        if (field === 'commissionPercent') {
          const numeric = Number(String(value).replace(',', '.'))
          return { ...item, commissionPercent: Number.isFinite(numeric) ? numeric : 0 }
        }
        if (field === 'isActive') {
          return { ...item, isActive: Boolean(value) }
        }
        return { ...item, [field]: String(value) }
      })
    )
  }

  const addLevel = () => {
    const nextLevel = levels.length > 0 ? Math.max(...levels.map((item) => item.level)) + 1 : 1
    setLevels((current) => [
      ...current,
      {
        level: nextLevel,
        name: `Nível ${nextLevel}`,
        commissionPercent: 0,
        isActive: true,
      },
    ])
  }

  const removeLevel = (index: number) => {
    setLevels((current) => current.filter((_, idx) => idx !== index))
  }

  const handleSave = async () => {
    if (!token) {
      setToast({ type: 'error', message: 'Token não encontrado. Faça login novamente.' })
      return
    }

    if (levels.length === 0) {
      setToast({ type: 'error', message: 'Adicione ao menos um nível de comissão.' })
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
        !Number.isFinite(item.commissionPercent) ||
        item.commissionPercent < 0 ||
        item.commissionPercent > 100
    )

    if (hasInvalid) {
      setToast({
        type: 'error',
        message: 'Revise os campos. Nível deve ser inteiro positivo e comissão entre 0 e 100.',
      })
      return
    }

    const uniqueLevels = new Set(normalized.map((item) => item.level))
    if (uniqueLevels.size !== normalized.length) {
      setToast({ type: 'error', message: 'Existem níveis duplicados. Ajuste antes de salvar.' })
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`${API_URL}/api/admin/commission-levels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ levels: normalized }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data?.ok) {
        setToast({ type: 'error', message: String(data?.error ?? 'Erro ao salvar níveis de comissão.') })
        return
      }

      setToast({ type: 'success', message: String(data?.message ?? 'Níveis de comissão salvos com sucesso.') })
      await loadLevels()
    } catch {
      setToast({ type: 'error', message: 'Falha de conexão ao salvar níveis de comissão.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="admin-page">
      <AdminSidebar />
      <section className="admin-content admin-users-page">
        <header className="admin-header">
          <div>
            <h1>Configuração de Comissão</h1>
            <p className="admin-subtitle">Defina os níveis de comissão e os percentuais de cada nível.</p>
          </div>
        </header>

        <section className="admin-panel admin-panel-wide">
          <div className="admin-panel-head">
            <h2>Níveis de Comissão</h2>
            <span>Gerencie os níveis e valores aplicados no sistema.</span>
          </div>

          {loading ? (
            <p className="admin-log-hint">Carregando níveis de comissão...</p>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {levels.map((item, index) => (
                <div
                  key={`${item.id ?? 'new'}-${index}`}
                  style={{
                    border: '1px solid #25375e',
                    borderRadius: 12,
                    padding: 12,
                    background: 'rgba(12, 20, 37, 0.72)',
                    display: 'grid',
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      display: 'grid',
                      gap: 10,
                      gridTemplateColumns: '120px minmax(180px, 1fr) 190px 130px auto',
                      alignItems: 'end',
                    }}
                  >
                    <div className="admin-withdraw-filter-field">
                      <label>Nível</label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        className="admin-withdraw-filter-input"
                        value={item.level}
                        onChange={(event) => handleChange(index, 'level', event.target.value)}
                      />
                    </div>

                    <div className="admin-withdraw-filter-field">
                      <label>Nome</label>
                      <input
                        type="text"
                        className="admin-withdraw-filter-input"
                        value={item.name}
                        onChange={(event) => handleChange(index, 'name', event.target.value)}
                        placeholder="Ex.: Nível 1"
                      />
                    </div>

                    <div className="admin-withdraw-filter-field">
                      <label>Comissão (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        className="admin-withdraw-filter-input"
                        value={item.commissionPercent}
                        onChange={(event) => handleChange(index, 'commissionPercent', event.target.value)}
                        placeholder="Ex.: 10.00"
                      />
                    </div>

                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontWeight: 600,
                        color: '#dbe7ff',
                        minHeight: 38,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={item.isActive}
                        onChange={(event) => handleChange(index, 'isActive', event.target.checked)}
                      />
                      Ativo
                    </label>

                    <button type="button" className="btn ghost" onClick={() => removeLevel(index)}>
                      Remover
                    </button>
                  </div>
                </div>
              ))}

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button type="button" className="btn ghost" onClick={addLevel} disabled={saving}>
                  Adicionar nível
                </button>
                <button type="button" className="btn primary" onClick={handleSave} disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar configuração'}
                </button>
                <button type="button" className="btn ghost" onClick={loadLevels} disabled={saving}>
                  Recarregar
                </button>
              </div>
            </div>
          )}
        </section>
      </section>

      <FloatingToast
        open={Boolean(toast?.message)}
        type={toast?.type ?? 'success'}
        message={toast?.message ?? ''}
        onClose={() => setToast(null)}
      />
    </main>
  )
}
