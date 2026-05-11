import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import './Roleta.css'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

const DEFAULT_PRIZES = ['1 BRL', '16 BRL', '35 BRL', '50 BRL', '73 BRL', '90 BRL', '183 BRL', '16600 BRL']

const WINNERS_SEED = [
  { phone: '****15658', amount: '35 BRL' },
  { phone: '****38633', amount: '73 BRL' },
  { phone: '****00277', amount: '183 BRL' },
  { phone: '****13231', amount: '35 BRL' },
  { phone: '****99044', amount: '16600 BRL' },
  { phone: '****60030', amount: '16 BRL' },
]

type RedeemModal =
  | { type: 'success'; code: string; spinsAdded: number; availableSpins: number }
  | { type: 'error'; message: string }
  | null

export default function Roleta() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [prizes, setPrizes] = useState<string[]>(DEFAULT_PRIZES)
  const [isSpinning, setIsSpinning] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [winner, setWinner] = useState<string | null>(null)
  const [, setMyWins] = useState<Array<{ amount: string; at: string }>>([])
  const [, setLiveWinners] = useState(WINNERS_SEED)
  const [remainingSpins, setRemainingSpins] = useState(0)
  const [redeemModal, setRedeemModal] = useState<RedeemModal>(null)
  const [celebration, setCelebration] = useState<{ amount: string } | null>(null)

  // Guard: chave do último resgate tentado — evita duplo disparo se o codeFromUrl mudar por re-render
  const redeemedCodeRef = useRef<string | null>(null)
  // Ref para prizes usado no timer (evita prizes no dep array do effect de dados)
  const prizesRef = useRef<string[]>(DEFAULT_PRIZES)

  const segmentAngle = 360 / prizes.length
  const codeFromUrl = (searchParams.get('codigo') ?? '').trim().toUpperCase()

  // ── Effect 1: carrega segmentos da roda (roda 1x só)
  useEffect(() => {
    fetch(`${API_URL}/api/roleta/segments`)
      .then((r) => r.json())
      .then((data: { ok?: boolean; segments?: string[] }) => {
        if (data?.ok && Array.isArray(data.segments) && data.segments.length > 0) {
          setPrizes(data.segments)
          prizesRef.current = data.segments
        }
      })
      .catch(() => {})
  }, [])

  // ── Effect 2: resgate do código da URL
  useEffect(() => {
    if (!codeFromUrl) {
      redeemedCodeRef.current = null
      return
    }

    // Lê token e user do storage
    const rawToken = localStorage.getItem('token') ?? sessionStorage.getItem('token')
    const rawUser = localStorage.getItem('user') ?? sessionStorage.getItem('user')

    if (!rawToken || !rawUser) {
      // Não está logado — salva a URL atual e redireciona para login
      const returnTo = `/roleta?codigo=${encodeURIComponent(codeFromUrl)}`
      sessionStorage.setItem('loginReturnTo', returnTo)
      navigate('/', { replace: true })
      return
    }

    let userId = 0
    try {
      const parsed = JSON.parse(rawUser) as { id?: number | string }
      userId = Number(parsed?.id ?? 0)
    } catch {
      const returnTo = `/roleta?codigo=${encodeURIComponent(codeFromUrl)}`
      sessionStorage.setItem('loginReturnTo', returnTo)
      navigate('/', { replace: true })
      return
    }

    if (!userId || Number.isNaN(userId)) {
      const returnTo = `/roleta?codigo=${encodeURIComponent(codeFromUrl)}`
      sessionStorage.setItem('loginReturnTo', returnTo)
      navigate('/', { replace: true })
      return
    }

    // Evita disparar duas vezes para o mesmo código+usuário
    const attemptKey = `${userId}:${codeFromUrl}`
    if (redeemedCodeRef.current === attemptKey) return
    redeemedCodeRef.current = attemptKey

    fetch(`${API_URL}/api/roleta/redeem-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${rawToken}`,
      },
      body: JSON.stringify({ userId, code: codeFromUrl }),
    })
      .then((res) =>
        res.json().then((data: { ok?: boolean; error?: string; spinsAdded?: number; availableSpins?: number }) => ({
          ok: res.ok,
          data,
        }))
      )
      .then(({ ok, data }) => {
        if (ok && data?.ok) {
          const spinsAdded = Number(data.spinsAdded ?? 1)
          const availableSpins = Number(data.availableSpins ?? 0)
          setRemainingSpins(availableSpins)
          setRedeemModal({ type: 'success', code: codeFromUrl, spinsAdded, availableSpins })
          setSearchParams((prev) => {
            const next = new URLSearchParams(prev.toString())
            next.delete('codigo')
            return next
          }, { replace: true })
        } else {
          const raw = String(data?.error ?? '').trim()
          const lower = raw.toLowerCase()
          let msg: string
          if (lower.includes('já resgatou') || lower.includes('já foi resgatado')) {
            msg = 'Você já resgatou este código anteriormente.'
          } else if (lower.includes('limite máximo')) {
            msg = 'Este código já atingiu o limite máximo de usos.'
          } else if (lower.includes('inativo')) {
            msg = 'Este código está inativo.'
          } else if (lower.includes('não encontrado') || lower.includes('invalido') || lower.includes('inválido')) {
            msg = 'Código inválido ou não encontrado.'
          } else {
            msg = raw || 'Não foi possível resgatar o código da roleta.'
          }
          setRedeemModal({ type: 'error', message: msg })
        }
      })
      .catch(() => {
        setRedeemModal({ type: 'error', message: 'Erro de conexão ao resgatar o código.' })
      })
  }, [codeFromUrl, setSearchParams])

  // ── Effect 3: carrega giros/vitórias e timer de winners (não depende de prizes)
  useEffect(() => {
    const rawUser = localStorage.getItem('user') ?? sessionStorage.getItem('user')
    const parsed = rawUser ? (JSON.parse(rawUser) as { id?: number }) : null
    const userId = Number(parsed?.id ?? 0)

    let cancelled = false

    if (userId && !Number.isNaN(userId)) {
      const loadData = async () => {
        try {
          const [winsRes, spinsRes] = await Promise.all([
            fetch(`${API_URL}/api/roleta/spins/${userId}?limit=20`),
            fetch(`${API_URL}/api/roleta/spins-available/${userId}`),
          ])

          if (!cancelled && winsRes.ok) {
            const d = await winsRes.json() as { ok?: boolean; spins?: Array<{ prizeLabel?: string; createdAt?: string }> }
            if (d?.ok && Array.isArray(d.spins)) {
              setMyWins(d.spins.map((s) => ({
                amount: String(s.prizeLabel ?? ''),
                at: s.createdAt ? new Date(s.createdAt).toLocaleString('pt-BR') : new Date().toLocaleString('pt-BR'),
              })))
            }
          }

          if (!cancelled && spinsRes.ok) {
            const d = await spinsRes.json() as { ok?: boolean; availableSpins?: number }
            if (d?.ok) setRemainingSpins(Number(d.availableSpins ?? 0))
          }
        } catch { /* noop */ }
      }
      loadData()
    }

    // Timer de live winners usa prizesRef (não coloca prizes no dep array)
    const timer = window.setInterval(() => {
      const list = prizesRef.current
      setLiveWinners((prev) => {
        const randomPhone = `****${Math.floor(10000 + Math.random() * 89999)}`
        const randomAmount = list[Math.floor(Math.random() * list.length)]
        return [{ phone: randomPhone, amount: randomAmount }, ...prev].slice(0, 18)
      })
    }, 1800)

    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, []) // roda 1x só

  const wheelStyle = useMemo(() => {
    const colors = [
      '#4caf50', '#81c784', '#a5d6a7', '#c8e6c9',
      '#2e7d32', '#66bb6a', '#388e3c', '#b9f6ca',
      '#4caf50', '#81c784', '#a5d6a7', '#c8e6c9',
    ]
    const stops = prizes.map((_, i) => {
      const start = i * segmentAngle
      const end = start + segmentAngle
      return `${colors[i % colors.length]} ${start}deg ${end}deg`
    }).join(', ')
    return {
      background: `conic-gradient(${stops})`,
      transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
    }
  }, [rotation, segmentAngle, prizes])

  const spin = async () => {
    if (isSpinning || remainingSpins <= 0) return
    setIsSpinning(true)
    setWinner(null)

    try {
      const rawToken = localStorage.getItem('token') ?? sessionStorage.getItem('token')
      const rawUser = localStorage.getItem('user') ?? sessionStorage.getItem('user')
      if (!rawUser || !rawToken) { setIsSpinning(false); return }

      const parsed = JSON.parse(rawUser) as { id?: number }
      const userId = Number(parsed?.id)
      if (!userId || Number.isNaN(userId)) { setIsSpinning(false); return }

      const response = await fetch(`${API_URL}/api/roleta/spin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${rawToken}`,
        },
        body: JSON.stringify({ userId }),
      })

      const data = await response.json() as {
        ok?: boolean
        spin?: { prizeLabel?: string; prizeIndex?: number; centerAngle?: number; segmentCount?: number; createdAt?: string }
        availableSpinsAfter?: number
      }

      if (!response.ok || !data?.ok || !data.spin) { setIsSpinning(false); return }

      const prizeLabel = String(data.spin.prizeLabel ?? prizes[0])
      const prizeIndex = Number(data.spin.prizeIndex ?? 0)

      // O conic-gradient começa no topo (0°) e vai no sentido horário.
      // Quando a roda rotaciona +R graus (CSS rotate), o ponto que fica sob o
      // ponteiro (topo) é aquele que estava em (360 - R % 360)° no gradiente.
      // Para o centro do segmento vencedor (centerAngle) ficar no topo:
      //   R % 360 = 360 - centerAngle
      const centerAngle = prizeIndex * segmentAngle + segmentAngle / 2
      const targetMod = (360 - centerAngle + 360) % 360
      const currentMod = rotation % 360
      let delta = targetMod - currentMod
      if (delta <= 0) delta += 360
      const finalRotation = rotation + delta + 1800

      setRotation(finalRotation)

      setTimeout(() => {
        setWinner(prizeLabel)
        setCelebration({ amount: prizeLabel })
        window.setTimeout(() => setCelebration(null), 3200)
        setMyWins((prev) => [
          { amount: prizeLabel, at: data.spin?.createdAt ? new Date(data.spin.createdAt).toLocaleString('pt-BR') : new Date().toLocaleString('pt-BR') },
          ...prev,
        ])
        if (typeof data.availableSpinsAfter === 'number') {
          setRemainingSpins(Number(data.availableSpinsAfter))
        } else {
          setRemainingSpins((prev) => Math.max(prev - 1, 0))
        }
        setIsSpinning(false)
      }, 4700)
    } catch {
      setIsSpinning(false)
    }
  }

  const closeRedeemModal = () => {
    setRedeemModal(null)
    redeemedCodeRef.current = null
    if (searchParams.get('codigo')) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev.toString())
        next.delete('codigo')
        return next
      }, { replace: true })
    }
  }

  return (
    <main className="roleta-pro">

      {/* ── Modal de sucesso no resgate ── */}
      {redeemModal?.type === 'success' ? (
        <div
          className="redeem-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="redeem-success-title"
          onClick={closeRedeemModal}
        >
          <div className="redeem-modal redeem-modal--success" onClick={(e) => e.stopPropagation()}>
            <div className="redeem-modal-icon">🎉</div>
            <h2 id="redeem-success-title">Código Resgatado!</h2>
            <p className="redeem-modal-code">
              <span>Código:</span> <strong>{redeemModal.code}</strong>
            </p>
            <p className="redeem-modal-reward">
              Você ganhou <strong>{redeemModal.spinsAdded} giro{redeemModal.spinsAdded > 1 ? 's' : ''}</strong> na roleta!
            </p>
            <p className="redeem-modal-spins">
              Giros disponíveis: <strong>{redeemModal.availableSpins}</strong>
            </p>
            <button type="button" className="redeem-modal-btn redeem-modal-btn--success" onClick={closeRedeemModal}>
              Jogar Agora!
            </button>
          </div>
        </div>
      ) : null}

      {/* ── Modal de erro no resgate ── */}
      {redeemModal?.type === 'error' ? (
        <div
          className="redeem-modal-overlay"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="redeem-error-title"
          onClick={closeRedeemModal}
        >
          <div className="redeem-modal redeem-modal--error" onClick={(e) => e.stopPropagation()}>
            <div className="redeem-modal-icon">❌</div>
            <h2 id="redeem-error-title">Erro ao Resgatar</h2>
            <p className="redeem-modal-message">{redeemModal.message}</p>
            <button type="button" className="redeem-modal-btn redeem-modal-btn--error" onClick={closeRedeemModal}>
              Fechar
            </button>
          </div>
        </div>
      ) : null}

      {/* ── Modal de celebração (prêmio ganho) ── */}
      {celebration ? (
        <div className="roleta-celebration" role="status" aria-live="polite">
          <div className="roleta-celebration-card">
            <div className="roleta-confetti" />
            <h2>🎉 Parabéns! 🎉</h2>
            <p>Você ganhou <strong>{celebration.amount}</strong> na roleta!</p>
          </div>
        </div>
      ) : null}

      <div className="roleta-wrap">
        <header className="roleta-head">
          <button className="roleta-back-btn" onClick={() => navigate('/dashboard')} type="button">←</button>
          <div className="roleta-head-spacer" />
        </header>

        <section className="wheel-stage">
          {/* LED lights */}
          <div className="wheel-leds" aria-hidden="true">
            {Array.from({ length: 36 }).map((_, i) => {
              const angle = i * (360 / 36)
              const rad = (angle * Math.PI) / 180
              const r = 48
              const left = 50 + r * Math.sin(rad)
              const top = 50 - r * Math.cos(rad)
              return (
                <span
                  key={`led-${i}`}
                  className="wheel-led"
                  style={{
                    left: `${left}%`,
                    top: `${top}%`,
                    animationDelay: `${(i % 6) * 0.1}s`,
                  }}
                />
              )
            })}
          </div>

          {/* Decorative stars */}
          <div className="wheel-leds" aria-hidden="true">
            {Array.from({ length: 12 }).map((_, i) => {
              const angle = i * (360 / 12) + 15
              const rad = (angle * Math.PI) / 180
              const r = 52
              const left = 50 + r * Math.sin(rad)
              const top = 50 - r * Math.cos(rad)
              return (
                <span
                  key={`star-${i}`}
                  className="wheel-star"
                  style={{
                    left: `${left}%`,
                    top: `${top}%`,
                    animationDelay: `${(i % 3) * 0.4}s`,
                  }}
                >
                  ✦
                </span>
              )
            })}
          </div>

          {/* Metallic outer ring */}
          <div className="wheel-outer-ring" />

          {/* Gold indicator */}
          <div className="wheel-ball-indicator" />

          {/* Disc */}
          <div className="wheel-disc" style={wheelStyle}>
            {prizes.map((text, i) => {
              const angle = i * segmentAngle + segmentAngle / 2
              const rad = (angle * Math.PI) / 180
              return (
                <div
                  key={`${text}-${i}`}
                  className="wheel-label"
                  style={{
                    left: `${50 + 34 * Math.sin(rad)}%`,
                    top: `${50 - 34 * Math.cos(rad)}%`,
                    transform: `translate(-50%, -50%) rotate(${angle}deg)`,
                  }}
                >
                  {text}
                </div>
              )
            })}
            {prizes.map((_, i) => (
              <span
                key={`line-${i}`}
                className="wheel-line"
                style={{ transform: `translate(-50%, -100%) rotate(${i * segmentAngle}deg)` }}
              />
            ))}
          </div>

          <button className="wheel-center-btn" disabled>{remainingSpins}</button>

          {/* Wheel base/stand */}
          <div className="wheel-base">
            <div className="wheel-base-top" />
            <div className="wheel-base-leg">
              <div className="wheel-leg" />
              <div className="wheel-leg" />
            </div>
            <div className="wheel-base-foot">
              <div className="wheel-foot" />
              <div className="wheel-foot" />
            </div>
          </div>
        </section>

        <section className="spin-cta">
          <button
            type="button"
            onClick={spin}
            disabled={isSpinning || remainingSpins <= 0}
            className={remainingSpins > 0 && !isSpinning ? 'ready' : ''}
          >
            {isSpinning ? 'Girando...' : 'Girar Roleta'}
          </button>
          {winner ? <p className="winner-text">Resultado: {winner}</p> : null}
        </section>

        <section className="rules-card" aria-label="Regras da roleta">
          <h2 className="rules-card__title">Informativo</h2>

          <ol className="rules-card__list">
            <li>
              <strong>Como ganhar giros:</strong> A cada usuário que depositar através do seu link, você receberá 1 giro.

            </li>
            <li>
              <strong>Como ganhar giros:</strong> Quanto mais você convida, mais giros você ganhará.

            </li>
          </ol>
        </section>
      </div>
    </main>
  )
}
