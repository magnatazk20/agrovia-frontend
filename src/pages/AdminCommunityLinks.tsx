import { useEffect, useMemo, useState } from 'react'
import AdminSidebar from '../components/AdminSidebar'
import FloatingToast from '../components/FloatingToast'
import './Admin.css'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

export default function AdminCommunityLinks() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [whatsappGroupUrl, setWhatsappGroupUrl] = useState('')
  const [vipGroupUrl, setVipGroupUrl] = useState('')
  const [managerContact, setManagerContact] = useState('')
  const [instagramUrl, setInstagramUrl] = useState('')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const token = useMemo(
    () => localStorage.getItem('token') ?? sessionStorage.getItem('token') ?? '',
    []
  )

  const loadLinks = async () => {
    if (!token) {
      setToast({ type: 'error', message: 'Token não encontrado. Faça login novamente.' })
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/community-links`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data?.ok) {
        setToast({ type: 'error', message: String(data?.error ?? 'Erro ao carregar links da comunidade.') })
        return
      }

      setWhatsappGroupUrl(String(data?.links?.whatsappGroupUrl ?? ''))
      setVipGroupUrl(String(data?.links?.vipGroupUrl ?? ''))
      setManagerContact(String(data?.links?.managerContact ?? ''))
      setInstagramUrl(String(data?.links?.instagramUrl ?? ''))
      setYoutubeUrl(String(data?.links?.youtubeUrl ?? ''))
    } catch {
      setToast({ type: 'error', message: 'Falha de conexão ao carregar links da comunidade.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLinks()
  }, [])

  const handleSave = async () => {
    if (!token) {
      setToast({ type: 'error', message: 'Token não encontrado. Faça login novamente.' })
      return
    }

    const normalizedWhatsappGroupUrl = whatsappGroupUrl.trim()
    const normalizedVipGroupUrl = vipGroupUrl.trim()
    const normalizedManagerContact = managerContact.trim()
    const normalizedInstagramUrl = instagramUrl.trim()
    const normalizedYoutubeUrl = youtubeUrl.trim()

    if (!normalizedWhatsappGroupUrl) {
      setToast({ type: 'error', message: 'Link do grupo WhatsApp é obrigatório.' })
      return
    }

    if (!normalizedManagerContact) {
      setToast({ type: 'error', message: 'Contato do gerente é obrigatório.' })
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`${API_URL}/api/community-links`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          whatsappGroupUrl: normalizedWhatsappGroupUrl,
          vipGroupUrl: normalizedVipGroupUrl,
          managerContact: normalizedManagerContact,
          instagramUrl: normalizedInstagramUrl,
          youtubeUrl: normalizedYoutubeUrl,
        }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data?.ok) {
        setToast({ type: 'error', message: String(data?.error ?? 'Erro ao salvar links da comunidade.') })
        return
      }

      setToast({ type: 'success', message: String(data?.message ?? 'Links da comunidade salvos com sucesso.') })
      await loadLinks()
    } catch {
      setToast({ type: 'error', message: 'Falha de conexão ao salvar links da comunidade.' })
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
            <h1>Links da Comunidade</h1>
            <p className="admin-subtitle">Configure os links da tabela community_links.</p>
          </div>
        </header>

        <section className="admin-panel admin-panel-wide">
          <div className="admin-panel-head">
            <h2>Configuração da Comunidade</h2>
            <span>Dados utilizados na página de comunidade</span>
          </div>

          {loading ? (
            <p className="admin-log-hint">Carregando links...</p>
          ) : (
            <div style={{ display: 'grid', gap: 12, maxWidth: 760 }}>
              <div className="admin-withdraw-filter-field">
                <label htmlFor="community-whatsapp-group-url">Link do Grupo WhatsApp</label>
                <input
                  id="community-whatsapp-group-url"
                  type="text"
                  className="admin-withdraw-filter-input"
                  placeholder="https://chat.whatsapp.com/..."
                  value={whatsappGroupUrl}
                  onChange={(event) => setWhatsappGroupUrl(event.target.value)}
                />
              </div>

              <div className="admin-withdraw-filter-field">
                <label htmlFor="community-vip-group-url">Link do Grupo VIP</label>
                <input
                  id="community-vip-group-url"
                  type="text"
                  className="admin-withdraw-filter-input"
                  placeholder="https://..."
                  value={vipGroupUrl}
                  onChange={(event) => setVipGroupUrl(event.target.value)}
                />
              </div>

              <div className="admin-withdraw-filter-field">
                <label htmlFor="community-manager-contact">Contato do Gerente</label>
                <input
                  id="community-manager-contact"
                  type="text"
                  className="admin-withdraw-filter-input"
                  placeholder="Ex.: @gerente ou +55..."
                  value={managerContact}
                  onChange={(event) => setManagerContact(event.target.value)}
                />
              </div>

              <div className="admin-withdraw-filter-field">
                <label htmlFor="community-instagram-url">Instagram</label>
                <input
                  id="community-instagram-url"
                  type="text"
                  className="admin-withdraw-filter-input"
                  placeholder="https://www.instagram.com/..."
                  value={instagramUrl}
                  onChange={(event) => setInstagramUrl(event.target.value)}
                />
              </div>

              <div className="admin-withdraw-filter-field">
                <label htmlFor="community-youtube-url">YouTube</label>
                <input
                  id="community-youtube-url"
                  type="text"
                  className="admin-withdraw-filter-input"
                  placeholder="https://www.youtube.com/..."
                  value={youtubeUrl}
                  onChange={(event) => setYoutubeUrl(event.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button type="button" className="btn primary" onClick={handleSave} disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar configuração'}
                </button>
                <button type="button" className="btn ghost" onClick={loadLinks} disabled={saving}>
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
