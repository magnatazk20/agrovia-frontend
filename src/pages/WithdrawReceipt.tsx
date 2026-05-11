import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import AppBottomNav from '../components/AppBottomNav'
import './WithdrawReceipt.css'

type ReceiptState = {
  amount: number
  feePercent?: number
  feeValue?: number
  netAmount?: number
  requestedAt: string
  receiptCode?: string | null
  externalId?: string | null
  walletType?: 'balance' | 'commission'
  pixKey?: string
  pixType?: string
  holderCpf?: string
}

const formatBRL = (value: number) =>
  Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const maskValue = (value: string) => {
  const raw = (value ?? '').trim()
  if (!raw) return '—'
  if (raw.includes('@')) {
    const [user, domain] = raw.split('@')
    if (!user) return `***@${domain}`
    const visible = user.slice(0, 2)
    return `${visible}${'*'.repeat(Math.max(3, user.length - 2))}@${domain}`
  }
  if (raw.length <= 4) return '*'.repeat(raw.length)
  const start = raw.slice(0, 3)
  const end = raw.slice(-2)
  const middle = '*'.repeat(Math.max(3, raw.length - 5))
  return `${start}${middle}${end}`
}

const pixTypeLabel = (type?: string) => {
  switch (type) {
    case 'CPF': return 'CPF'
    case 'CNPJ': return 'CNPJ'
    case 'EMAIL': return 'E-mail'
    case 'TELEFONE': return 'Telefone'
    case 'CHAVE_ALEATORIA': return 'Chave aleatória'
    default: return 'Chave PIX'
  }
}

export default function WithdrawReceipt() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state ?? null) as ReceiptState | null
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60)
    return () => clearTimeout(t)
  }, [])

  if (!state) {
    return (
      <main className="wr-page">
        <div className="wr-empty">
          <div className="wr-empty__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
              <path d="M9 15h6" />
            </svg>
          </div>
          <h2>Comprovante indisponível</h2>
          <p>Nenhum comprovante encontrado.</p>
          <button type="button" className="wr-action-btn wr-action-btn--primary" onClick={() => navigate('/saque')}>
            Voltar para Saque
          </button>
        </div>
        <AppBottomNav />
      </main>
    )
  }

  const dateStr = new Date(state.requestedAt).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  return (
    <main className="wr-page">
      {/* ── Hero verde com valor ── */}
      <div className={`wr-hero ${visible ? 'wr-hero--visible' : ''}`}>
        <div className="wr-hero__glow" aria-hidden="true" />

        {/* Ícone de sucesso animado */}
        <div className="wr-hero__check-ring">
          <div className="wr-hero__check">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>

        <span className="wr-hero__label">Você vai receber</span>
        <strong className="wr-hero__amount">{formatBRL(state.netAmount ?? state.amount)}</strong>
        {state.netAmount !== undefined && state.netAmount !== state.amount ? (
          <span className="wr-hero__original">de {formatBRL(state.amount)} solicitados</span>
        ) : null}
        <span className="wr-hero__date">{dateStr}</span>

        {/* Ondulação decorativa no fundo */}
        <div className="wr-hero__wave" aria-hidden="true" />
      </div>

      <div className="wr-body">
        {/* ── Status badge ── */}
        <div className={`wr-status-badge ${visible ? 'wr-status-badge--visible' : ''}`}>
          <span className="wr-status-dot" />
          Solicitação recebida — em processamento
        </div>

        {/* ── Card de detalhes ── */}
        <div className={`wr-card ${visible ? 'wr-card--visible' : ''}`} style={{ transitionDelay: '100ms' }}>
          <div className="wr-card__title">Resumo do saque</div>

          <div className="wr-row">
            <span className="wr-row__label">Valor solicitado</span>
            <span className="wr-row__value">{formatBRL(state.amount)}</span>
          </div>

          {state.feeValue !== undefined && state.feeValue > 0 ? (
            <div className="wr-row">
              <span className="wr-row__label">
                Taxa{state.feePercent ? ` (${state.feePercent}%)` : ''}
              </span>
              <span className="wr-row__value wr-row__value--fee">− {formatBRL(state.feeValue)}</span>
            </div>
          ) : null}

          <div className="wr-row wr-row--highlight">
            <span className="wr-row__label wr-row__label--highlight">Você vai receber</span>
            <span className="wr-row__value wr-row__value--net">{formatBRL(state.netAmount ?? state.amount)}</span>
          </div>

          <div className="wr-row">
            <span className="wr-row__label">Carteira</span>
            <span className="wr-row__value">
              {state.walletType === 'commission' ? 'Comissão' : 'Saldo'}
            </span>
          </div>

          <div className="wr-row">
            <span className="wr-row__label">Data e hora</span>
            <span className="wr-row__value">{dateStr}</span>
          </div>

          {state.pixKey ? (
            <div className="wr-row">
              <span className="wr-row__label">{pixTypeLabel(state.pixType)}</span>
              <span className="wr-row__value wr-row__value--mono">{maskValue(state.pixKey)}</span>
            </div>
          ) : null}

          {state.holderCpf ? (
            <div className="wr-row">
              <span className="wr-row__label">CPF do titular</span>
              <span className="wr-row__value wr-row__value--mono">{maskValue(state.holderCpf)}</span>
            </div>
          ) : null}
        </div>

        {/* ── Card do código do comprovante ── */}
        {(state.receiptCode || state.externalId) ? (
          <div className={`wr-code-card ${visible ? 'wr-code-card--visible' : ''}`} style={{ transitionDelay: '180ms' }}>
            <div className="wr-code-card__label">Código do comprovante</div>
            <div className="wr-code-card__code">
              {state.receiptCode ?? state.externalId}
            </div>
          </div>
        ) : null}

        {/* ── Info ── */}
        <div className={`wr-info ${visible ? 'wr-info--visible' : ''}`} style={{ transitionDelay: '240ms' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          O prazo de processamento pode levar até 1 dia útil. Em caso de dúvidas, entre em contato com o suporte.
        </div>

        {/* ── Botões ── */}
        <div className={`wr-actions ${visible ? 'wr-actions--visible' : ''}`} style={{ transitionDelay: '300ms' }}>
          <button
            type="button"
            className="wr-action-btn wr-action-btn--primary"
            onClick={() => navigate('/saque')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Novo saque
          </button>
          <button
            type="button"
            className="wr-action-btn wr-action-btn--ghost"
            onClick={() => navigate('/dashboard')}
          >
            Ir para Início
          </button>
        </div>
      </div>

      <AppBottomNav />
    </main>
  )
}
