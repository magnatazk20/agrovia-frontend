import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

type AdminUser = {
  id?: number
  name?: string
  phone?: string
}

type AdminUsersResponse = {
  ok?: boolean
  users?: Array<{ id?: number; name?: string; phone?: string }>
}

export default function AdminSidebar() {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const user = useMemo(() => {
    const raw = localStorage.getItem('user') ?? sessionStorage.getItem('user')
    if (!raw) return null
    try {
      return JSON.parse(raw) as AdminUser
    } catch {
      return null
    }
  }, [])

  const [usersCount, setUsersCount] = useState<number | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token') ?? sessionStorage.getItem('token') ?? ''
    const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

    const loadUsersCount = async () => {
      try {
        const res = await fetch(`${API_URL}/api/admin/users`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        const data = (await res.json()) as AdminUsersResponse
        if (!res.ok || !data?.ok || !Array.isArray(data?.users)) {
          setUsersCount(null)
          return
        }
        setUsersCount(data.users.length)
      } catch {
        setUsersCount(null)
      }
    }

    loadUsersCount()
  }, [])

  const usersLabel = usersCount == null ? 'Usuários' : `Usuários (${usersCount})`

  return (
    <>
      <header className="admin-mobile-topbar">
        <button
          type="button"
          className="menu-toggle"
          aria-label="Abrir menu admin"
          onClick={() => setMenuOpen(true)}
        >
          ☰
        </button>
        <div className="admin-mobile-user">
          <strong>Admin</strong>
          <small>{user?.name ?? 'Administrador'}</small>
        </div>
      </header>

      {menuOpen ? (
        <button
          type="button"
          className="dash-overlay"
          aria-label="Fechar menu admin"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}

      <aside className={`dash-sidebar admin-dash-sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="dash-brand">
          <div className="brand-logo">A</div>
          <div>
            <strong>Admin Panel</strong>
            <small>{user?.name ?? 'Administrador'}</small>
          </div>
        </div>

        <div className="admin-dash-user-chip">
          <span>{user?.phone ?? '-'}</span>
        </div>

        <nav className="dash-nav">
          <p className="dash-nav-group-title">Visão Geral</p>
          <button type="button" className="dash-nav-item" onClick={() => { navigate('/adf'); setMenuOpen(false) }}>Dashboard Admin</button>

          <p className="dash-nav-group-title">Usuários e Rede</p>
          <button type="button" className="dash-nav-item" onClick={() => { navigate('/adf/users'); setMenuOpen(false) }}>{usersLabel}</button>
          <button type="button" className="dash-nav-item" onClick={() => { navigate('/adf/rankings'); setMenuOpen(false) }}>Rankings</button>

          <p className="dash-nav-group-title">Saques</p>
          <button type="button" className="dash-nav-item" onClick={() => { navigate('/adf/withdraw-config'); setMenuOpen(false) }}>Configuração de Saque</button>
          <button type="button" className="dash-nav-item" onClick={() => { navigate('/adf/withdrawals/users'); setMenuOpen(false) }}>Saques Usuários</button>
          <button type="button" className="dash-nav-item" onClick={() => { navigate('/adf/withdrawals/pending'); setMenuOpen(false) }}>Saques Pendentes</button>

          <p className="dash-nav-group-title">Depósitos e Comissão</p>
          <button type="button" className="dash-nav-item" onClick={() => { navigate('/adf/deposits'); setMenuOpen(false) }}>Depósitos</button>
          <button type="button" className="dash-nav-item" onClick={() => { navigate('/adf/deposit-config'); setMenuOpen(false) }}>Configuração de Depósitos</button>
          <button type="button" className="dash-nav-item" onClick={() => { navigate('/adf/commission-config'); setMenuOpen(false) }}>Configuração de Comissão</button>
          <button type="button" className="dash-nav-item" onClick={() => { navigate('/adf/monthly-salary'); setMenuOpen(false) }}>Salário Mensal</button>

          <p className="dash-nav-group-title">Promoções</p>
          <button type="button" className="dash-nav-item" onClick={() => { navigate('/adf/gift-codes'); setMenuOpen(false) }}>Gift Codes</button>
          <button type="button" className="dash-nav-item" onClick={() => { navigate('/adf/roulette-code'); setMenuOpen(false) }}>Código da Roleta</button>
          <button type="button" className="dash-nav-item" onClick={() => { navigate('/adf/roulette-probabilities'); setMenuOpen(false) }}>Probabilidades da Roleta</button>
          <button type="button" className="dash-nav-item" onClick={() => { navigate('/adf/caixas-box'); setMenuOpen(false) }}>Caixas Box</button>
          <button type="button" className="dash-nav-item" onClick={() => { navigate('/adf/cycle-products'); setMenuOpen(false) }}>Produtos (Cycle)</button>
          <button type="button" className="dash-nav-item" onClick={() => { navigate('/adf/mini-tasks'); setMenuOpen(false) }}>Mini Tasks</button>

          <p className="dash-nav-group-title">Sistema</p>
          <button type="button" className="dash-nav-item" onClick={() => { navigate('/adf/site-branding'); setMenuOpen(false) }}>Título e Foto do Site</button>
          <button type="button" className="dash-nav-item" onClick={() => { navigate('/adf/telegram-config'); setMenuOpen(false) }}>Bot Telegram</button>
          <button type="button" className="dash-nav-item" onClick={() => { navigate('/adf/community-links'); setMenuOpen(false) }}>Links da Comunidade</button>
          <button type="button" className="dash-nav-item" onClick={() => { navigate('/adf/logs'); setMenuOpen(false) }}>Logs</button>
          <button type="button" className="dash-nav-item" onClick={() => { navigate('/adf/security-logs'); setMenuOpen(false) }}>🛡️ Logs de Segurança</button>
          <button type="button" className="dash-nav-item" onClick={() => { navigate('/adf/correction-logs'); setMenuOpen(false) }}>🔧 Correções de Saldo</button>
        </nav>

        <button
          type="button"
          className="dash-logout side"
          onClick={() => {
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            sessionStorage.removeItem('token')
            sessionStorage.removeItem('user')
            navigate('/')
          }}
        >
          Sair
        </button>
      </aside>
    </>
  )
}
