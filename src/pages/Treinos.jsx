// src/pages/Treinos.jsx
import React, { useState, useEffect } from 'react'
import { Plus, X, Check, Dumbbell, Zap } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { PageBotanical } from '../components/BotanicalBg'
import { today, formatDateShort } from '../lib/utils'

/* ─── EXERCISE ROW ───────────────────────────────────────────────── */
function ExerciseRow({ exercise, todayLogs, onLog }) {
  const myLogs = todayLogs.filter(l => l.exercise_id === exercise.id)
  const target = exercise.target_sets || 3
  const done   = myLogs.length >= target
  const last   = myLogs[myLogs.length - 1]

  return (
    <div style={{ padding: '14px 0', borderBottom: '1px solid var(--c-border-light)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 500, color: 'var(--c-text-900)', marginBottom: 3 }}>
            {exercise.name}
          </div>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--c-text-500)' }}>
            {[
              exercise.target_sets && `${exercise.target_sets} séries`,
              exercise.target_reps && `${exercise.target_reps} reps`,
              exercise.target_load && `${exercise.target_load} kg`,
            ].filter(Boolean).join(' · ')}
          </div>
        </div>
        <button onClick={() => onLog(exercise)} style={{
          padding: '8px 14px', borderRadius: 'var(--r-full)', border: 'none', cursor: 'pointer',
          background: done ? 'var(--c-sage-faint)' : 'var(--c-text-900)',
          color: done ? 'var(--c-sage)' : 'var(--c-base-0)',
          fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 500,
          display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
        }}>
          {done ? <Check size={13} strokeWidth={2.5} /> : <Plus size={13} strokeWidth={2.5} />}
          Série
        </button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {Array.from({ length: target }, (_, i) => (
          <div key={i} style={{
            width: 8, height: 8, borderRadius: '50%',
            background: i < myLogs.length ? 'var(--c-sage)' : 'var(--c-base-2)',
          }} />
        ))}
        {last && (
          <span style={{ fontSize: 11, color: 'var(--c-text-300)', marginLeft: 4, fontFamily: 'var(--font-ui)' }}>
            {[last.load && `${last.load}kg`, last.reps && `× ${last.reps}`].filter(Boolean).join(' ')}
          </span>
        )}
      </div>
    </div>
  )
}

/* ─── LOG SET MODAL ──────────────────────────────────────────────── */
function LogModal({ exercise, planId, planName, userId, onClose, onSave }) {
  const [date, setDate]     = useState(today())
  const [load, setLoad]     = useState(exercise.target_load ? String(exercise.target_load) : '')
  const [reps, setReps]     = useState(exercise.target_reps ? String(exercise.target_reps) : '')
  const [notes, setNotes]   = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone]     = useState(false)

  const save = async () => {
    setSaving(true)
    await supabase.from('fitness_workout_logs').insert({
    user_id: userId, date: date,
      plan_id: planId, plan_name: planName,
      exercise_id: exercise.id, exercise_name: exercise.name,
      set_number: 1,
      reps: reps ? parseInt(reps) : null,
      load: load ? parseFloat(load.replace(',', '.')) : null,
      notes: notes || null,
    })
    setDone(true)
    setTimeout(() => { onSave?.(); onClose() }, 600)
  }

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <h2 className="sheet-title" style={{ marginBottom: 0, fontSize: 20 }}>{exercise.name}</h2>
          <button onClick={onClose} className="btn-ghost" style={{ padding: 8 }}><X size={18} strokeWidth={1.8} /></button>
        </div>
        <p style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--c-text-300)', marginBottom: 24 }}>
          {[exercise.target_sets && `${exercise.target_sets}×`, exercise.target_reps, exercise.target_load && `${exercise.target_load}kg`].filter(Boolean).join(' ')}
        </p>
        {done ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '20px 0' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--c-sage-faint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Check size={24} strokeWidth={2} style={{ color: 'var(--c-sage)' }} />
            </div>
            <p style={{ fontFamily: 'var(--font-editorial)', fontSize: 18, color: 'var(--c-text-700)', fontStyle: 'italic' }}>Série registrada</p>
          </div>
        ) : (
  <>
    <div style={{ marginBottom: 16 }}>
              <label className="input-label">Data</label>
              <input className="input-field" type="date"
                onChange={e => setDate(e.target.value)} />
            </div>

            <label className="input-label" style={{ display: 'block', marginBottom: 10 }}>Tipo de atividade</label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <label className="input-label">Carga (kg)</label>
                <input className="input-field" type="text" inputMode="decimal"
                  placeholder={exercise.target_load || '0'} value={load}
                  onChange={e => setLoad(e.target.value)}
                  style={{ textAlign: 'center', fontSize: 22, fontFamily: 'var(--font-display)' }} />
              </div>
              <div>
                <label className="input-label">Repetições</label>
                <input className="input-field" type="text" inputMode="numeric"
                  placeholder={exercise.target_reps || '0'} value={reps}
                  onChange={e => setReps(e.target.value)}
                  style={{ textAlign: 'center', fontSize: 22, fontFamily: 'var(--font-display)' }} />
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label className="input-label">Observação</label>
              <input className="input-field" type="text" placeholder="Opcional"
                value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
            <button className="btn-primary" onClick={save} disabled={saving}>
              {saving ? 'Salvando...' : 'Registrar série'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

/* ─── QUICK SESSION MODAL ────────────────────────────────────────── */
const ACTIVITY_TYPES = ['Força', 'Aeróbico', 'Yoga', 'Pilates', 'Caminhada', 'Outro']

function QuickSessionModal({ userId, currentPlan, onClose, onSave }) {
   const [date, setDate]         = useState(today())
  const [type, setType]         = useState('Aeróbico')
  const [duration, setDuration] = useState('')
  const [notes, setNotes]       = useState('')
  const [saving, setSaving]     = useState(false)
  const [done, setDone]         = useState(false)

  const save = async () => {
    setSaving(true)
    const label = duration ? `${type} · ${duration} min` : type
    const { error } = await supabase.from('fitness_workout_logs').insert({
      user_id: userId,
      date: today(),
      plan_id:   type === 'Força' ? (currentPlan?.id   ?? null) : null,
      plan_name: type === 'Força' ? (currentPlan?.name ?? null) : null,
      exercise_id:   null,
      exercise_name: label,
      set_number: 1,
      reps: null,
      load: null,
      notes: notes || null,
    })
    if (error) { console.error(error); setSaving(false); return }
    setDone(true)
    setTimeout(() => { onSave?.(); onClose() }, 800)
  }

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <h2 className="sheet-title" style={{ marginBottom: 0, fontSize: 20 }}>Registrar sessão</h2>
          <button onClick={onClose} className="btn-ghost" style={{ padding: 8 }}><X size={18} strokeWidth={1.8} /></button>
        </div>
        <p style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--c-text-300)', marginBottom: 24 }}>
          Sem detalhar exercícios — só marcar ✓
        </p>

        {done ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '20px 0' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--c-sage-faint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Check size={24} strokeWidth={2} style={{ color: 'var(--c-sage)' }} />
            </div>
            <p style={{ fontFamily: 'var(--font-editorial)', fontSize: 18, color: 'var(--c-text-700)', fontStyle: 'italic' }}>Treino registrado!</p>
          </div>
        ) : (
          <>
            <label className="input-label" style={{ display: 'block', marginBottom: 10 }}>Tipo de atividade</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 22 }}>
              {ACTIVITY_TYPES.map(t => (
                <button key={t} onClick={() => setType(t)} style={{
                  padding: '8px 14px', borderRadius: 'var(--r-full)',
                  border: `1.5px solid ${type === t ? 'var(--c-sage)' : 'var(--c-border)'}`,
                  background: type === t ? 'var(--c-sage-faint)' : 'none',
                  color: type === t ? 'var(--c-sage)' : 'var(--c-text-500)',
                  fontFamily: 'var(--font-ui)', fontSize: 13, cursor: 'pointer',
                  transition: 'all 0.15s',
                }}>
                  {t}
                </button>
              ))}
            </div>

            <div style={{ marginBottom: 14 }}>
              <label className="input-label">Duração (min)</label>
              <input className="input-field" type="text" inputMode="numeric"
                placeholder="45" value={duration}
                onChange={e => setDuration(e.target.value)}
                style={{ textAlign: 'center', fontSize: 22, fontFamily: 'var(--font-display)' }} />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label className="input-label">Observação</label>
              <input className="input-field" type="text" placeholder="Ex: corrida no parque, aula nova..."
                value={notes} onChange={e => setNotes(e.target.value)} />
            </div>

            <button className="btn-primary" onClick={save} disabled={saving}>
              {saving ? 'Salvando...' : '✓ Registrar sessão'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

/* ─── ADD PROGRAM MODAL ──────────────────────────────────────────── */
function AddProgramModal({ userId, onClose, onSave }) {
  const [name, setName]           = useState('')
  const [saving, setSaving]       = useState(false)
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate]     = useState('')

  const save = async () => {
    if (!name.trim()) return
    setSaving(true)
    const { data: last } = await supabase.from('vitta_programs')
      .select('order_idx').eq('user_id', userId).order('order_idx', { ascending: false }).limit(1).maybeSingle()
    await supabase.from('vitta_programs').insert({
      user_id: userId, name: name.trim(), order_idx: (last?.order_idx ?? -1) + 1,
      start_date: startDate || null, end_date: endDate || null,
    })
    onSave?.(); onClose()
  }

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        <h2 className="sheet-title">Novo programa</h2>
        <label className="input-label">Nome</label>
        <input className="input-field" type="text" placeholder="Ex: Programa 2 — Hipertrofia"
          value={name} onChange={e => setName(e.target.value)} autoFocus style={{ marginBottom: 14 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <div><label className="input-label">Início</label><input className="input-field" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
          <div><label className="input-label">Fim (opcional)</label><input className="input-field" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
        </div>
        <button className="btn-primary" onClick={save} disabled={!name.trim() || saving}>
          {saving ? 'Criando...' : 'Criar programa'}
        </button>
      </div>
    </div>
  )
}

/* ─── MAIN PAGE ──────────────────────────────────────────────────── */
export default function Treinos({ userId }) {
  const [programs, setPrograms]         = useState([])
  const [activeProg, setActiveProg]     = useState(null)
  const [activeVariant, setActiveVariant] = useState('A')
  const [plans, setPlans]               = useState([])
  const [exercises, setExercises]       = useState([])
  const [todayLogs, setTodayLogs]       = useState([])
  const [recentLogs, setRecentLogs]     = useState([])
  const [loading, setLoading]           = useState(true)
  const [logTarget, setLogTarget]       = useState(null)
  const [modal, setModal]               = useState(null)
  const [quickModal, setQuickModal]     = useState(false)
  const [refreshKey, setRefreshKey]     = useState(0)

  const refresh = () => setRefreshKey(k => k + 1)

  useEffect(() => {
    if (!userId) return
    supabase.from('vitta_programs')
      .select('id,name,order_idx,active,start_date,end_date')
      .eq('user_id', userId).eq('active', true).order('order_idx')
      .then(({ data }) => {
        const list = data || []
        setPrograms(list)
        if (list.length) setActiveProg(prev => prev ?? list[0].id)
        else setLoading(false)
      })
  }, [userId, refreshKey])

  useEffect(() => {
    if (!userId || !activeProg) return
    let cancelled = false
    setLoading(true)

    const run = async () => {
      try {
        const [{ data: planList }, { data: logs }, { data: recent }] = await Promise.all([
          supabase.from('fitness_workout_plans')
            .select('id,name,variant').eq('user_id', userId).eq('program_id', activeProg).order('order_idx'),
          supabase.from('fitness_workout_logs')
            .select('*').eq('user_id', userId).eq('date', today()),
          supabase.from('fitness_workout_logs')
            .select('date,plan_name,exercise_name,load,reps,exercise_id')
            .eq('user_id', userId).order('created_at', { ascending: false }).limit(30),
        ])
        if (cancelled) return

        const pList = planList || []
        setPlans(pList)
        setTodayLogs(logs || [])
        setRecentLogs(recent || [])

        const plan = pList.find(p => p.variant === activeVariant) ?? pList[0]
        if (plan) {
          const { data: exList } = await supabase.from('fitness_workout_exercises')
            .select('*').eq('plan_id', plan.id).order('order_idx')
          if (!cancelled) setExercises(exList || [])
        } else {
          if (!cancelled) setExercises([])
        }
      } catch (e) {
        console.error('[Treinos] load error:', e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()
    return () => { cancelled = true }
  }, [userId, activeProg, activeVariant, refreshKey])

  const currentPlan = plans.find(p => p.variant === activeVariant) ?? plans[0]
  const variants    = ['A', 'B', 'C'].filter(v => plans.some(p => p.variant === v))

  // Sessão rápida = log sem exercise_id
  const todayQuick = todayLogs.find(l => !l.exercise_id && l.exercise_name)

  const byDate = recentLogs.reduce((acc, l) => {
    if (!acc[l.date]) acc[l.date] = []
    acc[l.date].push(l)
    return acc
  }, {})
  const recentDates = Object.keys(byDate).sort((a, b) => b.localeCompare(a)).slice(0, 5)

  return (
    <div style={{ position: 'relative', minHeight: '100%', paddingBottom: 24 }}>
      {/* Header */}
      <div style={{ padding: '52px var(--page-pad-x) 0', position: 'relative', overflow: 'hidden', marginBottom: 20 }}>
        <PageBotanical />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 500, color: 'var(--c-text-900)', letterSpacing: '-0.02em', marginBottom: 4 }}>
            Treinos
          </h1>
          <p style={{ fontFamily: 'var(--font-editorial)', fontSize: 16, color: 'var(--c-text-500)', fontStyle: 'italic' }}>
            Registro e evolução de cargas
          </p>
        </div>
      </div>

      {/* Program selector */}
      <div style={{ padding: '0 var(--page-pad-x)', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {programs.map(prog => (
            <button key={prog.id} onClick={() => setActiveProg(prog.id)} style={{
              padding: '8px 16px', borderRadius: 'var(--r-full)', border: 'none', cursor: 'pointer',
              background: activeProg === prog.id ? 'var(--c-text-900)' : 'var(--c-base-2)',
              color: activeProg === prog.id ? 'var(--c-base-0)' : 'var(--c-text-500)',
              fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: activeProg === prog.id ? 500 : 400,
              flexShrink: 0, transition: 'background 0.15s, color 0.15s',
              display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2,
            }}>
              <span>{prog.name}</span>
              {prog.start_date && (
                <span style={{ fontSize: 9, opacity: 0.7, fontWeight: 400 }}>
                  {new Date(prog.start_date + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
                  {prog.end_date ? ' → ' + new Date(prog.end_date + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }) : ''}
                </span>
              )}
            </button>
          ))}
          <button onClick={() => setModal('prog')} style={{
            padding: '8px 12px', borderRadius: 'var(--r-full)',
            border: '1.5px dashed var(--c-border)', background: 'none', cursor: 'pointer',
            color: 'var(--c-text-300)', flexShrink: 0, display: 'flex', alignItems: 'center',
          }}>
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Variant tabs A / B / C */}
      {variants.length > 0 && (
        <div style={{ display: 'flex', margin: '0 var(--page-pad-x) 16px', borderBottom: '1px solid var(--c-border)' }}>
          {variants.map(v => {
            const active = activeVariant === v
            const planName = plans.find(p => p.variant === v)?.name
            return (
              <button key={v} onClick={() => setActiveVariant(v)} style={{
                flex: 1, padding: '10px 0', border: 'none', background: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 500,
                color: active ? 'var(--c-text-900)' : 'var(--c-text-300)',
                borderBottom: `2px solid ${active ? 'var(--c-sage)' : 'transparent'}`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              }}>
                {v}
                {planName && (
                  <span style={{ fontSize: 9, fontFamily: 'var(--font-ui)', color: 'var(--c-text-300)', fontWeight: 400, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {planName}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* ── QUICK SESSION BANNER ── */}
      <div style={{ padding: '0 var(--page-pad-x)', marginBottom: 14 }}>
        {todayQuick ? (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 14px', borderRadius: 'var(--r-md)',
            background: 'var(--c-sage-faint)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Check size={14} strokeWidth={2.5} style={{ color: 'var(--c-sage)', flexShrink: 0 }} />
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--c-sage)', fontWeight: 500 }}>
                {todayQuick.exercise_name}
              </span>
            </div>
            <button onClick={() => setQuickModal(true)} style={{
              fontSize: 11, fontFamily: 'var(--font-ui)', color: 'var(--c-sage)',
              background: 'none', border: 'none', cursor: 'pointer', opacity: 0.7,
            }}>
              + outra
            </button>
          </div>
        ) : (
          <button onClick={() => setQuickModal(true)} style={{
            width: '100%', padding: '11px 14px', borderRadius: 'var(--r-md)',
            border: '1.5px dashed var(--c-border)', background: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            color: 'var(--c-text-400)', fontFamily: 'var(--font-ui)', fontSize: 13,
          }}>
            <Zap size={14} strokeWidth={2} />
            Registrar sessão rápida
          </button>
        )}
      </div>

      {/* Exercises */}
      <div style={{ padding: '0 var(--page-pad-x)', marginBottom: 32 }}>
        {loading ? (
          Array.from({ length: 4 }, (_, i) => (
            <div key={i} style={{ height: 72, marginBottom: 8, borderRadius: 'var(--r-sm)' }} className="loading-shimmer" />
          ))
        ) : exercises.length > 0 ? (
          <div className="card" style={{ padding: '0 16px' }}>
            {exercises.map(ex => (
              <ExerciseRow key={ex.id} exercise={ex} todayLogs={todayLogs} onLog={setLogTarget} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <Dumbbell size={32} style={{ color: 'var(--c-text-100)' }} />
            <p className="empty-state-text">
              {programs.length === 0 ? 'Crie um programa para começar' : 'Nenhum exercício neste treino'}
            </p>
          </div>
        )}
      </div>

      {/* Recent activity */}
      {recentDates.length > 0 && (
        <section style={{ padding: '0 var(--page-pad-x)', marginBottom: 24 }}>
          <h2 className="section-title" style={{ marginBottom: 16 }}>Histórico recente</h2>
          {recentDates.map(dt => (
            <div key={dt} style={{ marginBottom: 20 }}>
              <p style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--c-text-300)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {formatDateShort(dt)}
              </p>
              <div className="card" style={{ padding: '4px 16px' }}>
                {byDate[dt].slice(0, 6).map((l, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 0',
                    borderBottom: i < Math.min(byDate[dt].length, 6) - 1 ? '1px solid var(--c-border-light)' : 'none',
                  }}>
                    <span style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--c-text-700)' }}>{l.exercise_name}</span>
                    <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--c-text-300)' }}>
                      {[l.load && `${l.load}kg`, l.reps && `× ${l.reps}`].filter(Boolean).join(' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      {logTarget && (
        <LogModal exercise={logTarget} planId={currentPlan?.id} planName={currentPlan?.name}
          userId={userId} onClose={() => setLogTarget(null)} onSave={refresh} />
      )}
      {modal === 'prog' && (
        <AddProgramModal userId={userId} onClose={() => setModal(null)} onSave={refresh} />
      )}
      {quickModal && (
        <QuickSessionModal
          userId={userId}
          currentPlan={currentPlan}
          onClose={() => setQuickModal(false)}
          onSave={refresh}
        />
      )}
    </div>
  )
}
