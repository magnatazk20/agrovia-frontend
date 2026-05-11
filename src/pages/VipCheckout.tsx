import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import './VipCheckout.css'

type VipLevel = {
  id: number
  name: string
  price: number
  dailyTaskLimit: number
  taskRewardAmount: number
  benefits: string
  imageUrl?: string
}

type CommissionLevel = {
  id: number
  level: number
  name: string
  commissionPercent: number
}

type WalletKey = 'balance' | 'commission_balance' | 'recharge_balance'

type WalletOption = {
  key: WalletKey
  label: string
  value: number
}

const WALLET_COLORS: Record<string, string> = {
  balance: '#0066cc',
  commission_balance: '#16a34a',
  recharge_balance: '#7c3aed',
}

const WALLET_ICONS: Record<string, React.ReactNode> = {
  balance: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  ),
  commission_balance: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  ),
  recharge_balance: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

const formatBRL = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function VipCheckout() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [plan, setPlan] = useState<VipLevel | null>(null)
  const [commissions, setCommissions] = useState<CommissionLevel[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [activeVipName, setActiveVipName] = useState<string | null>(null)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [wallets, setWallets] = useState<WalletOption[]>([])
  const [selectedWallet, setSelectedWallet] = useState<WalletKey>('recharge_balance')

  const user = useMemo(() => {
    const raw = localStorage.getItem('user') ?? sessionStorage.getItem('user')
    if (!raw) return null
    try {
      return JSON.parse(raw) as { id: number; name: string; balance?: number; commission_balance?: number; recharge_balance?: number }
    } catch {
      return null
    }
  }, [])

  const token = useMemo(
    () => localStorage.getItem('token') ?? sessionStorage.getItem('token') ?? '',
    []
  )

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const tokenHeader: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}

        const fetches: Promise<Response>[] = [
          fetch(`${API_URL}/api/vip/levels`),
          fetch(`${API_URL}/api/referral/commission-levels`),
        ]
        // Verifica se o usuário já possui VIP ativo e saldos das carteiras
        if (user?.id) {
          fetches.push(fetch(`${API_URL}/api/vip/user/${user.id}`, { headers: tokenHeader }))
        }
        const results = await Promise.allSettled(fetches)
        const [levelsRes, commRes, userVipRes] = results.map(r => r.status === 'fulfilled' ? r.value : null)

        // Pega saldos das carteiras a partir da resposta do vip/user
        if (userVipRes?.ok) {
          const vipJson = await userVipRes.json().catch(() => ({})) as { balance?: number; commission_balance?: number; recharge_balance?: number; ok?: boolean; hasVip?: boolean; vip?: { levelName?: string } }
          const walletOpts: WalletOption[] = [
            { key: 'balance', label: 'Saldo Geral', value: Number(vipJson?.balance ?? 0) },
            { key: 'commission_balance', label: 'Carteira de Comissão', value: Number(vipJson?.commission_balance ?? 0) },
            { key: 'recharge_balance', label: 'Carteira de Recarga', value: Number(vipJson?.recharge_balance ?? 0) },
          ].filter(w => w.value > 0)
          setWallets(walletOpts)
          // Default to first wallet with balance
          if (walletOpts.length > 0) {
            setSelectedWallet(walletOpts[0].key)
          }
          // Chec active VIP from same json
          if (vipJson?.ok && vipJson?.hasVip && vipJson?.vip) {
            setActiveVipName(String(vipJson.vip.levelName ?? ''))
          }
        } else if (user) {
          // Fallback from localStorage user object
          const walletOpts: WalletOption[] = [
            { key: 'balance', label: 'Saldo Geral', value: Number(user.balance ?? 0) },
            { key: 'commission_balance', label: 'Carteira de Comissão', value: Number(user.commission_balance ?? 0) },
            { key: 'recharge_balance', label: 'Carteira de Recarga', value: Number(user.recharge_balance ?? 0) },
          ].filter(w => w.value > 0)
          setWallets(walletOpts)
          if (walletOpts.length > 0) {
            setSelectedWallet(walletOpts[0].key)
          }
        }

        const levelsJson = await levelsRes?.json().catch(() => ({})) ?? {}
        const commJson = await commRes?.json().catch(() => ({})) ?? {}

        if (levelsRes.ok && levelsJson?.ok && Array.isArray(levelsJson.levels)) {
          const found = levelsJson.levels.find(
            (l: any) => Number(l.id) === Number(id)
          )
          if (found) {
            setPlan({
              id: Number(found.id),
              name: String(found.name ?? ''),
              price: Number(found.price ?? 0),
              dailyTaskLimit: Number(found.dailyTaskLimit ?? 0),
              taskRewardAmount: Number(found.taskRewardAmount ?? 0),
              benefits: String(found.benefits ?? ''),
              imageUrl: String(found.imageUrl ?? ''),
            })
          } else {
            setMessage({ text: 'Plano VIP não encontrado.', type: 'error' })
          }
        } else {
          setMessage({ text: 'Erro ao carregar planos VIP.', type: 'error' })
        }

        if (commRes.ok && commJson?.ok && Array.isArray(commJson.levels)) {
          setCommissions(
            commJson.levels.map((row: any) => ({
              id: Number(row.id),
              level: Number(row.level ?? 0),
              name: String(row.name ?? ''),
              commissionPercent: Number(row.commissionPercent ?? 0),
            }))
          )
        }
      } catch {
        setMessage({ text: 'Erro de conexão ao carregar dados.', type: 'error' })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id, token])

  const handleConfirm = async () => {
    if (!user?.id || !plan) {
      setMessage({ text: 'Faça login para ativar um VIP.', type: 'error' })
      return
    }

    setMessage(null)
    setSubmitting(true)

    try {
      const response = await fetch(`${API_URL}/api/vip/activate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ userId: user.id, vipLevelId: plan.id, wallet: selectedWallet }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data?.ok) {
        setMessage({ text: data?.error ?? 'Falha ao ativar VIP.', type: 'error' })
        return
      }

      setMessage({ text: data?.message ?? 'VIP ativado com sucesso!', type: 'success' })
      setTimeout(() => navigate('/dashboard'), 2000)
    } catch {
      setMessage({ text: 'Erro de conexão ao ativar VIP.', type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const dailyIncome = plan ? plan.dailyTaskLimit * plan.taskRewardAmount : 0
  const monthlyIncome = dailyIncome * 30

  return (
    <main className="vip-checkout-page">
      <div className="vip-checkout-shell">
        {/* Header */}
        <div className="vip-checkout-header">
          <Link to="/vip" className="vip-checkout-back">
            Voltar
          </Link>
          <h1>Confirmar Plano VIP</h1>
        </div>

        {/* Modal de mensagem */}
        {message && (
          <div className="vip-checkout-modal-overlay" onClick={() => setMessage(null)}>
            <div
              className={`vip-checkout-modal ${
                message.type === 'success'
                  ? 'vip-checkout-modal--success'
                  : message.type === 'error'
                    ? 'vip-checkout-modal--error'
                    : ''
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="vip-checkout-modal-icon">
                {message.type === 'success' ? (
                  <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                )}
              </div>
              <p className="vip-checkout-modal-text">{message.text}</p>
              <button
                type="button"
                className="vip-checkout-modal-btn"
                onClick={() => setMessage(null)}
              >
                OK
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="vip-checkout-loading">Carregando plano...</div>
        ) : plan ? (
          <>
            {/* Card do plano */}
            <div className="vip-checkout-plan-card">
              {plan.imageUrl && (
                <div className="vip-checkout-plan-img-wrap">
                  <img
                    src={plan.imageUrl}
                    alt={plan.name}
                    className="vip-checkout-plan-img"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                  <span className="vip-checkout-plan-name-tag">{plan.name}</span>
                </div>
              )}

              <div className="vip-checkout-plan-body">
                {!plan.imageUrl && (
                  <h2 style={{ margin: '0 0 14px', color: '#ff8a03', fontSize: '1.3rem' }}>
                    {plan.name}
                  </h2>
                )}
                <table className="vip-checkout-table">
                  <thead>
                    <tr>
                      <th>Detalhe</th>
                      <th>Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Plano</td>
                      <td>{plan.name}</td>
                    </tr>
                    <tr>
                      <td>Preço</td>
                      <td className="vip-checkout-highlight">{formatBRL(plan.price)}</td>
                    </tr>
                    <tr>
                      <td>Tarefas diárias</td>
                      <td>{plan.dailyTaskLimit}</td>
                    </tr>
                    <tr>
                      <td>Recompensa por tarefa</td>
                      <td>{formatBRL(plan.taskRewardAmount)}</td>
                    </tr>
                    <tr>
                      <td>Renda diária estimada</td>
                      <td className="vip-checkout-highlight">{formatBRL(dailyIncome)}</td>
                    </tr>
                    <tr>
                      <td>Renda mensal estimada</td>
                      <td className="vip-checkout-highlight">{formatBRL(monthlyIncome)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Comissões por indicação (depósito) */}
            {commissions.length > 0 && plan && (
              <div className="vip-checkout-commission-card">
                <h2 className="vip-checkout-section-title">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  Comissoes por indicacao
                </h2>

                <div className="vip-checkout-explanation">
                  <p>
                    Quando um subordinado seu ativa um plano VIP, voce recebe uma comissao sobre o valor do deposito dele.
                    Por exemplo, se o seu subordinado ativar o plano <strong>{plan.name}</strong> ({formatBRL(plan.price)}):
                  </p>
                  <ul className="vip-checkout-example-list">
                    {commissions.map((comm) => {
                      const commValue = plan.price * (comm.commissionPercent / 100)
                      return (
                        <li key={comm.id}>
                          Subordinado de <strong>{comm.level}o nivel</strong>: {formatBRL(plan.price)} x {comm.commissionPercent}% = <strong>{formatBRL(commValue)}</strong>
                        </li>
                      )
                    })}
                  </ul>
                  <p className="vip-checkout-explanation-note">
                    As comissoes de indicacao sao creditadas automaticamente na sua conta quando o subordinado realiza o deposito.
                  </p>
                  <p className="vip-checkout-cta-text">
                    Convide seus amigos para participar e ganhe mais comissoes!
                  </p>
                </div>

                <table className="vip-checkout-commission-table">
                  <thead>
                    <tr>
                      <th>Nivel</th>
                      <th>Nome</th>
                      <th>Comissao</th>
                      <th>Valor do Deposito</th>
                      <th>Voce Recebe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commissions.map((comm) => {
                      const commValue = plan.price * (comm.commissionPercent / 100)
                      return (
                        <tr key={comm.id}>
                          <td>
                            <span className="vip-checkout-commission-badge">
                              Nivel {comm.level}
                            </span>
                          </td>
                          <td>{comm.name}</td>
                          <td className="vip-checkout-commission-percent">
                            {comm.commissionPercent}%
                          </td>
                          <td>{formatBRL(plan.price)}</td>
                          <td className="vip-checkout-highlight">{formatBRL(commValue)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Seção: Comissões de Tarefas do Plano */}
            {commissions.length > 0 && plan && (
              <div className="vip-checkout-commission-card">
                <h2 className="vip-checkout-section-title">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                  Comissoes de Tarefas — {plan.name}
                </h2>

                <div className="vip-checkout-explanation">
                  <p>
                    Cada tarefa concluida pelo seu subordinado com o plano <strong>{plan.name}</strong> gera uma recompensa de <strong>{formatBRL(plan.taskRewardAmount)}</strong>.
                    Voce recebe uma comissao sobre esse valor conforme o nivel do subordinado:
                  </p>
                  <ul className="vip-checkout-example-list">
                    {commissions.map((comm) => {
                      const perTask = plan.taskRewardAmount * (comm.commissionPercent / 100)
                      return (
                        <li key={comm.id}>
                          Subordinado de <strong>{comm.level}o nivel</strong>: {formatBRL(plan.taskRewardAmount)} x {comm.commissionPercent}% = <strong>{formatBRL(perTask)}</strong> por tarefa concluida.
                        </li>
                      )
                    })}
                  </ul>
                  <p>
                    O plano possui <strong>{plan.dailyTaskLimit} tarefas diarias</strong>. Se o subordinado completar todas:
                  </p>
                  <ul className="vip-checkout-example-list">
                    {commissions.map((comm) => {
                      const perTask = plan.taskRewardAmount * (comm.commissionPercent / 100)
                      const daily = perTask * plan.dailyTaskLimit
                      const monthly = daily * 30
                      return (
                        <li key={comm.id}>
                          <strong>{comm.level}o nivel</strong>: {formatBRL(perTask)} x {plan.dailyTaskLimit} tarefas = <strong>{formatBRL(daily)}/dia</strong> — <strong>{formatBRL(monthly)}/mes</strong>
                        </li>
                      )
                    })}
                  </ul>
                  <p className="vip-checkout-explanation-note">
                    As comissoes sao creditadas automaticamente na sua conta toda vez que um subordinado conclui uma tarefa.
                  </p>
                </div>

                <table className="vip-checkout-commission-table">
                  <thead>
                    <tr>
                      <th>Nivel</th>
                      <th>%</th>
                      <th>Por Tarefa</th>
                      <th>Diario ({plan.dailyTaskLimit}x)</th>
                      <th>Mensal (30d)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commissions.map((comm) => {
                      const perTask = plan.taskRewardAmount * (comm.commissionPercent / 100)
                      const daily = perTask * plan.dailyTaskLimit
                      const monthly = daily * 30
                      return (
                        <tr key={comm.id}>
                          <td>
                            <span className="vip-checkout-commission-badge">
                              Nivel {comm.level}
                            </span>
                          </td>
                          <td className="vip-checkout-commission-percent">
                            {comm.commissionPercent}%
                          </td>
                          <td>{formatBRL(perTask)}</td>
                          <td>{formatBRL(daily)}</td>
                          <td className="vip-checkout-highlight">{formatBRL(monthly)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Seletor de Carteira */}
            {wallets.length > 0 && (
              <div className="vip-checkout-wallet-section">
                <label className="vip-checkout-section-title" htmlFor="wallet-select">
                 
                  Wallet para um pagamento
                </label>
                <div className="vip-checkout-select-wrap">
                  <select
                    id="wallet-select"
                    className="vip-checkout-select"
                    value={selectedWallet}
                    onChange={(e) => setSelectedWallet(e.target.value as WalletKey)}
                    style={{ borderColor: WALLET_COLORS[selectedWallet] }}
                  >
                    {wallets.map((wallet) => (
                      <option key={wallet.key} value={wallet.key}>
                        {wallet.label} — {formatBRL(wallet.value)}
                      </option>
                    ))}
                  </select>
                  <svg className="vip-checkout-select-arrow" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
                <p className="vip-checkout-wallet-hint" style={{ color: WALLET_COLORS[selectedWallet] }}>
                  {wallets.find(w => w.key === selectedWallet)
                    ? `${formatBRL(wallets.find(w => w.key === selectedWallet)!.value)} disponível`
                    : ''}
                </p>
              </div>
            )}

            {/* Botão confirmar */}
            <div className="vip-checkout-actions">
              <button
                className="vip-checkout-confirm-btn"
                onClick={handleConfirm}
                disabled={submitting}
              >
                {submitting
                  ? 'Ativando...'
                  : activeVipName
                    ? `Trocar para ${plan.name} — ${formatBRL(plan.price)}`
                    : `Ativar ${plan.name} — ${formatBRL(plan.price)}`}
              </button>
            </div>
          </>
        ) : null}
      </div>
    </main>
  )
}
