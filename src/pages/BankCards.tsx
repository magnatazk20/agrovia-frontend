import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppBottomNav from '../components/AppBottomNav'
import './BankCards.css'

type StoredUser = {
  id: number
  name: string
  phone: string
}

type PixKeyType = 'CPF' | 'CNPJ' | 'EMAIL' | 'TELEFONE' | 'CHAVE_ALEATORIA'

type PixKeyResponse = {
  ok?: boolean
  hasPixKey?: boolean
  pixKey?: {
    userId: number
    holderName: string
    holderCpf: string
    pixKeyType: PixKeyType
    pixKey: string
  } | null
  error?: string
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

const PIX_TYPE_OPTIONS: Array<{ value: PixKeyType; label: string; placeholder: string; disabled?: boolean }> = [
  { value: 'CPF', label: 'CPF', placeholder: 'Apenas números' },
  { value: 'CNPJ', label: 'CNPJ', placeholder: 'Apenas números' },
  { value: 'EMAIL', label: 'E-mail', placeholder: 'voce@exemplo.com' },
  { value: 'TELEFONE', label: 'Telefone', placeholder: '(DDD) 9XXXX-XXXX', disabled: true },
  { value: 'CHAVE_ALEATORIA', label: 'Chave Aleatória', placeholder: 'Chave gerada pelo banco' },
]

const ICON_PIX = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
    <line x1="12" y1="4" x2="12" y2="20" />
  </svg>
)

const ICON_PERSON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

const ICON_CARD = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <line x1="2" y1="10" x2="22" y2="10" />
  </svg>
)

const ICON_KEY = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="7.5" cy="15.5" r="5.5" />
    <path d="M11.5 11.5L22 1" />
    <path d="M22 1l-4.5 4.5" />
    <path d="M22 1l-2 2" />
  </svg>
)

const ICON_CHECK_GREEN = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const ICON_BANK = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="22" x2="21" y2="22" />
    <line x1="6" y1="18" x2="6" y2="11" />
    <line x1="10" y1="18" x2="10" y2="11" />
    <line x1="14" y1="18" x2="14" y2="11" />
    <line x1="18" y1="18" x2="18" y2="11" />
    <polygon points="12 2 20 7 4 7" />
  </svg>
)

const ICON_INFO = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4" />
    <path d="M12 8h.01" />
  </svg>
)

const ICON_BACK = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 6l-6 6l6 6" />
  </svg>
)

export default function BankCards() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasExistingKey, setHasExistingKey] = useState(false)
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [holderName, setHolderName] = useState('')
  const [holderCpf, setHolderCpf] = useState('')
  const [pixKeyType, setPixKeyType] = useState<PixKeyType>('CPF')
  const [pixKey, setPixKey] = useState('')
  const [mounted, setMounted] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50)
    return () => clearTimeout(t)
  }, [])

  const user = useMemo(() => {
    const raw = localStorage.getItem('user') ?? sessionStorage.getItem('user')
    if (!raw) return null
    try {
      return JSON.parse(raw) as StoredUser
    } catch {
      return null
    }
  }, [])

  const selectedTypeMeta = useMemo(
    () => PIX_TYPE_OPTIONS.find((opt) => opt.value === pixKeyType) ?? PIX_TYPE_OPTIONS[0],
    [pixKeyType]
  )

  useEffect(() => {
    const loadPixData = async () => {
      if (!user?.id) {
        navigate('/')
        return
      }

      setLoading(true)
      try {
        const res = await fetch(`${API_URL}/api/user/pix-key/${user.id}`)
        const data = (await res.json()) as PixKeyResponse

        if (!res.ok || !data?.ok) {
          setMsg({ text: data?.error ?? 'Erro ao carregar dados PIX.', type: 'error' })
          return
        }

        if (data.hasPixKey && data.pixKey) {
          setHolderName(String(data.pixKey.holderName ?? ''))
          setHolderCpf(String(data.pixKey.holderCpf ?? ''))
          setPixKeyType((data.pixKey.pixKeyType as PixKeyType) ?? 'CPF')
          setPixKey(String(data.pixKey.pixKey ?? ''))
          setHasExistingKey(true)
        } else {
          setHasExistingKey(false)
        }
      } catch {
        setMsg({ text: 'Erro de conexão ao carregar chave PIX.', type: 'error' })
      } finally {
        setLoading(false)
      }
    }

    loadPixData()
  }, [navigate, user?.id])

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return

    const payload = {
      userId: user.id,
      holderName: holderName.trim(),
      holderCpf: holderCpf.replace(/\D/g, ''),
      pixKeyType,
      pixKey: pixKey.trim(),
    }

    if (!payload.holderName || !payload.holderCpf || !payload.pixKey) {
      setShowErrorModal(true)
      return
    }

    setSaving(true)

    const token = localStorage.getItem('token') ?? sessionStorage.getItem('token') ?? ''
    try {
      const res = await fetch(`${API_URL}/api/user/pix-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(payload),
      })

      const data = (await res.json()) as { ok?: boolean; error?: string; message?: string }

      if (!res.ok || !data?.ok) {
        setShowErrorModal(true)
        return
      }

      setHasExistingKey(true)
      setShowSuccessModal(true)
    } catch {
      setShowErrorModal(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="bc-page">
      {/* Header */}
      <header className="bc-header">
        <button type="button" className="bc-back-btn" onClick={() => navigate('/profile')} aria-label="Voltar">
          {ICON_BACK}
        </button>
        <div className="bc-header-text">
          <h1>Chave PIX</h1>
          <p>Cadastre sua chave para saques</p>
        </div>
        <div className="bc-header-spacer" />
      </header>

      <div className="bc-content">
        {/* Hero card */}
        <div className={`bc-hero-card ${mounted ? 'bc-hero-card--visible' : ''}`}>
          <div className="bc-hero-glow" aria-hidden="true" />
          <div className="bc-hero-icon-wrap">
            <div className="bc-hero-icon">{ICON_PIX}</div>
            <div className="bc-hero-icon-ring" aria-hidden="true" />
          </div>
          <div className="bc-hero-bank-icon">{ICON_BANK}</div>
          <h2 className="bc-hero-title">Dados PIX</h2>
          <p className="bc-hero-text">
            Cadastre ou atualize sua chave PIX para receber saques na sua conta.
          </p>
          {hasExistingKey && (
            <div className="bc-hero-badge">
              <span className="bc-hero-badge-icon">{ICON_CHECK_GREEN}</span>
              Chave já cadastrada
            </div>
          )}
          <div className="bc-hero-shine" aria-hidden="true" />
        </div>

        {/* Form card */}
        <div className={`bc-form-card ${mounted ? 'bc-form-card--visible' : ''}`}
          style={{ transitionDelay: '100ms' }}>
          <div className="bc-form-header">
            <span className="bc-form-icon">{ICON_INFO}</span>
            <span className="bc-form-title">Dados do titular</span>
          </div>

          <form className="bc-form" onSubmit={onSave}>
            {/* Tipo de chave */}
            <div className="bc-field">
              <div className="bc-field-top">
                <label className="bc-label">Tipo de chave PIX</label>
                <span className="bc-type-badge">{selectedTypeMeta.label}</span>
              </div>
              <div className="bc-select-wrap">
                <select
                  className="bc-select"
                  value={pixKeyType}
                  onChange={(e) => setPixKeyType(e.target.value as PixKeyType)}
                >
                  {PIX_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                      {opt.label}{opt.disabled ? ' (indisponível)' : ''}
                    </option>
                  ))}
                </select>
                <span className="bc-select-arrow" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </span>
              </div>
            </div>

            {/* Nome do titular */}
            <div className="bc-field">
              <label className="bc-label">Nome do titular <span className="bc-required">*</span></label>
              <div className="bc-input-wrap">
                <span className="bc-input-icon">{ICON_PERSON}</span>
                <input
                  className="bc-input"
                  placeholder="Nome completo"
                  value={holderName}
                  onChange={(e) => setHolderName(e.target.value)}
                />
              </div>
            </div>

            {/* CPF do titular */}
            <div className="bc-field">
              <label className="bc-label">CPF do titular <span className="bc-required">*</span></label>
              <div className="bc-input-wrap">
                <span className="bc-input-icon">{ICON_CARD}</span>
                <input
                  className="bc-input"
                  placeholder="000.000.000-00"
                  value={holderCpf}
                  onChange={(e) => setHolderCpf(e.target.value)}
                  inputMode="numeric"
                />
              </div>
            </div>

            {/* Chave PIX */}
            <div className="bc-field">
              <label className="bc-label">Chave PIX <span className="bc-required">*</span></label>
              <div className="bc-input-wrap">
                <span className="bc-input-icon">{ICON_KEY}</span>
                <input
                  className="bc-input"
                  placeholder={selectedTypeMeta.placeholder}
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                />
              </div>
              <span className="bc-hint">
                {selectedTypeMeta.label === 'CPF' || selectedTypeMeta.label === 'CNPJ'
                  ? 'Apenas números, sem pontos ou traços.'
                  : `Informe sua chave do tipo ${selectedTypeMeta.label}.`}
              </span>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className={`bc-submit-btn ${!loading && holderName && holderCpf && pixKey ? 'active' : ''}`}
              disabled={saving || loading}
            >
              {saving ? (
                <span className="bc-btn-loading">
                  <span className="bc-spinner" />
                  Salvando...
                </span>
              ) : (
                <span className="bc-btn-content">
                  <span className="bc-btn-icon">{ICON_CHECK_GREEN}</span>
                  {hasExistingKey ? 'Atualizar chave PIX' : 'Salvar chave PIX'}
                </span>
              )}
              {!saving && holderName && holderCpf && pixKey && (
                <span className="bc-btn-glow" aria-hidden="true" />
              )}
            </button>
          </form>
        </div>

        {/* Info card */}
        <div className={`bc-info-card ${mounted ? 'bc-info-card--visible' : ''}`}
          style={{ transitionDelay: '200ms' }}>
          <div className="bc-info-row">
            <span className="bc-info-icon">{ICON_INFO}</span>
            <div>
              <p className="bc-info-title">Importante</p>
              <p className="bc-info-text">Os dados devem ser do titular da conta. Saques serão transferidos para a chave PIX cadastrada.</p>
            </div>
          </div>
        </div>

        {/* Decorative floating icons */}
        <div className="bc-float-deco" aria-hidden="true">
          <span className="bc-deco bc-deco-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="3" y1="22" x2="21" y2="22" /><line x1="6" y1="18" x2="6" y2="11" /><line x1="10" y1="18" x2="10" y2="11" /><line x1="14" y1="18" x2="14" y2="11" /><line x1="18" y1="18" x2="18" y2="11" /><polygon points="12 2 20 7 4 7" /></svg>
          </span>
          <span className="bc-deco bc-deco-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
          </span>
        </div>
      </div>

      {/* Success modal */}
      {showSuccessModal && (
        <div className="bc-modal-overlay" role="dialog" aria-modal="true" onClick={() => setShowSuccessModal(false)}>
          <div className="bc-modal bc-modal--success" onClick={(e) => e.stopPropagation()}>
            <div className="bc-modal-confetti" aria-hidden="true">
              {[1, 2, 3, 4, 5, 6, 7].map(i => (
                <span key={i} className={`bc-confetti-${i}`} style={{ animationDelay: `${(i - 1) * 0.07}s` }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke={i % 2 === 0 ? '#4caf50' : '#f59e0b'} strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                </span>
              ))}
            </div>
            <div className="bc-modal-icon-success">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div className="bc-modal-title">Salvo!</div>
            <p className="bc-modal-message">Sua chave PIX foi {hasExistingKey ? 'atualizada' : 'cadastrada'} com sucesso.</p>
            <button type="button" className="bc-modal-btn success" onClick={() => setShowSuccessModal(false)}>
              Continuar
            </button>
          </div>
        </div>
      )}

      {/* Error modal */}
      {showErrorModal && (
        <div className="bc-modal-overlay" role="dialog" aria-modal="true" onClick={() => setShowErrorModal(false)}>
          <div className="bc-modal bc-modal--error" onClick={(e) => e.stopPropagation()}>
            <div className="bc-modal-icon-error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <div className="bc-modal-title-error">Ops!</div>
            <p className="bc-modal-message">Preencha todos os campos obrigatórios.</p>
            <button type="button" className="bc-modal-btn error" onClick={() => setShowErrorModal(false)}>
              Tentar novamente
            </button>
          </div>
        </div>
      )}

      <AppBottomNav />
    </main>
  )
}