import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AppSidebar from '../components/AppSidebar'
import './Vip.css'
import AppBottomNav from '../components/AppBottomNav'

type VipLevel = {
  id: number
  name: string
  price: number
  dailyTaskLimit: number
  taskRewardAmount: number
  durationDays?: number
  benefits: string
  imageUrl?: string
  isActive?: boolean
  alreadyExpired?: boolean
  requireCommissionLevel1Count?: number
  requireCommissionLevel2Count?: number
  requireCommissionLevel3Count?: number
}

type StoredUser = {
  id: number
  name: string
  phone: string
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

const formatBRL = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function Vip() {
  const navigate = useNavigate()
  const [levels, setLevels] = useState<VipLevel[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string>('')
  const [currentVipLevelId, setCurrentVipLevelId] = useState<number | null>(null)
  const [currentVipExpiresAt, setCurrentVipExpiresAt] = useState<string | null>(null)

  const user = useMemo(() => {
    const raw = localStorage.getItem('user') ?? sessionStorage.getItem('user')
    if (!raw) return null
    try {
      return JSON.parse(raw) as StoredUser
    } catch {
      return null
    }
  }, [])

  const loadVipData = async () => {
    setLoading(true)
    try {
      /* Sempre carrega os levels (com userId para marcar VIPs já expirados) */
      const userIdQuery = user?.id ? `?userId=${user.id}` : ''
      const levelsRes = await fetch(`${API_URL}/api/vip/levels${userIdQuery}`)
      const levelsJson = await levelsRes.json()

      if (levelsRes.ok && levelsJson?.ok) {
        setLevels(Array.isArray(levelsJson.levels) ? levelsJson.levels : [])
      }

      /* Se tem user logado, busca o VIP ativo dele */
      if (user?.id) {
        const userVipRes = await fetch(`${API_URL}/api/vip/user/${user.id}`)
        const userVipJson = await userVipRes.json()

        if (userVipRes.ok && userVipJson?.ok && userVipJson?.hasVip && userVipJson?.vip) {
          setCurrentVipLevelId(Number(userVipJson.vip.vipLevelId))
          setCurrentVipExpiresAt(userVipJson.vip.expiresAt ?? null)
        } else {
          setCurrentVipLevelId(null)
          setCurrentVipExpiresAt(null)
        }
      }
    } catch {
      setMessage('Não foi possível carregar os planos VIP agora.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadVipData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* Separa VIP ativo, disponíveis e desativados */
  const activeLevel = levels.find((l) => l.id === currentVipLevelId) ?? null
  const availableLevels = levels.filter((l) => l.id !== currentVipLevelId && l.isActive !== false)
  const disabledLevels = levels.filter((l) => l.id !== currentVipLevelId && l.isActive === false)

  return (
    <main className="vip-page">
      <div className="vip-shell">
        <section className="vip-hero">
          <div className="vip-hero__content">
            <div>
              <p className="vip-kicker">Oportunidades de Trabalho Online</p>
              <h1>Planos VIP</h1>
              <p className="vip-subtitle">
                A TRK oferece oportunidades de trabalho online com horários flexíveis, permitindo que colaboradores realizem tarefas e gerem renda no conforto de casa.
              </p>
            </div>
            <Link to="/dashboard" className="vip-back">
              Voltar
            </Link>
          </div>
        </section>

        {message ? <div className="vip-message">{message}</div> : null}

        {loading ? (
          <div className="vip-loading">Carregando planos...</div>
        ) : (
          <>
            {/* ── VIP ativo ── */}
            {activeLevel && (
              <section className="vip-active-section">
                <article className="vip-card active">
                  <div className="vip-card__img-wrap">
                    <img
                      src={activeLevel.imageUrl || `https://picsum.photos/seed/vip-${activeLevel.id}/600/300`}
                      alt={activeLevel.name}
                      className="vip-card__img"
                    />
                    <span className="vip-card__img-tag">{activeLevel.name}</span>
                    <span className="vip-card__img-active">
                      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                      Ativo
                    </span>
                  </div>
                  <div className="vip-card__body">
                    <div className="vip-card-top">
                      <div className="vip-price">
                        <small>plano atual</small>
                        <strong>{formatBRL(activeLevel.price)}</strong>
                      </div>
                    </div>
                    <div className="vip-card__info">
                      <div className="vip-card__info-row">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" /></svg>
                        <span><strong>{activeLevel.dailyTaskLimit}</strong> tarefas diárias</span>
                      </div>
                      <div className="vip-card__info-row">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                        <span><strong>{formatBRL(Number(activeLevel.taskRewardAmount))}</strong> por tarefa</span>
                      </div>
                      <div className="vip-card__info-row">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                        <span>Renda diária: <strong>{formatBRL(Number(activeLevel.dailyTaskLimit) * Number(activeLevel.taskRewardAmount))}</strong></span>
                      </div>
                      <div className="vip-card__info-row vip-card__info-row--highlight">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
                        <span>Renda mensal: <strong>{formatBRL(Number(activeLevel.dailyTaskLimit) * Number(activeLevel.taskRewardAmount) * 30)}</strong></span>
                      </div>
                    </div>
                    <button className="vip-btn" disabled>
                      VIP ativo
                    </button>
                  </div>
                </article>
              </section>
            )}

            {/* ── VIPs disponíveis para compra ── */}
            {availableLevels.length > 0 && (
              <section className="vip-available-section">
                <div className="vip-grid">
                  {availableLevels.map((level) => {
                    const dailyIncome = Number(level.dailyTaskLimit) * Number(level.taskRewardAmount)
                    const monthlyIncome = dailyIncome * 30
                    const isExpiredBefore = Boolean(level.alreadyExpired)
                    const hasRequirements =
                      (level.requireCommissionLevel1Count ?? 0) > 0 ||
                      (level.requireCommissionLevel2Count ?? 0) > 0 ||
                      (level.requireCommissionLevel3Count ?? 0) > 0
                    return (
                      <article
                        key={level.id}
                        className={`vip-card ${isExpiredBefore ? 'vip-card--disabled' : ''}`}
                      >
                        <div className="vip-card__img-wrap">
                          <img
                            src={level.imageUrl || `https://picsum.photos/seed/vip-${level.id}/600/300`}
                            alt={level.name}
                            className="vip-card__img"
                          />
                          <span className="vip-card__img-tag">{level.name}</span>
                          {isExpiredBefore && (
                            <span className="vip-card__img-disabled">
                              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" /></svg>
                              Já expirado
                            </span>
                          )}
                        </div>
                        <div className="vip-card__body">
                          <div className="vip-card-top">
                            <div className="vip-price">
                              <small>a partir de</small>
                              <strong>{formatBRL(level.price)}</strong>
                            </div>
                          </div>
                          <div className="vip-card__info">
                            <div className="vip-card__info-row">
                              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" /></svg>
                              <span><strong>{level.dailyTaskLimit}</strong> tarefas diárias</span>
                            </div>
                            <div className="vip-card__info-row">
                              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                              <span><strong>{formatBRL(Number(level.taskRewardAmount))}</strong> por tarefa</span>
                            </div>
                            
                            <div className="vip-card__info-row">
                              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                              <span>Renda diária: <strong>{formatBRL(dailyIncome)}</strong></span>
                            </div>
                            <div className="vip-card__info-row vip-card__info-row--highlight">
                              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
                              <span>Renda mensal: <strong>{formatBRL(monthlyIncome)}</strong></span>
                            </div>
                          </div>
                          {hasRequirements && (
                            <div className="vip-requirements">
                              <div className="vip-requirements__title">
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                                <span>Requisitos para se tornar funcionário</span>
                              </div>
                              <div className="vip-requirements__list">
                                {(level.requireCommissionLevel1Count ?? 0) > 0 && (
                                  <div className="vip-requirements__item">
                                    <span className="vip-requirements__label">Nível 1</span>
                                    <strong>{level.requireCommissionLevel1Count}</strong>
                                    <span className="vip-requirements__sub">indicados</span>
                                  </div>
                                )}
                                {(level.requireCommissionLevel2Count ?? 0) > 0 && (
                                  <div className="vip-requirements__item">
                                    <span className="vip-requirements__label">Nível 2</span>
                                    <strong>{level.requireCommissionLevel2Count}</strong>
                                    <span className="vip-requirements__sub">indicados</span>
                                  </div>
                                )}
                                {(level.requireCommissionLevel3Count ?? 0) > 0 && (
                                  <div className="vip-requirements__item">
                                    <span className="vip-requirements__label">Nível 3</span>
                                    <strong>{level.requireCommissionLevel3Count}</strong>
                                    <span className="vip-requirements__sub">indicados</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          {isExpiredBefore ? (
                            <button
                              className="vip-btn vip-btn--disabled"
                              disabled
                              title="Você já adquiriu este VIP anteriormente e ele expirou."
                            >
                              Já comprado anteriormente
                            </button>
                          ) : (
                            <button
                              className="vip-btn"
                              onClick={() => navigate(`/vip/checkout/${level.id}`)}
                            >
                              {currentVipLevelId !== null ? 'Trocar para este plano' : 'Ativar plano'}
                            </button>
                          )}
                        </div>
                      </article>
                    )
                  })}
                </div>
              </section>
            )}

            {/* ── VIPs desativados ── */}
            {disabledLevels.length > 0 && (
              <section className="vip-disabled-section">
                <div className="vip-grid">
                  {disabledLevels.map((level) => {
                    const dailyIncome = Number(level.dailyTaskLimit) * Number(level.taskRewardAmount)
                    const monthlyIncome = dailyIncome * 30
                    const hasRequirements =
                      (level.requireCommissionLevel1Count ?? 0) > 0 ||
                      (level.requireCommissionLevel2Count ?? 0) > 0 ||
                      (level.requireCommissionLevel3Count ?? 0) > 0
                    return (
                      <article key={level.id} className="vip-card vip-card--disabled">
                        <div className="vip-card__img-wrap">
                          <img
                            src={level.imageUrl || `https://picsum.photos/seed/vip-${level.id}/600/300`}
                            alt={level.name}
                            className="vip-card__img"
                          />
                          <span className="vip-card__img-tag">{level.name}</span>
                          <span className="vip-card__img-disabled">
                            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" /></svg>
                            Indisponível
                          </span>
                        </div>
                        <div className="vip-card__body">
                          <div className="vip-card-top">
                            <div className="vip-price">
                              <small>plano</small>
                              <strong>{formatBRL(level.price)}</strong>
                            </div>
                          </div>
                          <div className="vip-card__info">
                            <div className="vip-card__info-row">
                              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" /></svg>
                              <span><strong>{level.dailyTaskLimit}</strong> tarefas diárias</span>
                            </div>
                            <div className="vip-card__info-row">
                              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                              <span><strong>{formatBRL(Number(level.taskRewardAmount))}</strong> por tarefa</span>
                            </div>
                            <div className="vip-card__info-row">
                              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                              <span>Renda diária: <strong>{formatBRL(dailyIncome)}</strong></span>
                            </div>
                            <div className="vip-card__info-row vip-card__info-row--highlight">
                              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
                              <span>Renda mensal: <strong>{formatBRL(monthlyIncome)}</strong></span>
                            </div>
                          </div>
                          {hasRequirements && (
                            <div className="vip-requirements">
                              <div className="vip-requirements__title">
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                                <span>Requisitos de convite</span>
                              </div>
                              <div className="vip-requirements__list">
                                {(level.requireCommissionLevel1Count ?? 0) > 0 && (
                                  <div className="vip-requirements__item">
                                    <span className="vip-requirements__label">Nível 1</span>
                                    <strong>{level.requireCommissionLevel1Count}</strong>
                                    <span className="vip-requirements__sub">indicados</span>
                                  </div>
                                )}
                                {(level.requireCommissionLevel2Count ?? 0) > 0 && (
                                  <div className="vip-requirements__item">
                                    <span className="vip-requirements__label">Nível 2</span>
                                    <strong>{level.requireCommissionLevel2Count}</strong>
                                    <span className="vip-requirements__sub">indicados</span>
                                  </div>
                                )}
                                {(level.requireCommissionLevel3Count ?? 0) > 0 && (
                                  <div className="vip-requirements__item">
                                    <span className="vip-requirements__label">Nível 3</span>
                                    <strong>{level.requireCommissionLevel3Count}</strong>
                                    <span className="vip-requirements__sub">indicados</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          <button className="vip-btn vip-btn--disabled" disabled>
                            Indisponível
                          </button>
                        </div>
                      </article>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Sem planos cadastrados */}
            {levels.length === 0 && (
              <div className="vip-message">Nenhum plano VIP disponível no momento.</div>
            )}
          </>
        )}
      </div>
      <AppSidebar />
      <AppBottomNav />
</main>
  )
}
