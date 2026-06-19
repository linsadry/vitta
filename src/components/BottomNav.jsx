import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Home, TrendingUp, Heart, Dumbbell, Sparkles } from 'lucide-react'

const TABS = [
  { path: '/',         label: 'Hoje',    Icon: Home },
  { path: '/evolucao', label: 'Evolução', Icon: TrendingUp },
  { path: '/saude',    label: 'Saúde',   Icon: Heart },
  { path: '/treinos',  label: 'Treinos', Icon: Dumbbell },
  { path: '/ia',       label: 'IA',      Icon: Sparkles },
]

export default function BottomNav() {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  return (
    <>
      <style>{`
        .bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 100;
          background: rgba(250, 247, 244, 0.94);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border-top: 1px solid var(--c-border-light);
          padding-bottom: var(--safe-bottom);
        }
        .bottom-nav-inner {
          display: flex;
          align-items: stretch;
          height: var(--nav-height);
        }
        .nav-tab {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px 4px;
          transition: opacity 0.15s;
          position: relative;
        }
        .nav-tab:active { opacity: 0.7; }
        .nav-tab-icon {
          width: 22px;
          height: 22px;
          color: var(--c-text-300);
          transition: color 0.2s;
        }
        .nav-tab-label {
          font-family: var(--font-ui);
          font-size: 10px;
          font-weight: 400;
          color: var(--c-text-300);
          letter-spacing: 0.01em;
          transition: color 0.2s;
          line-height: 1;
        }
        .nav-tab.active .nav-tab-icon {
          color: var(--c-text-700);
        }
        .nav-tab.active .nav-tab-label {
          color: var(--c-text-700);
          font-weight: 500;
        }
        .nav-tab.active::before {
          content: '';
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 20px;
          height: 2px;
          background: var(--c-rose);
          border-radius: 0 0 2px 2px;
        }
      `}</style>

      <nav className="bottom-nav" role="navigation" aria-label="Navegação principal">
        <div className="bottom-nav-inner">
          {TABS.map(({ path, label, Icon }) => {
            const active = pathname === path
            return (
              <button
                key={path}
                className={`nav-tab${active ? ' active' : ''}`}
                onClick={() => navigate(path)}
                aria-label={label}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className="nav-tab-icon" strokeWidth={active ? 1.8 : 1.5} />
                <span className="nav-tab-label">{label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </>
  )
}
