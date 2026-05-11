import { useLocation, Outlet } from 'react-router-dom'
import VipHeader from './VipHeader'
import AppBottomNav from './AppBottomNav' // será criado depois
import './Layout.css' // novo CSS se necessário

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Início',
  '/vip': 'Planos VIP',
  '/tasks': 'Trabalho',
  '/profile': 'Perfil',
  '/invite': 'Convidar',
  '/cashin': 'Depositar',
  '/saque': 'Saque',
  '/gift-vouchers': 'Vale-presentes',
  '/mini-tasks': 'Mini tarefas',
  '/cycle-products': 'Fundo de Riqueza',
  '/monthly-salary': 'Salário Mensal',
  '/team-report': 'Relatório da Equipe',
  '/bank-cards': 'Cartões Bancários',
  '/roleta': 'Roleta',
  '/sinuca': 'Sinuca',
  '/community': 'Comunidade',
  '/checkin': 'Check-in',
  '/team-expansion': 'Expansão da Equipe',
  '/registros-tarefas': 'Registros de Tarefas',
  '/registro-do-dia': 'Registro do Dia',
  // adicionar mais conforme necessário
  '/adf': 'Admin Dashboard',
  '/adf/users': 'Usuários',
  // admin...
}

export default function Layout({ children }: { children?: React.ReactNode }) {
  const location = useLocation()
  const title = PAGE_TITLES[location.pathname as keyof typeof PAGE_TITLES] || 'Página'

  return (
    <main className="vip-app-layout">
      <VipHeader title={title} />
      <div className="vip-content-shell">
        <Outlet />
      </div>
      <AppBottomNav />
    </main>
  )
}
