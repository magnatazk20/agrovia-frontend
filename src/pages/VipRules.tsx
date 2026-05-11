import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppSidebar from '../components/AppSidebar'
import './Tasks.css'
import AppBottomNav from '../components/AppBottomNav'

type CycleProduct = {
  id: number
  name: string
  description: string
  amount: number
  profit: number
  cycleDays: number
  imageUrl: string
  planType: 'normal' | 'vip' | 'vip_day'
  requireCommissionLevel1Count: number
  requireCommissionLevel2Count: number
  requireCommissionLevel3Count: number
  stockQuantity: number
  expiresAt: string | null
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

const formatBRL = (value: number) =>
  Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const normalizePlanType = (value: unknown): 'normal' | 'vip' | 'vip_day' => {
  const raw = String(value ?? '').trim().toLowerCase()
  if (raw === 'vip') return 'vip'
  if (raw === 'vip_day') return 'vip_day'
  return 'normal'
}

const IconCrown = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 20h20M4 20L6 9l6 5l6-9l2 15" />
  </svg>
)
const IconBolt = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2L4.5 13.5H12L11 22L19.5 10.5H12L13 2Z" />
  </svg>
)
const IconMoney = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M14.8 9A2 2 0 0 0 13 8h-2a2 2 0 0 0 0 4h2a2 2 0 0 1 0 4h-2a2 2 0 0 1-1.8-1" />
    <path d="M12 7v1M12 16v1" />
  </svg>
)
const IconProfit = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </svg>
)
const IconClock = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 3" />
  </svg>
)
const IconUsers = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="7" r="3" />
    <circle cx="17" cy="9" r="2.5" />
    <path d="M3 19a6 6 0 0 1 12 0" />
    <path d="M14 16a5 5 0 0 1 7 0" />
  </svg>
)
const IconPackage = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
)

export default function VipRules() {
  const navigate = useNavigate()
  const [products, setProducts] = useState<CycleProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'vip' | 'vip_day'>('vip')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = await fetch(`${API_URL}/api/dashboard/cycle-products`)
        const data = await res.json().catch(() => ({})) as { ok?: boolean; products?: Array<Record<string, unknown>> }
        if (!res.ok || !data?.ok || !Array.isArray(data.products)) { setProducts([]); return }
        const mapped: CycleProduct[] = data.products
          .map((item) => ({
            id: Number(item.id ?? 0),
            name: String(item.name ?? ''),
            description: String(item.description ?? ''),
            amount: Number(item.amount ?? 0),
            profit: Number(item.profit ?? 0),
            cycleDays: Number(item.cycleDays ?? 0),
            imageUrl: String(item.imageUrl ?? ''),
            planType: normalizePlanType(item.planType),
            requireCommissionLevel1Count: Number(item.requireCommissionLevel1Count ?? 0),
            requireCommissionLevel2Count: Number(item.requireCommissionLevel2Count ?? 0),
            requireCommissionLevel3Count: Number(item.requireCommissionLevel3Count ?? 0),
            stockQuantity: Number(item.stockQuantity ?? 0),
            expiresAt: item.expiresAt == null ? null : String(item.expiresAt),
          }))
          .filter((p) => p.planType === 'vip' || p.planType === 'vip_day')
        setProducts(mapped)
      } catch {
        setProducts([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = products.filter((p) => p.planType === activeTab)
  const isVip = activeTab === 'vip'

  const tabGradient = isVip
    ? 'linear-gradient(120deg,#7c3aed,#a855f7)'
    : 'linear-gradient(120deg,#d97706,#f59e0b)'

  return (
    <main className="tasks-page">
      <AppSidebar />

      <header className="tasks-header">
        <div>
          <p className="tasks-kicker">VIP</p>
          <h1>Regras VIP</h1>
          <span className="tasks-subtitle">Requisitos de convite por produto VIP</span>
        </div>
        <div className="tasks-header-actions">
          <button className="btn ghost" type="button" onClick={() => navigate('/profile')}>Voltar</button>
        </div>
      </header>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: 10, padding: '0 16px 16px' }}>
        {(['vip', 'vip_day'] as const).map((tab) => {
          const active = activeTab === tab
          const tAccent = tab === 'vip' ? '#7c3aed' : '#d97706'
          const tLight  = tab === 'vip' ? '#ede9fe' : '#fef3c7'
          const tText   = tab === 'vip' ? '#4c1d95' : '#78350f'
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '12px 0',
                borderRadius: 14,
                fontWeight: 700,
                fontSize: 15,
                border: active ? `2px solid ${tAccent}` : '1.5px solid #e2e8f0',
                background: active ? tLight : '#fff',
                color: active ? tText : '#94a3b8',
                cursor: 'pointer',
                transition: 'all 160ms',
                boxShadow: active ? `0 4px 16px ${tAccent}33` : 'none',
              }}
            >
              {tab === 'vip' ? <IconCrown /> : <IconBolt />}
              {tab === 'vip' ? 'Plano VIP' : 'VIP do Dia'}
            </button>
          )
        })}
      </div>

      {/* ── Content ── */}
      <div style={{ padding: '0 16px 40px' }}>
        {loading ? (
          <div className="vip-inline-message">Carregando produtos...</div>
        ) : filtered.length === 0 ? (
          <div className="vip-inline-message">Nenhum produto disponível nesta categoria.</div>
        ) : (
          <>
            {/* ── Legenda rápida ── */}
            <div style={{
              display: 'flex',
              gap: 8,
              marginBottom: 14,
              flexWrap: 'wrap',
            }}>
              {[
                { label: 'N1', bg: '#ede9fe', border: '#c4b5fd', color: '#5b21b6', desc: 'Diretos' },
                { label: 'N2', bg: '#fef3c7', border: '#fde68a', color: '#92400e', desc: 'Indiretos' },
                { label: 'N3', bg: '#dcfce7', border: '#bbf7d0', color: '#166534', desc: 'Rede profunda' },
              ].map((r) => (
                <span key={r.label} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '5px 10px', borderRadius: 20,
                  background: r.bg, border: `1.5px solid ${r.border}`,
                  fontSize: 12, fontWeight: 700, color: r.color,
                }}>
                  <span style={{
                    width: 20, height: 20, borderRadius: 5,
                    background: r.color, color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 900,
                  }}>{r.label}</span>
                  {r.desc}
                </span>
              ))}
              <span style={{ fontSize: 12, color: '#94a3b8', display: 'flex', alignItems: 'center', marginLeft: 4 }}>
                — Indicados com depósito exigidos
              </span>
            </div>

            {/* ── Tabela ── */}
            <div style={{
              background: '#fff',
              borderRadius: 16,
              overflow: 'hidden',
              boxShadow: '0 4px 24px rgba(15,23,42,.09)',
              border: '1px solid #e2e8f0',
            }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 540 }}>
                  <thead>
                    <tr style={{ background: tabGradient }}>
                      {[
                        { icon: <IconPackage />, label: 'Produto' },
                        { icon: <IconMoney />,   label: 'Montante' },
                        { icon: <IconProfit />,  label: 'Lucro' },
                        { icon: <IconClock />,   label: 'Ciclo' },
                        { icon: <IconUsers />,   label: 'N1' },
                        { icon: <IconUsers />,   label: 'N2' },
                        { icon: <IconUsers />,   label: 'N3' },
                      ].map(({ icon, label }, i) => (
                        <th
                          key={label}
                          style={{
                            padding: i === 0 ? '14px 16px' : '14px 10px',
                            textAlign: i === 0 ? 'left' : 'center',
                            color: '#fff',
                            fontWeight: 700,
                            fontSize: 12,
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase',
                            whiteSpace: 'nowrap',
                            borderBottom: 'none',
                          }}
                        >
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                            {icon} {label}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((product, idx) => {
                      const even = idx % 2 === 0
                      const lvl1 = product.requireCommissionLevel1Count
                      const lvl2 = product.requireCommissionLevel2Count
                      const lvl3 = product.requireCommissionLevel3Count

                      const LevelBadge = ({ count, bg, border, color }: { count: number; bg: string; border: string; color: string }) =>
                        count === 0 ? (
                          <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>—</span>
                        ) : (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            minWidth: 34, height: 34,
                            borderRadius: 10,
                            background: bg,
                            border: `1.5px solid ${border}`,
                            color,
                            fontWeight: 900,
                            fontSize: 15,
                          }}>
                            {count}
                          </span>
                        )

                      return (
                        <tr
                          key={product.id}
                          style={{
                            background: even ? '#fff' : '#f8fafc',
                            borderTop: '1px solid #f1f5f9',
                            transition: 'background 120ms',
                          }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = isVip ? '#f5f3ff' : '#fffbeb' }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = even ? '#fff' : '#f8fafc' }}
                        >
                          {/* Produto */}
                          <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              {product.imageUrl ? (
                                <img
                                  src={product.imageUrl}
                                  alt={product.name}
                                  style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover', flexShrink: 0, border: '1px solid #e2e8f0' }}
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                                />
                              ) : (
                                <span style={{
                                  width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                                  background: tabGradient,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  color: '#fff',
                                }}>
                                  {isVip ? <IconCrown /> : <IconBolt />}
                                </span>
                              )}
                              <div>
                                <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', lineHeight: 1.2 }}>{product.name}</div>
                                {product.description ? (
                                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {product.description}
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </td>

                          {/* Montante */}
                          <td style={{ padding: '12px 10px', textAlign: 'center', verticalAlign: 'middle' }}>
                            <span style={{ fontWeight: 800, fontSize: 13, color: '#0f172a' }}>{formatBRL(product.amount)}</span>
                          </td>

                          {/* Lucro */}
                          <td style={{ padding: '12px 10px', textAlign: 'center', verticalAlign: 'middle' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '3px 9px', borderRadius: 20,
                              background: '#f0fdf4', border: '1px solid #bbf7d0',
                              fontWeight: 800, fontSize: 13, color: '#16a34a',
                            }}>
                              {formatBRL(product.profit)}
                            </span>
                          </td>

                          {/* Ciclo */}
                          <td style={{ padding: '12px 10px', textAlign: 'center', verticalAlign: 'middle' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '3px 9px', borderRadius: 20,
                              background: '#eff6ff', border: '1px solid #bfdbfe',
                              fontWeight: 700, fontSize: 13, color: '#2563eb',
                            }}>
                              {product.cycleDays}d
                            </span>
                          </td>

                          {/* N1 */}
                          <td style={{ padding: '12px 10px', textAlign: 'center', verticalAlign: 'middle' }}>
                            <LevelBadge count={lvl1} bg="#ede9fe" border="#c4b5fd" color="#5b21b6" />
                          </td>

                          {/* N2 */}
                          <td style={{ padding: '12px 10px', textAlign: 'center', verticalAlign: 'middle' }}>
                            <LevelBadge count={lvl2} bg="#fef3c7" border="#fde68a" color="#92400e" />
                          </td>

                          {/* N3 */}
                          <td style={{ padding: '12px 10px', textAlign: 'center', verticalAlign: 'middle' }}>
                            <LevelBadge count={lvl3} bg="#dcfce7" border="#bbf7d0" color="#166534" />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* rodapé da tabela */}
              <div style={{
                padding: '10px 16px',
                borderTop: '1px solid #f1f5f9',
                background: '#f8fafc',
                fontSize: 11,
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}>
                <IconUsers />
                N1 = indicados diretos · N2 = indicados dos seus indicados · N3 = terceiro grau · todos com depósito confirmado
              </div>
            </div>
          </>
        )}
      </div>
      <AppBottomNav />
</main>
  )
}
