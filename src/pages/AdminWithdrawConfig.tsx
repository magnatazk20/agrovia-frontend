import { useEffect, useMemo, useState } from 'react'
import AdminSidebar from '../components/AdminSidebar'
import FloatingToast from '../components/FloatingToast'
import './Admin.css'
import './AdminUsers.css'

type WithdrawConfigResponse = {
  ok?: boolean
  error?: string
  config?: {
    withdrawFeePercent: number
    minWithdrawAmount: number
    maxWithdrawAmount: number
    withdrawAutoApprove?: boolean
    withdrawStartTime?: string
    withdrawEndTime?: string
    withdrawAllowedDays?: string
  }
  message?: string
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

const weekDays = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda' },
  { value: 2, label: 'Terça' },
  { value: 3, label: 'Quarta' },
  { value: 4, label: 'Quinta' },
  { value: 5, label: 'Sexta' },
  { value: 6, label: 'Sábado' },
] as const

export default function AdminWithdrawConfig() {
  const token = useMemo(
    () => localStorage.getItem('token') ?? sessionStorage.getItem('token') ?? '',
    []
  )

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const [withdrawFeePercent, setWithdrawFeePercent] = useState('')
  const [minWithdrawAmount, setMinWithdrawAmount] = useState('')
  const [maxWithdrawAmount, setMaxWithdrawAmount] = useState('')
  const [withdrawAutoApprove, setWithdrawAutoApprove] = useState(false)
  const [withdrawStartTime, setWithdrawStartTime] = useState('00:00')
  const [withdrawEndTime, setWithdrawEndTime] = useState('23:59')
  const [withdrawAllowedDays, setWithdrawAllowedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6])

  const loadConfig = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/admin/withdraw-config`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      const data = (await res.json()) as WithdrawConfigResponse
      if (!res.ok || !data?.ok || !data.config) {
        const msg = data?.error ?? 'Falha ao carregar configurações de saque.'
        setToast({ type: 'error', message: msg })
        return
      }

      setWithdrawFeePercent(String(Number(data.config.withdrawFeePercent ?? 0)))
      setMinWithdrawAmount(String(Number(data.config.minWithdrawAmount ?? 0)))
      setMaxWithdrawAmount(String(Number(data.config.maxWithdrawAmount ?? 0)))
      setWithdrawAutoApprove(Boolean(data.config.withdrawAutoApprove))
      setWithdrawStartTime(String(data.config.withdrawStartTime ?? '00:00'))
      setWithdrawEndTime(String(data.config.withdrawEndTime ?? '23:59'))

      const parsedDays = String(data.config.withdrawAllowedDays ?? '0,1,2,3,4,5,6')
        .split(',')
        .map((day) => Number(day.trim()))
        .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)

      setWithdrawAllowedDays(parsedDays.length > 0 ? parsedDays : [0, 1, 2, 3, 4, 5, 6])
    } catch {
      const msg = 'Erro de conexão ao carregar configurações.'
      setToast({ type: 'error', message: msg })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadConfig()
  }, [])

  const saveConfig = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setToast(null)

    const fee = Number(String(withdrawFeePercent).replace(',', '.'))
    const min = Number(String(minWithdrawAmount).replace(',', '.'))
    const max = Number(String(maxWithdrawAmount).replace(',', '.'))
    const start = String(withdrawStartTime ?? '').trim()
    const end = String(withdrawEndTime ?? '').trim()
    const allowedDays = [...withdrawAllowedDays].sort((a, b) => a - b)

    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/

    if (!Number.isFinite(fee) || fee < 0) {
      const msg = 'Taxa de saque inválida.'
      setToast({ type: 'error', message: msg })
      return
    }

    if (!Number.isFinite(min) || min < 0) {
      const msg = 'Valor mínimo de saque inválido.'
      setToast({ type: 'error', message: msg })
      return
    }

    if (!Number.isFinite(max) || max <= 0) {
      const msg = 'Valor máximo de saque inválido.'
      setToast({ type: 'error', message: msg })
      return
    }

    if (min > max) {
      const msg = 'O valor mínimo não pode ser maior que o valor máximo.'
      setToast({ type: 'error', message: msg })
      return
    }

    if (!timeRegex.test(start) || !timeRegex.test(end)) {
      const msg = 'Horário inválido. Use o formato HH:MM.'
      setToast({ type: 'error', message: msg })
      return
    }

    if (allowedDays.length === 0) {
      const msg = 'Selecione ao menos um dia permitido para saque.'
      setToast({ type: 'error', message: msg })
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`${API_URL}/api/admin/withdraw-config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          withdrawFeePercent: fee,
          minWithdrawAmount: min,
          maxWithdrawAmount: max,
          withdrawAutoApprove,
          withdrawStartTime: start,
          withdrawEndTime: end,
          withdrawAllowedDays: allowedDays.join(','),
        }),
      })

      const data = (await res.json()) as WithdrawConfigResponse
      if (!res.ok || !data?.ok) {
        const msg = data?.error ?? 'Falha ao salvar configurações.'
        setToast({ type: 'error', message: msg })
        return
      }

      const msg = data?.message ?? 'Configurações salvas com sucesso.'
      setToast({ type: 'success', message: msg })
      await loadConfig()
    } catch {
      const msg = 'Erro de conexão ao salvar configurações.'
      setToast({ type: 'error', message: msg })
    } finally {
      setSaving(false)
    }
  }

  const toggleAllowedDay = (day: number) => {
    setWithdrawAllowedDays((prev) => {
      if (prev.includes(day)) return prev.filter((d) => d !== day)
      return [...prev, day].sort((a, b) => a - b)
    })
  }

  return (
    <main className="admin-page">
      <AdminSidebar />
      <section className="admin-content admin-users-page">
        <header className="admin-header">
          <div>
            <h1>Configuração de Saque</h1>
            <p className="admin-subtitle">Defina taxa, limites e se o saque será automático.</p>
          </div>
        </header>

        <section className="admin-panel admin-users-panel">
          {loading ? (
            <p>Carregando configurações...</p>
          ) : (
            <form className="admin-balance-adjust-form" onSubmit={saveConfig}>
              <div className="admin-balance-adjust-grid">
                <label>
                  <span>Taxa de saque (%)</span>
                  <input
                    type="text"
                    value={withdrawFeePercent}
                    onChange={(e) => setWithdrawFeePercent(e.target.value)}
                    inputMode="decimal"
                    placeholder="0"
                  />
                </label>

                <label>
                  <span>Valor mínimo de saque</span>
                  <input
                    type="text"
                    value={minWithdrawAmount}
                    onChange={(e) => setMinWithdrawAmount(e.target.value)}
                    inputMode="decimal"
                    placeholder="0,00"
                  />
                </label>

                <label>
                  <span>Valor máximo de saque</span>
                  <input
                    type="text"
                    value={maxWithdrawAmount}
                    onChange={(e) => setMaxWithdrawAmount(e.target.value)}
                    inputMode="decimal"
                    placeholder="0,00"
                  />
                </label>
              </div>

              <div className="admin-balance-adjust-grid" style={{ marginTop: 12 }}>
                <label>
                  <span>Horário de saque (início)</span>
                  <input
                    type="time"
                    value={withdrawStartTime}
                    onChange={(e) => setWithdrawStartTime(e.target.value)}
                  />
                </label>

                <label>
                  <span>Horário de saque (fim)</span>
                  <input
                    type="time"
                    value={withdrawEndTime}
                    onChange={(e) => setWithdrawEndTime(e.target.value)}
                  />
                </label>
              </div>

              <label style={{ display: 'block', marginTop: 12 }}>
                <span style={{ fontWeight: 600 }}>Dias permitidos para saque</span>
              </label>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 8 }}>
                {weekDays.map((day) => (
                  <label key={day.value} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input
                      type="checkbox"
                      checked={withdrawAllowedDays.includes(day.value)}
                      onChange={() => toggleAllowedDay(day.value)}
                    />
                    <span>{day.label}</span>
                  </label>
                ))}
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
                <input
                  type="checkbox"
                  checked={withdrawAutoApprove}
                  onChange={(e) => setWithdrawAutoApprove(e.target.checked)}
                />
                <span>
                  Permitir saques automáticos (quando ativado, não precisa aprovação em /adf/withdrawals/pending)
                </span>
              </label>

              <button type="submit" className="admin-toggle-logs-btn" disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar configurações'}
              </button>
            </form>
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
