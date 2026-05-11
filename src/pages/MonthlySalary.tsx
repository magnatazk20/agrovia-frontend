import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppSidebar from '../components/AppSidebar'
import './Dashboard.css'
import './MonthlySalary.css'
import AppBottomNav from '../components/AppBottomNav'

type StoredUser = {
  id: number
  name: string
  phone: string
}

type MonthlySalaryPlan = {
  id: number
  title: string
  imageUrl: string
  monthlySalary: number
  requiredLevel1Deposited: number
  requiredLevel2Deposited: number
  requiredLevel3Deposited: number
  isActive: boolean
  sortOrder: number
}

type MonthlySalaryResponse = {
  ok?: boolean
  plans?: MonthlySalaryPlan[]
  error?: string
}

type ClaimResponse = {
  ok?: boolean
  message?: string
  error?: string
  contract?: string
  requirements?: {
    requiredLevel1Deposited: number
    requiredLevel2Deposited: number
    requiredLevel3Deposited: number
  }
  current?: {
    level1Deposited: number
    level2Deposited: number
    level3Deposited: number
  }
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

const formatBRL = (value: number) =>
  Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function MonthlySalary() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [plans, setPlans] = useState<MonthlySalaryPlan[]>([])
  const [error, setError] = useState('')
  const [claimLoadingPlanId, setClaimLoadingPlanId] = useState<number | null>(null)
  const [successMessage, setSuccessMessage] = useState('')

  const user = useMemo(() => {
    const raw = localStorage.getItem('user') ?? sessionStorage.getItem('user')
    if (!raw) return null
    try {
      return JSON.parse(raw) as StoredUser
    } catch {
      return null
    }
  }, [])

  const handleClaim = async (planId: number) => {
    if (!user?.id || claimLoadingPlanId) return

    setClaimLoadingPlanId(planId)
    setError('')
    setSuccessMessage('')

    const token = localStorage.getItem('token') ?? sessionStorage.getItem('token') ?? ''
    try {
      const res = await fetch(`${API_URL}/api/monthly-salary-plans/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          userId: user.id,
          planId,
        }),
      })

      const data = (await res.json()) as ClaimResponse

      if (!res.ok || !data?.ok) {
        if (data?.requirements && data?.current) {
          setError(
            `Requisitos nao atendidos. Nivel 1: ${data.current.level1Deposited}/${data.requirements.requiredLevel1Deposited}, ` +
              `Nivel 2: ${data.current.level2Deposited}/${data.requirements.requiredLevel2Deposited}, ` +
              `Nivel 3: ${data.current.level3Deposited}/${data.requirements.requiredLevel3Deposited}.`
          )
        } else {
          setError(data?.error ?? 'Nao foi possivel obter o contrato.')
        }
        return
      }

      setSuccessMessage(data?.message ?? `Contrato obtido: ${data?.contract ?? 'Start V1'}`)
    } catch {
      setError('Erro de conexao ao obter contrato.')
    } finally {
      setClaimLoadingPlanId(null)
    }
  }

  useEffect(() => {
    const loadPlans = async () => {
      if (!user?.id) {
        navigate('/')
        return
      }

      setLoading(true)
      setError('')

      try {
        const res = await fetch(`${API_URL}/api/monthly-salary-plans`)
        const data = (await res.json()) as MonthlySalaryResponse

        if (!res.ok || !data?.ok) {
          setError(data?.error ?? 'Erro ao carregar planos de salario mensal.')
          setPlans([])
          return
        }

        setPlans(Array.isArray(data.plans) ? data.plans : [])
      } catch {
        setError('Erro de conexao ao carregar planos de salario mensal.')
        setPlans([])
      } finally {
        setLoading(false)
      }
    }

    loadPlans()
  }, [navigate, user?.id])

  return (
    <main className="dash-app">
      <section className="dash-main">
        <AppSidebar />

        <div className="ms-content">
          {/* ── Modal de feedback ── */}
          {(error || successMessage) ? (
            <div className="ms-modal-overlay" onClick={() => { setError(''); setSuccessMessage('') }}>
              <div className={`ms-modal ${error ? 'ms-modal--error' : 'ms-modal--success'}`} onClick={(e) => e.stopPropagation()}>
                <div className="ms-modal__icon">
                  {error ? (
                    <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                  ) : (
                    <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                  )}
                </div>
                <h3 className="ms-modal__title">{error ? 'Erro' : 'Sucesso'}</h3>
                <p className="ms-modal__message">{error || successMessage}</p>
                <button
                  type="button"
                  className="ms-modal__btn"
                  onClick={() => { setError(''); setSuccessMessage('') }}
                >
                  Fechar
                </button>
              </div>
            </div>
          ) : null}

          {/* ── Descrição ── */}
          <div className="ms-desc">
            <p>Convide pessoas para a TRK. Quanto mais indicados você tiver em cada nível, mais alto o seu salário mensal!</p>
          </div>

          {/* ── Plans grid ── */}
          {loading ? (
            <div className="ms-empty-card">Carregando...</div>
          ) : plans.length === 0 ? (
            <div className="ms-empty-card">Nenhum plano disponível no momento.</div>
          ) : (
            <div className="ms-grid">
              {plans.map((plan) => (
                <article key={plan.id} className="ms-card">
                  <div className="ms-card__body">
                    <div className="ms-card__left">
                      <div className="ms-card__salary">
                        <small>{plan.title}</small>
                        <strong>R$ {plan.monthlySalary.toLocaleString('pt-BR')}</strong>
                      </div>
                      <div className="ms-card__requirements">
                        <div className="ms-req">
                          <span className="ms-req__label">Nível 1</span>
                          <span className="ms-req__value">{plan.requiredLevel1Deposited} indicados</span>
                        </div>
                        <div className="ms-req">
                          <span className="ms-req__label">Nível 2</span>
                          <span className="ms-req__value">{plan.requiredLevel2Deposited} indicados</span>
                        </div>
                        <div className="ms-req">
                          <span className="ms-req__label">Nível 3</span>
                          <span className="ms-req__value">{plan.requiredLevel3Deposited} indicados</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="ms-btn"
                        onClick={() => handleClaim(plan.id)}
                        disabled={claimLoadingPlanId === plan.id}
                      >
                        {claimLoadingPlanId === plan.id ? 'Obtendo...' : 'Contratar'}
                      </button>
                    </div>
                    <div className="ms-card__image">
                      <img src={plan.imageUrl} alt={plan.title} />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
      <AppBottomNav />
</main>
  )
}
