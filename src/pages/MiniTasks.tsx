import { useMemo, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import AppSidebar from '../components/AppSidebar'
import './Tasks.css'
import './MiniTasks.css'
import AppBottomNav from '../components/AppBottomNav'

type MiniTask = {
  id: number
  title: string
  inviteGoal: number
  reward: number
  badge: string
  isClaimed?: boolean
}

type RedeemState = Record<number, 'idle' | 'loading' | 'done'>

const formatBRL = (value: number) =>
  Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

type StoredUser = {
  id: number
  name: string
  phone: string
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

const getBadgeTheme = (badgeText: string) => {
  const normalized = String(badgeText ?? '').toLowerCase()
  if (normalized.includes('diam')) return 'diamond'
  if (normalized.includes('ouro') || normalized.includes('gold')) return 'gold'
  if (normalized.includes('prata') || normalized.includes('silver')) return 'silver'
  if (normalized.includes('bronze')) return 'bronze'
  if (normalized.includes('vip')) return 'vip'
  return 'regular'
}

function BadgeShield({ badge }: { badge: string }) {
  const theme = getBadgeTheme(badge)
  return (
    <span className={`mini-task-shield-icon mini-task-shield-${theme}`} aria-hidden="true">
      <svg viewBox="0 0 24 24">
        <path d="M12 2l7 3v6c0 5-3.4 9.3-7 11c-3.6-1.7-7-6-7-11V5l7-3z" fill="currentColor" />
        <path d="M12 6.2l3.2 1.4v3.1c0 2.3-1.3 4.5-3.2 5.7c-1.9-1.2-3.2-3.4-3.2-5.7V7.6L12 6.2z" fill="rgba(255,255,255,0.42)" />
      </svg>
      <span className={`mini-task-shield-mark mini-task-shield-mark-${theme}`} />
    </span>
  )
}

export default function MiniTasks() {
  const navigate = useNavigate()
  const [redeemState, setRedeemState] = useState<RedeemState>({})
  const [notice, setNotice] = useState<string>('')
  const [tasks, setTasks] = useState<MiniTask[]>([])
  const [badges, setBadges] = useState<string[]>([])

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
      navigate('/')
    }
  }, [navigate, user?.id])

  const fallbackTasks = useMemo<MiniTask[]>(
    () => [
      { id: 1, title: 'Convidar 30 usuários', inviteGoal: 30, reward: 10, badge: 'Bronze' },
      { id: 2, title: 'Convidar 20 usuários', inviteGoal: 20, reward: 20, badge: 'Prata' },
      { id: 3, title: 'Convidar 40 usuários', inviteGoal: 40, reward: 25, badge: 'Foco' },
      { id: 4, title: 'Convidar 50 usuários', inviteGoal: 50, reward: 35, badge: 'Meta' },
      { id: 5, title: 'Convidar 60 usuários', inviteGoal: 60, reward: 45, badge: 'Impulso' },
      { id: 6, title: 'Convidar 70 usuários', inviteGoal: 70, reward: 55, badge: 'Destaque' },
      { id: 7, title: 'Convidar 80 usuários', inviteGoal: 80, reward: 70, badge: 'Elite' },
      { id: 8, title: 'Convidar 90 usuários', inviteGoal: 90, reward: 85, badge: 'Turbo' },
      { id: 9, title: 'Convidar 100 usuários', inviteGoal: 100, reward: 100, badge: 'Mestre' },
      { id: 10, title: 'Convidar 120 usuários', inviteGoal: 120, reward: 130, badge: 'Lendário' },
    ],
    []
  )

  const loadMiniTasks = useCallback(async () => {
    const userId = Number(user?.id ?? 0)
    if (!userId || Number.isNaN(userId)) return

    const token = localStorage.getItem('token') ?? sessionStorage.getItem('token') ?? ''

    try {
      const response = await fetch(`${API_URL}/api/mini-tasks/${userId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok || data?.ok === false || !Array.isArray(data?.tasks)) {
        setTasks(fallbackTasks)
        return
      }

      const normalizedTasks: MiniTask[] = data.tasks.map((item: any) => ({
        id: Number(item?.id ?? 0),
        title: String(item?.title ?? ''),
        inviteGoal: Number(item?.inviteGoal ?? 0),
        reward: Number(item?.rewardAmount ?? item?.reward ?? 0),
        badge: String(item?.badgeLabel ?? item?.badge ?? ''),
        isClaimed: Boolean(item?.redeemed ?? item?.isClaimed),
      }))

      setTasks(normalizedTasks)

      setRedeemState((prev) => {
        const next: RedeemState = { ...prev }
        normalizedTasks.forEach((task) => {
          next[task.id] = task.isClaimed ? 'done' : (prev[task.id] === 'loading' ? 'loading' : 'idle')
        })
        return next
      })

      const earnedBadges = normalizedTasks
        .filter((task) => Boolean(task.isClaimed) && String(task.badge ?? '').trim().length > 0)
        .map((task) => String(task.badge).trim())

      setBadges(Array.from(new Set(earnedBadges)))
    } catch {
      setTasks(fallbackTasks)
    }
  }, [fallbackTasks, user?.id])

  useEffect(() => {
    loadMiniTasks()
  }, [loadMiniTasks])

  const handleRedeem = async (task: MiniTask) => {
    setNotice('')
    setRedeemState((prev) => ({ ...prev, [task.id]: 'loading' }))

    try {
      const userId = Number(user?.id ?? 0)
      if (!userId || Number.isNaN(userId)) {
        throw new Error('Usuário não autenticado.')
      }

      const token = localStorage.getItem('token') ?? sessionStorage.getItem('token') ?? ''

      const response = await fetch(`${API_URL}/api/mini-tasks/${task.id}/redeem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({}),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok || data?.ok === false) {
        throw new Error(
          data?.error ??
            'Resgate não disponível. Somente convidados nível 1 (direto do seu link) com depósito contam.'
        )
      }

      setRedeemState((prev) => ({ ...prev, [task.id]: 'done' }))
      setTasks((prev) => prev.map((item) => (item.id === task.id ? { ...item, isClaimed: true } : item)))
      if (Array.isArray(data?.badges)) {
        setBadges(
          data.badges
            .map((item: unknown) => String(item ?? '').trim())
            .filter((item: string) => item.length > 0)
        )
      } else if (task.badge) {
        setBadges((prev) => (prev.includes(task.badge) ? prev : [...prev, task.badge]))
      }
      setNotice(data?.message ?? 'Resgate realizado com sucesso.')
    } catch (err: any) {
      setRedeemState((prev) => ({ ...prev, [task.id]: 'idle' }))
      setNotice(
        err?.message ??
          'Não foi possível resgatar. Apenas convidados nível 1 depositantes são válidos.'
      )
    }
  }

  return (
    <main className="tasks-page mini-tasks-page">
      <AppSidebar />
      <header className="tasks-header">
        <div>
          <p className="tasks-kicker">Perfil</p>
          <h1>Mini tarefas</h1>
          <span className="tasks-subtitle">Complete convites e receba recompensas</span>
        </div>
        <div className="tasks-header-actions">
          <button className="btn ghost" type="button" onClick={() => navigate('/profile')}>
            Voltar
          </button>
        </div>
      </header>

      <section className="mini-tasks-hero">
        <h2>Desafios de convite</h2>
        <p>Conclua metas de convites para receber bônus em saldo.</p>
        <small className="mini-tasks-rule">
          Regra: só conta convidado nível 1 (direto do seu link) que fez depósito.
        </small>
      </section>

      {notice ? <div className="mini-tasks-notice">{notice}</div> : null}

      {badges.length > 0 ? (
        <section className="mini-tasks-earned">
          <h3>Meus emblemas</h3>
          <div className="mini-tasks-earned-list">
            {badges.map((badge) => (
              <span key={badge} className="mini-task-earned-chip">
                <BadgeShield badge={badge} />
                <span>{badge}</span>
              </span>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mini-tasks-grid">
        {tasks.map((task) => {
          const state = task.isClaimed ? 'done' : (redeemState[task.id] ?? 'idle')
          return (
            <article
              key={task.id}
              className={`mini-task-card ${state === 'done' ? 'is-done' : ''}`}
              role="article"
              aria-label={task.title}
            >
              <div className="mini-task-left">
                <span className="mini-task-index">#{task.id}</span>
                <div>
                  <h3 className="mini-task-title">{task.title}</h3>
                  <p className="mini-task-sub">Meta: {task.inviteGoal} convidados</p>
                  <span className={`mini-task-badge mini-task-badge-${getBadgeTheme(task.badge)}`} aria-label={`Emblema da tarefa ${task.id}`}>
                    <BadgeShield badge={task.badge} />
                    <span>{task.badge || 'Sem badge'}</span>
                  </span>
                </div>
              </div>
              <div className="mini-task-reward">
                <span>Recompensa</span>
                <strong>{formatBRL(task.reward)}</strong>
                {state === 'done' ? (
                  <div className={`mini-task-earned-badge mini-task-badge-${getBadgeTheme(task.badge)}`} aria-label="Tarefa resgatada">
                    <BadgeShield badge={task.badge} />
                    <span>{task.badge || 'Badge recebida'}</span>
                  </div>
                ) : null}
                <button
                  type="button"
                  className="mini-task-redeem-btn"
                  disabled={state === 'loading' || state === 'done'}
                  onClick={() => handleRedeem(task)}
                >
                  {state === 'loading' ? 'Resgatando...' : state === 'done' ? 'Resgatado' : 'Resgatar'}
                </button>
              </div>
            </article>
          )
        })}
      </section>
      <AppBottomNav />
</main>
  )
}
