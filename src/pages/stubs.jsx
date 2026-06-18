import React from 'react'
import { TrendingUp, Heart, Dumbbell, Sparkles, BookMarked } from 'lucide-react'
import { PageBotanical } from '../components/BotanicalBg'

function StubPage({ icon: Icon, title, subtitle, color }) {
  return (
    <div style={{ position: 'relative', minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <PageBotanical />
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: 40, textAlign: 'center' }}>
        <div style={{
          width: 64, height: 64, borderRadius: 20,
          background: color + '18',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={28} strokeWidth={1.5} style={{ color }} />
        </div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 500, color: 'var(--c-text-900)', letterSpacing: '-0.02em' }}>
          {title}
        </h2>
        <p style={{ fontFamily: 'var(--font-editorial)', fontSize: 17, color: 'var(--c-text-500)', fontStyle: 'italic', lineHeight: 1.6, maxWidth: 280 }}>
          {subtitle}
        </p>
        <div style={{
          marginTop: 8, padding: '6px 16px', borderRadius: 'var(--r-full)',
          background: 'var(--c-base-2)',
          fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--c-text-300)',
          letterSpacing: '0.04em',
        }}>
          Em desenvolvimento
        </div>
      </div>
    </div>
  )
}

export function Evolucao() {
  return (
    <StubPage
      icon={TrendingUp}
      title="Evolução"
      subtitle="Acompanhe sua evolução corporal, peso, medidas e hábitos ao longo do tempo."
      color="var(--c-rose)"
    />
  )
}

export function Saude() {
  return (
    <StubPage
      icon={Heart}
      title="Saúde"
      subtitle="Gerencie consultas, medicamentos, ciclo e sua jornada FIV em um só lugar."
      color="var(--c-rose-mid)"
    />
  )
}

export function Treinos() {
  return (
    <StubPage
      icon={Dumbbell}
      title="Treinos"
      subtitle="Registre seus treinos, acompanhe evolução de carga e veja o progresso de cada exercício."
      color="var(--c-sage)"
    />
  )
}

export function IA() {
  return (
    <StubPage
      icon={Sparkles}
      title="Assistente Vitta"
      subtitle="Análise personalizada dos seus hábitos, padrões de sono, ciclo e evolução geral."
      color="var(--c-gold)"
    />
  )
}

export function Jornada() {
  return (
    <StubPage
      icon={BookMarked}
      title="Minha Jornada"
      subtitle="Toda a sua história de saúde e bem-estar reunida em uma linha do tempo pessoal."
      color="var(--c-lavender)"
    />
  )
}
