import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AppSidebar from '../components/AppSidebar'
import AppBottomNav from '../components/AppBottomNav'
import './CycleProducts.css'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

type CycleProduct = {
  id: number
  name: string
  description: string
  amount: number
  profit: number
  cycleDays: number
  imageUrl: string
  isActive: boolean
  sortOrder: number
  planType: string
  stockQuantity: number
  minAmount: number
  maxAmount: number
  profitPercent: number
  requireCommissionLevel1Count: number
  requireCommissionLevel2Count: number
  requireCommissionLevel3Count: number
}

type ModalState = {
  type: 'success' | 'error' | null
  message: string
}

export default function CycleProductDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [plan, setPlan] = useState<CycleProduct | null>(null)
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(false)
  const [modal, setModal] = useState<ModalState>({ type: null, message: '' })
  const token = localStorage.getItem('token') || sessionStorage.getItem('token') || ''
  const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}') as { id?: number }

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const res = await fetch(`${API_URL}/api/dashboard/cycle-products`)
        const data = await res.json() as { products?: CycleProduct[] }
        const found = data.products?.find((p) => String(p.id) === id)
        setPlan(found ?? null)
      } catch {
        setPlan(null)
      } finally {
        setLoading(false)
      }
    }
    fetchPlan()
  }, [id])

  const dailyIncome = plan ? plan.amount * (plan.profitPercent / 100) : 0
  const totalIncome = plan ? dailyIncome * plan.cycleDays : 0

  const closeModal = () => {
    setModal({ type: null, message: '' })
  }

  const handlePurchase = async () => {
    if (!plan || !user.id) return
    setPurchasing(true)
    try {
      const res = await fetch(`${API_URL}/api/cycle-products/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: user.id, cycleProductId: plan.id, investAmount: plan.amount }),
      })
      const data = await res.json() as { ok?: boolean; message?: string; error?: string }
      if (data.ok) {
        setModal({
          type: 'success',
          message: 'Plano contratado com sucesso!',
        })
      } else {
        setModal({
          type: 'error',
          message: data.message || data.error || 'Erro ao comprar.',
        })
      }
    } catch {
      setModal({
        type: 'error',
        message: 'Erro de conexão.',
      })
    } finally {
      setPurchasing(false)
    }
  }

  if (loading) return <div className="loading-screen">Carregando...</div>
  if (!plan) return <div className="loading-screen">Plano não encontrado.</div>

  return (
    <div className="page-layout">
      <AppSidebar />
      <main className="page-main">
        <div className="cycle-detail-page">
          <button className="back-btn" onClick={() => navigate(-1)} type="button">← Voltar</button>

          <div className="cycle-detail-card">
            <img src={plan.imageUrl} alt={plan.name} className="cycle-detail-img" />
            <h1 className="cycle-detail-title">{plan.name}</h1>

            <div className="cycle-detail-info">
              <div className="cycle-detail-row">
                <span className="cycle-detail-label">Valor investido:</span>
                <span className="cycle-detail-value">R$ {plan.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="cycle-detail-row">
                <span className="cycle-detail-label">Renda diária:</span>
                <span className="cycle-detail-value">R$ {dailyIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="cycle-detail-row">
                <span className="cycle-detail-label">Lucro total no final:</span>
                <span className="cycle-detail-value">R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="cycle-detail-row">
                <span className="cycle-detail-label">Dias de investimento:</span>
                <span className="cycle-detail-value">{plan.cycleDays} dias</span>
              </div>
              <div className="cycle-detail-row">
                <span className="cycle-detail-label">Estoque disponível:</span>
                <span className="cycle-detail-value">{plan.stockQuantity}</span>
              </div>
              {plan.description && (
                <div className="cycle-detail-row">
                  <span className="cycle-detail-label">Descrição:</span>
                  <span className="cycle-detail-value">{plan.description}</span>
                </div>
              )}
            </div>

            <button
              type="button"
              className="cycle-detail-buy-btn"
              onClick={handlePurchase}
              disabled={purchasing || plan.stockQuantity <= 0}
            >
              {purchasing ? 'Processando...' : `Comprar por R$ ${plan.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            </button>
          </div>
        </div>
      </main>
      <AppBottomNav />

      {/* ── Modal ── */}
      {modal.type && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className={`modal-card modal-card--${modal.type}`} onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">
              {modal.type === 'success' ? '✅' : '❌'}
            </div>
            <p className="modal-message">{modal.message}</p>
            <button type="button" className="modal-btn" onClick={modal.type === 'success' ? () => navigate('/investment-orders') : closeModal}>
              {modal.type === 'success' ? 'Ver meus planos' : 'Tentar novamente'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
