import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppSidebar from '../components/AppSidebar'
import './CaixasBox.css'
import AppBottomNav from '../components/AppBottomNav'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

type StoredUser = { id: number; name: string; phone: string }

type Prize = {
  id: string
  label: string
  type: 'cash' | 'physical'
  value: number
  probability: number
  imageUrl?: string | null
}

type HistoryItem = {
  id: number
  prizeId: string
  prizeLabel: string
  prizeType: string
  prizeValue: number
  imageUrl?: string | null
  createdAt: string
}

// Imagens reais para prêmios físicos (carregadas da internet)
const PHYSICAL_IMAGES: Record<string, string> = {
  iphone: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=400&q=85&auto=format&fit=crop',
  caixa_som: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&q=80&auto=format&fit=crop',
}

// SVG de notas de Real brasileiro bem detalhadas
function BillIcon({ value, size }: { value: number; size: number }) {
  type ColorMap = Record<number, { bg: string; accent: string; light: string; dark: string }>
  const colors: ColorMap = {
    50:  { bg: '#fbbf24', accent: '#d97706', light: '#fde68a', dark: '#92400e' },
    20:  { bg: '#fca5a5', accent: '#ef4444', light: '#fee2e2', dark: '#991b1b' },
    10:  { bg: '#6ee7b7', accent: '#059669', light: '#d1fae5', dark: '#065f46' },
    5:   { bg: '#93c5fd', accent: '#3b82f6', light: '#dbeafe', dark: '#1e40af' },
    1:   { bg: '#d4d4d8', accent: '#71717a', light: '#f4f4f5', dark: '#3f3f46' },
  }
  const c = colors[value] ?? colors[1]
  const w = size * 1.7
  const h = size

  return (
    <svg width={w} height={h} viewBox="0 0 170 100" fill="none" aria-hidden="true" style={{ borderRadius: 8, display: 'block' }}>
      {/* Fundo da nota */}
      <rect width="170" height="100" rx="6" fill={c.bg} />
      {/* Padrão de fundo */}
      <rect width="170" height="100" rx="6" fill="url(#billPattern)" opacity="0.18" />
      {/* Faixa de segurança */}
      <rect x="28" y="0" width="6" height="100" fill={c.accent} opacity="0.6" />
      {/* Borda decorativa */}
      <rect x="4" y="4" width="162" height="92" rx="4" fill="none" stroke={c.dark} strokeWidth="1.2" opacity="0.5" />
      <rect x="8" y="8" width="154" height="84" rx="3" fill="none" stroke={c.accent} strokeWidth="0.6" opacity="0.4" />
      {/* Círculo central decorativo */}
      <circle cx="85" cy="50" r="22" fill={c.accent} opacity="0.12" />
      <circle cx="85" cy="50" r="16" fill={c.accent} opacity="0.15" />
      <circle cx="85" cy="50" r="10" fill={c.accent} opacity="0.2" />
      {/* Brasão simplificado */}
      <circle cx="85" cy="50" r="7" fill={c.dark} opacity="0.8" />
      <text x="85" y="54" textAnchor="middle" fill={c.light} fontSize="8" fontWeight="900" fontFamily="serif">R$</text>
      {/* Valor principal */}
      <text x="130" y="44" textAnchor="middle" fill={c.dark} fontSize="22" fontWeight="900" fontFamily="serif" opacity="0.95">{value}</text>
      {/* REAIS escrito */}
      <text x="130" y="56" textAnchor="middle" fill={c.dark} fontSize="6.5" fontWeight="700" fontFamily="sans-serif" letterSpacing="2" opacity="0.8">REAIS</text>
      {/* Valor pequeno canto superior esquerdo */}
      <text x="14" y="22" fill={c.dark} fontSize="11" fontWeight="800" fontFamily="serif" opacity="0.9">{value}</text>
      {/* Valor pequeno canto inferior esquerdo */}
      <text x="14" y="88" fill={c.dark} fontSize="11" fontWeight="800" fontFamily="serif" opacity="0.9">{value}</text>
      {/* BANCO CENTRAL DO BRASIL */}
      <text x="85" y="18" textAnchor="middle" fill={c.dark} fontSize="5" fontWeight="700" fontFamily="sans-serif" letterSpacing="0.5" opacity="0.7">BANCO CENTRAL DO BRASIL</text>
      {/* Linha decorativa inferior */}
      <rect x="42" y="78" width="86" height="2" rx="1" fill={c.dark} opacity="0.25" />
      <defs>
        <pattern id="billPattern" x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
          <circle cx="6" cy="6" r="1" fill={c.dark} />
        </pattern>
      </defs>
    </svg>
  )
}

// Ícone de moeda R$1
function CoinIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" aria-hidden="true">
      <circle cx="40" cy="40" r="38" fill="url(#coinGold)" stroke="#b45309" strokeWidth="2" />
      <circle cx="40" cy="40" r="31" fill="none" stroke="#fde68a" strokeWidth="1.5" opacity="0.6" />
      <circle cx="40" cy="40" r="24" fill="#d97706" opacity="0.3" />
      <text x="40" y="37" textAnchor="middle" fill="#7c2d12" fontSize="11" fontWeight="900" fontFamily="serif">R$</text>
      <text x="40" y="52" textAnchor="middle" fill="#7c2d12" fontSize="14" fontWeight="900" fontFamily="serif">1</text>
      <defs>
        <radialGradient id="coinGold" cx="35%" cy="30%" r="65%">
          <stop stopColor="#fde68a" />
          <stop offset="0.5" stopColor="#fbbf24" />
          <stop offset="1" stopColor="#d97706" />
        </radialGradient>
      </defs>
    </svg>
  )
}

// Ícone iPhone SVG detalhado
function IphoneIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" aria-hidden="true">
      <rect x="16" y="4" width="48" height="72" rx="10" fill="url(#iphoneBody)" />
      <rect x="18" y="6" width="44" height="68" rx="8" fill="url(#iphoneInner)" />
      <rect x="22" y="14" width="36" height="48" rx="3" fill="#0f172a" />
      {/* Câmera */}
      <circle cx="37" cy="10" r="2.5" fill="#334155" />
      <circle cx="43" cy="10" r="1.2" fill="#475569" />
      {/* Botão home */}
      <circle cx="40" cy="68" r="3.5" fill="#334155" stroke="#475569" strokeWidth="1" />
      {/* Tela com interface */}
      <rect x="24" y="16" width="32" height="44" rx="2" fill="#0ea5e9" opacity="0.9" />
      <rect x="26" y="20" width="28" height="8" rx="2" fill="rgba(255,255,255,0.2)" />
      <rect x="26" y="31" width="12" height="12" rx="3" fill="rgba(255,255,255,0.15)" />
      <rect x="41" y="31" width="13" height="12" rx="3" fill="rgba(255,255,255,0.15)" />
      <rect x="26" y="46" width="28" height="4" rx="1" fill="rgba(255,255,255,0.1)" />
      <rect x="26" y="52" width="20" height="4" rx="1" fill="rgba(255,255,255,0.1)" />
      <defs>
        <linearGradient id="iphoneBody" x1="16" y1="4" x2="64" y2="76" gradientUnits="userSpaceOnUse">
          <stop stopColor="#e2e8f0" />
          <stop offset="1" stopColor="#94a3b8" />
        </linearGradient>
        <linearGradient id="iphoneInner" x1="18" y1="6" x2="62" y2="74" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f8fafc" />
          <stop offset="1" stopColor="#cbd5e1" />
        </linearGradient>
      </defs>
    </svg>
  )
}

// Ícone Caixa de Som SVG detalhado
function SpeakerIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" aria-hidden="true">
      <rect x="8" y="8" width="64" height="64" rx="12" fill="url(#speakerBg)" />
      <rect x="10" y="10" width="60" height="60" rx="10" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
      {/* Woofer grande */}
      <circle cx="40" cy="38" r="18" fill="#0f172a" />
      <circle cx="40" cy="38" r="14" fill="#1e293b" />
      <circle cx="40" cy="38" r="9" fill="#334155" />
      <circle cx="40" cy="38" r="5" fill="#f59e0b" />
      <circle cx="40" cy="38" r="2.5" fill="#fbbf24" />
      <circle cx="40" cy="38" r="1" fill="white" opacity="0.6" />
      {/* Tweeter pequeno */}
      <circle cx="40" cy="16" r="4.5" fill="#0f172a" />
      <circle cx="40" cy="16" r="2.5" fill="#334155" />
      <circle cx="40" cy="16" r="1.2" fill="#64748b" />
      {/* Painel lateral */}
      <rect x="12" y="58" width="56" height="8" rx="4" fill="rgba(0,0,0,0.3)" />
      <circle cx="24" cy="62" r="2" fill="#f59e0b" />
      <circle cx="34" cy="62" r="2" fill="#64748b" />
      <rect x="44" y="60" width="20" height="4" rx="2" fill="#1e293b" />
      <rect x="46" y="61" width="12" height="2" rx="1" fill="#94a3b8" opacity="0.6" />
      <defs>
        <linearGradient id="speakerBg" x1="8" y1="8" x2="72" y2="72" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1e293b" />
          <stop offset="1" stopColor="#0f172a" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function PrizeIcon({ id, size = 48, imageUrl }: { id: string; size?: number; imageUrl?: string | null }) {
  const [customImgError, setCustomImgError] = useState(false)
  const [defaultImgError, setDefaultImgError] = useState(false)

  // 1. Prioridade máxima: URL personalizada definida pelo admin no banco de dados
  if (imageUrl && !customImgError) {
    return (
      <img
        src={imageUrl}
        alt={id}
        width={size}
        height={size}
        onError={() => setCustomImgError(true)}
        style={{
          objectFit: 'cover',
          borderRadius: 12,
          width: size,
          height: size,
          display: 'block',
          background: 'rgba(0,0,0,0.2)',
        }}
        aria-hidden="true"
      />
    )
  }

  // 2. Prêmios físicos com imagem padrão (Unsplash) — só se não tiver URL personalizada ou ela falhou
  if ((id === 'iphone' || id === 'caixa_som') && !defaultImgError) {
    const src = PHYSICAL_IMAGES[id]
    return (
      <img
        src={src}
        alt={id === 'iphone' ? 'iPhone' : 'Caixa de Som'}
        width={size}
        height={size}
        onError={() => setDefaultImgError(true)}
        style={{
          objectFit: 'cover',
          borderRadius: 12,
          width: size,
          height: size,
          display: 'block',
          background: 'rgba(0,0,0,0.2)',
        }}
        aria-hidden="true"
      />
    )
  }

  // 3. Fallback SVG para prêmios físicos conhecidos
  if (id === 'iphone') return <IphoneIcon size={size} />
  if (id === 'caixa_som') return <SpeakerIcon size={size} />

  // 4. Notas de dinheiro — SVG local (sem URL externa)
  if (id === 'r1') return <CoinIcon size={size} />

  const billValues: Record<string, number> = { r5: 5, r10: 10, r20: 20, r50: 50 }
  const billVal = billValues[id]
  if (billVal) {
    return (
      <div style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: 8 }}>
        <BillIcon value={billVal} size={size} />
      </div>
    )
  }

  // 5. Fallback genérico para prêmios não reconhecidos
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <circle cx="24" cy="24" r="20" fill="#6b7280" opacity="0.2" />
      <circle cx="24" cy="24" r="13" fill="#6b7280" />
      <text x="24" y="29" textAnchor="middle" fill="white" fontSize="11" fontWeight="800" fontFamily="system-ui">?</text>
    </svg>
  )
}

function BoxAnimation({ opening, onDone, prize }: { opening: boolean; onDone: () => void; prize: Prize | null }) {
  const [phase, setPhase] = useState<'idle' | 'shaking' | 'opening' | 'reveal'>('idle')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!opening) {
      setPhase('idle')
      return
    }
    setPhase('shaking')
    timerRef.current = setTimeout(() => {
      setPhase('opening')
      timerRef.current = setTimeout(() => {
        setPhase('reveal')
        timerRef.current = setTimeout(() => {
          onDone()
        }, 2200)
      }, 900)
    }, 900)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [opening, onDone])

  return (
    <div className={`cbox-animation-wrap phase-${phase}`} aria-live="polite">
      {phase !== 'reveal' ? (
        <div className={`cbox-box-svg phase-${phase}`}>
          {/* Caixa fechada */}
          <svg width="140" height="140" viewBox="0 0 140 140" fill="none">
            {/* Tampa */}
            <rect
              x="15" y="20" width="110" height="28" rx="8"
              fill="url(#lidGrad)"
              className={phase === 'opening' ? 'cbox-lid-open' : ''}
            />
            <rect x="25" y="26" width="90" height="16" rx="5" fill="rgba(255,255,255,0.12)" />
            {/* Fita na tampa */}
            <rect x="62" y="20" width="16" height="28" rx="3" fill="url(#ribbonGrad)" />
            {/* Corpo */}
            <rect x="10" y="46" width="120" height="76" rx="10" fill="url(#boxGrad)" />
            <rect x="20" y="52" width="100" height="64" rx="7" fill="rgba(255,255,255,0.06)" />
            {/* Fita no corpo */}
            <rect x="62" y="46" width="16" height="76" rx="3" fill="url(#ribbonGrad)" />
            {/* Laço */}
            <ellipse cx="70" cy="20" rx="18" ry="10" fill="none" stroke="url(#ribbonGrad)" strokeWidth="4" />
            <ellipse cx="70" cy="20" rx="10" ry="6" fill="none" stroke="url(#ribbonGrad)" strokeWidth="3" />
            {/* Estrelinhas decorativas */}
            {phase === 'shaking' && <>
              <circle cx="30" cy="35" r="3" fill="#fbbf24" opacity="0.8" className="cbox-star cbox-star-1" />
              <circle cx="110" cy="40" r="2" fill="#a78bfa" opacity="0.8" className="cbox-star cbox-star-2" />
              <circle cx="20" cy="80" r="2.5" fill="#34d399" opacity="0.7" className="cbox-star cbox-star-3" />
              <circle cx="120" cy="75" r="3" fill="#fb7185" opacity="0.8" className="cbox-star cbox-star-4" />
            </>}
            <defs>
              <linearGradient id="lidGrad" x1="15" y1="20" x2="125" y2="48" gradientUnits="userSpaceOnUse">
                <stop stopColor="#7c3aed" />
                <stop offset="1" stopColor="#4f46e5" />
              </linearGradient>
              <linearGradient id="boxGrad" x1="10" y1="46" x2="130" y2="122" gradientUnits="userSpaceOnUse">
                <stop stopColor="#6d28d9" />
                <stop offset="1" stopColor="#3730a3" />
              </linearGradient>
              <linearGradient id="ribbonGrad" x1="0" y1="0" x2="1" y2="1" gradientUnits="objectBoundingBox">
                <stop stopColor="#fbbf24" />
                <stop offset="1" stopColor="#f59e0b" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      ) : (
        <div className="cbox-reveal-wrap">
          {/* Confetes */}
          <div className="cbox-confetti-layer" aria-hidden="true">
            {Array.from({ length: 24 }).map((_, i) => (
              <span key={i} className={`cbox-confetti cbox-confetti-${(i % 8) + 1}`} />
            ))}
          </div>
          {prize && (
            <div className={`cbox-prize-card rarity-${prize.type === 'physical' ? 'legendary' : prize.value >= 20 ? 'epic' : prize.value >= 5 ? 'rare' : 'common'}`}>
              <div className="cbox-prize-icon-wrap">
                <PrizeIcon id={prize.id} size={72} imageUrl={prize.imageUrl} />
              </div>
              <p className="cbox-prize-label">{prize.label}</p>
              {prize.type === 'cash' && (
                <p className="cbox-prize-sub">Adicionado ao seu saldo!</p>
              )}
              {prize.type === 'physical' && (
                <p className="cbox-prize-sub">Entre em contato para retirar seu prêmio!</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const formatBRL = (v: number) =>
  Number(v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const formatDate = (d: string) => {
  if (!d) return ''
  return new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function CaixasBox() {
  const navigate = useNavigate()
  const user = useMemo<StoredUser | null>(() => {
    const raw = localStorage.getItem('user') ?? sessionStorage.getItem('user')
    if (!raw) return null
    try { return JSON.parse(raw) as StoredUser } catch { return null }
  }, [])
  const token = localStorage.getItem('token') ?? sessionStorage.getItem('token') ?? ''

  const [availableSpins, setAvailableSpins] = useState(0)
  const [totalEarned, setTotalEarned] = useState(0)
  const [totalUsed, setTotalUsed] = useState(0)
  const [prizes, setPrizes] = useState<Prize[]>([])
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [opening, setOpening] = useState(false)
  const [currentPrize, setCurrentPrize] = useState<Prize | null>(null)
  const [loadingOpen, setLoadingOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    if (!user?.id || !token) { navigate('/'); return }
    loadData()
  }, [user?.id])

  const loadData = async () => {
    if (!user?.id) return
    try {
      const [spinsRes, prizesRes, histRes] = await Promise.all([
        fetch(`${API_URL}/api/caixas-box/spins/${user.id}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/caixas-box/prizes`),
        fetch(`${API_URL}/api/caixas-box/history/${user.id}`, { headers: { Authorization: `Bearer ${token}` } }),
      ])
      const spinsData = await spinsRes.json() as { ok?: boolean; availableSpins?: number; totalEarned?: number; totalUsed?: number }
      const prizesData = await prizesRes.json() as { ok?: boolean; prizes?: Prize[] }
      const histData = await histRes.json() as { ok?: boolean; history?: HistoryItem[] }

      if (spinsData.ok) {
        setAvailableSpins(Number(spinsData.availableSpins ?? 0))
        setTotalEarned(Number(spinsData.totalEarned ?? 0))
        setTotalUsed(Number(spinsData.totalUsed ?? 0))
      }
      if (prizesData.ok && Array.isArray(prizesData.prizes)) setPrizes(prizesData.prizes)
      if (histData.ok && Array.isArray(histData.history)) setHistory(histData.history)
    } catch {
      setError('Erro ao carregar dados.')
    }
  }

  const handleOpen = async () => {
    if (!user?.id || availableSpins <= 0 || loadingOpen || opening) return
    setError(null)
    setLoadingOpen(true)
    setCurrentPrize(null)

    try {
      const res = await fetch(`${API_URL}/api/caixas-box/open`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId: user.id }),
      })
      const data = await res.json() as {
        ok?: boolean
        prize?: { prizeId: string; prizeLabel: string; prizeType: string; prizeValue: number; imageUrl?: string | null }
        availableSpinsAfter?: number
        error?: string
      }

      if (!res.ok || !data.ok) {
        setError(data.error ?? 'Erro ao abrir a caixa.')
        setLoadingOpen(false)
        return
      }

      const wonPrize = prizes.find((p) => p.id === data.prize?.prizeId) ?? {
        id: data.prize?.prizeId ?? 'r1',
        label: data.prize?.prizeLabel ?? 'Prêmio',
        type: (data.prize?.prizeType ?? 'cash') as 'cash' | 'physical',
        value: data.prize?.prizeValue ?? 0,
        probability: 0,
        imageUrl: data.prize?.imageUrl ?? null,
      }

      setCurrentPrize(wonPrize)
      setAvailableSpins(Number(data.availableSpinsAfter ?? 0))
      setOpening(true)
    } catch {
      setError('Erro de conexão ao abrir a caixa.')
      setLoadingOpen(false)
    }
  }

  const handleAnimationDone = () => {
    setOpening(false)
    setLoadingOpen(false)
    loadData()
  }

  const isAnimating = opening || loadingOpen

  return (
    <main className="cbox-page">
      <AppSidebar />

      <header className="cbox-header">
        <button type="button" className="cbox-back-btn" onClick={() => navigate('/profile')} aria-label="Voltar">
          <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
            <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="cbox-header-center">
          <span className="cbox-header-kicker">Recompensas</span>
          <h1 className="cbox-header-title">Caixas Box</h1>
        </div>
        <button
          type="button"
          className="cbox-history-btn"
          onClick={() => setShowHistory((v) => !v)}
          aria-label="Histórico"
        >
          <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
            <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </header>

      {/* Spins disponíveis */}
      <div className="cbox-spins-banner">
        <div className="cbox-spins-glow" aria-hidden="true" />
        <div className="cbox-spins-info">
          <span className="cbox-spins-label">Giros disponíveis</span>
          <span className="cbox-spins-count">{availableSpins}</span>
        </div>
        <div className="cbox-spins-meta">
          <span>Total ganhos: <b>{totalEarned}</b></span>
          <span>Total usados: <b>{totalUsed}</b></span>
        </div>
      </div>

      {error && (
        <div className="cbox-error" role="alert">{error}</div>
      )}

      {/* Animação da caixa */}
      <BoxAnimation opening={opening} onDone={handleAnimationDone} prize={currentPrize} />

      {/* Botão de abrir */}
      {!opening && (
        <div className="cbox-open-section">
          <button
            type="button"
            className="cbox-open-btn"
            onClick={handleOpen}
            disabled={availableSpins <= 0 || isAnimating}
          >
            {loadingOpen && !opening ? (
              <span className="cbox-spinner" />
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
                  <path d="M20 12V21H4V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M22 7H2v5h20V7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 22V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {availableSpins <= 0 ? 'Sem giros disponíveis' : 'Abrir Caixa Box'}
              </>
            )}
          </button>
          {availableSpins <= 0 && (
            <p className="cbox-no-spins-tip">
              Faça um depósito de R$50 ou mais e ganhe 1 giro na Caixa Box!
            </p>
          )}
        </div>
      )}

      {/* Prêmios possíveis */}
      <section className="cbox-prizes-section">
        <h2 className="cbox-section-title">Prêmios possíveis</h2>
        <div className="cbox-prizes-grid">
          {prizes.map((prize) => (
            <div
              key={prize.id}
              className={`cbox-prize-item rarity-${prize.type === 'physical' ? 'legendary' : prize.value >= 20 ? 'epic' : prize.value >= 5 ? 'rare' : 'common'}`}
            >
              <div className="cbox-prize-item-icon">
                <PrizeIcon id={prize.id} size={72} imageUrl={prize.imageUrl} />
              </div>
              <span className="cbox-prize-item-label">{prize.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Histórico */}
      {showHistory && (
        <section className="cbox-history-section">
          <h2 className="cbox-section-title">Histórico de aberturas</h2>
          {history.length === 0 ? (
            <p className="cbox-empty">Você ainda não abriu nenhuma caixa.</p>
          ) : (
            <div className="cbox-history-list">
              {history.map((item) => (
                <div key={item.id} className="cbox-history-item">
                  <div className="cbox-history-icon">
                    <PrizeIcon
                      id={item.prizeId}
                      size={44}
                      imageUrl={prizes.find((p) => p.id === item.prizeId)?.imageUrl ?? item.imageUrl}
                    />
                  </div>
                  <div className="cbox-history-info">
                    <span className="cbox-history-label">{item.prizeLabel}</span>
                    <span className="cbox-history-date">{formatDate(item.createdAt)}</span>
                  </div>
                  {item.prizeType === 'cash' && (
                    <span className="cbox-history-value">{formatBRL(item.prizeValue)}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}
      <AppBottomNav />
</main>
  )
}
