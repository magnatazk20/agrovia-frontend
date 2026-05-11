import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppSidebar from '../components/AppSidebar'
import './Tasks.css'
import './GiftVouchers.css'
import AppBottomNav from '../components/AppBottomNav'

type StoredUser = {
  id: number
  name: string
  phone: string
}

type GiftVoucher = {
  id: number
  name: string
  description: string
  imageUrl: string
  price: number
  redeemRewardValue: number
}

type PurchaseSuccessData = {
  message: string
  voucherName: string
  giftCode: string
  rewardValue: number
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

const formatBRL = (value: number) =>
  Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function GiftVouchers() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [vouchers, setVouchers] = useState<GiftVoucher[]>([])
  const [buyingId, setBuyingId] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [confirmVoucher, setConfirmVoucher] = useState<GiftVoucher | null>(null)
  const [successData, setSuccessData] = useState<PurchaseSuccessData | null>(null)

  const user = useMemo(() => {
    const raw = localStorage.getItem('user') ?? sessionStorage.getItem('user')
    if (!raw) return null
    try {
      return JSON.parse(raw) as StoredUser
    } catch {
      return null
    }
  }, [])

  const token = localStorage.getItem('token') ?? sessionStorage.getItem('token') ?? ''

  useEffect(() => {
    if (!user?.id || !token) {
      navigate('/')
      return
    }

    const loadVouchers = async () => {
      setLoading(true)
      try {
        const res = await fetch(`${API_URL}/api/gift-vouchers`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json() as { ok?: boolean; vouchers?: GiftVoucher[]; error?: string }

        if (!res.ok || !data?.ok) {
          setFeedback({ type: 'error', message: data?.error || 'Erro ao carregar vales presentes.' })
          setVouchers([])
          return
        }

        setVouchers(Array.isArray(data.vouchers) ? data.vouchers : [])
      } catch {
        setFeedback({ type: 'error', message: 'Erro de conexão ao carregar vales presentes.' })
        setVouchers([])
      } finally {
        setLoading(false)
      }
    }

    loadVouchers()
  }, [navigate, token, user?.id])

  const buyVoucher = async (voucher: GiftVoucher) => {
    if (!user?.id) return
    setBuyingId(voucher.id)
    setFeedback(null)

    try {
      const res = await fetch(`${API_URL}/api/gift-vouchers/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user.id,
          giftVoucherId: voucher.id,
        }),
      })

      const data = await res.json() as {
        ok?: boolean
        message?: string
        error?: string
        generatedGiftCode?: string
        purchase?: {
          name?: string
          generatedGiftCode?: string
          redeemRewardValue?: number
        }
      }

      if (!res.ok || !data?.ok) {
        setFeedback({ type: 'error', message: data?.error || 'Não foi possível comprar o vale.' })
        return
      }

      const giftCode = String(data?.generatedGiftCode ?? data?.purchase?.generatedGiftCode ?? '').trim()
      if (!giftCode) {
        setFeedback({ type: 'error', message: 'Compra concluída, mas não foi possível obter o código.' })
        return
      }

      setSuccessData({
        message: data?.message || 'Vale presente comprado com sucesso.',
        voucherName: voucher.name,
        giftCode,
        rewardValue: Number(data?.purchase?.redeemRewardValue ?? voucher.redeemRewardValue ?? 0),
      })
      setConfirmVoucher(null)
    } catch {
      setFeedback({ type: 'error', message: 'Erro de conexão ao comprar vale presente.' })
    } finally {
      setBuyingId(null)
    }
  }

  return (
    <main className="tasks-page gift-vouchers-page">
      <AppSidebar />

      {confirmVoucher ? (
        <div className="redeem-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="gift-buy-confirm-title">
          <div className="redeem-modal-card">
            <div className="redeem-modal-badge">Confirmação</div>
            <h2 id="gift-buy-confirm-title">Confirmar compra</h2>
            <p className="redeem-modal-message">
              Deseja comprar <b>{confirmVoucher.name}</b> por <b>{formatBRL(confirmVoucher.price)}</b>?
            </p>
            <div className="redeem-modal-highlight">
              <span>Valor de resgate</span>
              <strong>{formatBRL(confirmVoucher.redeemRewardValue)}</strong>
            </div>
            <div className="gift-confirm-actions">
              <button
                type="button"
                className="btn ghost"
                onClick={() => setConfirmVoucher(null)}
                disabled={buyingId === confirmVoucher.id}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="redeem-modal-btn"
                onClick={() => buyVoucher(confirmVoucher)}
                disabled={buyingId === confirmVoucher.id}
              >
                {buyingId === confirmVoucher.id ? 'Comprando...' : 'Confirmar compra'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {successData ? (
        <div className="redeem-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="gift-buy-success-title">
          <div className="redeem-modal-confetti-layer" aria-hidden="true">
            {Array.from({ length: 28 }).map((_, i) => (
              <span key={i} className={`confetti confetti-${(i % 7) + 1}`} />
            ))}
          </div>
          <div className="redeem-modal-card">
            <div className="redeem-modal-badge">🎁 Compra concluída</div>
            <h2 id="gift-buy-success-title">Seu código foi gerado</h2>
            <p className="redeem-modal-message">{successData.message}</p>
            <div className="redeem-modal-highlight">
              <span>{successData.voucherName}</span>
              <strong>{formatBRL(successData.rewardValue)}</strong>
            </div>
            <p className="redeem-modal-code">Código: <b>{successData.giftCode}</b></p>
            <button
              type="button"
              className="redeem-modal-btn"
              onClick={() => {
                setSuccessData(null)
                navigate('/profile')
              }}
            >
              Ir para Perfil e Resgatar
            </button>
          </div>
        </div>
      ) : null}

      <header className="tasks-header gift-vouchers-header">
        <div>
          <p className="tasks-kicker">Compras</p>
          <h1>Vales Presentes</h1>
          <span className="tasks-subtitle">Escolha um vale presente para comprar e resgatar recompensas</span>
        </div>
        <div className="tasks-header-actions">
          <button className="btn ghost" onClick={() => navigate('/profile')}>
            Voltar
          </button>
        </div>
      </header>

      {feedback ? (
        <div className={`gift-toast ${feedback.type === 'success' ? 'success' : 'error'}`} role="status" aria-live="polite">
          {feedback.message}
        </div>
      ) : null}

      {loading ? (
        <div className="vip-inline-message">Carregando vales presentes...</div>
      ) : vouchers.length === 0 ? (
        <div className="vip-inline-message">Não tem produto no momento.</div>
      ) : (
        <section className="gift-vouchers-list">
          {vouchers.map((voucher) => (
            <article key={voucher.id} className="gift-voucher-card">
              <img
                className="gift-voucher-image"
                src={voucher.imageUrl || 'https://via.placeholder.com/640x360?text=Vale+Presente'}
                alt={voucher.name}
              />
              <div className="gift-voucher-content">
                <h3 className="gift-voucher-title">{voucher.name}</h3>
                <p className="gift-voucher-description">{voucher.description}</p>
                <div className="gift-voucher-meta">
                  <span><b>Valor:</b> {formatBRL(voucher.price)}</span>
                  <span><b>Ganho no resgate:</b> {formatBRL(voucher.redeemRewardValue)}</span>
                </div>
                <button
                  type="button"
                  className="btn primary gift-voucher-buy-btn"
                  onClick={() => setConfirmVoucher(voucher)}
                  disabled={buyingId === voucher.id}
                >
                  {buyingId === voucher.id ? 'Comprando...' : 'Comprar'}
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
      <AppBottomNav />
</main>
  )
}
