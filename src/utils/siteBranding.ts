const DEFAULT_TITLE = 'Agrovia Plataforma'
const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

export type SiteBrandingConfig = {
  siteTitle?: string
  siteLogoUrl?: string
}

export const applySiteBranding = (config: SiteBrandingConfig) => {
  const title = String(config.siteTitle ?? '').trim() || DEFAULT_TITLE
  const logoUrl = String(config.siteLogoUrl ?? '').trim()

  document.title = title

  if (logoUrl) {
    let favicon = document.querySelector("link[rel='icon']") as HTMLLinkElement | null
    if (!favicon) {
      favicon = document.createElement('link')
      favicon.setAttribute('rel', 'icon')
      document.head.appendChild(favicon)
    }
    favicon.setAttribute('href', logoUrl)
  }
}

export const loadAndApplySiteBranding = async () => {
  try {
    const response = await fetch(`${API_BASE}/api/site-settings`)
    const data = await response.json().catch(() => ({}))

    if (!response.ok || !data?.ok) {
      return
    }

    applySiteBranding({
      siteTitle: String(data?.settings?.siteTitle ?? ''),
      siteLogoUrl: String(data?.settings?.siteLogoUrl ?? ''),
    })
  } catch {
    // sem impacto crítico: mantém branding padrão
  }
}
