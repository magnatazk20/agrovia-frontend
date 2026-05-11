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

type ReferralItem = {
  id: number
  name: string
  phone: string
  createdAt: string | null
  hasDeposit: boolean
  totalDepositsPaid: number
}

type CommissionLevelStat = {
  level: number
  name: string
  commissionPercent: number
  referralCount: number
  referralsWithDeposit: number
}

type UserDetailsResponse = {
  ok?: boolean
  error?: string
  user?: {
    id: number
    name: string
    phone: string
    is_admin: number
    is_banned: number
    created_at?: string
    balance: number
    shopBalance: number
    telegramConectado?: number | boolean
    telegramConnection?: {
      telegramChatId: string
      telegramUserId: string
      telegramUsername: string
      telegramFirstName: string
      connectedAt: string | null
    } | null
    hasWithdrawPassword?: boolean
    activeContract?: string | null
    totalDepositsPaid: number
    totalWithdrawals: number
    totalCyclePlansBought: number
    totalVipPlansBought: number
    totalShopGiftCardPurchases: number
    commissionLevelStats?: CommissionLevelStat[]
    accountLogs?: UserLogItem[]
    vipPurchases?: PurchaseItem[]
    cyclePurchases?: PurchaseItem[]
    giftCodeRedemptions?: GiftCodeRedemptionItem[]
    dailyCheckinRedemptions?: DailyCheckinRedemptionItem[]
    referralsLevel1?: ReferralItem[]
    referralsLevel2?: ReferralItem[]
    referralsLevel3?: ReferralItem[]
  }
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

const formatBRL = (value: number) =>
  Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function AdminUserDetails() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [user, setUser] = useState<UserDetailsResponse['user'] | null>(null)

  const [adjustAmount, setAdjustAmount] = useState('')
  const [adjustOperation, setAdjustOperation] = useState<'add' | 'subtract'>('add')
  const [adjustReason, setAdjustReason] = useState('')
  const [adjustLoading, setAdjustLoading] = useState(false)
  const [adjustFeedback, setAdjustFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const [showAllLevel1, setShowAllLevel1] = useState(false)
  const [showAllLevel2, setShowAllLevel2] = useState(false)
  const [showAllLevel3, setShowAllLevel3] = useState(false)

  const [editingPhone, setEditingPhone] = useState(false)
  const [editPhone, setEditPhone] = useState('')
  const [editPhoneLoading, setEditPhoneLoading] = useState(false)
  const [editPhoneFeedback, setEditPhoneFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const [telegramDisconnectLoading, setTelegramDisconnectLoading] = useState(false)
  const [telegramDisconnectFeedback, setTelegramDisconnectFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [telegramModalOpen, setTelegramModalOpen] = useState(false)

  const [telegramMsgText, setTelegramMsgText] = useState('')
  const [telegramMsgLoading, setTelegramMsgLoading] = useState(false)
  const [telegramMsgFeedback, setTelegramMsgFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const [withdrawPwdDeleteLoading, setWithdrawPwdDeleteLoading] = useState(false)
  const [withdrawPwdDeleteFeedback, setWithdrawPwdDeleteFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [withdrawPwdModalOpen, setWithdrawPwdModalOpen] = useState(false)

  const token = useMemo(
    () => localStorage.getItem('token') ?? sessionStorage.getItem('token') ?? '',
    []
  )

  const loadUserDetails = async () => {
    if (!id) {
      setError('ID de usuário inválido.')
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
        setError(data?.error ?? 'Falha ao carregar detalhes do usuário.')
        setUser(null)
        return
      }

      setUser(data.user)
    } catch {
      setError('Erro de conexão ao carregar detalhes do usuário.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUserDetails()
  }, [id])

  const handlePhoneSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!id || !user) return
    const newPhone = editPhone.trim()
    if (!newPhone) {
      setEditPhoneFeedback({ type: 'error', message: 'Informe um número de telefone válido.' })
      return
    }
    setEditPhoneLoading(true)
    setEditPhoneFeedback(null)
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ name: user.name, phone: newPhone }),
      })
      const data = (await res.json()) as { ok?: boolean; error?: string; message?: string }
      if (!res.ok || !data?.ok) {
        setEditPhoneFeedback({ type: 'error', message: data?.error ?? 'Falha ao atualizar telefone.' })
        return
      }
      setEditPhoneFeedback({ type: 'success', message: 'Telefone atualizado com sucesso.' })
      setEditingPhone(false)
      await loadUserDetails()
    } catch {
      setEditPhoneFeedback({ type: 'error', message: 'Erro de conexão.' })
    } finally {
      setEditPhoneLoading(false)
    }
  }

  const handleTelegramDisconnect = () => {
    setTelegramDisconnectFeedback(null)
    setTelegramModalOpen(true)
  }

  const confirmTelegramDisconnect = async () => {
    if (!id) return
    setTelegramDisconnectLoading(true)
    setTelegramDisconnectFeedback(null)
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${id}/telegram`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = (await res.json()) as { ok?: boolean; error?: string; message?: string }
      if (!res.ok || !data?.ok) {
        setTelegramDisconnectFeedback({ type: 'error', message: data?.error ?? 'Falha ao desconectar Telegram.' })
        setTelegramModalOpen(false)
        return
      }
      setTelegramDisconnectFeedback({ type: 'success', message: 'Telegram desconectado com sucesso.' })
      setTelegramModalOpen(false)
      await loadUserDetails()
    } catch {
      setTelegramDisconnectFeedback({ type: 'error', message: 'Erro de conexão.' })
      setTelegramModalOpen(false)
    } finally {
      setTelegramDisconnectLoading(false)
    }
  }

  const confirmWithdrawPwdDelete = async () => {
    if (!id) return
    setWithdrawPwdDeleteLoading(true)
    setWithdrawPwdDeleteFeedback(null)
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${id}/withdraw-password`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = (await res.json()) as { ok?: boolean; error?: string; message?: string }
      if (!res.ok || !data?.ok) {
        setWithdrawPwdDeleteFeedback({ type: 'error', message: data?.error ?? 'Falha ao remover senha de saque.' })
        setWithdrawPwdModalOpen(false)
        return
      }
      setWithdrawPwdDeleteFeedback({ type: 'success', message: 'Senha de saque removida com sucesso.' })
      setWithdrawPwdModalOpen(false)
      await loadUserDetails()
    } catch {
      setWithdrawPwdDeleteFeedback({ type: 'error', message: 'Erro de conexão.' })
      setWithdrawPwdModalOpen(false)
    } finally {
      setWithdrawPwdDeleteLoading(false)
    }
  }

  const handleTelegramMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!id) return
    const text = telegramMsgText.trim()
    if (!text) {
      setTelegramMsgFeedback({ type: 'error', message: 'Digite uma mensagem antes de enviar.' })
      return
    }
    setTelegramMsgLoading(true)
    setTelegramMsgFeedback(null)
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${id}/telegram/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: text }),
      })
      const data = (await res.json()) as { ok?: boolean; error?: string; message?: string }
      if (!res.ok || !data?.ok) {
        setTelegramMsgFeedback({ type: 'error', message: data?.error ?? 'Falha ao enviar mensagem.' })
        return
      }
      setTelegramMsgFeedback({ type: 'success', message: 'Mensagem enviada com sucesso pelo Telegram!' })
      setTelegramMsgText('')
    } catch {
      setTelegramMsgFeedback({ type: 'error', message: 'Erro de conexão ao enviar mensagem.' })
    } finally {
      setTelegramMsgLoading(false)
    }
  }

  const handleBalanceAdjust = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!id) return

    const parsedAmount = Number(String(adjustAmount).replace(',', '.'))
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setAdjustFeedback({ type: 'error', message: 'Informe um valor válido maior que zero.' })
      return
    }

    setAdjustLoading(true)
    setAdjustFeedback(null)

    try {
      const res = await fetch(`${API_URL}/api/admin/users/${id}/balance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          amount: parsedAmount,
          operation: adjustOperation,
          reason: adjustReason.trim() || undefined,
        }),
      })

      const data = (await res.json()) as { ok?: boolean; error?: string; message?: string }
      if (!res.ok || !data?.ok) {
        setAdjustFeedback({ type: 'error', message: data?.error ?? 'Falha ao ajustar saldo.' })
        return
      }

      setAdjustFeedback({ type: 'success', message: data?.message ?? 'Saldo ajustado com sucesso.' })
      setAdjustAmount('')
      setAdjustReason('')
      await loadUserDetails()
    } catch {
      setAdjustFeedback({ type: 'error', message: 'Erro de conexão ao ajustar saldo.' })
    } finally {
      setAdjustLoading(false)
    }
  }

  const renderReferralLevel = (
    title: string,
    items: ReferralItem[] | undefined,
    showAll: boolean,
    onToggle: () => void
  ) => {
    const safeItems = items ?? []
    const visibleItems = showAll ? safeItems : safeItems.slice(0, 5)

    return (
      <section className="admin-panel admin-user-list-panel">
        <div className="admin-log-header">
          <h3>{title}</h3>
        </div>

        {safeItems.length > 0 ? (
          <>
            <div className="admin-user-list">
              {visibleItems.map((member) => (
                <article key={member.id} className="admin-user-list-item">
                  <div>
                    <strong>{member.name}</strong>
                    <p>#{member.id} · {member.phone}</p>
                    <p>Cadastro: {member.createdAt ? new Date(member.createdAt).toLocaleString('pt-BR') : '-'}</p>
                  </div>
                  <div>
                    <p><strong>Status depósito:</strong> {member.hasDeposit ? 'Depositou' : 'Não depositou'}</p>
                    <p><strong>Total depositado:</strong> {formatBRL(member.totalDepositsPaid)}</p>
                  </div>
                </article>
              ))}
            </div>

            {safeItems.length > 5 ? (
              <button type="button" className="admin-toggle-logs-btn" onClick={onToggle}>
                {showAll ? 'Mostrar menos' : `Ver mais (${safeItems.length - 5} restantes)`}
              </button>
            ) : null}
          </>
        ) : (
          <p className="admin-log-hint">Nenhum convidado neste nível.</p>
        )}
      </section>
    )
  }

  const tc = user?.telegramConnection

  return (
    <main className="admin-page">
      <AdminSidebar />

      {/* ── Modal confirmação desconectar Telegram ── */}
      {telegramModalOpen ? (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(15,23,42,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 2000, padding: 16,
        }}>
          <div style={{
            width: '100%', maxWidth: 420,
            background: 'linear-gradient(180deg,#fff 0%,#f8fafc 100%)',
            borderRadius: 16,
            border: '1px solid #e2e8f0',
            boxShadow: '0 20px 48px rgba(2,6,23,.18)',
            padding: 24,
          }}>
            <h3 style={{ margin: '0 0 6px', color: '#0f172a', fontSize: 18 }}>
              Desconectar Telegram
            </h3>
            <p style={{ margin: '0 0 18px', color: '#64748b', fontSize: 14 }}>
              Confirme antes de remover a conexão com o Telegram deste usuário.
            </p>

            {/* Dados do Telegram conectado */}
            <div style={{
              background: '#f1f5f9', borderRadius: 10,
              padding: '14px 16px', marginBottom: 20,
              border: '1px solid #e2e8f0',
              display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              {[
                { label: 'Nome no Telegram', value: tc?.telegramFirstName || '-' },
                { label: 'Username',         value: tc?.telegramUsername ? `@${tc.telegramUsername}` : '-' },
                { label: 'Telegram User ID', value: tc?.telegramUserId || '-' },
                { label: 'Chat ID',          value: tc?.telegramChatId || '-' },
                { label: 'Conectado em',     value: tc?.connectedAt ? new Date(tc.connectedAt).toLocaleString('pt-BR') : '-' },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600, minWidth: 140 }}>{label}:</span>
                  <span style={{ fontSize: 13, color: '#0f172a', fontFamily: 'monospace', fontWeight: 500 }}>{value}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setTelegramModalOpen(false)}
                style={{
                  padding: '8px 18px', borderRadius: 9,
                  border: '1.5px solid #e2e8f0', background: 'transparent',
                  fontWeight: 700, fontSize: 14, cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={telegramDisconnectLoading}
                onClick={confirmTelegramDisconnect}
                style={{
                  padding: '8px 18px', borderRadius: 9,
                  border: 'none', background: '#dc2626', color: '#fff',
                  fontWeight: 700, fontSize: 14,
                  cursor: telegramDisconnectLoading ? 'not-allowed' : 'pointer',
                  opacity: telegramDisconnectLoading ? 0.7 : 1,
                }}
              >
                {telegramDisconnectLoading ? 'Desconectando...' : 'Confirmar desconexão'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Modal confirmação deletar senha de saque ── */}
      {withdrawPwdModalOpen ? (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(15,23,42,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 2000, padding: 16,
        }}>
          <div style={{
            width: '100%', maxWidth: 400,
            background: 'linear-gradient(180deg,#fff 0%,#f8fafc 100%)',
            borderRadius: 16,
            border: '1px solid #e2e8f0',
            boxShadow: '0 20px 48px rgba(2,6,23,.18)',
            padding: 24,
          }}>
            <h3 style={{ margin: '0 0 6px', color: '#0f172a', fontSize: 18 }}>
              Remover senha de saque
            </h3>
            <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: 14 }}>
              Tem certeza que deseja remover a senha de saque deste usuário? Ele precisará cadastrar uma nova senha antes de sacar.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setWithdrawPwdModalOpen(false)}
                style={{
                  padding: '8px 18px', borderRadius: 9,
                  border: '1.5px solid #e2e8f0', background: 'transparent',
                  fontWeight: 700, fontSize: 14, cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={withdrawPwdDeleteLoading}
                onClick={confirmWithdrawPwdDelete}
                style={{
                  padding: '8px 18px', borderRadius: 9,
                  border: 'none', background: '#dc2626', color: '#fff',
                  fontWeight: 700, fontSize: 14,
                  cursor: withdrawPwdDeleteLoading ? 'not-allowed' : 'pointer',
                  opacity: withdrawPwdDeleteLoading ? 0.7 : 1,
                }}
              >
                {withdrawPwdDeleteLoading ? 'Removendo...' : 'Confirmar remoção'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <section className="admin-content admin-user-details-page">
        <header className="admin-header">
          <div>
            <h1>Detalhes do Usuário</h1>
            <p className="admin-subtitle">Informações completas para gestão administrativa.</p>
          </div>
          <button type="button" className="admin-back-btn" onClick={() => navigate('/adf/users')}>
            Voltar
          </button>
        </header>

        {error ? <p className="admin-kpi-error">{error}</p> : null}

        {loading ? (
          <section className="admin-panel">
            <p>Carregando detalhes...</p>
          </section>
        ) : user ? (
          <>
            <section className="admin-panel admin-user-identity">
              <h2>{user.name}</h2>
              <p><strong>ID:</strong> #{user.id}</p>
              <p style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <strong>Telefone:</strong>
                {editingPhone ? (
                  <form
                    onSubmit={handlePhoneSave}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}
                  >
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder={user.phone}
                      autoFocus
                      style={{
                        padding: '4px 10px',
                        borderRadius: 8,
                        border: '1.5px solid #6366f1',
                        fontSize: 14,
                        outline: 'none',
                        width: 180,
                      }}
                    />
                    <button
                      type="submit"
                      disabled={editPhoneLoading}
                      style={{
                        padding: '4px 12px',
                        borderRadius: 8,
                        border: 'none',
                        background: '#6366f1',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: editPhoneLoading ? 'not-allowed' : 'pointer',
                        opacity: editPhoneLoading ? 0.7 : 1,
                      }}
                    >
                      {editPhoneLoading ? 'Salvando...' : 'Salvar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setEditingPhone(false); setEditPhoneFeedback(null) }}
                      style={{
                        padding: '4px 12px',
                        borderRadius: 8,
                        border: '1.5px solid #e2e8f0',
                        background: 'transparent',
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: 'pointer',
                      }}
                    >
                      Cancelar
                    </button>
                    {editPhoneFeedback ? (
                      <span style={{ fontSize: 12, color: editPhoneFeedback.type === 'success' ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                        {editPhoneFeedback.message}
                      </span>
                    ) : null}
                  </form>
                ) : (
                  <>
                    <span>{user.phone}</span>
                    <button
                      type="button"
                      onClick={() => { setEditPhone(user.phone); setEditingPhone(true); setEditPhoneFeedback(null) }}
                      style={{
                        padding: '3px 10px',
                        borderRadius: 8,
                        border: '1.5px solid #6366f1',
                        background: 'transparent',
                        color: '#6366f1',
                        fontWeight: 700,
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      ✏️ Editar
                    </button>
                  </>
                )}
              </p>
              <p><strong>Admin:</strong> {user.is_admin ? 'Sim' : 'Não'}</p>
              <p><strong>Status:</strong> {user.is_banned ? 'Banido' : 'Ativo'}</p>
              <p style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <strong>Telegram conectado:</strong>
                <span>{Number(user.telegramConectado ?? 0) === 1 ? 'Sim' : 'Não'}</span>
                {Number(user.telegramConectado ?? 0) === 1 ? (
                  <button
                    type="button"
                    disabled={telegramDisconnectLoading}
                    onClick={handleTelegramDisconnect}
                    style={{
                      padding: '3px 10px',
                      borderRadius: 8,
                      border: '1.5px solid #dc2626',
                      background: 'transparent',
                      color: '#dc2626',
                      fontWeight: 700,
                      fontSize: 12,
                      cursor: telegramDisconnectLoading ? 'not-allowed' : 'pointer',
                      opacity: telegramDisconnectLoading ? 0.6 : 1,
                    }}
                  >
                    {telegramDisconnectLoading ? 'Desconectando...' : '🔌 Desconectar'}
                  </button>
                ) : null}
                {telegramDisconnectFeedback ? (
                  <span style={{ fontSize: 12, color: telegramDisconnectFeedback.type === 'success' ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                    {telegramDisconnectFeedback.message}
                  </span>
                ) : null}
              </p>
              <p style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <strong>Senha de saque:</strong>
                <span style={{ color: user.hasWithdrawPassword ? '#4ade80' : '#f87171', fontWeight: 600 }}>
                  {user.hasWithdrawPassword ? '✅ Cadastrada' : '❌ Não cadastrada'}
                </span>
                {user.hasWithdrawPassword ? (
                  <button
                    type="button"
                    disabled={withdrawPwdDeleteLoading}
                    onClick={() => { setWithdrawPwdDeleteFeedback(null); setWithdrawPwdModalOpen(true) }}
                    style={{
                      padding: '3px 10px',
                      borderRadius: 8,
                      border: '1.5px solid #dc2626',
                      background: 'transparent',
                      color: '#dc2626',
                      fontWeight: 700,
                      fontSize: 12,
                      cursor: withdrawPwdDeleteLoading ? 'not-allowed' : 'pointer',
                      opacity: withdrawPwdDeleteLoading ? 0.6 : 1,
                    }}
                  >
                    🗑️ Deletar senha
                  </button>
                ) : null}
                {withdrawPwdDeleteFeedback ? (
                  <span style={{ fontSize: 12, color: withdrawPwdDeleteFeedback.type === 'success' ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                    {withdrawPwdDeleteFeedback.message}
                  </span>
                ) : null}
              </p>
              <p><strong>Contrato ativo:</strong> {String(user.activeContract ?? '').trim() || 'Sem contrato ativo'}</p>
              <p><strong>Cadastrado em:</strong> {user.created_at ? new Date(user.created_at).toLocaleString('pt-BR') : '-'}</p>
            </section>

            <section className="admin-panel admin-user-list-panel">
              <div className="admin-log-header">
                <h3>Ajuste de saldo (admin)</h3>
              </div>

              <form className="admin-balance-adjust-form" onSubmit={handleBalanceAdjust}>
                <div className="admin-balance-adjust-grid">
                  <label>
                    <span>Valor</span>
                    <input
                      type="text"
                      value={adjustAmount}
                      onChange={(e) => setAdjustAmount(e.target.value)}
                      placeholder="0,00"
                      inputMode="decimal"
                    />
                  </label>

                  <label>
                    <span>Operação</span>
                    <select
                      value={adjustOperation}
                      onChange={(e) => setAdjustOperation(e.target.value as 'add' | 'subtract')}
                    >
                      <option value="add">Adicionar saldo</option>
                      <option value="subtract">Retirar saldo</option>
                    </select>
                  </label>

                  <label className="admin-balance-adjust-reason">
                    <span>Motivo (opcional)</span>
                    <input
                      type="text"
                      value={adjustReason}
                      onChange={(e) => setAdjustReason(e.target.value)}
                      placeholder="Ex: correção manual"
                    />
                  </label>
                </div>

                <button type="submit" className="admin-toggle-logs-btn" disabled={adjustLoading}>
                  {adjustLoading ? 'Salvando...' : 'Confirmar ajuste'}
                </button>

                {adjustFeedback ? (
                  <p className={adjustFeedback.type === 'success' ? 'admin-balance-feedback-success' : 'admin-balance-feedback-error'}>
                    {adjustFeedback.message}
                  </p>
                ) : null}
              </form>
            </section>

            {Number(user.telegramConectado ?? 0) === 1 ? (
              <section className="admin-panel admin-user-list-panel">
                <div className="admin-log-header">
                  <h3>📨 Enviar mensagem pelo Telegram</h3>
                </div>
                <p className="admin-log-hint" style={{ marginBottom: 12 }}>
                  Envie uma mensagem diretamente para este usuário via bot do Telegram.
                  {user.telegramConnection?.telegramFirstName
                    ? ` Conectado como: ${user.telegramConnection.telegramFirstName}${user.telegramConnection.telegramUsername ? ` (@${user.telegramConnection.telegramUsername})` : ''}.`
                    : ''}
                </p>
                <form onSubmit={handleTelegramMessage} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <textarea
                    value={telegramMsgText}
                    onChange={(e) => setTelegramMsgText(e.target.value)}
                    placeholder="Digite a mensagem para enviar ao usuário..."
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: '1.5px solid #2a3a63',
                      background: '#0d1526',
                      color: '#e2e8f0',
                      fontSize: 14,
                      resize: 'vertical',
                      outline: 'none',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box',
                    }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <button
                      type="submit"
                      className="admin-toggle-logs-btn"
                      disabled={telegramMsgLoading}
                      style={{ opacity: telegramMsgLoading ? 0.7 : 1 }}
                    >
                      {telegramMsgLoading ? 'Enviando...' : '📤 Enviar mensagem'}
                    </button>
                    {telegramMsgFeedback ? (
                      <span style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: telegramMsgFeedback.type === 'success' ? '#16a34a' : '#dc2626',
                      }}>
                        {telegramMsgFeedback.message}
                      </span>
                    ) : null}
                  </div>
                </form>
              </section>
            ) : null}

            <section className="admin-user-metrics-grid">
              <article className="admin-kpi-card">
                <p>Saldo atual</p>
                <strong>{formatBRL(user.balance)}</strong>
              </article>
              <article className="admin-kpi-card">
                <p>Saldo da loja (gift cards)</p>
                <strong>{formatBRL(user.shopBalance ?? 0)}</strong>
              </article>
              <article className="admin-kpi-card">
                <p>Total depósitos pagos</p>
                <strong>{formatBRL(user.totalDepositsPaid)}</strong>
              </article>
              <article className="admin-kpi-card">
                <p>Total saques</p>
                <strong>{formatBRL(user.totalWithdrawals)}</strong>
              </article>
              <article className="admin-kpi-card">
                <p>Compras de gift card (loja)</p>
                <strong>{user.totalShopGiftCardPurchases ?? 0}</strong>
              </article>
              <article className="admin-kpi-card">
                <p>Total planos ciclo comprados</p>
                <strong>{user.totalCyclePlansBought}</strong>
              </article>
              <article className="admin-kpi-card">
                <p>Total planos VIP comprados</p>
                <strong>{user.totalVipPlansBought}</strong>
              </article>
            </section>

            {(user.commissionLevelStats ?? []).length > 0 ? (
              <section className="admin-panel admin-user-list-panel">
                <div className="admin-log-header">
                  <h3>Convidados por nível de comissão</h3>
                </div>
                <div className="admin-user-metrics-grid">
                  {(user.commissionLevelStats ?? []).map((stat) => (
                    <article key={`cl-${stat.level}`} className="admin-kpi-card admin-kpi-card--referral">
                      <p className="admin-kpi-label">
                        {stat.name}
                        <span className="admin-kpi-commission-badge">{stat.commissionPercent}%</span>
                      </p>
                      <strong className="admin-kpi-value">{stat.referralCount}</strong>
                      <small className="admin-kpi-sub">
                        {stat.referralsWithDeposit} depositaram
                        {stat.referralCount > 0
                          ? ` (${Math.round((stat.referralsWithDeposit / stat.referralCount) * 100)}%)`
                          : ''}
                      </small>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="admin-panel admin-user-list-panel">
              <div className="admin-log-header">
                <h3>Histórico detalhado</h3>
              </div>
              <p className="admin-log-hint">
                Clique no botão abaixo para abrir a página com: Planos VIP, planos de ciclo, gift codes, check-ins e logs da conta.
              </p>
              <button
                type="button"
                className="admin-toggle-logs-btn"
                onClick={() => navigate(`/adf/users/${user.id}/history`)}
              >
                Abrir histórico detalhado
              </button>
            </section>

            {renderReferralLevel('Convites Nível 1', user.referralsLevel1, showAllLevel1, () => setShowAllLevel1((prev) => !prev))}
            {renderReferralLevel('Convites Nível 2', user.referralsLevel2, showAllLevel2, () => setShowAllLevel2((prev) => !prev))}
            {renderReferralLevel('Convites Nível 3', user.referralsLevel3, showAllLevel3, () => setShowAllLevel3((prev) => !prev))}
          </>
        ) : null}
      </section>
    </main>
  )
}
