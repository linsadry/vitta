import React, { useState, useEffect } from 'react'
import { VittaIcon, PinBotanical } from '../components/BotanicalBg'

const PIN_LENGTH = 6

export default function PinScreen({ onSuccess, pinExists, verifyPin }) {
  const [digits, setDigits]     = useState([])
  const [error, setError]       = useState('')
  const [shaking, setShaking]   = useState(false)
  const [checking, setChecking] = useState(false)

  // Auto-submit when full
  useEffect(() => {
    if (digits.length === PIN_LENGTH && !checking) {
      submit(digits.join(''))
    }
  }, [digits])

  const submit = async (pin) => {
    setChecking(true)
    const { ok, error: err } = await verifyPin(pin)
    if (ok) {
      onSuccess()
    } else {
      setError(err || 'PIN incorreto. Tente novamente.')
      setShaking(true)
      setTimeout(() => { setShaking(false); setDigits([]); setError(''); setChecking(false) }, 700)
    }
  }

  const press = (d) => {
    if (digits.length < PIN_LENGTH && !checking) {
      setError('')
      setDigits(prev => [...prev, d])
    }
  }

  const del = () => {
    if (!checking) setDigits(prev => prev.slice(0, -1))
  }

  return (
    <>
      <style>{`
        .pin-screen {
          position: fixed;
          inset: 0;
          background: var(--c-base-0);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 300;
          padding: 40px 32px;
          padding-bottom: calc(40px + env(safe-area-inset-bottom, 0px));
          overflow: hidden;
        }
        .pin-brand {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          margin-bottom: 48px;
        }
        .pin-name {
          font-family: var(--font-display);
          font-size: 28px;
          font-weight: 500;
          color: var(--c-text-900);
          letter-spacing: -0.02em;
        }
        .pin-label {
          font-family: var(--font-editorial);
          font-size: 18px;
          font-weight: 300;
          color: var(--c-text-500);
          font-style: italic;
          letter-spacing: 0.01em;
        }
        .pin-dots {
          display: flex;
          gap: 12px;
          margin-bottom: 8px;
        }
        .pin-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 1.5px solid var(--c-text-300);
          background: transparent;
          transition: background 0.15s, border-color 0.15s, transform 0.1s;
        }
        .pin-dot.filled {
          background: var(--c-text-700);
          border-color: var(--c-text-700);
          transform: scale(1.1);
        }
        .pin-dots.shake {
          animation: shake 0.55s cubic-bezier(0.36, 0.07, 0.19, 0.97);
        }
        .pin-dots.shake .pin-dot.filled {
          background: var(--c-rose-mid);
          border-color: var(--c-rose-mid);
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15%       { transform: translateX(-7px); }
          30%       { transform: translateX(7px); }
          45%       { transform: translateX(-5px); }
          60%       { transform: translateX(5px); }
          75%       { transform: translateX(-3px); }
          90%       { transform: translateX(3px); }
        }
        .pin-error {
          font-family: var(--font-ui);
          font-size: 13px;
          color: var(--c-rose-deep);
          min-height: 20px;
          text-align: center;
          margin-bottom: 4px;
          letter-spacing: 0.01em;
        }
        .pin-setup-hint {
          font-family: var(--font-editorial);
          font-size: 14px;
          color: var(--c-text-500);
          text-align: center;
          margin-bottom: 32px;
          font-style: italic;
          line-height: 1.5;
          max-width: 240px;
        }
        .pin-keypad {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          width: 100%;
          max-width: 280px;
          margin-top: 32px;
        }
        .pin-key {
          aspect-ratio: 1;
          max-height: 72px;
          border: none;
          border-radius: var(--r-xl);
          background: var(--c-base-1);
          color: var(--c-text-900);
          font-family: var(--font-display);
          font-size: 24px;
          font-weight: 400;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.1s, transform 0.08s;
          -webkit-user-select: none;
          user-select: none;
        }
        .pin-key:active {
          background: var(--c-base-3);
          transform: scale(0.93);
        }
        .pin-key.empty { background: transparent; cursor: default; }
        .pin-key.del {
          background: transparent;
          font-size: 14px;
          color: var(--c-text-500);
        }
        .pin-key.del svg {
          width: 22px;
          height: 22px;
          color: var(--c-text-500);
        }
      `}</style>

      <div className="pin-screen">
        <PinBotanical />

        <div className="pin-brand" style={{ position: 'relative', zIndex: 1 }}>
          <VittaIcon size={72} />
          <span className="pin-name">Vitta+</span>
        </div>

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          {!pinExists && (
            <p className="pin-setup-hint">
              Primeira vez aqui. Crie um PIN de {PIN_LENGTH} dígitos para proteger seu espaço.
            </p>
          )}

          <p className="pin-label" style={{ marginBottom: 24 }}>
            {pinExists ? 'Digite seu PIN' : 'Crie seu PIN'}
          </p>

          <div className={`pin-dots${shaking ? ' shake' : ''}`}>
            {Array.from({ length: PIN_LENGTH }, (_, i) => (
              <div key={i} className={`pin-dot${i < digits.length ? ' filled' : ''}`} />
            ))}
          </div>

          <p className="pin-error">{error}</p>

          <div className="pin-keypad">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
              <button key={n} className="pin-key" onClick={() => press(String(n))}>{n}</button>
            ))}
            <button className="pin-key empty" disabled />
            <button className="pin-key" onClick={() => press('0')}>0</button>
            <button className="pin-key del" onClick={del} aria-label="Apagar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/>
                <line x1="18" y1="9" x2="12" y2="15"/>
                <line x1="12" y1="9" x2="18" y2="15"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
