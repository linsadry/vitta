import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import BottomNav from './components/BottomNav'
import FloatingButton from './components/FloatingButton'
import PinScreen from './pages/PinScreen'
import AuthScreen from './pages/AuthScreen'
import Home from './pages/Home'
import { Evolucao, Saude, Treinos, IA, Jornada } from './pages/stubs'

function AppShell() {
  const { loading, supaUser, pinVerified, pinExists, verifyPin, sendOtp, verifyOtp } = useAuth()
  const [fabOpen, setFabOpen] = React.useState(false)

  // Loading state
  if (loading) {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: 'var(--c-base-0)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: 'var(--c-rose)', opacity: 0.4,
          animation: 'pulse 1.2s ease-in-out infinite',
        }} />
        <style>{`@keyframes pulse { 0%,100%{transform:scale(1);opacity:0.4} 50%{transform:scale(1.6);opacity:0.9} }`}</style>
      </div>
    )
  }

  // No Supabase session → show auth screen
  if (!supaUser) {
    return <AuthScreen sendOtp={sendOtp} verifyOtp={verifyOtp} />
  }

  // Session exists but PIN not verified
  if (!pinVerified) {
    return (
      <PinScreen
        pinExists={pinExists}
        verifyPin={verifyPin}
        onSuccess={() => {}} // state updates via hook
      />
    )
  }

  // Authenticated + PIN verified → show app
  return (
    <div className="app-shell">
      <main className="page-content">
        <Routes>
          <Route path="/"         element={<Home userId={supaUser.id} />} />
          <Route path="/evolucao" element={<Evolucao />} />
          <Route path="/saude"    element={<Saude />} />
          <Route path="/treinos"  element={<Treinos />} />
          <Route path="/ia"       element={<IA />} />
          <Route path="/jornada"  element={<Jornada />} />
        </Routes>
      </main>
      <BottomNav />
      <FloatingButton onClick={() => setFabOpen(v => !v)} />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  )
}
