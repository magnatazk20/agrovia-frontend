import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AdminSidebar from '../components/AdminSidebar'
import './Admin.css'
import './AdminUserDetails.css'

type UserLogItem = {
  id: number
  action: string
  old_balance: number | null
  new_balance: number | null
  amount: number | null
  metadata: string | null
  created_at: string | null
}

const formatLogActionLabel = (actionRaw: string) => {
  const action = String(actionRaw ?? '').toLowerCase().trim()

  if (action === 'withdraw_request_created' || action === 'withdraw_request_auto_processed') {
    return 'Solicitacao de saque'
  }

  return actionRaw
}

type PurchaseItem = {
  id: number
  planName: string
  amountPaid: number
  createdAt: string | null
}

type GiftCodeRedemptionItem = {
  id: number
  code: string
  rewardType: string
  rewardValue: number
  createdAt: string | null
}

type DailyCheckinRedemptionItem = {
  id: number
  checkinDay: number
  rewardAmount: number
  checkinDate: string | null
  createdAt: string | null
}

type DepositHistoryItem = {
  id: number
  amount: number
  status: string
  method: string
  externalId: string | null
  paidAt: string | null
  createdAt: string | null
}

type ShopDepositHistoryItem = {
  id: number
  amount: number
  status: string
  externalId: string | null
  paidAt: string | null
  createdAt: string | null
}

type ShopPurchaseHistoryItem = {
  id: number
  amount: number
  reason: string
  referenceId: string | null
  createdAt: string | null
}

type WithdrawalHistoryItem = {
  id: number
  amount: number
  status: string
  holderName: string
  pixKeyType: string
  pixKey: string
  externalId: string | null
  paidAt: string | null
  createdAt: string | null
}

type RouletteSpinItem = {
  id: number
  prizeLabel: string
  prizeIndex: number
  source: string
  createdAt: string | null
}

type RouletteSpinBalance = {
  availableSpins: number
  totalEarned: number
  totalUsed: number
}

type UserDetailsResponse = {
  ok?: boolean
  error?: string
  user?: {
    id: number
    name: string
    phone: string
    vipPurchases?: PurchaseItem[]
    cyclePurchases?: PurchaseItem[]
    giftCodeRedemptions?: GiftCodeRedemptionItem[]
    dailyCheckinRedemptions?: DailyCheckinRedemptionItem[]
    depositHistory?: DepositHistoryItem[]
    withdrawalHistory?: WithdrawalHistoryItem[]
    shopDepositHistory?: ShopDepositHistoryItem[]
    shopPurchaseHistory?: ShopPurchaseHistoryItem[]
    rouletteSpins?: RouletteSpinItem[]
    rouletteSpinBalance?: RouletteSpinBalance
    accountLogs?: UserLogItem[]
  }
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

const formatBRL = (value: number) =>
  Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function AdminUserHistory() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [user, setUser] = useState<UserDetailsResponse['user'] | null>(null)
  const [showLogs, setShowLogs] = useState(false)
  const [showTaskLogs, setShowTaskLogs] = useState(false)
  const [showVipPurchases, setShowVipPurchases] = useState(false)
  const [showCyclePurchases, setShowCyclePurchases] = useState(false)
  const [showGiftCodeRedemptions, setShowGiftCodeRedemptions] = useState(false)
  const [showDailyCheckins, setShowDailyCheckins] = useState(false)
  const [showDepositHistory, setShowDepositHistory] = useState(false)
  const [showWithdrawalHistory, setShowWithdrawalHistory] = useState(false)
  const [showShopDepositHistory, setShowShopDepositHistory] = useState(false)
  const [showShopPurchaseHistory, setShowShopPurchaseHistory] = useState(false)
  const [showRouletteSpins, setShowRouletteSpins] = useState(false)

  const token = useMemo(
    () => localStorage.getItem('token') ?? sessionStorage.getItem('token') ?? '',
    []
  )

  useEffect(() => {
    const load = async () => {
      if (!id) {
        setError('ID de usuario invalido.')
        return
      }

      setLoading(true)
      setError('')
      try {
        const res = await fetch(`${API_URL}/api/admin/users/${id}/details`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })

        const data = (await res.json()) as UserDetailsResponse
        if (!res.ok || !data?.ok || !data.user) {
          setError(data?.error ?? 'Falha ao carregar historico do usuario.')
          setUser(null)
          return
        }

        setUser(data.user)
      } catch {
        setError('Erro de conexao ao carregar historico do usuario.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [id])

  return (
    <main className='admin-page'>
      <AdminSidebar />
      <section className='admin-content admin-user-details-page'>
        <header className='admin-header'>
          <div>
            <h1>Historico do Usuario</h1>
            <p className='admin-subtitle'>VIP, ciclos, gift codes, check-ins e logs da conta.</p>
          </div>
          <button type='button' className='admin-back-btn' onClick={() => navigate(`/adf/users/${id}`)}>
            Voltar para detalhes
          </button>
        </header>

        {error ? <p className='admin-kpi-error'>{error}</p> : null}

        {loading ? (
          <section className='admin-panel'>
            <p>Carregando historico...</p>
          </section>
        ) : user ? (
          <>
            <section className='admin-panel admin-user-list-panel'>
              <div className='admin-log-header'>
                <h3>Planos VIP comprados</h3>
                <button type='button' className='admin-toggle-logs-btn' onClick={() => setShowVipPurchases((prev) => !prev)}>
                  {showVipPurchases ? 'Ocultar planos VIP' : 'Mostrar planos VIP'}
                </button>
              </div>
              {showVipPurchases ? (
                (user.vipPurchases ?? []).length ? (
                  <div className='admin-user-list'>
                    {(user.vipPurchases ?? []).map((item) => (
                      <article key={`vip-${item.id}`} className='admin-user-list-item'>
                        <div>
                          <strong>{item.planName}</strong>
                          <p>{item.createdAt ? new Date(item.createdAt).toLocaleString('pt-BR') : '-'}</p>
                        </div>
                        <span>{formatBRL(item.amountPaid)}</span>
                      </article>
                    ))}
                  </div>
                ) : <p>Nenhuma compra VIP encontrada.</p>
              ) : <p className='admin-log-hint'>Clique em Mostrar planos VIP para visualizar os planos comprados.</p>}
            </section>

            <section className='admin-panel admin-user-list-panel'>
              <div className='admin-log-header'>
                <h3>Planos de ciclo comprados</h3>
                <button type='button' className='admin-toggle-logs-btn' onClick={() => setShowCyclePurchases((prev) => !prev)}>
                  {showCyclePurchases ? 'Ocultar planos de ciclo' : 'Mostrar planos de ciclo'}
                </button>
              </div>
              {showCyclePurchases ? (
                (user.cyclePurchases ?? []).length ? (
                  <div className='admin-user-list'>
                    {(user.cyclePurchases ?? []).map((item) => (
                      <article key={`cycle-${item.id}`} className='admin-user-list-item'>
                        <div>
                          <strong>{item.planName}</strong>
                          <p>{item.createdAt ? new Date(item.createdAt).toLocaleString('pt-BR') : '-'}</p>
                        </div>
                        <span>{formatBRL(item.amountPaid)}</span>
                      </article>
                    ))}
                  </div>
                ) : <p>Nenhuma compra de ciclo encontrada.</p>
              ) : <p className='admin-log-hint'>Clique em Mostrar planos de ciclo para visualizar os planos comprados.</p>}
            </section>

            <section className='admin-panel admin-user-list-panel'>
              <div className='admin-log-header'>
                <h3>Gift codes resgatados</h3>
                <button type='button' className='admin-toggle-logs-btn' onClick={() => setShowGiftCodeRedemptions((prev) => !prev)}>
                  {showGiftCodeRedemptions ? 'Ocultar gift codes' : 'Mostrar gift codes'}
                </button>
              </div>
              {showGiftCodeRedemptions ? (
                (user.giftCodeRedemptions ?? []).length ? (
                  <div className='admin-user-list'>
                    {(user.giftCodeRedemptions ?? []).map((gift) => (
                      <article key={`gift-${gift.id}`} className='admin-user-list-item'>
                        <div>
                          <strong>{gift.code}</strong>
                          <p>{gift.createdAt ? new Date(gift.createdAt).toLocaleString('pt-BR') : '-'}</p>
                        </div>
                        <span>{gift.rewardType} {formatBRL(gift.rewardValue)}</span>
                      </article>
                    ))}
                  </div>
                ) : <p>Nenhum gift code resgatado.</p>
              ) : <p className='admin-log-hint'>Clique em Mostrar gift codes para visualizar os resgates.</p>}
            </section>

            <section className='admin-panel admin-user-list-panel'>
              <div className='admin-log-header'>
                <h3>Resgates de check-in diario</h3>
                <button type='button' className='admin-toggle-logs-btn' onClick={() => setShowDailyCheckins((prev) => !prev)}>
                  {showDailyCheckins ? 'Ocultar check-ins' : 'Mostrar check-ins'}
                </button>
              </div>
              {showDailyCheckins ? (
                (user.dailyCheckinRedemptions ?? []).length ? (
                  <div className='admin-user-list'>
                    {(user.dailyCheckinRedemptions ?? []).map((item) => (
                      <article key={`checkin-${item.id}`} className='admin-user-list-item'>
                        <div>
                          <strong>Dia {item.checkinDay}</strong>
                          <p>{item.checkinDate ? new Date(item.checkinDate).toLocaleDateString('pt-BR') : '-'}</p>
                        </div>
                        <span>{formatBRL(item.rewardAmount)}</span>
                      </article>
                    ))}
                  </div>
                ) : <p>Nenhum resgate de check-in encontrado.</p>
              ) : <p className='admin-log-hint'>Clique em Mostrar check-ins para visualizar os resgates.</p>}
            </section>

            <section className='admin-panel admin-user-list-panel'>
              <div className='admin-log-header'>
                <h3>Historico de depositos</h3>
                <button type='button' className='admin-toggle-logs-btn' onClick={() => setShowDepositHistory((prev) => !prev)}>
                  {showDepositHistory ? 'Ocultar depositos' : 'Mostrar depositos'}
                </button>
              </div>
              {showDepositHistory ? (
                (user.depositHistory ?? []).length ? (
                  <div className='admin-user-list'>
                    {(user.depositHistory ?? []).map((dep) => {
                      const isPaid = ['paid', 'payment.paid'].includes(dep.status.toLowerCase())
                      return (
                        <article key={`dep-${dep.id}`} className='admin-user-list-item'>
                          <div>
                            <strong style={{ color: isPaid ? '#22c55e' : '#94a3b8' }}>
                              {isPaid ? '✅' : '⏳'} {formatBRL(dep.amount)}
                            </strong>
                            <p>Criado: {dep.createdAt ? new Date(dep.createdAt).toLocaleString('pt-BR') : '-'}</p>
                            {dep.paidAt ? (
                              <p>Pago: {new Date(dep.paidAt).toLocaleString('pt-BR')}</p>
                            ) : null}
                            {dep.externalId ? (
                              <small style={{ color: '#64748b' }}>ID: {dep.externalId}</small>
                            ) : null}
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '3px 10px',
                              borderRadius: '999px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              background: isPaid ? 'rgba(34,197,94,0.15)' : 'rgba(148,163,184,0.12)',
                              color: isPaid ? '#22c55e' : '#94a3b8',
                              border: `1px solid ${isPaid ? '#166534' : '#334155'}`,
                            }}>
                              {dep.status}
                            </span>
                            <p style={{ marginTop: '4px', fontSize: '0.8rem', color: '#64748b' }}>{dep.method.toUpperCase()}</p>
                          </div>
                        </article>
                      )
                    })}
                  </div>
                ) : <p>Nenhum deposito encontrado.</p>
              ) : <p className='admin-log-hint'>Clique em Mostrar depositos para visualizar o historico.</p>}
            </section>

            <section className='admin-panel admin-user-list-panel'>
              <div className='admin-log-header'>
                <h3>Historico de saques</h3>
                <button type='button' className='admin-toggle-logs-btn' onClick={() => setShowWithdrawalHistory((prev) => !prev)}>
                  {showWithdrawalHistory ? 'Ocultar saques' : 'Mostrar saques'}
                </button>
              </div>
              {showWithdrawalHistory ? (
                (user.withdrawalHistory ?? []).length ? (
                  <div className='admin-user-list'>
                    {(user.withdrawalHistory ?? []).map((wd) => {
                      const isPaid = ['paid', 'payment.paid'].includes(wd.status.toLowerCase())
                      const isFailed = ['failed', 'canceled', 'cancelled'].includes(wd.status.toLowerCase())
                      const statusColor = isPaid ? '#22c55e' : isFailed ? '#f87171' : '#94a3b8'
                      const statusBg = isPaid ? 'rgba(34,197,94,0.15)' : isFailed ? 'rgba(248,113,113,0.15)' : 'rgba(148,163,184,0.12)'
                      const statusBorder = isPaid ? '#166534' : isFailed ? '#7f1d1d' : '#334155'
                      return (
                        <article key={`wd-${wd.id}`} className='admin-user-list-item'>
                          <div>
                            <strong style={{ color: statusColor }}>
                              {isPaid ? '✅' : isFailed ? '❌' : '⏳'} {formatBRL(wd.amount)}
                            </strong>
                            <p>{wd.holderName} · {wd.pixKeyType}</p>
                            <p style={{ fontSize: '0.82rem', color: '#64748b', wordBreak: 'break-all' }}>{wd.pixKey}</p>
                            <p>Criado: {wd.createdAt ? new Date(wd.createdAt).toLocaleString('pt-BR') : '-'}</p>
                            {wd.paidAt ? (
                              <p>Pago: {new Date(wd.paidAt).toLocaleString('pt-BR')}</p>
                            ) : null}
                            {wd.externalId ? (
                              <small style={{ color: '#64748b' }}>ID: {wd.externalId}</small>
                            ) : null}
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '3px 10px',
                              borderRadius: '999px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              background: statusBg,
                              color: statusColor,
                              border: `1px solid ${statusBorder}`,
                            }}>
                              {wd.status}
                            </span>
                          </div>
                        </article>
                      )
                    })}
                  </div>
                ) : <p>Nenhum saque encontrado.</p>
              ) : <p className='admin-log-hint'>Clique em Mostrar saques para visualizar o historico.</p>}
            </section>

            {/* ── DEPÓSITOS NA LOJA ── */}
            <section className='admin-panel admin-user-list-panel'>
              <div className='admin-log-header'>
                <h3>🏪 Depósitos na loja (shop_balance)</h3>
                <button type='button' className='admin-toggle-logs-btn' onClick={() => setShowShopDepositHistory((p) => !p)}>
                  {showShopDepositHistory ? 'Ocultar' : 'Mostrar depósitos loja'}
                </button>
              </div>
              {showShopDepositHistory ? (
                (user.shopDepositHistory ?? []).length ? (
                  <div className='admin-user-list'>
                    {(user.shopDepositHistory ?? []).map((dep) => {
                      const isPaid = ['paid', 'payment.paid'].includes(dep.status.toLowerCase())
                      const isExp  = ['expired', 'canceled', 'failed'].includes(dep.status.toLowerCase())
                      const color  = isPaid ? '#22c55e' : isExp ? '#f87171' : '#94a3b8'
                      const bg     = isPaid ? 'rgba(34,197,94,0.15)' : isExp ? 'rgba(248,113,113,0.15)' : 'rgba(148,163,184,0.12)'
                      const border = isPaid ? '#166534' : isExp ? '#7f1d1d' : '#334155'
                      return (
                        <article key={`sdep-${dep.id}`} className='admin-user-list-item'>
                          <div>
                            <strong style={{ color }}>
                              {isPaid ? '✅' : isExp ? '❌' : '⏳'} {formatBRL(dep.amount)}
                            </strong>
                            <p>Criado: {dep.createdAt ? new Date(dep.createdAt).toLocaleString('pt-BR') : '-'}</p>
                            {dep.paidAt && <p>Pago: {new Date(dep.paidAt).toLocaleString('pt-BR')}</p>}
                            {dep.externalId && <small style={{ color: '#64748b' }}>ID: {dep.externalId}</small>}
                          </div>
                          <span style={{ display:'inline-block', padding:'3px 10px', borderRadius:'999px', fontSize:'0.75rem', fontWeight:700, background:bg, color, border:`1px solid ${border}` }}>
                            {dep.status}
                          </span>
                        </article>
                      )
                    })}
                  </div>
                ) : <p>Nenhum depósito na loja encontrado.</p>
              ) : <p className='admin-log-hint'>Clique para ver depósitos PIX feitos na loja.</p>}
            </section>

            {/* ── COMPRAS DE GIFT CARD ── */}
            <section className='admin-panel admin-user-list-panel'>
              <div className='admin-log-header'>
                <h3>🎁 Compras de gift card (loja)</h3>
                <button type='button' className='admin-toggle-logs-btn' onClick={() => setShowShopPurchaseHistory((p) => !p)}>
                  {showShopPurchaseHistory ? 'Ocultar' : 'Mostrar compras gift card'}
                </button>
              </div>
              {showShopPurchaseHistory ? (
                (user.shopPurchaseHistory ?? []).length ? (
                  <div className='admin-user-list'>
                    {(user.shopPurchaseHistory ?? []).map((purch) => (
                      <article key={`spurch-${purch.id}`} className='admin-user-list-item'>
                        <div>
                          <strong style={{ color: '#f87171' }}>🎁 -{formatBRL(purch.amount)}</strong>
                          <p>{purch.reason}</p>
                          <p>{purch.createdAt ? new Date(purch.createdAt).toLocaleString('pt-BR') : '-'}</p>
                          {purch.referenceId && <small style={{ color: '#64748b' }}>Ref: {purch.referenceId}</small>}
                        </div>
                        <span style={{ display:'inline-block', padding:'3px 10px', borderRadius:'999px', fontSize:'0.75rem', fontWeight:700, background:'rgba(248,113,113,0.12)', color:'#f87171', border:'1px solid #7f1d1d' }}>
                          débito
                        </span>
                      </article>
                    ))}
                  </div>
                ) : <p>Nenhuma compra de gift card encontrada.</p>
              ) : <p className='admin-log-hint'>Clique para ver compras de gift card feitas na loja.</p>}
            </section>

            <section className='admin-panel admin-user-list-panel'>
              <div className='admin-log-header'>
                <h3>Roleta — saldo e historico de giros</h3>
                <button type='button' className='admin-toggle-logs-btn' onClick={() => setShowRouletteSpins((prev) => !prev)}>
                  {showRouletteSpins ? 'Ocultar roleta' : 'Mostrar roleta'}
                </button>
              </div>
              {showRouletteSpins ? (
                <>
                  {(() => {
                    const bal = user.rouletteSpinBalance
                    return bal ? (
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
                        <div className='admin-kpi-card' style={{ flex: '1 1 120px' }}>
                          <p className='admin-kpi-label'>Giros disponiveis</p>
                          <strong className='admin-kpi-value'>{bal.availableSpins}</strong>
                        </div>
                        <div className='admin-kpi-card' style={{ flex: '1 1 120px' }}>
                          <p className='admin-kpi-label'>Total ganhos</p>
                          <strong className='admin-kpi-value'>{bal.totalEarned}</strong>
                        </div>
                        <div className='admin-kpi-card' style={{ flex: '1 1 120px' }}>
                          <p className='admin-kpi-label'>Total usados</p>
                          <strong className='admin-kpi-value'>{bal.totalUsed}</strong>
                        </div>
                      </div>
                    ) : (
                      <p style={{ marginBottom: '8px', color: '#64748b', fontSize: '0.9rem' }}>
                        Nenhum saldo de giro encontrado.
                      </p>
                    )
                  })()}

                  {(user.rouletteSpins ?? []).length ? (
                    <div className='admin-user-list'>
                      {(user.rouletteSpins ?? []).map((spin) => (
                        <article key={`spin-${spin.id}`} className='admin-user-list-item'>
                          <div>
                            <strong>🎰 {spin.prizeLabel}</strong>
                            <p>{spin.createdAt ? new Date(spin.createdAt).toLocaleString('pt-BR') : '-'}</p>
                            <small style={{ color: '#64748b' }}>Origem: {spin.source}</small>
                          </div>
                          <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#475569' }}>
                            #{spin.id}
                          </span>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p>Nenhum giro realizado.</p>
                  )}
                </>
              ) : (
                <p className='admin-log-hint'>Clique em Mostrar roleta para visualizar os giros e saldo.</p>
              )}
            </section>

            <section className='admin-panel admin-user-list-panel'>
              <div className='admin-log-header'>
                <h3>📋 Logs de tarefas de mineração</h3>
                <button type='button' className='admin-toggle-logs-btn' onClick={() => setShowTaskLogs((prev) => !prev)}>
                  {showTaskLogs ? 'Ocultar logs de tarefas' : 'Mostrar logs de tarefas'}
                </button>
              </div>
              {showTaskLogs ? (
                (() => {
                  const taskLogs = (user.accountLogs ?? []).filter(
                    (log) => String(log.action ?? '').toLowerCase() === 'mining_task_complete'
                  )
                  return taskLogs.length ? (
                    <div className='admin-user-list'>
                      {taskLogs.map((log) => {
                        let taskInfo = ''
                        try {
                          if (log.metadata) {
                            const meta = JSON.parse(log.metadata)
                            taskInfo = `Tarefa #${meta.taskId ?? '-'}${meta.vipName ? ` · ${meta.vipName}` : ''}`
                          }
                        } catch {
                          taskInfo = ''
                        }
                        return (
                          <article key={`tasklog-${log.id}`} className='admin-user-log-item'>
                            <div>
                              <strong style={{ color: '#22c55e' }}>✅ Tarefa concluída</strong>
                              {taskInfo ? <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{taskInfo}</p> : null}
                              <p>{log.created_at ? new Date(log.created_at).toLocaleString('pt-BR') : '-'}</p>
                              <small>
                                anterior: {log.old_balance == null ? '-' : formatBRL(log.old_balance)} | novo:{' '}
                                {log.new_balance == null ? '-' : formatBRL(log.new_balance)} | valor:{' '}
                                {log.amount == null ? '-' : formatBRL(log.amount)}
                              </small>
                            </div>
                          </article>
                        )
                      })}
                    </div>
                  ) : <p>Nenhum log de tarefa encontrado.</p>
                })()
              ) : <p className='admin-log-hint'>Clique em Mostrar logs de tarefas para visualizar as tarefas concluídas pelo usuário.</p>}
            </section>

            <section className='admin-panel admin-user-list-panel'>
              <div className='admin-log-header'>
                <h3>Logs da conta</h3>
                <button type='button' className='admin-toggle-logs-btn' onClick={() => setShowLogs((prev) => !prev)}>
                  {showLogs ? 'Ocultar logs' : 'Mostrar logs'}
                </button>
              </div>
              {showLogs ? (
                (user.accountLogs ?? []).length ? (
                  <div className='admin-user-list'>
                    {(user.accountLogs ?? []).map((log) => (
                      <article key={`log-${log.id}`} className='admin-user-log-item'>
                        <div>
                          <strong>{formatLogActionLabel(log.action)}</strong>
                          <p>{log.created_at ? new Date(log.created_at).toLocaleString('pt-BR') : '-'}</p>
                          <small>
                            anterior: {log.old_balance == null ? '-' : formatBRL(log.old_balance)} | novo:{' '}
                            {log.new_balance == null ? '-' : formatBRL(log.new_balance)} | valor:{' '}
                            {log.amount == null ? '-' : formatBRL(log.amount)}
                          </small>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : <p>Nenhum log encontrado.</p>
              ) : <p className='admin-log-hint'>Clique em Mostrar logs para visualizar o historico da conta.</p>}
            </section>
          </>
        ) : null}
      </section>
    </main>
  )
}
