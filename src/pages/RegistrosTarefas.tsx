import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppSidebar from '../components/AppSidebar'
import {
  fetchYouTubeTitle,
  getVideoIdForSlot,
  getYouTubeThumbnail,
} from '../utils/miningVideos'
import './Dashboard.css'
import './RegistrosTarefas.css'
import AppBottomNav from '../components/AppBottomNav'

interface User {
  id: number
  name: string
  phone: string
}

type TaskRecord = {
  id: number
  taskId: number
  taskName: string
  taskDescription: string
  progressDate: string | null
  completedCount: number
  earnedAmount: number
  createdAt: string | null
  updatedAt: string | null
}

type HistoryResponse = {
  ok?: boolean
  summary?: {
    totalEarned?: number
    totalCompleted?: number
    totalRecords?: number
  }
  records?: TaskRecord[]
}

type ApiTask = {
  id: number
  name: string
}

type VipInfo = {
  vipDailyTaskLimit: number
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

const formatBRL = (value: number) =>
  Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const formatDate = (raw: string | null) => {
  if (!raw) return '-'
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const formatDateTime = (raw: string | null) => {
  if (!raw) return '-'
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const dateToISO = (d: Date) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

const todayISO = () => dateToISO(new Date())

export default function RegistrosTarefas() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [records, setRecords] = useState<TaskRecord[]>([])
  const [tasks, setTasks] = useState<ApiTask[]>([])
  const [vip, setVip] = useState<VipInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [videoTitles, setVideoTitles] = useState<Record<string, string>>({})

  const initialFrom = useMemo(() => {
    const past = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000)
    return dateToISO(past)
  }, [])
  const [from, setFrom] = useState(initialFrom)
  const [to, setTo] = useState(todayISO())

  useEffect(() => {
    const token = localStorage.getItem('token') ?? sessionStorage.getItem('token')
    const raw = localStorage.getItem('user') ?? sessionStorage.getItem('user')

    if (!token || !raw) {
      navigate('/')
      return
    }

    try {
      setUser(JSON.parse(raw) as User)
    } catch {
      navigate('/')
    }
  }, [navigate])

  // Carrega o universo de tarefas + vip (mesma fonte que /tasks)
  // para reconstruir o videoId que cada slot usa.
  useEffect(() => {
    if (!user?.id) return
    const loadTasksContext = async () => {
      try {
        const response = await fetch(`${API_URL}/api/mining/tasks/${user.id}`)
        const data = await response.json()
        if (response.ok && data?.ok) {
          setTasks(Array.isArray(data.tasks) ? data.tasks : [])
          setVip(data.vip ?? null)
        }
      } catch {
        // silencioso — fallback usa o nome da tarefa
      }
    }
    loadTasksContext()
  }, [user?.id])

  // Mapa taskId -> videoId, derivado do mesmo round-robin de Tasks.tsx
  const taskIdToVideoId = useMemo<Record<number, string>>(() => {
    const map: Record<number, string> = {}
    if (!Array.isArray(tasks) || tasks.length === 0) return map
    const userIdNum = Number(user?.id ?? 0)
    const limit = Number(vip?.vipDailyTaskLimit ?? 0)
    const total = limit > 0 ? limit : tasks.length
    for (let i = 0; i < total; i += 1) {
      const base = tasks[i % tasks.length]
      // Pega o primeiro slot que mapeia para cada taskId
      if (base && map[base.id] === undefined) {
        map[base.id] = getVideoIdForSlot(userIdNum, i)
      }
    }
    return map
  }, [tasks, vip?.vipDailyTaskLimit, user?.id])

  useEffect(() => {
    if (!user?.id) return

    const loadHistory = async () => {
      setLoading(true)
      setErrorMessage('')
      try {
        const token = localStorage.getItem('token') ?? sessionStorage.getItem('token') ?? ''
        const params = new URLSearchParams()
        if (from) params.set('from', from)
        if (to) params.set('to', to)
        const url = `${API_URL}/api/mining/history/${user.id}${params.toString() ? `?${params.toString()}` : ''}`
        const response = await fetch(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (!response.ok) {
          setRecords([])
          setErrorMessage('Não foi possível carregar o histórico de trabalho.')
          return
        }
        const data = (await response.json()) as HistoryResponse
        if (!data?.ok || !Array.isArray(data.records)) {
          setRecords([])
          return
        }
        setRecords(data.records)
      } catch {
        setRecords([])
        setErrorMessage('Erro de conexão ao carregar histórico.')
      } finally {
        setLoading(false)
      }
    }

    loadHistory()
  }, [user?.id, from, to])

  // Buscar títulos reais dos vídeos via oEmbed
  useEffect(() => {
    if (records.length === 0) return

    const controller = new AbortController()
    const uniqueVideoIds = Array.from(
      new Set(
        records
          .map((r) => taskIdToVideoId[r.taskId])
          .filter((v): v is string => Boolean(v))
      )
    )

    if (uniqueVideoIds.length === 0) return

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
        // silencioso
      })

    return () => controller.abort()
  }, [records, taskIdToVideoId])

  const totals = useMemo(() => {
    const totalEarned = records.reduce((acc, r) => acc + Number(r.earnedAmount ?? 0), 0)
    const totalCompleted = records.reduce((acc, r) => acc + Number(r.completedCount ?? 0), 0)
    return { totalEarned, totalCompleted, totalRecords: records.length }
  }, [records])

  const setQuickRange = (kind: 'today' | '7d' | '30d' | 'all') => {
    const today = todayISO()
    if (kind === 'today') {
      setFrom(today)
      setTo(today)
      return
    }
    if (kind === 'all') {
      setFrom('2020-01-01')
      setTo(today)
      return
    }
    const days = kind === '7d' ? 6 : 29
    const past = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    setFrom(dateToISO(past))
    setTo(today)
  }

  if (!user) return null

  return (
    <main className="dash-app">
      <section className="dash-main">
        <AppSidebar />

        <div className="dash-content">
          <section className="rt-header" aria-label="Registros de Trabalho">
            <button
              type="button"
              className="rt-back-btn"
              onClick={() => navigate('/profile')}
              aria-label="Voltar"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M15 6l-6 6l6 6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <div className="rt-header-text">
              <h2 className="rt-title">Registros de Trabalho</h2>
              <p className="rt-subtitle">Vídeos assistidos e comissões recebidas</p>
            </div>
          </section>

          <section className="rt-summary" aria-label="Resumo de trabalho">
            <div className="rt-summary-item rt-summary-item--earn">
              <span className="rt-summary-label">Lucro total</span>
              <span className="rt-summary-value">{formatBRL(totals.totalEarned)}</span>
            </div>
            <div className="rt-summary-divider" />
            <div className="rt-summary-item">
              <span className="rt-summary-label">Trabalhos concluídos</span>
              <span className="rt-summary-value">{totals.totalCompleted}</span>
            </div>
            <div className="rt-summary-divider" />
            <div className="rt-summary-item">
              <span className="rt-summary-label">Registros</span>
              <span className="rt-summary-value">{totals.totalRecords}</span>
            </div>
          </section>

          <section className="rt-filters" aria-label="Filtros">
            <div className="rt-filter-row">
              <label className="rt-field">
                <span>De</span>
                <input
                  type="date"
                  value={from}
                  max={to || undefined}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </label>
              <label className="rt-field">
                <span>Até</span>
                <input
                  type="date"
                  value={to}
                  min={from || undefined}
                  onChange={(e) => setTo(e.target.value)}
                />
              </label>
            </div>

            <div className="rt-quick-range">
              <button type="button" onClick={() => setQuickRange('today')}>Hoje</button>
              <button type="button" onClick={() => setQuickRange('7d')}>7 dias</button>
              <button type="button" onClick={() => setQuickRange('30d')}>30 dias</button>
              <button type="button" onClick={() => setQuickRange('all')}>Tudo</button>
            </div>
          </section>

          <section className="rt-list" aria-label="Lista de trabalho">
            {loading ? (
              <div className="rt-empty">Carregando...</div>
            ) : errorMessage ? (
              <div className="rt-empty rt-error">{errorMessage}</div>
            ) : records.length === 0 ? (
              <div className="rt-empty">
                Nenhum trabalho concluído no período selecionado.
              </div>
            ) : (
              records.map((rec) => {
                const videoId = taskIdToVideoId[rec.taskId]
                const videoTitle = (videoId && videoTitles[videoId]) || rec.taskName
                const thumbUrl = videoId ? getYouTubeThumbnail(videoId) : ''

                return (
                  <article key={rec.id} className="rt-item">
                    <div className="rt-item-thumb" aria-hidden="true">
                      {thumbUrl ? (
                        <img
                          src={thumbUrl}
                          alt=""
                          loading="lazy"
                          onError={(e) => {
                            const target = e.currentTarget
                            target.onerror = null
                            target.style.display = 'none'
                          }}
                        />
                      ) : (
                        <svg viewBox="0 0 24 24">
                          <polygon points="23 7 16 12 23 17 23 7" fill="currentColor" />
                          <rect x="1" y="5" width="15" height="14" rx="2" ry="2" fill="currentColor" />
                        </svg>
                      )}
                      <span className="rt-item-thumb-badge" aria-hidden="true">
                        <svg viewBox="0 0 24 24" width="10" height="10" fill="#ff0000">
                          <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.4 31.4 0 0 0 0 12a31.4 31.4 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.4 31.4 0 0 0 24 12a31.4 31.4 0 0 0-.5-5.8zM9.5 15.6V8.4l6.3 3.6-6.3 3.6z" />
                        </svg>
                      </span>
                    </div>

                    <div className="rt-item-info">
                      <div className="rt-item-title-row">
                        <p className="rt-item-title" title={videoTitle}>
                          {videoTitle}
                        </p>
                        {rec.completedCount > 1 ? (
                          <span className="rt-item-count">×{rec.completedCount}</span>
                        ) : null}
                      </div>
                      {rec.taskDescription ? (
                        <p className="rt-item-desc">{rec.taskDescription}</p>
                      ) : null}
                      <p className="rt-item-date">
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.6" />
                          <path d="M12 7v5l3 2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                        </svg>
                        {formatDate(rec.progressDate)}
                        {rec.updatedAt ? (
                          <span className="rt-item-time-detail">
                            {' • '}{formatDateTime(rec.updatedAt)}
                          </span>
                        ) : null}
                      </p>
                    </div>

                    <div className="rt-item-amount">
                      <span className="rt-item-amount-value">
                        + {formatBRL(rec.earnedAmount)}
                      </span>
                      <span className="rt-item-amount-label">Recebido</span>
                    </div>
                  </article>
                )
              })
            )}
          </section>
        </div>
      </section>
      <AppBottomNav />
</main>
  )
}
