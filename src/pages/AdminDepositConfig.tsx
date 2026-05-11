import { useEffect, useState } from 'react'
import AdminSidebar from '../components/AdminSidebar'
import FloatingToast from '../components/FloatingToast'
import './Admin.css'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

export default function AdminDepositConfig() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [minDepositAmount, setMinDepositAmount] = useState('0')
  const [maxDepositAmount, setMaxDepositAmount] = useState('0')
  const [depositEnabled, setDepositEnabled] = useState(true)
  const [quickPresetValues, setQuickPresetValues] = useState('20,50,100,200,500')
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const fetchConfig = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token') ?? sessionStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/admin/deposit-config`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data?.ok) {
        setToast({ type: 'error', message: String(data?.error ?? 'Erro ao carregar configuração de depósitos.') })
        return
      }

      setMinDepositAmount(String(Number(data?.config?.minDepositAmount ?? 0)))
      setMaxDepositAmount(String(Number(data?.config?.maxDepositAmount ?? 0)))
      setDepositEnabled(Boolean(data?.config?.depositEnabled ?? true))
      const serverPresets = data?.config?.quickPresetValues
      if (Array.isArray(serverPresets) && serverPresets.length > 0) {
        const normalized = serverPresets
          .map((value: unknown) => Number(value))
          .filter((value: number) => Number.isFinite(value) && value > 0)
        if (normalized.length > 0) {
          setQuickPresetValues(normalized.join(','))
        }
      }
    } catch {
      setToast({ type: 'error', message: 'Falha de conexão ao carregar configuração de depósitos.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConfig()
  }, [])

  const handleSave = async () => {
    const min = Number(String(minDepositAmount).replace(',', '.'))
    const max = Number(String(maxDepositAmount).replace(',', '.'))

    if (!Number.isFinite(min) || min < 0) {
      setToast({ type: 'error', message: 'Valor mínimo inválido.' })
      return
    }

    if (!Number.isFinite(max) || max < 0) {
      setToast({ type: 'error', message: 'Valor máximo inválido.' })
      return
    }

    if (max > 0 && min > max) {
      setToast({ type: 'error', message: 'Valor mínimo não pode ser maior que o máximo.' })
      return
    }

    const normalizedPresets = String(quickPresetValues)
      .split(',')
      .map((item) => Number(item.trim().replace(',', '.')))
      .filter((value) => Number.isFinite(value) && value > 0)
      .map((value) => Number(value.toFixed(2)))

    if (normalizedPresets.length === 0) {
      setToast({ type: 'error', message: 'Informe ao menos um valor pré-selecionado válido.' })
      return
    }

    setSaving(true)
    try {
      const token = localStorage.getItem('token') ?? sessionStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/admin/deposit-config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          minDepositAmount: Number(min.toFixed(2)),
          maxDepositAmount: Number(max.toFixed(2)),
          depositEnabled,
          quickPresetValues: normalizedPresets,
        }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data?.ok) {
        setToast({ type: 'error', message: String(data?.error ?? 'Erro ao salvar configuração de depósitos.') })
        return
      }

      setToast({ type: 'success', message: String(data?.message ?? 'Configuração de depósitos salva com sucesso.') })
      setMinDepositAmount(String(Number(data?.config?.minDepositAmount ?? min)))
      setMaxDepositAmount(String(Number(data?.config?.maxDepositAmount ?? max)))
      setDepositEnabled(Boolean(data?.config?.depositEnabled ?? depositEnabled))
      const persistedPresets = data?.config?.quickPresetValues
      if (Array.isArray(persistedPresets) && persistedPresets.length > 0) {
        const normalized = persistedPresets
          .map((value: unknown) => Number(value))
          .filter((value: number) => Number.isFinite(value) && value > 0)
        if (normalized.length > 0) {
          setQuickPresetValues(normalized.join(','))
        }
      } else {
        setQuickPresetValues(normalizedPresets.join(','))
      }
    } catch {
      setToast({ type: 'error', message: 'Falha de conexão ao salvar configuração de depósitos.' })
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
            <h1>Config Depósitos</h1>
            <p className="admin-subtitle">Defina valor mínimo e máximo permitido para depósitos.</p>
          </div>
        </header>

        <section className="admin-panel admin-panel-wide" style={{ maxWidth: 560 }}>
          {loading ? (
            <p className="admin-log-hint">Carregando configurações...</p>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              <div className="admin-withdraw-filter-field">
                <label htmlFor="min-deposit">Valor mínimo de depósito</label>
                <input
                  id="min-deposit"
                  type="number"
                  min="0"
                  step="0.01"
                  className="admin-withdraw-filter-input"
                  value={minDepositAmount}
                  onChange={(event) => setMinDepositAmount(event.target.value)}
                  placeholder="Ex.: 20.00"
                />
              </div>

              <div className="admin-withdraw-filter-field">
                <label htmlFor="max-deposit">Valor máximo de depósito</label>
                <input
                  id="max-deposit"
                  type="number"
                  min="0"
                  step="0.01"
                  className="admin-withdraw-filter-input"
                  value={maxDepositAmount}
                  onChange={(event) => setMaxDepositAmount(event.target.value)}
                  placeholder="Ex.: 1000.00"
                />
              </div>

              <div className="admin-withdraw-filter-field">
                <label htmlFor="quick-presets">Botões pré-selecionados no /cashin</label>
                <input
                  id="quick-presets"
                  type="text"
                  className="admin-withdraw-filter-input"
                  value={quickPresetValues}
                  onChange={(event) => setQuickPresetValues(event.target.value)}
                  placeholder="Ex.: 20,50,100,200,500"
                />
                <small style={{ color: '#94a3b8' }}>
                  Separe por vírgula. Exemplo: 20,50,100,200,500
                </small>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={depositEnabled}
                    onChange={(event) => setDepositEnabled(event.target.checked)}
                  />
                  Depósitos ativos
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className="btn primary" onClick={handleSave} disabled={saving}>
                    {saving ? 'Salvando...' : 'Salvar configuração'}
                  </button>
                  <button type="button" className="btn ghost" onClick={fetchConfig} disabled={saving}>
                    Recarregar
                  </button>
                </div>
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
