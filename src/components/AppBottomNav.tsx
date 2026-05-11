import { useLocation, useNavigate } from 'react-router-dom';
import './AppBottomNav.css';

const navItems = [
  {
    path: '/dashboard',
    label: 'Inicio',
    icon: '/nav-icons/inicio-1-BQTc56nL.png',
    activeIcon: '/nav-icons/inicio-active-26-DGXCTSp8.png',
  },
  {
    path: '/cycle-products',
    label: 'Promoção',
    icon: '/nav-icons/promo-1-ZY9--ZOm.png',
    activeIcon: '/nav-icons/promo-active-26-Dms8X1Aw.png',
  },
  {
    path: '/cashin',
    label: 'Depositar',
    icon: '/nav-icons/flexible-1-D-KLezLo.png',
    activeIcon: '/nav-icons/flexible-25-DiXxSgEq.png',
    isCenter: true,
  },
  {
    path: '/investment-orders',
    label: 'Investimentos',
    icon: '/nav-icons/entrar-1-BlewzNOq.png',
    activeIcon: '/nav-icons/entrar-active-26-CyFa4cRD.png',
  },
  {
    path: '/profile',
    label: 'Perfil',
    icon: '/nav-icons/perfil-1-TTmfhmCG.png',
    activeIcon: '/nav-icons/perfil-active-26-DPDXdH-K.png',
  },
];

export default function AppBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="app-bottom-nav" role="tablist">
      <div className="inner-wrap">
        {/* Wall/background placeholder */}
        <div className="wall background-img" />

        {navItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              className={`app-bottom-nav__btn ${isActive ? 'active' : ''} ${item.isCenter ? 'center' : ''}`}
              onClick={() => navigate(item.path)}
              aria-label={item.label}
              role="tab"
              aria-selected={isActive}
            >
              {item.isCenter ? (
                <>
                  <div className="flexible-tab-box">
                    <span className="flexible-tab-title">Depositar</span>
                    <img
                      src="/nav-icons/bg-flexible-25-C8wVES1_.svg"
                      className="app-bottom-nav__ring-outside"
                      alt=""
                      aria-hidden="true"
                    />
                    <img
                      src={isActive ? item.activeIcon : item.icon}
                      className="app-bottom-nav__center-icon"
                      alt={item.label}
                    />
                    <img
                      src="/nav-icons/ring-inside-25-DXRbVADU.svg"
                      className="app-bottom-nav__ring-inside"
                      alt=""
                      aria-hidden="true"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="wall good-img">
                    <img
                      src={isActive ? item.activeIcon : item.icon}
                      alt={item.label}
                      className="app-bottom-nav__img"
                    />
                  </div>
                  <span className="app-bottom-nav__label">{item.label}</span>
                  {/* Red point placeholder for notifications */}
                  <p className={`red-point point-${index}`} style={{ display: 'none' }} />
                </>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}