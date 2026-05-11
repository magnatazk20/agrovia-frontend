import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppSidebar from '../components/AppSidebar'
import './TeamExpansion.css'
import AppBottomNav from '../components/AppBottomNav'

// Local utilities
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

const formatBRL = (value: number) =>
  Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

// Types
interface StoredUser {
  id: number
  phone?: string
}

interface TeamLevel {
  level: number
  totalMembers: number
  depositedMembers: number
  rechargedAmount: number
}

interface CommissionLevel {
  id: number
  level: number
  name: string
  commissionPercent: number
  isActive: boolean
}

export default function TeamExpansion() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [teamSize, setTeamSize] = useState(0)
  const [depositedMembers, setDepositedMembers] = useState(0)
  const [teamRecharge, setTeamRecharge] = useState(0)
  const [teamWithdraw, setTeamWithdraw] = useState(0)
  const [levels, setLevels] = useState<TeamLevel[]>([])
const [commissionLevels, setCommissionLevels] = useState<CommissionLevel[]>([])
  const [refCode, setRefCode] = useState('')
  const [referralLink, setReferralLink] = useState('')
  const [copied, setCopied] = useState(false)

  const user = useMemo(() => {
    const raw = localStorage.getItem('user') ?? sessionStorage.getItem('user')
    if (!raw) return null
    try {
      return JSON.parse(raw) as StoredUser
    } catch {
      return null
    }
  }, [])

  const token = useMemo(
    () => localStorage.getItem('token') ?? sessionStorage.getItem('token') ?? '',
    []
  )

  useEffect(() => {
    if (!user?.id) {
      navigate('/')
      return
    }

    const loadData = async () => {
      setLoading(true)
      try {
        // Load team report
        const reportRes = await fetch(
          `${API_URL}/api/referral/team-report/${user.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        if (reportRes.ok) {
          const data = await reportRes.json()
          if (data?.ok) {
            setTeamSize(Number(data.summary?.teamSize ?? 0))
            setDepositedMembers(Number(data.summary?.depositedMembers ?? 0))
            setTeamRecharge(Number(data.summary?.teamRecharge ?? 0))
            setTeamWithdraw(Number(data.summary?.teamWithdraw ?? 0))
            if (Array.isArray(data.levels)) {
              setLevels(
                data.levels.map((l: any) => ({
                  level: Number(l.level ?? 0),
                  totalMembers: Number(l.totalMembers ?? 0),
                  depositedMembers: Number(l.depositedMembers ?? 0),
                  rechargedAmount: Number(l.rechargedAmount ?? 0),
                }))
              )
            }
          }
        }

        // Load referral code
        const refRes = await fetch(`${API_URL}/api/referral/${user.id}`)
        if (refRes.ok) {
          const refData = await refRes.json()
          if (refData?.ok) {
            setRefCode(String(refData.referralCode ?? ''))
            setReferralLink(String(refData.referralLink ?? ''))
          }
        }

        // Load commission levels
        const commissionRes = await fetch(`${API_URL}/api/commission/levels`)
        if (commissionRes.ok) {
          const commissionData = await commissionRes.json()
          if (commissionData?.ok && Array.isArray(commissionData.levels)) {
            setCommissionLevels(
              commissionData.levels.map((c: any) => ({
                id: Number(c.id ?? 0),
                level: Number(c.level ?? 0),
                name: String(c.name ?? ''),
                commissionPercent: Number(c.commissionPercent ?? 0),
                isActive: Boolean(c.isActive ?? false),
              }))
            )
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados da equipe:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user?.id, token, API_URL])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const el = document.createElement('textarea')
      el.value = referralLink
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <main className="dash-app">
      <section className="dash-main">
        <AppSidebar />
        <div className="dash-content">
          <header className="team-exp-header">
            <button type="button" className="team-exp-back" onClick={() => navigate('/dashboard')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <h1 className="team-exp-title">Expansão da Equipe</h1>
          </header>

          {loading ? (
            <div className="team-exp-loading">Carregando...</div>
          ) : (
            <>
            {/* Summary Cards */}
            <div className="team-exp-summary">
              <div className="team-exp-card">
                <div className="team-exp-card-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#ff8a03" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <div className="team-exp-card-info">
                  <span className="team-exp-card-value">{teamSize}</span>
                  <span className="team-exp-card-label">Total da equipe</span>
                </div>
              </div>

              <div className="team-exp-card">
                <div className="team-exp-card-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <path d="M22 4L12 14.01l-3-3" />
                  </svg>
                </div>
                <div className="team-exp-card-info">
                  <span className="team-exp-card-value">{depositedMembers}</span>
                  <span className="team-exp-card-label">Membros ativos</span>
                </div>
              </div>

              <div className="team-exp-card">
                <div className="team-exp-card-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                <div className="team-exp-card-info">
                  <span className="team-exp-card-value">{formatBRL(teamRecharge)}</span>
                  <span className="team-exp-card-label">Recarga da equipe</span>
                </div>
              </div>

              <div className="team-exp-card">
                <div className="team-exp-card-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3v12" />
                    <path d="M7 10l5 5 5-5" />
                    <path d="M4 19h16" />
                  </svg>
                </div>
                <div className="team-exp-card-info">
                  <span className="team-exp-card-value">{formatBRL(teamWithdraw)}</span>
                  <span className="team-exp-card-label">Saques da equipe</span>
                </div>
              </div>
            </div>

            {/* Referral Section */}
            <div className="team-exp-referral">
              <h2 className="team-exp-section-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="#ff8a03" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                  <path d="M16 6l-4-4-4 4" />
                  <path d="M12 2v13" />
                </svg>
                Convide e expanda sua equipe
              </h2>
              <p className="team-exp-referral-desc">
                Compartilhe seu link de convite e ganhe comissões de todos os níveis da sua equipe.
              </p>

              {refCode ? (
                <div className="team-exp-referral-box">
                  <div className="team-exp-ref-code">
                    <span className="team-exp-ref-label">Seu código:</span>
                    <span className="team-exp-ref-value">{refCode}</span>
                  </div>
                  <div className="team-exp-ref-link">
                    <input
                      type="text"
                      readOnly
                      value={referralLink}
                      className="team-exp-ref-input"
                    />
                    <button
                      type="button"
                      className="team-exp-copy-btn"
                      onClick={handleCopy}
                    >
                      {copied ? 'Copiado!' : 'Copiar Link'}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Levels Breakdown */}
            <div className="team-exp-levels">
              <h2 className="team-exp-section-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="#ff8a03" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                  <path d="M3 3v18h18" />
                  <path d="M7 17l4-8 4 4 6-10" />
                </svg>
                Níveis da equipe
              </h2>

              <div className="team-exp-levels-grid">
                {levels.map((lvl) => {
                  const commLevel = commissionLevels.find((c) => c.level === lvl.level)
                  return (
                    <div key={lvl.level} className="team-exp-level-card">
                      <div className="team-exp-level-header">
                        <span className="team-exp-level-badge">Nível {lvl.level}</span>
                        {commLevel ? (
                          <span className="team-exp-level-commission">
                            {commLevel.commissionPercent}% comissão
                          </span>
                        ) : null}
                      </div>
                      <div className="team-exp-level-stats">
                        <div className="team-exp-level-stat">
                          <span className="team-exp-level-stat-value">{lvl.totalMembers}</span>
                          <span className="team-exp-level-stat-label">Membros</span>
                        </div>
                        <div className="team-exp-level-stat">
                          <span className="team-exp-level-stat-value">{lvl.depositedMembers}</span>
                          <span className="team-exp-level-stat-label">Ativos</span>
                        </div>
                        <div className="team-exp-level-stat">
                          <span className="team-exp-level-stat-value">{formatBRL(lvl.rechargedAmount)}</span>
                          <span className="team-exp-level-stat-label">Recarga</span>
                        </div>
                      </div>
                    </div>
                  )
                })}

                {levels.length === 0 ? (
                  <p className="team-exp-empty">Nenhum membro na equipe ainda. Compartilhe seu link!</p>
                ) : null}
              </div>
            </div>

            {/* Commission Levels Info */}
            {commissionLevels.length > 0 ? (
              <div className="team-exp-commission-info">
                <h2 className="team-exp-section-title">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#ff8a03" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                  Tabela de comissões
                </h2>
                <div className="team-exp-commission-table">
                  <div className="team-exp-commission-row team-exp-commission-header">
                    <span>Nível</span>
                    <span>Nome</span>
                    <span>Comissão</span>
                  </div>
                  {commissionLevels
                    .filter((c) => c.isActive)
                    .sort((a, b) => a.level - b.level)
                    .map((c) => (
                      <div key={c.id} className="team-exp-commission-row">
                        <span className="team-exp-commission-level">Nível {c.level}</span>
                        <span className="team-exp-commission-name">{c.name}</span>
                        <span className="team-exp-commission-percent">{c.commissionPercent}%</span>
                      </div>
                    ))}
                </div>
              </div>
            ) : null}

            {/* Nova seção: Como Convidar */}
            <div className="team-exp-howto-section">
              <h2 className="team-exp-section-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="#ff8a03" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                  <path d="M22 2H2v20h20V2z" />
                  <path d="M12 2v20M2 12h20" />
                </svg>
                Como Convidar Novos Membros
              </h2>
              <img src="/trk-invite-banner.png" alt="Convide e ganhe com a TRK" className="team-exp-banner" />
              <div className="team-exp-tip-list">
                <div className="team-exp-tip-item">
                  <span className="team-exp-tip-number">1</span>
                  <p>Clique em "Copiar Link" acima para copiar seu link de convite exclusivo.</p>
                </div>
                <div className="team-exp-tip-item">
                  <span className="team-exp-tip-number">2</span>
                  <p>Envie o link por WhatsApp, Telegram, Instagram ou qualquer rede social.</p>
                </div>
                <div className="team-exp-tip-item">
                  <span className="team-exp-tip-number">3</span>
                  <p>Seu convidado clica no link e cria uma conta na TRK (só leva 1 minuto).</p>
                </div>
                <div className="team-exp-tip-item">
                  <span className="team-exp-tip-number">4</span>
                  <p>Ele entra automaticamente na sua equipe no Nível 1.</p>
                </div>
                <div className="team-exp-tip-item">
                  <span className="team-exp-tip-number">5</span>
                  <p>Você ganha comissão sobre todas as recargas dele e de toda a equipe dele!</p>
                </div>
              </div>
            </div>

            {/* Nova seção: Como Divulgar */}
            <div className="team-exp-howto-section">
              <h2 className="team-exp-section-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="#ff8a03" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 19.24v3M16 11a4 4 0 1 1 0 8 4 4 0 0 1 0-8z" />
                </svg>
                Como Divulgar Eficazmente
              </h2>
              <div className="team-exp-tip-list">
                <div className="team-exp-tip-item">
                  <span className="team-exp-tip-number">1</span>
                  <p><strong>WhatsApp:</strong> Envie para contatos individuais ou grupos de amigos/família.</p>
                </div>
                <div className="team-exp-tip-item">
                  <span className="team-exp-tip-number">2</span>
                  <p><strong>Instagram:</strong> Stories com sticker de link + posts no feed com depoimentos.</p>
                </div>
                <div className="team-exp-tip-item">
                  <span className="team-exp-tip-number">3</span>
                  <p><strong>Facebook:</strong> Grupos locais, marketplace, stories e página pessoal.</p>
                </div>
                <div className="team-exp-tip-item">
                  <span className="team-exp-tip-number">4</span>
                  <p><strong>TikTok:</strong> Vídeos curtos mostrando ganhos reais e como funciona.</p>
                </div>
                <div className="team-exp-tip-item">
                  <span className="team-exp-tip-number">5</span>
                  <p><strong>Telegram:</strong> Canais, grupos e bio do perfil com seu link permanente.</p>
                </div>
                <div className="team-exp-tip-item">
                  <span className="team-exp-tip-number">6</span>
                  <p>Coloque seu link na bio de todas as redes + crie conteúdo mostrando seus ganhos!</p>
                </div>
              </div>
            </div>

            {/* Nova seção: Para Quem Divulgar */}
            <div className="team-exp-howto-section">
              <h2 className="team-exp-section-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="#ff8a03" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                Para Quem Divulgar (Público-Alvo)
              </h2>
              <div className="team-exp-tip-list">
                <div className="team-exp-tip-item">
                  <span className="team-exp-tip-number">1</span>
                  <p><strong>Amigos e família:</strong> Pessoas próximas que confiam em você.</p>
                </div>
                <div className="team-exp-tip-item">
                  <span className="team-exp-tip-number">2</span>
                  <p><strong>Estudantes:</strong> Buscando renda extra flexível estudando.</p>
                </div>
                <div className="team-exp-tip-item">
                  <span className="team-exp-tip-number">3</span>
                  <p><strong>Empreendedores:</strong> Já entendem marketing de rede e multiplicação.</p>
                </div>
                <div className="team-exp-tip-item">
                  <span className="team-exp-tip-number">4</span>
                  <p><strong>Autônomos:</strong> Motoristas, entregadores, vendedores buscando renda passiva.</p>
                </div>
                <div className="team-exp-tip-item">
                  <span className="team-exp-tip-number">5</span>
                  <p><strong>Donas de casa:</strong> Renda extra sem sair de casa, horário flexível.</p>
                </div>
                <div className="team-exp-tip-item">
                  <span className="team-exp-tip-number">6</span>
                  <p><strong>Qualquer pessoa</strong> com smartphone querendo ganhar dinheiro real!</p>
                </div>
              </div>
              <div className="team-exp-actions-spacer">
                <button
                  type="button"
                  className="team-exp-action-btn"
                  onClick={() => navigate('/invite')}
                >
                  🚀 Ir para Convidar Agora
                </button>
              </div>
            </div>

            <div className="team-exp-tip-list">
              <div className="team-exp-tip-item">
                <span className="team-exp-tip-number">1</span>
                <p>Copie seu link de convite acima e compartilhe com amigos, familiares ou nas redes sociais.</p>
              </div>
              <div className="team-exp-tip-item">
                <span className="team-exp-tip-number">2</span>
                <p>Quando alguem se cadastrar pelo seu link, essa pessoa entra automaticamente na sua equipe.</p>
              </div>
              <div className="team-exp-tip-item">
                <span className="team-exp-tip-number">3</span>
                <p>Voce recebe comissao sobre as recargas dos membros da sua equipe, conforme a tabela de comissoes acima.</p>
              </div>
              <div className="team-exp-tip-item">
                <span className="team-exp-tip-number">4</span>
                <p>Quanto mais membros ativos na sua equipe, maior a sua renda de comissoes. Convide pelo WhatsApp, Instagram, Facebook, TikTok ou Telegram.</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="team-exp-actions">
              <button
                type="button"
                className="team-exp-action-btn"
                onClick={() => navigate('/invite')}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                  <line x1="20" y1="8" x2="20" y2="14" />
                  <line x1="23" y1="11" x2="17" y2="11" />
                </svg>
                Convidar Membros
              </button>
              <button
                type="button"
                className="team-exp-action-btn team-exp-action-secondary"
                onClick={() => navigate('/position')}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                Gestão de Equipe
              </button>
            </div>
          </>
        )}
        </div>
      </section>
      <AppBottomNav />
</main>
  )
}
