import { useEffect, useMemo, useState } from 'react'
import AdminSidebar from '../components/AdminSidebar'
import FloatingToast from '../components/FloatingToast'
import './Admin.css'
import './AdminSiteBranding.css'
import { applySiteBranding } from '../utils/siteBranding'

type BrandingConfig = {
  title: string
  logoUrl: string
  description: string
}

const DEFAULT_TITLE = 'AGROVIA Plataforma'
const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

const readToken = () => {
  const fromLocal = String(localStorage.getItem('token') ?? '').trim()
  if (fromLocal) return fromLocal
  const fromSession = String(sessionStorage.getItem('token') ?? '').trim()
  return fromSession
}

export default function AdminSiteBranding() {
  const current = useMemo<BrandingConfig>(() => ({ title: DEFAULT_TITLE, logoUrl: '', description: '' }), [])
  const [title, setTitle] = useState(current.title)
  const [logoUrl, setLogoUrl] = useState(current.logoUrl)
  const [description, setDescription] = useState(current.description)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ open: boolean; type: 'success' | 'error'; message: string }>({
    open: false,
    type: 'success',
    message: '',
  })

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ open: true, type, message })
  }


  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const token = readToken()
        if (!token) {
          throw new Error('Token de admin não encontrado.')
        }

        const response = await fetch(`${API_BASE}/api/admin/site-settings`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const data = await response.json().catch(() => ({}))
        if (!response.ok || !data?.ok) {
          throw new Error(String(data?.error ?? 'Não foi possível carregar configurações.'))
        }

        const remoteTitle = String(data?.settings?.siteTitle ?? '').trim() || DEFAULT_TITLE
        const remoteLogoUrl = String(data?.settings?.siteLogoUrl ?? '').trim()
        const remoteDescription = String(data?.settings?.siteDescription ?? '').trim()

        if (!active) return
        setTitle(remoteTitle)
        setLogoUrl(remoteLogoUrl)
        setDescription(remoteDescription)
        applySiteBranding({ siteTitle: remoteTitle, siteLogoUrl: remoteLogoUrl })
      } catch (error) {
        if (!active) return
        showToast('error', error instanceof Error ? error.message : 'Falha ao carregar configurações.')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()

    return () => {
      active = false
    }
  }, [])

  const save = async () => {
    const normalized: BrandingConfig = {
      title: title.trim() || DEFAULT_TITLE,
      logoUrl: logoUrl.trim(),
      description: description.trim(),
    }

    try {
      setSaving(true)
      const token = readToken()
      if (!token) {
        throw new Error('Token de admin não encontrado.')
      }

      const response = await fetch(`${API_BASE}/api/admin/site-settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          siteTitle: normalized.title,
          siteDescription: normalized.description,
          siteLogoUrl: normalized.logoUrl,
        }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data?.ok) {
        throw new Error(String(data?.error ?? 'Não foi possível salvar as configurações.'))
      }

      applySiteBranding({ siteTitle: normalized.title, siteLogoUrl: normalized.logoUrl })
      showToast('success', 'Configuração de título e foto do site salva no banco com sucesso.')
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Não foi possível salvar as configurações de branding.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="admin-page admin-branding-page">
      <AdminSidebar />
      <section className="admin-content admin-branding-content">
        <article className="admin-branding-card">
          <header className="admin-branding-head">
            <h1>Personalização do Site</h1>
            <p>Altere o título e a foto (logo/favicon) exibidos no site inteiro.</p>
          </header>

          <div className="admin-branding-grid">
            <label className="admin-branding-field">
              <span>Título do site</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex.: Minha Plataforma"
              />
            </label>

            <label className="admin-branding-field">
              <span>URL da foto/logo</span>
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://exemplo.com/logo.png"
              />
            </label>

            <label className="admin-branding-field full">
              <span>Descrição do site (banco: site_settings.site_description)</span>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrição opcional do site"
              />
            </label>
          </div>

          <section className="admin-branding-preview">
            <h2>Pré-visualização</h2>
            <div className="admin-branding-preview-box">
              <div className="admin-branding-logo">
                {logoUrl.trim() ? (
                  <img src={logoUrl.trim()} alt="Preview do logo" />
                ) : (
                  <div className="admin-branding-logo-fallback">Sem logo</div>
                )}
              </div>
              <div className="admin-branding-meta">
                <strong>{title.trim() || DEFAULT_TITLE}</strong>
                <small>Esse título aparecerá na aba do navegador.</small>
              </div>
            </div>
          </section>

          <div className="admin-branding-actions">
            <button type="button" onClick={save} disabled={loading || saving}>
              {saving ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </div>
        </article>
      </section>

      <FloatingToast
        open={toast.open}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
      />
    </main>
  )
}
