import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppSidebar from '../components/AppSidebar'
import './Profile.css'
import AppBottomNav from '../components/AppBottomNav'

type VipLevel = {
  id: number
  name: string
  minWithdraw?: number
  withdrawTime?: string
  description?: string
  price?: number
}

type SiteSettings = {
  minWithdrawAmount?: number
  withdrawMinByVip?: string
  withdrawSchedule?: string
  vipLevels?: VipLevel[]
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

type Category = 'saque' | 'vip' | 'duvidas' | 'recarga'

const formatBRL = (value: number) =>
  Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function Manual() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<Category>('saque')
  const [vipLevels, setVipLevels] = useState<VipLevel[]>([])
  const [withdrawSchedule, setWithdrawSchedule] = useState('')
  const [withdrawMinByVip, setWithdrawMinByVip] = useState<Record<string, number>>({})
  const [minWithdraw, setMinWithdraw] = useState(0)

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('token') ?? sessionStorage.getItem('token') ?? ''
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}

        // Get userId from localStorage to pass to vip/levels
        const rawUser = localStorage.getItem('user') ?? sessionStorage.getItem('user')
        const userId = rawUser ? (JSON.parse(rawUser) as { id?: number })?.id : null
        const userIdQuery = userId ? `?userId=${userId}` : ''

        const [settingsRes, vipRes] = await Promise.all([
          fetch(`${API_URL}/api/site-settings`, { headers }),
          fetch(`${API_URL}/api/vip/levels${userIdQuery}`, { headers }),
        ])

        if (settingsRes.ok) {
          const data = (await settingsRes.json()) as SiteSettings
          setMinWithdraw(Number(data.minWithdrawAmount ?? 0))
          setWithdrawSchedule(String(data.withdrawSchedule ?? '00:00 - 23:59'))
          if (data.withdrawMinByVip) {
            try {
              const parsed = JSON.parse(data.withdrawMinByVip) as Record<string, number>
              setWithdrawMinByVip(parsed)
            } catch {
              // silent
            }
          }
        }

        if (vipRes.ok) {
          const json = (await vipRes.json()) as { ok?: boolean; levels?: VipLevel[] }
          if (json?.ok && Array.isArray(json.levels)) {
            setVipLevels(json.levels)
          }
        }
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const categories = [
    { id: 'saque' as Category, label: 'Saque', icon: 'wallet' },
    { id: 'vip' as Category, label: 'VIP', icon: 'crown' },
    { id: 'duvidas' as Category, label: 'Dúvidas', icon: 'help' },
    { id: 'recarga' as Category, label: 'Recarga', icon: 'refresh' },
  ]

  const iconSvgs: Record<string, JSX.Element> = {
    wallet: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4z" />
      </svg>
    ),
    crown: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" /><path d="M3 20h18" />
      </svg>
    ),
    help: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    refresh: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 4v6h-6" /><path d="M1 20v-6h6" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
      </svg>
    ),
    clock: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    alert: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-2.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  }

  return (
    <main className="dash-app profile-page">
      <section className="dash-main">
        <AppSidebar />
        <div className="dash-content">
          {loading ? (
            <div className="profile-loading">Carregando...</div>
          ) : (
            <>
              <div className="profile-banner-top">
                <img src="/trk-banner.png" alt="TRK Banner" className="profile-banner-img" />
              </div>

              <section className="profile-header-modern">
                <button
                  type="button"
                  onClick={() => navigate('/profile')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#ff8a03" strokeWidth="2">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                  <span style={{ fontSize: 14, color: '#ff8a03', fontWeight: 600 }}>Voltar</span>
                </button>
              </section>

              <h2 style={{ textAlign: 'center', margin: '0 16px 16px', fontSize: 20, color: '#5a3d1a', fontWeight: 800 }}>
                Manual de Ajuda
              </h2>

              {/* Seletor de Categorias */}
              <div style={{
                display: 'flex',
                gap: 8,
                padding: '0 16px',
                marginBottom: 16,
                overflowX: 'auto',
                scrollbarWidth: 'none'
              }}>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    style={{
                      background: activeCategory === cat.id
                        ? 'linear-gradient(135deg, #ffb347, #ff8a03)'
                        : '#fff',
                      color: activeCategory === cat.id ? '#fff' : '#8a6b3f',
                      border: `1px solid ${activeCategory === cat.id ? '#ff8a03' : 'rgba(255, 138, 3, 0.22)'}`,
                      borderRadius: 20,
                      padding: '8px 16px',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      transition: 'all 0.2s',
                      boxShadow: activeCategory === cat.id
                        ? '0 6px 14px rgba(255, 138, 3, 0.28)'
                        : '0 2px 6px rgba(90, 61, 26, 0.12)'
                    }}
                  >
                    <span>{iconSvgs[cat.icon]}</span>
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Categoria: Saque */}
              {activeCategory === 'saque' && (
                <>
                  <div style={{ padding: '0 16px', marginBottom: 16 }}>
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.85)',
                      borderRadius: 12,
                      padding: 20,
                      border: '1px solid rgba(255, 138, 3, 0.22)',
                      boxShadow: '0 12px 24px rgba(90, 61, 26, 0.12)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <div style={{
                          width: 32,
                          height: 32,
                          borderRadius: 999,
                          background: 'linear-gradient(135deg, #ffb347, #ff8a03)',
                          display: 'grid',
                          placeItems: 'center',
                          color: '#fff'
                        }}>
                          {iconSvgs['clock']}
                        </div>
                        <h3 style={{ color: '#5a3d1a', margin: 0, fontSize: 15, fontWeight: 700 }}>
                          Horários de Saque
                        </h3>
                      </div>
                      <p style={{ color: '#8a6b3f', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
                        Saques disponíveis das{' '}
                        <strong style={{ color: '#ff8a03' }}>{withdrawSchedule || '00:00 às 23:59'}</strong>
                      </p>
                      <p style={{ color: '#a08050', fontSize: 12, marginTop: 8 }}>
                        * Horários podem variar em dias festivos
                      </p>
                    </div>
                  </div>

                  <div style={{ padding: '0 16px', marginBottom: 24 }}>
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.85)',
                      borderRadius: 12,
                      padding: 20,
                      border: '1px solid rgba(255, 138, 3, 0.22)',
                      boxShadow: '0 12px 24px rgba(90, 61, 26, 0.12)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                        <div style={{
                          width: 32,
                          height: 32,
                          borderRadius: 999,
                          background: 'linear-gradient(135deg, #ffb347, #ff8a03)',
                          display: 'grid',
                          placeItems: 'center',
                          color: '#fff'
                        }}>
                          {iconSvgs['wallet']}
                        </div>
                        <h3 style={{ color: '#5a3d1a', margin: 0, fontSize: 15, fontWeight: 700 }}>
                          Saque Mínimo por VIP
                        </h3>
                      </div>

                      {Object.keys(withdrawMinByVip).length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {Object.entries(withdrawMinByVip).map(([vipName, minVal]) => (
                            <div key={vipName} style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              background: 'rgba(255, 245, 235, 0.8)',
                              padding: '10px 16px',
                              borderRadius: 8,
                              border: '1px solid rgba(255, 138, 3, 0.15)'
                            }}>
                              <span style={{ color: '#ff8a03', fontWeight: 700, fontSize: 14 }}>{vipName}</span>
                              <span style={{ color: '#5a3d1a', fontSize: 14, fontWeight: 700 }}>{formatBRL(minVal)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          background: 'rgba(255, 245, 235, 0.8)',
                          padding: '10px 16px',
                          borderRadius: 8,
                          border: '1px solid rgba(255, 138, 3, 0.15)'
                        }}>
                          <span style={{ color: '#8a6b3f', fontSize: 14 }}>Valor mínimo padrão</span>
                          <span style={{ color: '#5a3d1a', fontSize: 14, fontWeight: 700 }}>{formatBRL(minWithdraw)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Categoria: VIP */}
              {activeCategory === 'vip' && (
                <div style={{ padding: '0 16px', marginBottom: 24 }}>
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.85)',
                    borderRadius: 12,
                    padding: 20,
                    border: '1px solid rgba(255, 138, 3, 0.22)',
                    boxShadow: '0 12px 24px rgba(90, 61, 26, 0.12)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                      <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: 999,
                        background: 'linear-gradient(135deg, #ffb347, #ff8a03)',
                        display: 'grid',
                        placeItems: 'center',
                        color: '#fff'
                      }}>
                        {iconSvgs['crown']}
                      </div>
                      <h3 style={{ color: '#5a3d1a', margin: 0, fontSize: 15, fontWeight: 700 }}>
                        Como Funciona cada VIP
                      </h3>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {vipLevels.map((vip) => (
                        <div key={vip.id} style={{
                          background: 'rgba(255, 245, 235, 0.8)',
                          padding: '16px',
                          borderRadius: 10,
                          border: '1px solid rgba(255, 138, 3, 0.15)'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <h4 style={{ color: '#ff8a03', margin: 0, fontSize: 15, fontWeight: 700 }}>{vip.name}</h4>
                            {vip.price ? (
                              <span style={{ color: '#2d7a3a', fontSize: 13, fontWeight: 700 }}>
                                {formatBRL(vip.price)}
                              </span>
                            ) : null}
                          </div>
                          {vip.minWithdraw ? (
                            <p style={{ color: '#8a6b3f', fontSize: 13, margin: '4px 0' }}>
                              <strong style={{ color: '#5a3d1a' }}>Saque mínimo:</strong> {formatBRL(vip.minWithdraw)}
                            </p>
                          ) : null}
                          {vip.durationDays ? (
                            <p style={{ color: '#8a6b3f', fontSize: 13, margin: '4px 0' }}>
                              <strong style={{ color: '#5a3d1a' }}>Duração:</strong> {vip.durationDays} dias
                            </p>
                          ) : null}
                          {vip.dailyTaskLimit ? (
                            <p style={{ color: '#8a6b3f', fontSize: 13, margin: '4px 0' }}>
                              <strong style={{ color: '#5a3d1a' }}>Limite diário de tarefas:</strong> {vip.dailyTaskLimit}
                            </p>
                          ) : null}
                          {vip.taskRewardAmount ? (
                            <p style={{ color: '#8a6b3f', fontSize: 13, margin: '4px 0' }}>
                              <strong style={{ color: '#5a3d1a' }}>Recompensa por tarefa:</strong> {formatBRL(vip.taskRewardAmount)}
                            </p>
                          ) : null}
                          {vip.benefits ? (
                            <p style={{ color: '#a08050', fontSize: 13, margin: '8px 0 0', lineHeight: 1.5 }}>
                              {vip.benefits}
                            </p>
                          ) : null}
                        </div>
                      ))}

                      {vipLevels.length === 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {[
                            { name: 'T1', desc: 'Nível inicial. Acesso básico a todas as funcionalidades.' },
                            { name: 'T2', desc: 'Segundo nível. Libera mais opções de saque e tarefas.' },
                            { name: 'T3', desc: 'Nível intermediário. Mais benefícios e comissões.' },
                            { name: 'T4', desc: 'Nível máximo. Todos os benefícios liberados.' },
                          ].map((vip, i) => (
                            <div key={i} style={{
                              background: 'rgba(255, 245, 235, 0.8)',
                              padding: '14px 16px',
                              borderRadius: 10,
                              border: '1px solid rgba(255, 138, 3, 0.15)'
                            }}>
                              <h4 style={{ color: '#ff8a03', margin: '0 0 4px', fontSize: 15, fontWeight: 700 }}>{vip.name}</h4>
                              <p style={{ color: '#a08050', fontSize: 13, margin: 0, lineHeight: 1.4 }}>{vip.desc}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      <div style={{
                        background: 'rgba(255, 245, 235, 0.8)',
                        padding: '12px 16px',
                        borderRadius: 8,
                        border: '1px solid rgba(255, 138, 3, 0.15)'
                      }}>
                        <p style={{ color: '#8a6b3f', fontSize: 13, margin: 0, lineHeight: 1.5 }}>
                          <strong style={{ color: '#ff8a03', display: 'flex', alignItems: 'center', gap: 4 }}>
                            {iconSvgs['alert']}
                            Importante:
                          </strong> Não é possível ter mais de 1 VIP ativo na mesma conta. Ao adquirir um novo VIP, o anterior é substituído.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Categoria: Dúvidas */}
              {activeCategory === 'duvidas' && (
                <div style={{ padding: '0 16px', marginBottom: 24 }}>
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.85)',
                    borderRadius: 12,
                    padding: 20,
                    border: '1px solid rgba(255, 138, 3, 0.22)',
                    boxShadow: '0 12px 24px rgba(90, 61, 26, 0.12)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                      <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: 999,
                        background: 'linear-gradient(135deg, #ffb347, #ff8a03)',
                        display: 'grid',
                        placeItems: 'center',
                        color: '#fff'
                      }}>
                        {iconSvgs['help']}
                      </div>
                      <h3 style={{ color: '#5a3d1a', margin: 0, fontSize: 15, fontWeight: 700 }}>
                        Dúvidas Frequentes
                      </h3>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {[
                        {
                          q: 'Como subo de nível VIP?',
                          a: 'Comprando um dos pacotes VIP disponíveis na plataforma. Cada nível oferece benefícios diferentes.'
                        },
                        {
                          q: 'O saque é instantâneo?',
                          a: 'O processamento pode levar de alguns minutos até 24 horas, dependendo do nível VIP e do horário da solicitação.'
                        },
                        {
                          q: 'Posso ter mais de um VIP ativo?',
                          a: 'Não. Não é possível ter mais de 1 VIP ativo na mesma conta. Ao adquirir um novo VIP, o anterior é substituído.'
                        },
                        {
                          q: 'Qual o valor mínimo para recarga?',
                          a: 'O valor mínimo de recarga é De R$200,00.'
                        },
                      ].map((faq, i) => (
                        <div key={i} style={{
                          background: 'rgba(255, 245, 235, 0.8)',
                          padding: '12px 16px',
                          borderRadius: 8,
                          border: '1px solid rgba(255, 138, 3, 0.12)'
                        }}>
                          <p style={{ color: '#ff8a03', fontSize: 13, fontWeight: 700, margin: '0 0 6px' }}>{faq.q}</p>
                          <p style={{ color: '#8a6b3f', fontSize: 13, margin: 0, lineHeight: 1.5 }}>{faq.a}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Categoria: Recarga */}
              {activeCategory === 'recarga' && (
                <div style={{ padding: '0 16px', marginBottom: 24 }}>
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.85)',
                    borderRadius: 12,
                    padding: 20,
                    border: '1px solid rgba(255, 138, 3, 0.22)',
                    boxShadow: '0 12px 24px rgba(90, 61, 26, 0.12)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                      <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: 999,
                        background: 'linear-gradient(135deg, #ffb347, #ff8a03)',
                        display: 'grid',
                        placeItems: 'center',
                        color: '#fff'
                      }}>
                        {iconSvgs['refresh']}
                      </div>
                      <h3 style={{ color: '#5a3d1a', margin: 0, fontSize: 15, fontWeight: 700 }}>
                        Como Recarregar
                      </h3>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {[
                        {
                          q: 'Como fazer uma recarga?',
                          a: 'Acesse a página de recarga pelo menu principal. Escolha o valor desejado e o método de pagamento disponível.'
                        },
                        {
                          q: 'Qual o valor mínimo para recarga?',
                          a: 'O valor mínimo pode variar. Acesse a página de recarga para ver os valores mínimos aceitos.'
                        },
                        {
                          q: 'Quanto tempo demora para creditar?',
                          a: 'A maioria das recargas é creditada automaticamente em poucos minutos. Em casos excepcionais pode levar até 1 hora.'
                        },
                        {
                          q: 'Posso transferir saldo para outro usuário?',
                          a: 'Não é possível transferir saldo entre usuários. Cada conta possui seu próprio saldo indivisível.'
                        },
                      ].map((faq, i) => (
                        <div key={i} style={{
                          background: 'rgba(255, 245, 235, 0.8)',
                          padding: '12px 16px',
                          borderRadius: 8,
                          border: '1px solid rgba(255, 138, 3, 0.12)'
                        }}>
                          <p style={{ color: '#ff8a03', fontSize: 13, fontWeight: 700, margin: '0 0 6px' }}>{faq.q}</p>
                          <p style={{ color: '#8a6b3f', fontSize: 13, margin: 0, lineHeight: 1.5 }}>{faq.a}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>
      <AppBottomNav />
</main>
  )
}