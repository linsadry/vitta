import React, { useState } from 'react'
import { VittaIcon, PinBotanical } from '../components/BotanicalBg'

export default function AuthScreen({ sendOtp, verifyOtp }) {
  const [step, setStep]     = useState('email') // 'email' | 'otp'
  const [email, setEmail]   = useState('')
  const [token, setToken]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  const submitEmail = async () => {
    if (!email.trim()) return
    setLoading(true); setError('')
    const { error: err } = await sendOtp(email.trim())
    if (err) { setError('Erro ao enviar código. Verifique o e-mail.'); setLoading(false); return }
    setStep('otp'); setLoading(false)
  }

  const submitOtp = async () => {
    if (!token.trim()) return
    setLoading(true); setError('')
    const { error: err } = await verifyOtp(email.trim(), token.trim())
    if (err) { setError('Código inválido ou expirado.'); setLoading(false); return }
    // Auth state change handled by useAuth listener
    setLoading(false)
  }

  return (
    <>
      <style>{`
        .auth-screen {
          position: fixed; inset: 0;
          background: var(--c-base-0);
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          z-index: 300; padding: 40px 32px;
          overflow: hidden;
          padding-bottom: calc(40px + env(safe-area-inset-bottom, 0px));
        }
        .auth-form { width: 100%; max-width: 320px; display: flex; flex-direction: column; gap: 16px; }
        .auth-otp-input {
          text-align: center; font-family: var(--font-display);
          font-size: 28px; letter-spacing: 0.2em;
          border: none; border-bottom: 2px solid var(--c-border);
          background: transparent; outline: none; padding: 12px 0;
          color: var(--c-text-900); width: 100%;
          border-radius: 0;
        }
        .auth-otp-input:focus { border-bottom-color: var(--c-rose); }
      `}</style>

      <div className="auth-screen">
        <PinBotanical />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 48 }}>
          <VittaIcon size={72} />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 500, color: 'var(--c-text-900)', letterSpacing: '-0.02em' }}>Vitta+</span>
        </div>

        <div className="auth-form" style={{ position: 'relative', zIndex: 1 }}>
          {step === 'email' ? (
            <>
              <p style={{ fontFamily: 'var(--font-editorial)', fontSize: 18, color: 'var(--c-text-500)', fontStyle: 'italic', textAlign: 'center', marginBottom: 8 }}>
                Acesse seu espaço pessoal
              </p>
              <label className="input-label">E-mail</label>
              <input
                className="input-field"
                type="email"
                inputMode="email"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submitEmail()}
                autoFocus
              />
              {error && <p style={{ fontSize: 13, color: 'var(--c-rose-deep)', textAlign: 'center' }}>{error}</p>}
              <button className="btn-primary" onClick={submitEmail} disabled={!email || loading}>
                {loading ? 'Enviando...' : 'Continuar'}
              </button>
            </>
          ) : (
            <>
              <p style={{ fontFamily: 'var(--font-editorial)', fontSize: 16, color: 'var(--c-text-500)', fontStyle: 'italic', textAlign: 'center', marginBottom: 8, lineHeight: 1.5 }}>
                Código enviado para<br /><strong style={{ fontStyle: 'normal', color: 'var(--c-text-700)' }}>{email}</strong>
              </p>
              <input
                className="auth-otp-input"
                type="text"
                inputMode="numeric"
                placeholder="000000"
                value={token}
                onChange={e => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                autoFocus
              />
              {error && <p style={{ fontSize: 13, color: 'var(--c-rose-deep)', textAlign: 'center' }}>{error}</p>}
              <button className="btn-primary" onClick={submitOtp} disabled={token.length < 6 || loading}>
                {loading ? 'Verificando...' : 'Entrar'}
              </button>
              <button className="btn-ghost" onClick={() => { setStep('email'); setToken(''); setError('') }}
                style={{ textAlign: 'center', width: '100%' }}>
                Usar outro e-mail
              </button>
            </>
          )}
        </div>
      </div>
    </>
  )
}
