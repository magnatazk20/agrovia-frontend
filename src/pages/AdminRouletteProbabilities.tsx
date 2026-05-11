import { useEffect, useMemo, useState } from 'react'
import AdminSidebar from '../components/AdminSidebar'
import './AdminRouletteProbabilities.css'

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.trim() || 'http://localhost:3333'

type ProbabilityItem = {
  label: string
  percent: string
}

const DEFAULT_ITEMS: ProbabilityItem[] = [
  { label: '1 BRL', percent: '40' },
  { label: '16 BRL', percent: '20' },
  { label: '35 BRL', percent: '14' },
  { label: '50 BRL', percent: '10' },
  { label: '73 BRL', percent: '8' },
  { label: '90 BRL', percent: '5' },
  { label: '183 BRL', percent: '2' },
  { label: '16600 BRL', percent: '1' },
]

export default function AdminRouletteProbabilities() {
  const [items, setItems] = useState<ProbabilityItem[]>(DEFAULT_ITEMS)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)

  const totalPercent = useMemo(
    () => items.reduce((acc, item) => acc + (Number(String(item.percent).replace(',', '.')) || 0), 0),
    [items]
  )

  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    if (!token) return

    const loadConfig = async () => {
      setLoading(true)
      try {
        const res = await fetch(`${API_URL}/api/admin/roulette-probabilities`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json().catch(() => ({} as Record<string, unknown>))
        if (!res.ok) return
        const list = Array.isArray((data as { probabilities?: unknown[] }).probabilities)
          ? ((data as { probabilities: Array<Record<string, unknown>> }).probabilities ?? [])
          : []

        if (list.length > 0) {
          setItems(
            list.map((i) => ({
              label: String(i.label ?? ''),
              percent: String(i.percent ?? '0'),
            }))
          )
        }
      } finally {
        setLoading(false)
      }
    }

    loadConfig()
  }, [])

  const handleChange = (index: number, value: string) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, percent: value } : item)))
  }

  const handleSave = async () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    if (!token) {
      window.alert('Token não encontrado. Faça login novamente.')
      return
    }

    const parsed = items.map((item) => ({
      label: item.label,
      percent: Number(String(item.percent).replace(',', '.') || '0'),
    }))

    const hasInvalid = parsed.some((p) => !Number.isFinite(p.percent) || p.percent < 0)
    if (hasInvalid) {
      setIsError(true)
      setMessage('Todos os percentuais devem ser números válidos maiores ou iguais a 0.')
      return
    }

    try {
      setSaving(true)
      setMessage('')
      setIsError(false)
      const res = await fetch(`${API_URL}/api/admin/roulette-probabilities`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ probabilities: parsed }),
      })

      const data = await res.json().catch(() => ({} as Record<string, unknown>))
      if (!res.ok || !(data as { ok?: boolean })?.ok) {
        const err =
          typeof (data as { error?: string })?.error === 'string' && (data as { error?: string }).error!.trim()
            ? (data as { error?: string }).error!.trim()
            : `Erro HTTP ${res.status}: não foi possível salvar as probabilidades.`
        setIsError(true)
        setMessage(err)
        return
      }

      const success =
        typeof (data as { message?: string })?.message === 'string' && (data as { message?: string }).message!.trim()
          ? (data as { message?: string }).message!.trim()
          : 'Probabilidades salvas com sucesso.'
      setIsError(false)
      setMessage(success)
    } catch {
      setIsError(true)
      setMessage('Erro de conexão ao salvar probabilidades.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="admin-roulette-prob-page">
      <AdminSidebar />
      <section className="admin-roulette-prob-content">
        <div className="admin-roulette-prob-card">
          <h1 className="admin-roulette-prob-title">Probabilidades da Roleta</h1>
          <p className="admin-roulette-prob-subtitle">
            Configure a porcentagem de saída para cada prêmio da roleta. Itens com 0% nunca serão sorteados.
          </p>

          {loading ? <p className="admin-roulette-prob-feedback">Carregando configuração...</p> : null}

          <div className="admin-roulette-prob-grid">
            {items.map((item, index) => (
              <div key={item.label} className="admin-roulette-prob-row">
                <label className="admin-roulette-prob-label">{item.label}</label>
                <div className="admin-roulette-prob-input-wrap">
                  <input
                    className="admin-roulette-prob-input"
                    type="number"
                    min={0}
                    step="0.01"
                    value={item.percent}
                    onChange={(e) => handleChange(index, e.target.value)}
                  />
                  <span className="admin-roulette-prob-percent">%</span>
                </div>
              </div>
            ))}
          </div>

          <p className="admin-roulette-prob-total">
            Soma atual: <strong>{totalPercent.toFixed(2)}%</strong>
          </p>

          <div className="admin-roulette-prob-actions">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="admin-roulette-prob-save-btn"
            >
              {saving ? 'Salvando...' : 'Salvar Probabilidades'}
            </button>
          </div>

          {message ? (
            <p className={`admin-roulette-prob-feedback${isError ? ' admin-roulette-prob-feedback--error' : ''}`}>
              {message}
            </p>
          ) : null}
        </div>
      </section>
    </main>
  )
}
