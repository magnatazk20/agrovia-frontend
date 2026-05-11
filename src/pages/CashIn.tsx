import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import './CashIn.css'

type StorageUser = {
  id: number
  name: string
  phone: string
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

export default function CashIn() {
  const navigate = useNavigate()
  const [amount, setAmount] = useState('')
  const method = 'pix'
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [depositEnabled, setDepositEnabled] = useState(true)
  const [minDepositAmount, setMinDepositAmount] = useState(1)
  const [maxDepositAmount, setMaxDepositAmount] = useState(1000)
  const [quickAmounts, setQuickAmounts] = useState<number[]>([20, 50, 100, 200, 500])

  const user = useMemo(() => {
    const raw = localStorage.getItem('user') ?? sessionStorage.getItem('user')
    if (!raw) return null
    try {
      return JSON.parse(raw) as StorageUser
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    const loadDepositConfig = async () => {
      try {
        const token = localStorage.getItem('token') ?? sessionStorage.getItem('token')
        const response = await fetch(`${API_URL}/api/deposit-config`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        })

        const data = await response.json().catch(() => ({} as any))
        if (!response.ok || !data?.ok || !data?.config) return

        const cfg = data.config as {
          depositEnabled?: boolean
          minDepositAmount?: number
          maxDepositAmount?: number
          quickPresetValues?: Array<number | string>
        }

        const min = Number(cfg.minDepositAmount ?? 1)
        const max = Number(cfg.maxDepositAmount ?? 1000)
        const presets = Array.isArray(cfg.quickPresetValues)
          ? cfg.quickPresetValues
              .map((v) => Number(v))
              .filter((v) => Number.isFinite(v) && v > 0)
              .map((v) => Number(v.toFixed(2)))
          : []

        setDepositEnabled(Boolean(cfg.depositEnabled ?? true))
        setMinDepositAmount(Number.isFinite(min) && min >= 0 ? min : 1)
        setMaxDepositAmount(Number.isFinite(max) && max > 0 ? max : 1000)
        if (presets.length > 0) setQuickAmounts(presets)
      } catch {
        // mantém fallback local
      }
    }

    loadDepositConfig()
  }, [])

  const submitCashIn = async (event: FormEvent) => {
    event.preventDefault()
    setMessage(null)

    if (!user?.id) {
      setMessage({ type: 'error', text: 'Usuário não autenticado. Faça login novamente.' })
      return
    }

    const normalized = Number(amount.replace(',', '.'))
    if (!Number.isFinite(normalized) || normalized <= 0) {
      setMessage({ type: 'error', text: 'Informe um valor válido maior que zero.' })
      return
    }

    if (!depositEnabled) {
      setMessage({ type: 'error', text: 'Depósitos estão desativados no momento.' })
      return
    }

    if (normalized < minDepositAmount) {
      setMessage({ type: 'error', text: `Valor mínimo para depósito é R$ ${minDepositAmount.toFixed(2).replace('.', ',')}.` })
      return
    }

    if (maxDepositAmount > 0 && normalized > maxDepositAmount) {
      setMessage({ type: 'error', text: `Valor máximo para depósito é R$ ${maxDepositAmount.toFixed(2).replace('.', ',')}.` })
      return
    }

    try {
      setLoading(true)

      const response = await fetch(`${API_URL}/api/CASHIN/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, amount: normalized, method }),
      })

      const data = (await response.json()) as {
        message?: string
        error?: string
        transactionId?: string | number | null
        qrCode?: string
        provider?: {
          data?: {
            payment_data?: {
              qr_code_base64?: string
              qr_code_image?: string
            }
          }
        }
      }

      if (!response.ok) {
        setMessage({ type: 'error', text: data.error ?? 'Falha ao processar depósito.' })
        return
      }

      const qrImage =
        data.provider?.data?.payment_data?.qr_code_image ??
        data.provider?.data?.payment_data?.qr_code_base64 ??
        ''

      setAmount('')

      navigate('/cashin/checkout', {
        state: {
          amount: normalized,
          transactionId: data.transactionId ?? null,
          qrCode: data.qrCode ?? '',
          qrImage,
        },
      })
    } catch {
      setMessage({ type: 'error', text: 'Erro de conexão com servidor.' })
    } finally {
      setLoading(false)
    }
  }

  const normalized = Number(amount.replace(',', '.'))
  const displayValue = Number.isFinite(normalized) && normalized > 0 ? normalized : 0
  const minLabel = minDepositAmount.toFixed(2).replace('.', ',')

  return (
    <main className="cashin-page">
      <div className="cashin-wrap">
        {/* Header */}
        <div className="cashin-header">
          <button className="cashin-back-btn" onClick={() => navigate('/dashboard')}>
            ←
          </button>
          <div className="cashin-header-text">
            <h1>Depositar</h1>
            <p>Escolha o valor para recarregar</p>
          </div>
        </div>

        {/* Card valor */}
        <div className="cashin-card">
          <div className="cashin-valor-top">
            <div className="cashin-valor-label">
              <span>Valor do depósito</span>
              <small>mín. R$ {minLabel}</small>
            </div>
          </div>

          <div className="cashin-valor-input">
            <span className="cashin-valor-prefix">R$</span>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
        </div>

        {/* Chips rápidos */}
        <div className="cashin-chips">
          {quickAmounts.map((value) => (
            <button
              key={value}
              type="button"
              className={`cashin-chip ${displayValue === value ? 'active' : ''}`}
              onClick={() => setAmount(String(value))}
            >
              R$ {value}
            </button>
          ))}
        </div>

        {/* Card PIX */}
        <div className="cashin-card">
          <div className="cashin-pix-row">
            <div className="cashin-pix-icon">
              <svg viewBox="0 0 48 48" width="28" height="28" fill="none">
                <path d="M11.8 16.2 16.2 11.8a4 4 0 0 1 5.7 0L24 13.9l2.1-2.1a4 4 0 0 1 5.7 0l4.4 4.4a4 4 0 0 1 0 5.7L24 34 11.8 21.9a4 4 0 0 1 0-5.7Z" fill="#4caf50"/>
                <path d="M24 34 11.8 21.9a4 4 0 0 0 0 5.7l4.4 4.4a4 4 0 0 0 5.7 0L24 29.9l2.1 2.1a4 4 0 0 0 5.7 0l4.4-4.4a4 4 0 0 0 0-5.7L24 34Z" fill="#81c784" opacity="0.85"/>
                <circle cx="24" cy="24" r="2.4" fill="#ffffff"/>
              </svg>
            </div>
            <div className="cashin-pix-info">
              <strong>Pagamento PIX</strong>
              <p>Aprovação instantânea</p>
            </div>
            <div className="cashin-badge">Ativo</div>
          </div>
        </div>

        {/* Form */}
        <form className="cashin-card" onSubmit={submitCashIn}>
          {message && (
            <div className={`cashin-msg ${message.type}`}>{message.text}</div>
          )}
          <button
            type="submit"
            className="cashin-btn"
            disabled={loading || !amount || displayValue <= 0}
          >
            {loading ? (
              <span className="cashin-spinner" />
            ) : (
              <>Depositar R$ {displayValue > 0 ? displayValue.toFixed(2).replace('.', ',') : '0,00'}</>
            )}
          </button>
        </form>

        {/* Info */}
        <div className="cashin-info">
          <div className="cashin-info-item">
            <span>⚡</span>
            <span>Aprovação imediata</span>
          </div>
          <div className="cashin-info-item">
            <span>🔒</span>
            <span>Transação segura</span>
          </div>
          <div className="cashin-info-item">
            <span>📱</span>
            <span>100% online</span>
          </div>
        </div>
      </div>
    </main>
  )
}
