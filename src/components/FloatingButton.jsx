import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Scale, Droplets, Moon, Heart, Dumbbell, Ruler, Stethoscope } from 'lucide-react'

const OPTIONS = [
  { key: 'peso',     label: 'Peso',     icon: Scale,       path: '/evolucao' },
  { key: 'medidas',  label: 'Medidas',  icon: Ruler,       path: '/evolucao' },
  { key: 'agua',     label: 'Água',     icon: Droplets,    path: '/' },
  { key: 'sono',     label: 'Sono',     icon: Moon,        path: '/' },
  { key: 'humor',    label: 'Humor',    icon: Heart,       path: '/' },
  { key: 'treino',   label: 'Treino',   icon: Dumbbell,    path: '/treinos' },
  { key: 'consulta', label: 'Consulta', icon: Stethoscope, path: '/saude' },
]

export default function FloatingButton() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const choose = (opt) => {
    setOpen(false)
    navigate(opt.path, { state: { openModal: opt.key } })
  }

  return (
    <>
      <style>{`
        .fab {
          position: fixed;
          bottom: calc(var(--nav-height) + var(--safe-bottom) + 16px);
          right: 20px;
          z-index: 80;
          width: 44px;
          height: 44px;
          border-radius: var(--r-full);
          background: var(--c-text-900);
          color: var(--c-base-0);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 16px rgba(46, 37, 32, 0.3);
          transition: transform 0.2s, box-shadow 0.15s;
        }
        .fab.open { transform: rotate(45deg); }
        .fab:active { transform: scale(0.93); }
        .fab-overlay { position: fixed; inset: 0; z-index: 70; background: transparent; }
        .fab-menu {
          position: fixed;
          bottom: calc(var(--nav-height) + var(--safe-bottom) + 68px);
          right: 20px;
          z-index: 80;
          display: flex;
          flex-direction: column;
          gap: 8px;
          align-items: flex-end;
        }
        .fab-item {
          display: flex; align-items: center; gap: 10px;
          background: var(--c-base-0);
          border: 1px solid var(--c-border-light);
          border-radius: var(--r-full);
          padding: 8px 8px 8px 16px;
          cursor: pointer;
          box-shadow: 0 2px 10px rgba(46,37,32,0.12);
        }
        .fab-item span { font-family: var(--font-ui); font-size: 13px; color: var(--c-text-700); }
        .fab-item .ic {
          width: 30px; height: 30px; border-radius: 50%;
          background: var(--c-sage-faint); color: var(--c-sage);
          display: flex; align-items: center; justify-content: center;
        }
      `}</style>

      {open && <div className="fab-overlay" onClick={() => setOpen(false)} />}

      {open && (
        <div className="fab-menu">
          {OPTIONS.map(opt => {
            const Icon = opt.icon
            return (
              <button key={opt.key} className="fab-item" onClick={() => choose(opt)}>
                <span>{opt.label}</span>
                <div className="ic"><Icon size={15} strokeWidth={1.8} /></div>
              </button>
            )
          })}
        </div>
      )}

      <button className={`fab${open ? ' open' : ''}`} onClick={() => setOpen(o => !o)} aria-label="Novo registro">
        <Plus strokeWidth={2} style={{ width: 19, height: 19 }} />
      </button>
    </>
  )
}
