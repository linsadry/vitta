import React from 'react'
import { Plus } from 'lucide-react'

export default function FloatingButton({ onClick }) {
  return (
    <>
      <style>{`
        .fab {
          position: fixed;
          bottom: calc(var(--nav-height) + var(--safe-bottom) + 16px);
          right: 20px;
          z-index: 90;
          width: 52px;
          height: 52px;
          border-radius: var(--r-full);
          background: var(--c-text-900);
          color: var(--c-base-0);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 16px rgba(46, 37, 32, 0.3);
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .fab:active {
          transform: scale(0.93);
          box-shadow: 0 2px 8px rgba(46, 37, 32, 0.2);
        }
        .fab svg {
          width: 22px;
          height: 22px;
        }
      `}</style>
      <button className="fab" onClick={onClick} aria-label="Novo registro">
        <Plus strokeWidth={2} />
      </button>
    </>
  )
}
