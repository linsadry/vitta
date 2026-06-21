import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import BottomNav from './components/BottomNav'
import FloatingButton from './components/FloatingButton'
import PinScreen from './pages/PinScreen'
import AuthScreen from './pages/AuthScreen'
import Home from './pages/Home'
import Evolucao from './pages/Evolucao'
import Saude from './pages/Saude'
import Treinos from './pages/Treinos'
import Ciclo from './pages/Ciclo'
import Fiv from './pages/Fiv'
import Diario from './pages/Diario'
import { IA } from './pages/stubs'
import Jornada from './pages/Jornada'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    const el = document.querySelector('.page-content')
    if (el) el.scrollTop = 0
  }, [pathname])
  return null
}

function AppShell() {
  const { loading, supaUser, pinVerified, pinExists, verifyPin, sendOtp, verifyOtp } = useAuth()

  if (loading) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'var(--c-base-0)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--c-rose)', opacity: 0.4, animation: 'pulse 1.2s ease-in-out infinite' }} />
        <style>{`@keyframes pulse { 0%,100%{transform:scale(1);opacity:0.4} 50%{transform:scale(1.6);opacity:0.9} }`}</style>
      </div>
    )
  }

  if (!supaUser) return <AuthScreen sendOtp={sendOtp} verifyOtp={verifyOtp} />
  if (!pinVerified) return <PinScreen pinExists={pinExists} verifyPin={verifyPin} onSuccess={() => {}} />

  const uid = supaUser.id

  return (
    <div className="app-shell">
      <ScrollToTop />
      <main className="page-content">
        <Routes>
          <Route path="/"         element={<Home     userId={uid} />} />
          <Route path="/evolucao" element={<Evolucao userId={uid} />} />
          <Route path="/saude"    element={<Saude    userId={uid} />} />
          <Route path="/treinos"  element={<Treinos  userId={uid} />} />
          <Route path="/ciclo"    element={<Ciclo    userId={uid} />} />
          <Route path="/fiv"      element={<Fiv      userId={uid} />} />
          <Route path="/diario"   element={<Diario   userId={uid} />} />
          <Route path="/ia"       element={<IA />} />
          <Route path="/jornada"  element={<Jornada userId={uid} />} />
        </Routes>
      </main>
      <BottomNav />
      <FloatingButton onClick={() => {}} />
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
