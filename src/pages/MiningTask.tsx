import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import AppSidebar from '../components/AppSidebar'
import { YOUTUBE_IDS, fetchYouTubeTitle } from '../utils/miningVideos'
import './Dashboard.css'
import './Tasks.css'
import AppBottomNav from '../components/AppBottomNav'

type StoredUser = {
  id: number
  name: string
  phone: string
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'
const REQUIRED_SECONDS = 30

const formatBRL = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const formatTime = (totalSeconds: number) => {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function MiningTask() {
  const navigate = useNavigate()
  const { taskId } = useParams()
  const [searchParams] = useSearchParams()
  const queryVideoId = searchParams.get('video') ?? ''
  const [videoTitle, setVideoTitle] = useState('')

  const [loading, setLoading] = useState(false)
  const [checkingStatus, setCheckingStatus] = useState(true)
  const [alreadyCompletedToday, setAlreadyCompletedToday] = useState(false)
  const [message, setMessage] = useState('')
  const [reward, setReward] = useState<number | null>(null)
  const [toastMessage, setToastMessage] = useState('')
  const [rating, setRating] = useState<number>(0)
  const [ratingSent, setRatingSent] = useState(false)

  const [watchedSeconds, setWatchedSeconds] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [videoStarted, setVideoStarted] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const playerWrapRef = useRef<HTMLDivElement | null>(null)

  /* Vídeo vem da query string (?video=...). Fallback para um aleatório se ausente. */
  const [selectedVideoId] = useState(() => {
    const fromQuery = queryVideoId.trim()
    if (fromQuery && (YOUTUBE_IDS as readonly string[]).includes(fromQuery)) {
      return fromQuery
    }
    const idx = Math.floor(Math.random() * YOUTUBE_IDS.length)
    return YOUTUBE_IDS[idx]
  })

  /* Busca o título do vídeo no oEmbed do YouTube para mostrar no banner */
  useEffect(() => {
    const controller = new AbortController()
    fetchYouTubeTitle(selectedVideoId, controller.signal).then((title) => {
      if (title) setVideoTitle(title)
    })
    return () => controller.abort()
  }, [selectedVideoId])

  const embedUrl = `https://www.youtube.com/embed/${selectedVideoId}?enablejsapi=1&rel=0&modestbranding=1&showinfo=0&controls=0&disablekb=1&fs=0&iv_load_policy=3`

  const user = useMemo(() => {
    const raw = localStorage.getItem('user') ?? sessionStorage.getItem('user')
    if (!raw) return null
    try {
      return JSON.parse(raw) as StoredUser
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    if (!user?.id) {
      setMessage('Usuário não autenticado.')
      setCheckingStatus(false)
      return
    }

    const checkTaskStatus = async () => {
      if (!taskId) {
        setCheckingStatus(false)
        return
      }

      try {
        const token = localStorage.getItem('token') ?? sessionStorage.getItem('token') ?? ''
        const response = await fetch(`${API_URL}/api/mining/tasks/${user.id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        const data = await response.json()

        if (!response.ok || !data?.ok) {
          setCheckingStatus(false)
          return
        }

        const currentTask = Array.isArray(data.tasks)
          ? data.tasks.find((t: { id: number; completedToday: number }) => Number(t.id) === Number(taskId))
          : null

        const done = Number(currentTask?.completedToday ?? 0) > 0
        setAlreadyCompletedToday(done)

        if (done) {
          setIsPlaying(false)
          setWatchedSeconds(REQUIRED_SECONDS)
          setMessage('Você já concluiu esta tarefa hoje. Disponível novamente às 00:00.')
        }
      } catch {
        // noop
      } finally {
        setCheckingStatus(false)
      }
    }

    checkTaskStatus()
  }, [user?.id, taskId])

  const percent = Math.min(100, (watchedSeconds / REQUIRED_SECONDS) * 100)
  const remainingSeconds = Math.max(0, REQUIRED_SECONDS - watchedSeconds)
  const podeConcluir = watchedSeconds >= REQUIRED_SECONDS

  /* Envia comando para o iframe do YouTube */
  const postYtCommand = (func: string) => {
    const iframeWin = iframeRef.current?.contentWindow
    if (iframeWin) {
      iframeWin.postMessage(
        JSON.stringify({ event: 'command', func, args: [] }),
        '*',
      )
    }
  }

  const togglePlay = () => {
    if (podeConcluir || alreadyCompletedToday) return
    const next = !isPlaying
    if (next && !videoStarted) setVideoStarted(true)
    setIsPlaying(next)
    postYtCommand(next ? 'playVideo' : 'pauseVideo')
  }

  const toggleMute = () => {
    if (isPlaying) {
      postYtCommand(isMuted ? 'unMute' : 'mute')
    }
    setIsMuted((prev) => !prev)
  }

  const [isMuted, setIsMuted] = useState(false)

  useEffect(() => {
    if (alreadyCompletedToday) return
    if (!isPlaying) return
    if (watchedSeconds >= REQUIRED_SECONDS) {
      setIsPlaying(false)
      postYtCommand('pauseVideo')
      return
    }

    const interval = window.setInterval(() => {
      setWatchedSeconds((prev) => Math.min(REQUIRED_SECONDS, prev + 1))
    }, 1000)

    return () => window.clearInterval(interval)
  }, [isPlaying, watchedSeconds, alreadyCompletedToday])

  const concluirTarefaVideo = async () => {
    if (alreadyCompletedToday) {
      setMessage('Você já concluiu esta tarefa hoje. Disponível novamente às 00:00.')
      return
    }

    if (!podeConcluir) {
      setMessage('Assista ao vídeo por 00:30 para concluir a tarefa.')
      return
    }

    if (rating < 1) {
      setMessage('Avalie a tarefa antes de receber a comissão.')
      return
    }

    if (!user?.id || !taskId) {
      setMessage('Dados inválidos para concluir a tarefa.')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const token = localStorage.getItem('token') ?? sessionStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/mining/tasks/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ userId: user.id, taskId: Number(taskId) }),
      })

      const data = await response.json()

      if (!response.ok || !data?.ok) {
        setMessage(data?.error ?? 'Falha ao concluir tarefa de vídeo.')
        return
      }

      setReward(Number(data.rewardAmount ?? 0))
      setMessage(data?.message ?? 'Tarefa concluída com sucesso.')
    } catch {
      setMessage('Erro de conexão ao concluir tarefa.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (reward === null) return
    setToastMessage(`Comissão recebida: ${formatBRL(reward)}`)
    const timeout = window.setTimeout(() => {
      setToastMessage('')
    }, 3200)

    return () => window.clearTimeout(timeout)
  }, [reward])

  return (
    <main className="dash-app">
      <section className="dash-main">
        <AppSidebar />

        <div className="dash-content">
          {/* ── Banner ── */}
          <div className="tasks-banner">
            <div className="tasks-banner__bg" aria-hidden="true">
              <div className="tasks-banner__glow tasks-banner__glow--1" />
              <div className="tasks-banner__glow tasks-banner__glow--2" />
              <svg className="tasks-banner__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            </div>
            <p className="tasks-banner__kicker">Tarefa #{taskId}</p>
            <h1 className="tasks-banner__title" title={videoTitle || `Tarefa #${taskId}`}>
              {videoTitle || `Tarefa #${taskId}`}
            </h1>
            <span className="tasks-banner__subtitle">Assista ao vídeo por 30s e avalie para receber a comissão</span>
            <div className="tasks-banner__actions">
              <button className="tasks-btn tasks-btn--ghost" onClick={() => navigate('/tasks')}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                Voltar
              </button>
            </div>
          </div>

          {/* ── Checking status ── */}
          {checkingStatus ? (
            <div className="tasks-loading">
              <div className="tasks-loading__spinner" />
              <span>Verificando tarefa...</span>
            </div>
          ) : null}

          {/* ── Card do vídeo ── */}
          {!checkingStatus && (
            <div className="mining-card">
              <div className="mining-card__header">
                <div className="mining-card__header-icon">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="23 7 16 12 23 17 23 7" />
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                  </svg>
                </div>
                <span className="mining-card__header-label">Vídeo da tarefa</span>
                <span className={`mining-card__status ${isPlaying ? 'mining-card__status--playing' : podeConcluir ? 'mining-card__status--done' : ''}`}>
                  <span className="mining-card__status-dot" />
                  {alreadyCompletedToday
                    ? 'Concluída'
                    : isPlaying
                      ? 'Assistindo...'
                      : podeConcluir
                        ? 'Concluído'
                        : 'Pausado'}
                </span>
              </div>

              {/* Player customizado com YouTube */}
              <div className="trk-player" ref={playerWrapRef}>
                <div className="trk-player__screen">
                  <iframe
                    ref={iframeRef}
                    title="Vídeo da tarefa"
                    width="100%"
                    height="100%"
                    src={embedUrl}
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                    className="trk-player__iframe"
                  />

                  {/* Overlay clicável por cima do iframe */}
                  <div className="trk-player__overlay" onClick={togglePlay}>
                    {/* Botão play grande no centro */}
                    {!isPlaying && !podeConcluir && !alreadyCompletedToday && (
                      <div className="trk-player__big-play">
                        <svg viewBox="0 0 24 24" width="48" height="48" fill="rgba(255,255,255,0.95)" stroke="none">
                          <polygon points="6 3 20 12 6 21 6 3" />
                        </svg>
                      </div>
                    )}

                    {/* Badge concluído */}
                    {(podeConcluir || alreadyCompletedToday) && (
                      <div className="trk-player__done-overlay">
                        <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span>{alreadyCompletedToday ? 'Concluída hoje' : 'Tempo concluído'}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Controles customizados */}
                <div className="trk-player__controls">
                  <button className="trk-player__btn" onClick={togglePlay} disabled={podeConcluir || alreadyCompletedToday}>
                    {isPlaying ? (
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
                    ) : (
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3" /></svg>
                    )}
                  </button>

                  <span className="trk-player__time">
                    {formatTime(watchedSeconds)} / {formatTime(REQUIRED_SECONDS)}
                  </span>

                  <div className="trk-player__volume-wrap">
                    <button className="trk-player__btn" onClick={toggleMute}>
                      {isMuted ? (
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" /></svg>
                      ) : (
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" /></svg>
                      )}
                    </button>
                  </div>

                  <span className="trk-player__badge-yt">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="#ff0000"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.4 31.4 0 0 0 0 12a31.4 31.4 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.4 31.4 0 0 0 24 12a31.4 31.4 0 0 0-.5-5.8zM9.5 15.6V8.4l6.3 3.6-6.3 3.6z" /></svg>
                  </span>
                </div>
              </div>

              {/* Barra de progresso */}
              <div className="mining-card__progress-info">
                <span>Tempo assistido</span>
                <strong>{formatTime(watchedSeconds)} / 00:30</strong>
              </div>
              <div className="mining-card__progress-track">
                <div
                  className="mining-card__progress-fill"
                  style={{ width: `${percent}%` }}
                />
              </div>

              {/* Controles do vídeo */}
              <div className="mining-card__controls">
                <button
                  className={`tasks-btn ${podeConcluir || alreadyCompletedToday ? 'tasks-btn--done' : isPlaying ? 'tasks-btn--pause' : 'tasks-btn--primary'}`}
                  onClick={togglePlay}
                  disabled={podeConcluir || alreadyCompletedToday || checkingStatus}
                >
                  {alreadyCompletedToday ? (
                    <>
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                      Concluída hoje
                    </>
                  ) : podeConcluir ? (
                    <>
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                      Tempo concluído
                    </>
                  ) : isPlaying ? (
                    <>
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
                      Pausar vídeo
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                      Iniciar vídeo
                    </>
                  )}
                </button>
                <span className="mining-card__remaining">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                  Faltam {formatTime(remainingSeconds)}
                </span>
              </div>
            </div>
          )}

          {/* ── Card de avaliação ── */}
          {!checkingStatus && (
            <div className="mining-card">
              <div className="mining-card__header">
                <div className="mining-card__header-icon mining-card__header-icon--star">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </div>
                <span className="mining-card__header-label">Avaliação da tarefa</span>
                <span className="mining-card__status">
                  {alreadyCompletedToday
                    ? 'Concluída hoje'
                    : ratingSent
                      ? `Enviada (${rating}/5)`
                      : 'Aguardando'}
                </span>
              </div>

              {/* Estrelas */}
              <div className="mining-card__stars">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    className={`mining-star ${rating >= n ? 'mining-star--active' : ''}`}
                    disabled={alreadyCompletedToday || ratingSent || !podeConcluir}
                    onClick={() => setRating(n)}
                    aria-label={`${n} estrela${n > 1 ? 's' : ''}`}
                  >
                    <svg viewBox="0 0 24 24" width="28" height="28" fill={rating >= n ? '#ff8a03' : 'none'} stroke={rating >= n ? '#ff8a03' : '#c9a96e'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </button>
                ))}
              </div>

              {/* Botão enviar avaliação */}
              <button
                className={`tasks-btn ${ratingSent ? 'tasks-btn--done' : 'tasks-btn--primary'} mining-card__submit-btn`}
                disabled={alreadyCompletedToday || ratingSent || !podeConcluir || rating < 1}
                onClick={() => {
                  if (!podeConcluir) {
                    setMessage('Assista ao vídeo por 00:30 antes de avaliar.')
                    return
                  }
                  if (rating < 1) {
                    setMessage('Selecione uma nota de 1 a 5.')
                    return
                  }
                  setRatingSent(true)
                  setMessage(`Avaliação ${rating}/5 enviada! Agora clique em "Receber comissão".`)
                }}
              >
                {ratingSent ? (
                  <>
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    Avaliação enviada
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                    Enviar avaliação
                  </>
                )}
              </button>

              {/* Botão receber comissão — aparece após avaliar */}
              {ratingSent && !alreadyCompletedToday && reward === null && (
                <button
                  className={`tasks-btn tasks-btn--primary mining-card__submit-btn`}
                  disabled={loading}
                  onClick={() => void concluirTarefaVideo()}
                >
                  {loading ? (
                    <>
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                      Processando...
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                      Receber comissão
                    </>
                  )}
                </button>
              )}

              {/* Comissão recebida */}
              {reward !== null && (
                <button
                  className="tasks-btn tasks-btn--done mining-card__submit-btn"
                  disabled
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  Comissão recebida: {formatBRL(reward)}
                </button>
              )}

              {/* Status geral */}
              <div className="mining-card__task-status">
                <span className="mining-card__task-status-label">Status da tarefa</span>
                <span className="mining-card__task-status-value">
                  {alreadyCompletedToday ? (
                    <><span className="mining-card__task-status-dot mining-card__task-status-dot--done" /> Concluída hoje</>
                  ) : !podeConcluir ? (
                    <><span className="mining-card__task-status-dot mining-card__task-status-dot--watching" /> Assistindo vídeo...</>
                  ) : !ratingSent ? (
                    <><span className="mining-card__task-status-dot mining-card__task-status-dot--waiting" /> Aguardando avaliação</>
                  ) : loading ? (
                    <><span className="mining-card__task-status-dot mining-card__task-status-dot--loading" /> Creditando comissão...</>
                  ) : (
                    <><span className="mining-card__task-status-dot mining-card__task-status-dot--done" /> Comissão processada</>
                  )}
                </span>
              </div>
            </div>
          )}

          {/* ── Mensagem ── */}
          {message ? (
            <div className="mining-message">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
              {message}
            </div>
          ) : null}

          {/* ── Toast ── */}
          {toastMessage ? <div className="floating-toast">{toastMessage}</div> : null}
        </div>
      </section>
      <AppBottomNav />
</main>
  )
}
