import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppSidebar from '../components/AppSidebar'
import {
  fetchYouTubeTitle,
  getVideoIdForSlot,
  getYouTubeThumbnail,
} from '../utils/miningVideos'
import './Dashboard.css'
import './Tasks.css'
import AppBottomNav from '../components/AppBottomNav'

type ApiTask = {
  id: number
  name: string
  description: string
  rewardAmount: number
  completedToday: number
  earnedToday: number
  remainingToday: number
  imageUrl?: string
}

type VipInfo = {
  vipName: string
  vipDailyTaskLimit: number
  vipMultiplier: number
}

type StoredUser = {
  id: number
  name: string
  phone: string
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

const formatBRL = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function Tasks() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tasks, setTasks] = useState<ApiTask[]>([])
  const [vip, setVip] = useState<VipInfo | null>(null)
  const [remainingByVip, setRemainingByVip] = useState(0)

  const user = useMemo(() => {
    const raw = localStorage.getItem('user') ?? sessionStorage.getItem('user')
    if (!raw) return null
    try {
      return JSON.parse(raw) as StoredUser
    } catch {
      return null
    }
  }, [])

  const loadTasks = async () => {
    if (!user?.id) {
      setError('Usuário não autenticado.')
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_URL}/api/mining/tasks/${user.id}`)
      const data = await response.json()

      if (!response.ok || !data?.ok) {
        if (response.status === 403 || data?.code === 'VIP_REQUIRED') {
          setError('Você não possui VIP ativo. Ative um VIP para acessar as tarefas.')
        } else {
          setError(data?.error ?? 'Não foi possível carregar suas tarefas.')
        }
        setTasks([])
        setVip(null)
        setRemainingByVip(0)
        return
      }

      setTasks(Array.isArray(data.tasks) ? data.tasks : [])
      setVip(data.vip ?? null)
      setRemainingByVip(Number(data.remainingByVip ?? 0))
    } catch {
      setError('Erro de conexão ao carregar tarefas.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTasks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  // Mostrar a quantidade exata de slots de tarefas equivalente ao limite diário do VIP.
  // Cada slot recebe um vídeo do YouTube determinístico (não muda entre re-renders).
  // O título e a imagem do card vêm do próprio vídeo (thumbnail + oEmbed).
  type Slot = ApiTask & { slotIndex: number; videoId: string }

  const visibleSlots = useMemo<Slot[]>(() => {
    const limit = Number(vip?.vipDailyTaskLimit ?? 0)
    if (!Array.isArray(tasks) || tasks.length === 0) return []

    const userIdNum = Number(user?.id ?? 0)
    const total = limit > 0 ? limit : tasks.length

    const result: Slot[] = []
    for (let i = 0; i < total; i += 1) {
      const base = tasks[i % tasks.length]
      result.push({
        ...base,
        slotIndex: i,
        videoId: getVideoIdForSlot(userIdNum, i),
      })
    }
    return result
  }, [tasks, vip?.vipDailyTaskLimit, user?.id])

  // Títulos buscados na API oEmbed do YouTube (cache em utils/miningVideos)
  const [videoTitles, setVideoTitles] = useState<Record<string, string>>({})

  useEffect(() => {
    if (visibleSlots.length === 0) return

    const controller = new AbortController()
    const uniqueVideoIds = Array.from(new Set(visibleSlots.map((s) => s.videoId)))

    Promise.all(
      uniqueVideoIds.map(async (videoId) => {
        const title = await fetchYouTubeTitle(videoId, controller.signal)
        return [videoId, title] as const
      })
    )
      .then((entries) => {
        const next: Record<string, string> = {}
        entries.forEach(([videoId, title]) => {
          if (title) next[videoId] = title
        })
        setVideoTitles((prev) => ({ ...prev, ...next }))
      })
      .catch(() => {
        // silencioso — fallback para o nome da tarefa
      })

    return () => controller.abort()
  }, [visibleSlots])

  const totalEarned = useMemo(() => {
    return visibleSlots.reduce((acc, t) => acc + Number(t.earnedToday ?? 0), 0)
  }, [visibleSlots])

  return (
    <main className="dash-app">
      <section className="dash-main">
        <AppSidebar />

        <div className="dash-content">
          {/* ── Banner / Header ── */}
          <div className="tasks-banner">
            <div className="tasks-banner__bg" aria-hidden="true">
              <div className="tasks-banner__glow tasks-banner__glow--1" />
              <div className="tasks-banner__glow tasks-banner__glow--2" />
              {/* ícone de mining/picareta */}
              <svg className="tasks-banner__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
              </svg>
            </div>
            <p className="tasks-banner__kicker">Central de tarefas</p>
            <h1 className="tasks-banner__title">Tarefas</h1>
            <span className="tasks-banner__subtitle">As tarefas disponíveis seguem seu nível VIP ativo</span>
            <div className="tasks-banner__actions">
              <button className="tasks-btn tasks-btn--ghost" onClick={() => navigate('/dashboard')}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                Voltar
              </button>
              <button className="tasks-btn tasks-btn--ghost" onClick={() => loadTasks()}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6" /><path d="M1 20v-6h6" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>
                Atualizar
              </button>
            </div>
          </div>

          {/* ── Loading ── */}
          {loading ? (
            <div className="tasks-loading">
              <div className="tasks-loading__spinner" />
              <span>Carregando tarefas...</span>
            </div>
          ) : null}

          {/* ── Erro / VIP bloqueado ── */}
          {!loading && error ? (
            <section className="tasks-blocked">
              <div className="tasks-blocked__img-wrap">
                <img
                  src="/tasks-office.png"
                  alt="Equipe profissional trabalhando em escritório"
                  className="tasks-blocked__img"
                />
                <div className="tasks-blocked__img-overlay" />
              </div>
              <div className="tasks-blocked__body">
                <strong>Area restrita a membros VIP</strong>
                <p>
                  Para acessar o painel de tarefas e comecar a gerar rendimentos diarios,
                  e necessario possuir um plano VIP ativo. Adquira seu plano e faca parte
                  da nossa equipe de profissionais.
                </p>
                <p className="tasks-blocked__sub">{error}</p>
                <button className="tasks-btn tasks-btn--primary" onClick={() => navigate('/vip')}>
                  Conhecer Planos VIP
                </button>
              </div>
            </section>
          ) : null}

          {/* ── Conteúdo principal ── */}
          {!loading && !error && vip ? (
            <>
              {/* Métricas */}
              <section className="tasks-metrics">
                <article className="tasks-metric-card">
                  <div className="tasks-metric-card__icon">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </div>
                  <span className="tasks-metric-card__label">VIP ativo</span>
                  <strong className="tasks-metric-card__value">{vip.vipName}</strong>
                </article>
                <article className="tasks-metric-card">
                  <div className="tasks-metric-card__icon">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" />
                    </svg>
                  </div>
                  <span className="tasks-metric-card__label">Limite diário VIP</span>
                  <strong className="tasks-metric-card__value">{vip.vipDailyTaskLimit}</strong>
                </article>
                <article className="tasks-metric-card">
                  <div className="tasks-metric-card__icon">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <span className="tasks-metric-card__label">Restantes hoje</span>
                  <strong className="tasks-metric-card__value">{remainingByVip}</strong>
                </article>
                <article className="tasks-metric-card">
                  <div className="tasks-metric-card__icon tasks-metric-card__icon--earn">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                  </div>
                  <span className="tasks-metric-card__label">Ganhos hoje</span>
                  <strong className="tasks-metric-card__value tasks-metric-card__value--earn">{formatBRL(totalEarned)}</strong>
                </article>
              </section>

              {/* Grid de tarefas */}
              <section className="tasks-grid">
                {visibleSlots.map((slot) => {
                  const jaConcluidaHoje = Number(slot.completedToday ?? 0) > 0
                  const bloquearInicio = remainingByVip <= 0 || jaConcluidaHoje
                  const videoTitle = videoTitles[slot.videoId] || slot.name
                  const thumbUrl = getYouTubeThumbnail(slot.videoId)

                  return (
                    <article
                      key={`slot-${slot.slotIndex}-${slot.id}`}
                      className={`tasks-card ${jaConcluidaHoje ? 'tasks-card--done' : ''}`}
                    >
                      <div className="tasks-card__img-wrap">
                        <img
                          src={thumbUrl}
                          alt={videoTitle}
                          className="tasks-card__img"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.currentTarget
                            target.onerror = null
                            target.src = `https://picsum.photos/seed/task-${slot.id}-${slot.slotIndex}/720/360`
                          }}
                        />
                        <span className="tasks-card__yt-badge" aria-hidden="true">
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="#ff0000">
                            <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.4 31.4 0 0 0 0 12a31.4 31.4 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.4 31.4 0 0 0 24 12a31.4 31.4 0 0 0-.5-5.8zM9.5 15.6V8.4l6.3 3.6-6.3 3.6z" />
                          </svg>
                          Vídeo
                        </span>
                        {jaConcluidaHoje && (
                          <span className="tasks-card__badge-done">
                            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                            Concluída
                          </span>
                        )}
                      </div>
                      <div className="tasks-card__body">
                        <h3 className="tasks-card__name" title={videoTitle}>
                          {videoTitle}
                        </h3>
                        <p className="tasks-card__desc">{slot.description}</p>
                        <div className="tasks-card__footer">
                          <span className="tasks-card__reward">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                            {formatBRL(slot.rewardAmount)}
                          </span>
                          <button
                            className={`tasks-btn ${jaConcluidaHoje ? 'tasks-btn--done' : 'tasks-btn--primary'}`}
                            onClick={() =>
                              navigate(`/tasks/mining/${slot.id}?video=${encodeURIComponent(slot.videoId)}&slot=${slot.slotIndex}`)
                            }
                            disabled={bloquearInicio}
                            title={
                              jaConcluidaHoje
                                ? 'Tarefa já concluída hoje. Disponível novamente às 00:00 (São Paulo).'
                                : remainingByVip <= 0
                                  ? 'Limite diário do VIP atingido.'
                                  : 'Iniciar Trabalho'
                            }
                          >
                            {jaConcluidaHoje ? 'Concluída hoje' : 'Iniciar Trabalho'}
                          </button>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </section>
            </>
          ) : null}
        </div>
      </section>
      <AppBottomNav />
</main>
  )
}
