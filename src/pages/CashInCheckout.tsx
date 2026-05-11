import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import './CashInCheckout.css'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

type CheckoutState = {
  amount?: number
  transactionId?: string | number | null
  qrCode?: string
  qrImage?: string
}

type PaymentStatus = 'pending' | 'processing' | 'paid' | 'expired' | 'canceled' | 'failed'

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function getStatusInfo(status: PaymentStatus) {
  switch (status) {
    case 'paid':       return { label: 'Pago', icon: '✓', color: '#4caf50', bg: 'rgba(76,175,80,0.12)' }
    case 'processing': return { label: 'Processando', icon: '⟳', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' }
    case 'expired':    return { label: 'Expirado', icon: '✕', color: '#f87171', bg: 'rgba(248,113,113,0.12)' }
    case 'canceled':   return { label: 'Cancelado', icon: '✕', color: '#f87171', bg: 'rgba(248,113,113,0.12)' }
    case 'failed':     return { label: 'Falhou', icon: '✕', color: '#f87171', bg: 'rgba(248,113,113,0.12)' }
    default:           return { label: 'Aguardando', icon: '◷', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' }
  }
}

function updateStoredBalance(newBalance: number) {
  for (const storage of [localStorage, sessionStorage]) {
    const raw = storage.getItem('user')
    if (!raw) continue
    try {
      const user = JSON.parse(raw)
      user.balance = newBalance
      storage.setItem('user', JSON.stringify(user))
    } catch { /* ignora */ }
  }
}

export default function CashInCheckout() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const [copied, setCopied]         = useState(false)
  const [status, setStatus]         = useState<PaymentStatus>('pending')
  const [paidBalance, setPaidBalance] = useState<number | null>(null)
  const [paidMsg, setPaidMsg]       = useState(false)
  const [countdown, setCountdown]   = useState(600)
  const pollRef   = useRef<ReturnType<typeof setInterval> | null>(null)
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null)
  const ticksRef  = useRef(0)

  const data          = (location.state ?? {}) as CheckoutState
  const amount        = Number(data.amount ?? 0)
  const transactionId = String(data.transactionId ?? '')
  const pixCode       = (data.qrCode ?? '').trim()
  const qrImage       = (data.qrImage ?? '').trim()

  const generatedQrUrl = useMemo(() => {
    if (!pixCode) return ''
    return `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(pixCode)}&color=000000&bgcolor=FFFFFF&margin=2`
  }, [pixCode])

  const hasData = useMemo(() => amount > 0 && pixCode.length > 0, [amount, pixCode])

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
  }, [])

  const checkStatus = useCallback(async () => {
    if (!transactionId || transactionId === '-') return
    try {
      const res  = await fetch(`${API_URL}/api/cashin/status/${encodeURIComponent(transactionId)}`)
      const json = await res.json() as {
        ok?: boolean; status?: string; isPaid?: boolean; balance?: number | null
      }
      if (!res.ok || !json?.ok) return

      const newStatus = (json.status ?? 'pending') as PaymentStatus
      setStatus(newStatus)

      const isTerminal = ['paid', 'expired', 'canceled', 'failed'].includes(newStatus)

      if (json.isPaid) {
        stopPolling()
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
        if (json.balance != null) {
          updateStoredBalance(json.balance)
          setPaidBalance(json.balance)
        }
        setPaidMsg(true)
      } else if (isTerminal) {
        stopPolling()
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
      }
    } catch { /* silencia */ }
  }, [transactionId, stopPolling])

  useEffect(() => {
    if (!hasData || !transactionId || transactionId === '-') return
    ticksRef.current = 0
    pollRef.current = setInterval(() => {
      ticksRef.current++
      if (ticksRef.current > 120) { stopPolling(); return }
      checkStatus()
    }, 5000)
    checkStatus()

    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      stopPolling()
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    }
  }, [hasData, transactionId, checkStatus, stopPolling])

  const handleCopy = async () => {
    if (!pixCode) return
    try {
      await navigator.clipboard.writeText(pixCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch { setCopied(false) }
  }

  const statusInfo = getStatusInfo(status)
  const minutes = Math.floor(countdown / 60)
  const seconds = countdown % 60

  if (!hasData) {
    return (
      <main className="checkout-page">
        <div className="checkout-wrap">
          <div className="checkout-empty-card">
            <div className="checkout-empty-icon">❌</div>
            <h2>Pagamento não encontrado</h2>
            <p>Dados de cobrança não encontrados. Volte e gere um novo pagamento.</p>
            <div className="checkout-empty-actions">
              <button type="button" className="checkout-btn checkout-btn--secondary" onClick={() => navigate('/cashin')}>
                Novo depósito
              </button>
              <button type="button" className="checkout-btn checkout-btn--primary" onClick={() => navigate('/dashboard')}>
                Voltar ao início
              </button>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="checkout-page">
      <div className="checkout-wrap">
        {/* Header */}
        <div className="checkout-header">
          <button type="button" className="checkout-back-btn" onClick={() => navigate('/cashin')}>
            ←
          </button>
          <div className="checkout-header-text">
            <h1>Pagamento PIX</h1>
            <p>Depositar com segurança</p>
          </div>
          <div className="checkout-status-badge" style={{ background: statusInfo.bg, color: statusInfo.color }}>
            <span>{statusInfo.icon}</span>
            {statusInfo.label}
          </div>
        </div>

        {/* Sucesso */}
        {paidMsg && (
          <div className="checkout-success-card">
            <div className="checkout-success-icon">✅</div>
            <div className="checkout-success-text">
              <strong>Pagamento confirmado!</strong>
              <span>{paidBalance != null ? `Novo saldo: ${formatBRL(paidBalance)}` : 'Saldo atualizado.'}</span>
            </div>
            <button type="button" className="checkout-btn checkout-btn--success" onClick={() => navigate('/dashboard')}>
              Ir ao início
            </button>
          </div>
        )}

        {/* Card valor */}
        <div className="checkout-card checkout-amount-card">
          <span className="checkout-amount-label">Valor do depósito</span>
          <span className="checkout-amount-value">{formatBRL(amount)}</span>
          {status === 'pending' && countdown > 0 && (
            <span className="checkout-timer">
              ⏱ Expira em {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
          )}
        </div>

        {/* QR Code */}
        <div className="checkout-card checkout-qr-card">
          <div className="checkout-qr-frame">
            {generatedQrUrl ? (
              <img src={generatedQrUrl} alt="QR Code PIX" className="checkout-qr-img" />
            ) : qrImage ? (
              <img src={qrImage} alt="QR Code PIX" className="checkout-qr-img" />
            ) : (
              <div className="checkout-qr-fallback">QR Code indisponível</div>
            )}
          </div>
          <p className="checkout-qr-hint">Abra o app do seu banco e escaneie o QR Code</p>
        </div>

        {/* Divisor */}
        <div className="checkout-divider">
          <span className="checkout-divider-line" />
          <span className="checkout-divider-text">ou copie o código</span>
          <span className="checkout-divider-line" />
        </div>

        {/* PIX código */}
        <div className="checkout-card checkout-pix-section">
          <label className="checkout-pix-label">Código PIX Copia e Cola</label>
          <div className="checkout-pix-box">
            <div className="checkout-pix-code">{pixCode}</div>
          </div>
          <button
            type="button"
            className={`checkout-copy-btn ${copied ? 'checkout-copy-btn--copied' : ''}`}
            onClick={handleCopy}
          >
            {copied ? '✓ Código copiado!' : '📋 Copiar código PIX'}
          </button>
        </div>

        {/* Instruções */}
        <div className="checkout-card checkout-instructions">
          <h3 className="checkout-instructions-title">Como pagar</h3>
          <div className="checkout-step">
            <span className="checkout-step-num">1</span>
            <span className="checkout-step-text">Abra o app do seu banco ou carteira digital</span>
          </div>
          <div className="checkout-step">
            <span className="checkout-step-num">2</span>
            <span className="checkout-step-text">Escolha pagar com PIX e escaneie o QR Code ou cole o código</span>
          </div>
          <div className="checkout-step">
            <span className="checkout-step-num">3</span>
            <span className="checkout-step-text">Confirme o pagamento e aguarde a confirmação automática</span>
          </div>
        </div>

        {/* Info transação */}
        <div className="checkout-card checkout-tx-info">
          <div className="checkout-tx-row">
            <span className="checkout-tx-label">ID da transação</span>
            <span className="checkout-tx-value">{transactionId}</span>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="checkout-bottom-actions">
          <button type="button" className="checkout-btn checkout-btn--outline" onClick={() => navigate('/cashin')}>
            Novo pagamento
          </button>
          <button type="button" className="checkout-btn checkout-btn--primary" onClick={() => navigate('/dashboard')}>
            Voltar ao início
          </button>
        </div>
      </div>
    </main>
  )
}
