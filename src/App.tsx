import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Roleta from './pages/Roleta'
import RoletaTestAutoSpin from './pages/RoletaTestAutoSpin'
import Sinuca from './pages/Sinuca'
import CashIn from './pages/CashIn'
import CashInCheckout from './pages/CashInCheckout'
import Tasks from './pages/Tasks'
import MiningTask from './pages/MiningTask'
import Vip from './pages/Vip'
import VipCheckout from './pages/VipCheckout'
import Invite from './pages/Invite'
import Profile from './pages/Profile'
import InvestmentOrders from './pages/InvestmentOrders'
import BankCards from './pages/BankCards'
import TeamReport from './pages/TeamReport'
import Position from './pages/Position'
import Checkin from './pages/Checkin'
import NotFound from './pages/NotFound'
import Community from './pages/Community'
import TaxDeclaration from './pages/TaxDeclaration'
import WithdrawPassword from './pages/WithdrawPassword'
import ChangePassword from './pages/ChangePassword'
import Withdraw from './pages/Withdraw'
import WithdrawReceipt from './pages/WithdrawReceipt'
import GiftVouchers from './pages/GiftVouchers'
import RedeemCode from './pages/RedeemCode'
import CaixasBox from './pages/CaixasBox'
import CycleProducts from './pages/CycleProducts'
import CycleProductDetail from './pages/CycleProductDetail'
import MiniTasks from './pages/MiniTasks'
import VipRules from './pages/VipRules'
import Statement from './pages/Statement'
import Manual from './pages/Manual'
import MonthlySalary from './pages/MonthlySalary'
import RegistroDoDia from './pages/RegistroDoDia'
import RegistrosTarefas from './pages/RegistrosTarefas'
import TeamExpansion from './pages/TeamExpansion'
import Admin from './pages/Admin'
import AdminUsers from './pages/AdminUsers'
import AdminUserDetails from './pages/AdminUserDetails'
import AdminUserHistory from './pages/AdminUserHistory'
import AdminWithdrawConfig from './pages/AdminWithdrawConfig'
import AdminRankings from './pages/AdminRankings'
import AdminLogs from './pages/AdminLogs'
import AdminSecurityLogs from './pages/AdminSecurityLogs'
import AdminPendingWithdrawals from './pages/AdminPendingWithdrawals'
import AdminUserWithdrawals from './pages/AdminUserWithdrawals'
import AdminRouletteCode from './pages/AdminRouletteCode'
import AdminGiftCode from './pages/AdminGiftCode'
import AdminDeposits from './pages/AdminDeposits'
import AdminDepositConfig from './pages/AdminDepositConfig'
import AdminCommissionConfig from './pages/AdminCommissionConfig'
import AdminTelegramConfig from './pages/AdminTelegramConfig'
import AdminCycleProducts from './pages/AdminCycleProducts'
import AdminMonthlySalary from './pages/AdminMonthlySalary'
import AdminSiteBranding from './pages/AdminSiteBranding'
import AdminCommunityLinks from './pages/AdminCommunityLinks'
import AdminMiniTasks from './pages/AdminMiniTasks'
import AdminRouletteProbabilities from './pages/AdminRouletteProbabilities'
import AdminCaixasBox from './pages/AdminCaixasBox'
import AdminShopProducts from './pages/AdminShopProducts'
import AdminCorrectionLogs from './pages/AdminCorrectionLogs'
import AdminVipLevels from './pages/AdminVipLevels'
import AdminTaskCommissions from './pages/AdminTaskCommissions'
import AdminVipRefunds from './pages/AdminVipRefunds'
import AdminVipPhotos from './pages/AdminVipPhotos'
import About from './pages/About'
import Introduction from './pages/Introduction'
import ProtectedLayout from './components/ProtectedLayout'
import AdminProtectedLayout from './components/AdminProtectedLayout'
import RequireAuth from './components/RequireAuth'
import RequireMaxAdmin from './components/RequireMaxAdmin'
import './App.css'
import './components/Layout.css'

export default function App() {
  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'
    const sendHeartbeat = () => {
      try {
        const raw = localStorage.getItem('user') ?? sessionStorage.getItem('user')
        if (!raw) return // nao envia se nao estiver logado
        const userId = String((JSON.parse(raw) as { id?: unknown })?.id ?? '')
        if (!userId || userId === '0') return // nao envia se nao tiver userId valido
        fetch(`${API_URL}/api/presence/heartbeat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        }).catch(() => {})
      } catch {
        // silencioso
      }
    }
    sendHeartbeat()
    const interval = setInterval(sendHeartbeat, 30_000)
    return () => clearInterval(interval)
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/cadastro" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/roleta" element={<Roleta />} />
        <Route path="/roleta-test" element={<RoletaTestAutoSpin />} />
        <Route path="/sinuca" element={<Sinuca />} />
        <Route path="/cashin" element={<CashIn />} />
        <Route path="/cashin/checkout" element={<CashInCheckout />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/tasks/mining/:taskId" element={<MiningTask />} />
        <Route path="/vip" element={<Vip />} />
        <Route path="/vip/checkout/:id" element={<VipCheckout />} />
        <Route path="/about" element={<About />} />
        <Route path="/introducao" element={<Introduction />} />
        <Route path="/invite" element={<Invite />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/mini-tasks" element={<MiniTasks />} />
        <Route path="/vip-rules" element={<VipRules />} />
        <Route path="/statement" element={<Statement />} />
        <Route path="/manual" element={<Manual />} />
        <Route path="/investment-orders" element={<InvestmentOrders />} />
        <Route
          path="/monthly-salary"
          element={(
            <RequireAuth>
              <MonthlySalary />
            </RequireAuth>
          )}
        />
        <Route
          path="/salario-mensal"
          element={(
            <RequireAuth>
              <MonthlySalary />
            </RequireAuth>
          )}
        />
        <Route path="/bank-cards" element={<BankCards />} />
        <Route
          path="/registro-do-dia"
          element={(
            <RequireAuth>
              <RegistroDoDia />
            </RequireAuth>
          )}
        />
        <Route
          path="/registros-tarefas"
          element={(
            <RequireAuth>
              <RegistrosTarefas />
            </RequireAuth>
          )}
        />
        <Route path="/team-report" element={<TeamReport />} />
        <Route
          path="/team-expansion"
          element={(
            <RequireAuth>
              <TeamExpansion />
            </RequireAuth>
          )}
        />
        <Route path="/position" element={<Position />} />
        <Route path="/checkin" element={<Checkin />} />
        <Route path="/community" element={<Community />} />
        <Route path="/tax-declaration" element={<TaxDeclaration />} />
        <Route path="/withdraw-password" element={<WithdrawPassword />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route
          path="/envelope"
          element={(
            <RequireAuth>
              <GiftVouchers />
            </RequireAuth>
          )}
        />
        <Route
          path="/gift-vouchers"
          element={(
            <RequireAuth>
              <GiftVouchers />
            </RequireAuth>
          )}
        />
        <Route
          path="/redeem-code"
          element={(
            <RequireAuth>
              <RedeemCode />
            </RequireAuth>
          )}
        />
        <Route
          path="/caixas-box"
          element={(
            <RequireAuth>
              <CaixasBox />
            </RequireAuth>
          )}
        />
        <Route
          path="/cycle-products"
          element={(
            <RequireAuth>
              <CycleProducts />
            </RequireAuth>
          )}
        />
        <Route
          path="/ciclo/:id"
          element={(
            <RequireAuth>
              <CycleProductDetail />
            </RequireAuth>
          )}
        />
        <Route
          path="/saque"
          element={(
            <RequireAuth>
              <Withdraw />
            </RequireAuth>
          )}
        />
        <Route
          path="/saque/comprovante"
          element={(
            <RequireAuth>
              <WithdrawReceipt />
            </RequireAuth>
          )}
        />
        <Route
          path="/adf"
          element={(
            <RequireMaxAdmin>
              <Admin />
            </RequireMaxAdmin>
          )}
        />
        <Route
          path="/adf/users"
          element={(
            <RequireMaxAdmin>
              <AdminUsers />
            </RequireMaxAdmin>
          )}
        />
        <Route
          path="/adf/users/:id"
          element={(
            <RequireMaxAdmin>
              <AdminUserDetails />
            </RequireMaxAdmin>
          )}
        />
        <Route
          path="/adf/users/:id/history"
          element={(
            <RequireMaxAdmin>
              <AdminUserHistory />
            </RequireMaxAdmin>
          )}
        />
        <Route
          path="/adf/withdraw-config"
          element={(
            <RequireMaxAdmin>
              <AdminWithdrawConfig />
            </RequireMaxAdmin>
          )}
        />
        <Route
          path="/adf/rankings"
          element={(
            <RequireMaxAdmin>
              <AdminRankings />
            </RequireMaxAdmin>
          )}
        />
        <Route
          path="/adf/logs"
          element={(
            <RequireMaxAdmin>
              <AdminLogs />
            </RequireMaxAdmin>
          )}
        />
        <Route
          path="/adf/security-logs"
          element={(
            <RequireMaxAdmin>
              <AdminSecurityLogs />
            </RequireMaxAdmin>
          )}
        />
        <Route
          path="/adf/roulette-code"
          element={(
            <RequireMaxAdmin>
              <AdminRouletteCode />
            </RequireMaxAdmin>
          )}
        />
        <Route
          path="/adf/gift-codes"
          element={(
            <RequireMaxAdmin>
              <AdminGiftCode />
            </RequireMaxAdmin>
          )}
        />
        <Route
          path="/adf/withdrawals/users"
          element={(
            <RequireMaxAdmin>
              <AdminUserWithdrawals />
            </RequireMaxAdmin>
          )}
        />
        <Route
          path="/adf/withdrawals/pending"
          element={(
            <RequireMaxAdmin>
              <AdminPendingWithdrawals />
            </RequireMaxAdmin>
          )}
        />
        <Route
          path="/adf/deposits"
          element={(
            <RequireMaxAdmin>
              <AdminDeposits />
            </RequireMaxAdmin>
          )}
        />
        <Route
          path="/adf/deposit-config"
          element={(
            <RequireMaxAdmin>
              <AdminDepositConfig />
            </RequireMaxAdmin>
          )}
        />
        <Route
          path="/adf/commission-config"
          element={(
            <RequireMaxAdmin>
              <AdminCommissionConfig />
            </RequireMaxAdmin>
          )}
        />
        <Route
          path="/adf/telegram-config"
          element={(
            <RequireMaxAdmin>
              <AdminTelegramConfig />
            </RequireMaxAdmin>
          )}
        />
        <Route
          path="/adf/cycle-products"
          element={(
            <RequireMaxAdmin>
              <AdminCycleProducts />
            </RequireMaxAdmin>
          )}
        />
        <Route
          path="/adf/monthly-salary"
          element={(
            <RequireMaxAdmin>
              <AdminMonthlySalary />
            </RequireMaxAdmin>
          )}
        />
        <Route
          path="/adf/site-branding"
          element={(
            <RequireMaxAdmin>
              <AdminSiteBranding />
            </RequireMaxAdmin>
          )}
        />
        <Route
          path="/adf/community-links"
          element={(
            <RequireMaxAdmin>
              <AdminCommunityLinks />
            </RequireMaxAdmin>
          )}
        />
        <Route
          path="/adf/mini-tasks"
          element={(
            <RequireMaxAdmin>
              <AdminMiniTasks />
            </RequireMaxAdmin>
          )}
        />
        <Route
          path="/adf/roulette-probabilities"
          element={(
            <RequireMaxAdmin>
              <AdminRouletteProbabilities />
            </RequireMaxAdmin>
          )}
        />
        <Route
          path="/adf/caixas-box"
          element={(
            <RequireMaxAdmin>
              <AdminCaixasBox />
            </RequireMaxAdmin>
          )}
        />
        <Route
          path="/adf/shop-products"
          element={(
            <RequireMaxAdmin>
              <AdminShopProducts />
            </RequireMaxAdmin>
          )}
        />
        <Route
          path="/adf/correction-logs"
          element={(
            <RequireMaxAdmin>
              <AdminCorrectionLogs />
            </RequireMaxAdmin>
          )}
        />
        <Route
          path="/adf/vip-levels"
          element={(
            <RequireMaxAdmin>
              <AdminVipLevels />
            </RequireMaxAdmin>
          )}
        />
        <Route
          path="/adf/task-commissions"
          element={(
            <RequireMaxAdmin>
              <AdminTaskCommissions />
            </RequireMaxAdmin>
          )}
        />
        <Route
          path="/adf/vip-refunds"
          element={(
            <RequireMaxAdmin>
              <AdminVipRefunds />
            </RequireMaxAdmin>
          )}
        />
        <Route
          path="/adf/vip-photos"
          element={(
            <RequireMaxAdmin>
              <AdminVipPhotos />
            </RequireMaxAdmin>
          )}
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <a
        href="https://chat.whatsapp.com/IwZbFess27d6lF7uQadeIg"
        target="_blank"
        rel="noopener noreferrer"
        className="whatsapp-fab"
        aria-label="Entrar no grupo do WhatsApp"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>
    </BrowserRouter>
  )
}
