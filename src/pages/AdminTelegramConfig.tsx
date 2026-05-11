import { useEffect, useMemo, useState } from 'react'
import AdminSidebar from '../components/AdminSidebar'
import FloatingToast from '../components/FloatingToast'
import './Admin.css'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

export default function AdminTelegramConfig() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [botToken, setBotToken] = useState('')
  const [groupId, setGroupId] = useState('')
  const [logsGroupId, setLogsGroupId] = useState('')
  const [welcomeMessage, setWelcomeMessage] = useState('')
  const [privateChatOnlyMessage, setPrivateChatOnlyMessage] = useState('')
  const [privateLinkSuccessMessage, setPrivateLinkSuccessMessage] = useState('')
  const [alreadyLinkedMessage, setAlreadyLinkedMessage] = useState('')
  const [checkinSuccessMessage, setCheckinSuccessMessage] = useState('')
  const [checkinAlreadyClaimedMessage, setCheckinAlreadyClaimedMessage] = useState('')
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const token = useMemo(
    () => localStorage.getItem('token') ?? sessionStorage.getItem('token') ?? '',
    []
  )

  const loadConfig = async () => {
    if (!token) {
      setToast({ type: 'error', message: 'Token não encontrado. Faça login novamente.' })
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/admin/telegram-config`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data?.ok) {
        setToast({ type: 'error', message: String(data?.error ?? 'Erro ao carregar configuração do Telegram.') })
        return
      }

      setBotToken(String(data?.config?.botToken ?? ''))
      setGroupId(String(data?.config?.groupId ?? ''))
      setLogsGroupId(String(data?.config?.logsGroupId ?? ''))
      setWelcomeMessage(String(data?.config?.welcomeMessage ?? ''))
      setPrivateChatOnlyMessage(
        String(data?.config?.privateChatOnlyMessage ?? 'Conexão permitida somente no chat privado do bot.')
      )
      setPrivateLinkSuccessMessage(
        String(data?.config?.privateLinkSuccessMessage ?? 'Conta conectada com sucesso.')
      )
      setAlreadyLinkedMessage(
        String(
          data?.config?.alreadyLinkedMessage ??
            'Esta conta já foi conectada anteriormente e não pode ser vinculada novamente.'
        )
      )
      setCheckinSuccessMessage(
        String(
          data?.config?.checkinSuccessMessage ??
            'Check-in do dia {day} resgatado com sucesso!'
        )
      )
      setCheckinAlreadyClaimedMessage(
        String(
          data?.config?.checkinAlreadyClaimedMessage ??
            'Check-in de hoje já foi resgatado.'
        )
      )
    } catch {
      setToast({ type: 'error', message: 'Falha de conexão ao carregar configuração do Telegram.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadConfig()
  }, [])

  const handleSave = async () => {
    if (!token) {
      setToast({ type: 'error', message: 'Token não encontrado. Faça login novamente.' })
      return
    }

    const normalizedBotToken = botToken.trim()
    const normalizedGroupId = groupId.trim()
    const normalizedLogsGroupId = logsGroupId.trim()
    const normalizedWelcomeMessage = welcomeMessage.trim()
    const normalizedPrivateChatOnlyMessage =
      privateChatOnlyMessage.trim() || 'Conexão permitida somente no chat privado do bot.'
    const normalizedPrivateLinkSuccessMessage =
      privateLinkSuccessMessage.trim() || 'Conta conectada com sucesso.'
    const normalizedAlreadyLinkedMessage =
      alreadyLinkedMessage.trim() ||
      'Esta conta já foi conectada anteriormente e não pode ser vinculada novamente.'
    const normalizedCheckinSuccessMessage =
      checkinSuccessMessage.trim() ||
      'Check-in do dia {day} resgatado com sucesso!'
    const normalizedCheckinAlreadyClaimedMessage =
      checkinAlreadyClaimedMessage.trim() ||
      'Check-in de hoje já foi resgatado.'

    if (!normalizedBotToken) {
      setToast({ type: 'error', message: 'Bot token é obrigatório.' })
      return
    }

    if (!normalizedGroupId) {
      setToast({ type: 'error', message: 'Group ID é obrigatório.' })
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`${API_URL}/api/admin/telegram-config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          botToken: normalizedBotToken,
          groupId: normalizedGroupId,
          logsGroupId: normalizedLogsGroupId,
          welcomeMessage: normalizedWelcomeMessage,
          privateChatOnlyMessage: normalizedPrivateChatOnlyMessage,
          privateLinkSuccessMessage: normalizedPrivateLinkSuccessMessage,
          alreadyLinkedMessage: normalizedAlreadyLinkedMessage,
          checkinSuccessMessage: normalizedCheckinSuccessMessage,
          checkinAlreadyClaimedMessage: normalizedCheckinAlreadyClaimedMessage,
        }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data?.ok) {
        setToast({ type: 'error', message: String(data?.error ?? 'Erro ao salvar configuração do Telegram.') })
        return
      }

      setToast({ type: 'success', message: String(data?.message ?? 'Configuração do Telegram salva com sucesso.') })
      await loadConfig()
    } catch {
      setToast({ type: 'error', message: 'Falha de conexão ao salvar configuração do Telegram.' })
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
            <h1>Bot Telegram</h1>
            <p className="admin-subtitle">Configure o token do bot, o ID do grupo e as mensagens do Telegram.</p>
          </div>
        </header>

        <section className="admin-panel admin-panel-wide">
          <div className="admin-panel-head">
            <h2>Configuração Telegram</h2>
            <span>Dados usados para integração de notificações</span>
          </div>

          {loading ? (
            <p className="admin-log-hint">Carregando configuração...</p>
          ) : (
            <div style={{ display: 'grid', gap: 12, maxWidth: 760 }}>
              <div className="admin-withdraw-filter-field">
                <label htmlFor="telegram-bot-token">Bot Token</label>
                <input
                  id="telegram-bot-token"
                  type="text"
                  className="admin-withdraw-filter-input"
                  placeholder="Ex.: 123456789:AA..."
                  value={botToken}
                  onChange={(event) => setBotToken(event.target.value)}
                />
              </div>

              <div className="admin-withdraw-filter-field">
                <label htmlFor="telegram-group-id">Group ID (grupo principal)</label>
                <input
                  id="telegram-group-id"
                  type="text"
                  className="admin-withdraw-filter-input"
                  placeholder="Ex.: -1001234567890"
                  value={groupId}
                  onChange={(event) => setGroupId(event.target.value)}
                />
              </div>

              <div className="admin-withdraw-filter-field">
                <label htmlFor="telegram-logs-group-id">Group ID de Logs</label>
                <input
                  id="telegram-logs-group-id"
                  type="text"
                  className="admin-withdraw-filter-input"
                  placeholder="Ex.: -1009876543210 (grupo onde serão enviados os logs)"
                  value={logsGroupId}
                  onChange={(event) => setLogsGroupId(event.target.value)}
                />
              </div>

              <div className="admin-withdraw-filter-field">
                <label htmlFor="telegram-welcome-message">Mensagem de boas-vindas (/start no privado)</label>
                <textarea
                  id="telegram-welcome-message"
                  className="admin-withdraw-filter-input"
                  placeholder="Ex.: Bem-vindo! Envie seu telefone cadastrado para conectar."
                  value={welcomeMessage}
                  onChange={(event) => setWelcomeMessage(event.target.value)}
                  rows={5}
                  style={{ resize: 'vertical', minHeight: 120 }}
                />
              </div>

              <div className="admin-withdraw-filter-field">
                <label htmlFor="telegram-private-chat-only-message">Mensagem para quem falar no grupo</label>
                <textarea
                  id="telegram-private-chat-only-message"
                  className="admin-withdraw-filter-input"
                  placeholder="Ex.: Conexão permitida somente no chat privado do bot."
                  value={privateChatOnlyMessage}
                  onChange={(event) => setPrivateChatOnlyMessage(event.target.value)}
                  rows={4}
                  style={{ resize: 'vertical', minHeight: 100 }}
                />
              </div>

              <div className="admin-withdraw-filter-field">
                <label htmlFor="telegram-private-link-success-message">Mensagem de sucesso ao vincular no privado</label>
                <textarea
                  id="telegram-private-link-success-message"
                  className="admin-withdraw-filter-input"
                  placeholder="Ex.: Conta conectada com sucesso."
                  value={privateLinkSuccessMessage}
                  onChange={(event) => setPrivateLinkSuccessMessage(event.target.value)}
                  rows={4}
                  style={{ resize: 'vertical', minHeight: 100 }}
                />
              </div>

              <div className="admin-withdraw-filter-field">
                <label htmlFor="telegram-already-linked-message">Mensagem quando conta já estiver vinculada</label>
                <textarea
                  id="telegram-already-linked-message"
                  className="admin-withdraw-filter-input"
                  placeholder="Ex.: Esta conta já foi conectada anteriormente e não pode ser vinculada novamente."
                  value={alreadyLinkedMessage}
                  onChange={(event) => setAlreadyLinkedMessage(event.target.value)}
                  rows={4}
                  style={{ resize: 'vertical', minHeight: 100 }}
                />
              </div>

              <div className="admin-withdraw-filter-field">
                <label htmlFor="telegram-checkin-success-message">Mensagem de sucesso do /checkin</label>
                <textarea
                  id="telegram-checkin-success-message"
                  className="admin-withdraw-filter-input"
                  placeholder="Ex.: Check-in do dia {day} resgatado com sucesso!"
                  value={checkinSuccessMessage}
                  onChange={(event) => setCheckinSuccessMessage(event.target.value)}
                  rows={4}
                  style={{ resize: 'vertical', minHeight: 100 }}
                />
              </div>

              <div className="admin-withdraw-filter-field">
                <label htmlFor="telegram-checkin-already-claimed-message">Mensagem quando /checkin já foi resgatado</label>
                <textarea
                  id="telegram-checkin-already-claimed-message"
                  className="admin-withdraw-filter-input"
                  placeholder="Ex.: Check-in de hoje já foi resgatado."
                  value={checkinAlreadyClaimedMessage}
                  onChange={(event) => setCheckinAlreadyClaimedMessage(event.target.value)}
                  rows={4}
                  style={{ resize: 'vertical', minHeight: 100 }}
                />
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button type="button" className="btn primary" onClick={handleSave} disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar configuração'}
                </button>
                <button type="button" className="btn ghost" onClick={loadConfig} disabled={saving}>
                  Recarregar
                </button>
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
