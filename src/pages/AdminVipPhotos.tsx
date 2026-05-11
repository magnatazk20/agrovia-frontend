import { useEffect, useMemo, useRef, useState } from 'react'
import AdminSidebar from '../components/AdminSidebar'
import FloatingToast from '../components/FloatingToast'
import './Admin.css'
import './AdminMiniTasks.css'
import './AdminVipPhotos.css'

type VipLevelItem = {
  id: number
  name: string
  price: number
  avatarUrl: string
  isActive: boolean
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

const formatBRL = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const getToken = () => localStorage.getItem('token') ?? sessionStorage.getItem('token') ?? ''

export default function AdminVipPhotos() {
  const [levels, setLevels] = useState<VipLevelItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState<number | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadTargetId = useRef<number | null>(null)

  const token = useMemo(
    () => getToken(),
    []
  )

  const loadLevels = async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      const tk = getToken()
      const res = await fetch(`${API_URL}/api/admin/vip/levels`, {
        headers: tk ? { Authorization: `Bearer ${tk}` } : {},
      })
      if (!res.ok) {
        setErrorMsg(`Erro HTTP ${res.status} ao carregar VIPs.`)
        setLevels([])
        return
      }
      const data = await res.json()
      if (data?.ok && Array.isArray(data.levels)) {
        setLevels(
          data.levels.map((item: any) => ({
            id: Number(item.id),
            name: String(item.name ?? ''),
            price: Number(item.price ?? 0),
            avatarUrl: String(item.avatarUrl ?? ''),
            isActive: Boolean(item.isActive),
          }))
        )
      } else {
        setErrorMsg('Resposta inválida da API.')
        setLevels([])
      }
    } catch (err) {
      console.error('[AdminVipPhotos] loadLevels error:', err)
      setErrorMsg('Erro de conexão ao carregar VIPs.')
      setLevels([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLevels()
  }, [])

  const handleUploadClick = (levelId: number) => {
    uploadTargetId.current = levelId
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
      fileInputRef.current.click()
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    const levelId = uploadTargetId.current
    if (!file || !levelId) return

    if (file.size > 5 * 1024 * 1024) {
      setToast({ message: 'Imagem muito grande. Máximo 5MB.', type: 'error' })
      return
    }

    setUploading(levelId)

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      const tk = getToken()
      const res = await fetch(`${API_URL}/api/admin/vip/levels/${levelId}/upload-photo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(tk ? { Authorization: `Bearer ${tk}` } : {}),
        },
        body: JSON.stringify({ imageBase64: base64 }),
      })
      const data = await res.json()
      if (res.ok && data?.ok) {
        setToast({ message: 'Foto atualizada com sucesso!', type: 'success' })
        await loadLevels()
      } else {
        setToast({ message: data?.error ?? 'Erro ao enviar foto.', type: 'error' })
      }
    } catch {
      setToast({ message: 'Erro de conexão ao enviar foto.', type: 'error' })
    } finally {
      setUploading(null)
      uploadTargetId.current = null
    }
  }

  const resolveImageUrl = (url: string) => {
    if (!url) return ''
    if (url.startsWith('http')) return url
    return `${API_URL}${url}`
  }

  return (
    <main className="admin-page admin-mini-tasks-page">
      <AdminSidebar />
      <section className="admin-content admin-users-page">
        <header className="admin-users-header">
          <div>
            <h1>Fotos VIP dos Produtos</h1>
            <p>Faça upload das fotos que aparecerão como avatar do usuário no perfil, de acordo com o VIP ativo.</p>
          </div>
        </header>

        {/* Input de arquivo escondido */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        {loading ? (
          <p style={{ padding: '2rem', color: '#aaa', textAlign: 'center' }}>Carregando VIPs...</p>
        ) : errorMsg ? (
          <p style={{ padding: '2rem', color: '#ff5252', textAlign: 'center' }}>{errorMsg}</p>
        ) : levels.length === 0 ? (
          <p style={{ padding: '2rem', color: '#aaa', textAlign: 'center' }}>
            Nenhum nível VIP cadastrado. Crie VIPs na seção "Gerenciar VIPs" primeiro.
          </p>
        ) : (
          <div className="vip-photos-grid">
            {levels.map((level) => (
              <div key={level.id} className="vip-photo-card">
                <div className="vip-photo-preview">
                  {level.avatarUrl ? (
                    <img
                      src={resolveImageUrl(level.avatarUrl)}
                      alt={`Foto VIP ${level.name}`}
                      onError={(e) => {
                        const img = e.currentTarget
                        img.style.display = 'none'
                      }}
                    />
                  ) : (
                    <div className="vip-photo-placeholder">
                      <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#555" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="3" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="M21 15l-5-5L5 21" />
                      </svg>
                      <span>Sem foto</span>
                    </div>
                  )}
                </div>

                <div className="vip-photo-info">
                  <h3>{level.name}</h3>
                  <p>{formatBRL(level.price)}</p>
                  <span className={`vip-photo-status ${level.isActive ? 'active' : 'inactive'}`}>
                    {level.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                </div>

                <button
                  type="button"
                  className="vip-photo-upload-btn"
                  disabled={uploading === level.id}
                  onClick={() => handleUploadClick(level.id)}
                >
                  {uploading === level.id ? 'Enviando...' : level.avatarUrl ? 'Trocar Foto' : 'Enviar Foto'}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {toast ? (
        <FloatingToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      ) : null}
    </main>
  )
}
