import { useLocation, useNavigate } from 'react-router-dom'
import AppSidebar from '../components/AppSidebar'
import './Dashboard.css'
import './WithdrawReceipt.css'
import AppBottomNav from '../components/AppBottomNav'

type ReceiptState = {
  amount: number
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

  // E-mail
  if (raw.includes('@')) {
    const [user, domain] = raw.split('@')
    if (!user) return `***@${domain}`
    const visible = user.slice(0, 2)
    return `${visible}${'*'.repeat(Math.max(3, user.length - 2))}@${domain}`
  }

  // CPF/CNPJ/Telefone/chave aleatória
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

  if (!state) {
    return (
      <main className="dash-app">
        <section className="dash-main">
          <AppSidebar />
          <div className="dash-content">
            <div className="cert-empty">
              <div className="cert-empty__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6" />
                  <path d="M9 15h6" />
                </svg>
              </div>
              <h2>Comprovante indisponível</h2>
              <p>Não foi encontrado nenhum comprovante para exibir.</p>
              <button type="button" className="cert-btn cert-btn--primary" onClick={() => navigate('/saque')}>
                Voltar para Saque
              </button>
            </div>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="dash-app">
      <section className="dash-main">
        <AppSidebar />

        <div className="dash-content">
          {/* ── Certificado / Papel ── */}
          <div className="cert-wrapper">
            {/* Borda serrilhada topo */}
            <div className="cert-tear cert-tear--top" aria-hidden="true" />

            <div className="cert-paper">
              {/* Borda decorativa interna */}
              <div className="cert-border-inner" aria-hidden="true" />

              {/* Cabeçalho do certificado */}
              <header className="cert-header">
                <div className="cert-header__seal" aria-hidden="true">
                  <svg viewBox="0 0 48 48" fill="none">
                    <circle cx="24" cy="24" r="22" stroke="#c9a96e" strokeWidth="1.5" />
                    <circle cx="24" cy="24" r="18" stroke="#c9a96e" strokeWidth="0.8" strokeDasharray="3 2" />
                    <path d="M24 10l3.5 7 7.5 1.1-5.4 5.3 1.3 7.6L24 27.5l-6.9 3.5 1.3-7.6-5.4-5.3 7.5-1.1z" fill="#c9a96e" opacity="0.25" />
                    <path d="M20 24l2.5 2.5L28 21" stroke="#c9a96e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className="cert-header__badge">VIA DO CLIENTE</span>
                <h2 className="cert-header__title">Comprovante de Saque</h2>
                <p className="cert-header__subtitle">Solicitação processada com sucesso</p>
              </header>

              {/* Linha divisória ornamental */}
              <div className="cert-ornament" aria-hidden="true">
                <span className="cert-ornament__line" />
                <span className="cert-ornament__diamond" />
                <span className="cert-ornament__line" />
              </div>

              {/* Valor em destaque */}
              <div className="cert-amount">
                <span className="cert-amount__label">Valor solicitado</span>
                <strong className="cert-amount__value">{formatBRL(state.amount)}</strong>
              </div>

              {/* Corte serrilhado central (como destacar recibo) */}
              <div className="cert-cut" aria-hidden="true" />

              {/* Dados do comprovante */}
              <div className="cert-details">
                <div className="cert-row">
                  <span className="cert-row__label">Situação</span>
                  <span className="cert-row__value cert-row__value--status">
                    <span className="cert-status-dot" />
                    Solicitação recebida
                  </span>
                </div>
                <div className="cert-row">
                  <span className="cert-row__label">Carteira</span>
                  <span className="cert-row__value cert-row__value--wallet">
                    {state.walletType === 'commission' ? (
                      <>
                        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 1 0 0 7h5a3.5 3.5 0 1 1 0 7H6" />
                        </svg>
                        Comissão
                      </>
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <rect x="3.5" y="6.5" width="17" height="11" rx="2" />
                          <path d="M15 10h5v4h-5a2 2 0 0 1 0-4z" />
                          <circle cx="16.8" cy="12" r="0.8" fill="currentColor" />
                        </svg>
                        Saldo normal
                      </>
                    )}
                  </span>
                </div>
                <div className="cert-row">
                  <span className="cert-row__label">Valor</span>
                  <span className="cert-row__value">{formatBRL(state.amount)}</span>
                </div>
                <div className="cert-row">
                  <span className="cert-row__label">Data e hora</span>
                  <span className="cert-row__value">
                    {new Date(state.requestedAt).toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="cert-row">
                  <span className="cert-row__label">Comprovante</span>
                  <span className="cert-row__value cert-row__value--code">
                    {state.receiptCode ?? state.externalId ?? '-'}
                  </span>
                </div>
                {state.pixKey ? (
                  <div className="cert-row">
                    <span className="cert-row__label">{pixTypeLabel(state.pixType)}</span>
                    <span className="cert-row__value cert-row__value--code">
                      {maskValue(state.pixKey)}
                    </span>
                  </div>
                ) : null}
                {state.holderCpf ? (
                  <div className="cert-row">
                    <span className="cert-row__label">CPF do titular</span>
                    <span className="cert-row__value cert-row__value--code">
                      {maskValue(state.holderCpf)}
                    </span>
                  </div>
                ) : null}
              </div>

              {/* Rodapé */}
              <footer className="cert-footer">
                <small>Documento gerado automaticamente pela plataforma.</small>
              </footer>
            </div>

            {/* Borda serrilhada inferior */}
            <div className="cert-tear cert-tear--bottom" aria-hidden="true" />
          </div>

          {/* Ações fora do papel */}
          <section className="cert-actions">
            <button type="button" className="cert-btn cert-btn--primary" onClick={() => navigate('/saque')}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Voltar para Saque
            </button>
            <button type="button" className="cert-btn cert-btn--secondary" onClick={() => navigate('/dashboard')}>
              Ir para Dashboard
            </button>
          </section>
        </div>
      </section>
      <AppBottomNav />
</main>
  )
}
