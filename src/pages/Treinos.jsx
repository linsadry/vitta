import React, { useState, useEffect, useCallback } from 'react'
import { Plus, X, Check, Dumbbell, ChevronRight, TrendingUp, RotateCcw } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { PageBotanical } from '../components/BotanicalBg'
import { today, formatDateShort } from '../lib/utils'

/* ─── EXERCISE ROW ───────────────────────────────────────────────── */
function ExerciseRow({ exercise, todayLogs, onLog }) {
  const myLogs = todayLogs.filter(l => l.exercise_id === exercise.id)
  const lastLoad = myLogs.length > 0
    ? myLogs[myLogs.length - 1].load
    : exercise.target_load

  const setsToday = myLogs.length
  const target    = exercise.target_sets || 3

  return (
    <div style={{
      padding: '14px 0', borderBottom: '1px solid var(--c-border-light)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
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
          padding: '8px 14px', borderRadius: 'var(--r-full)',
          background: setsToday >= target ? 'var(--c-sage-faint)' : 'var(--c-text-900)',
          color: setsToday >= target ? 'var(--c-sage)' : 'var(--c-base-0)',
          border: 'none', cursor: 'pointer',
          fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 500,
          display: 'flex', alignItems: 'center', gap: 5,
          transition: 'background 0.15s',
          flexShrink: 0,
        }}>
          {setsToday >= target ? <Check size={13} strokeWidth={2.5} /> : <Plus size={13} strokeWidth={2.5} />}
          Série
        </button>
      </div>

      {/* Set progress dots */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {Array.from({ length: target }, (_, i) => (
          <div key={i} style={{
            width: 8, height: 8, borderRadius: '50%',
            background: i < setsToday ? 'var(--c-sage)' : 'var(--c-base-2)',
            transition: 'background 0.2s',
          }} />
        ))}
        {myLogs.length > 0 && (
          <span style={{ fontSize: 11, color: 'var(--c-text-300)', marginLeft: 4, fontFamily: 'var(--font-ui)' }}>
            {myLogs[myLogs.length-1].load ? `${myLogs[myLogs.length-1].load}kg` : ''}{' '}
            {myLogs[myLogs.length-1].reps ? `× ${myLogs[myLogs.length-1].reps}` : ''}
          </span>
        )}
      </div>
    </div>
  )
}

/* ─── LOG SET MODAL ──────────────────────────────────────────────── */
function LogModal({ exercise, planId, planName, userId, onClose, onSave }) {
  const [load, setLoad]   = useState(exercise.target_load ? String(exercise.target_load) : '')
  const [reps, setReps]   = useState(exercise.target_reps ? String(exercise.target_reps) : '')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone]   = useState(false)

  const save = async () => {
    setSaving(true)
    const row = {
      user_id: userId,
      date: today(),
      plan_id: planId,
      plan_name: planName,
      exercise_id: exercise.id,
      exercise_name: exercise.name,
      set_number: 1,
      reps: reps ? parseInt(reps) : null,
      load: load ? parseFloat(load.replace(',', '.')) : null,
      notes: notes || null,
    }
    await supabase.from('fitness_workout_logs').insert(row)
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

/* ─── ADD PROGRAM MODAL ──────────────────────────────────────────── */
function AddProgramModal({ userId, onClose, onSave }) {
  const [name, setName]   = useState('')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!name.trim()) return
    setSaving(true)
    const { data: progs } = await supabase.from('vitta_programs').select('order_idx').eq('user_id', userId).order('order_idx', { ascending: false }).limit(1).maybeSingle()
    const nextIdx = progs ? (progs.order_idx + 1) : 0
    await supabase.from('vitta_programs').insert({ user_id: userId, name: name.trim(), order_idx: nextIdx })
    onSave?.()
    onClose()
  }

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        <h2 className="sheet-title">Novo programa</h2>
        <label className="input-label">Nome</label>
        <input className="input-field" type="text" placeholder="Ex: Programa 2 — Hipertrofia"
          value={name} onChange={e => setName(e.target.value)} autoFocus style={{ marginBottom: 20 }} />
        <button className="btn-primary" onClick={save} disabled={!name.trim() || saving}>
          {saving ? 'Criando...' : 'Criar programa'}
        </button>
      </div>
    </div>
  )
}

/* ─── MAIN PAGE ──────────────────────────────────────────────────── */
export default function Treinos({ userId }) {
  const [programs, setPrograms]   = useState([])
  const [activeProg, setActiveProg] = useState(null)
  const [activeVariant, setActiveVariant] = useState('A')
  const [plans, setPlans]         = useState([])
  const [exercises, setExercises] = useState([])
  const [todayLogs, setTodayLogs] = useState([])
  const [recentLogs, setRecentLogs] = useState([])
  const [loading, setLoading]     = useState(true)
  const [logTarget, setLogTarget] = useState(null) // exercise being logged
  const [modal, setModal]         = useState(null)

  // Load programs
  const loadPrograms = useCallback(async () => {
    if (!userId) return
    const { data } = await supabase.from('vitta_programs')
      .select('*').eq('user_id', userId).eq('active', true).order('order_idx')
    setPrograms(data || [])
    if (data?.length && !activeProg) setActiveProg(data[0].id)
  }, [userId])

  // Load plans + exercises + today logs
  const loadPlan = useCallback(async () => {
    if (!userId || !activeProg) return
    setLoading(true)

    const [{ data: planList }, { data: logs }, { data: recent }] = await Promise.all([
      supabase.from('fitness_workout_plans')
        .select('id,name,variant').eq('user_id', userId).eq('program_id', activeProg).order('order_idx'),
      supabase.from('fitness_workout_logs')
        .select('*').eq('user_id', userId).eq('date', today()),
      supabase.from('fitness_workout_logs')
        .select('date,plan_name,exercise_name,load,reps').eq('user_id', userId)
        .order('created_at', { ascending: false }).limit(20),
    ])

    setPlans(planList || [])
    setTodayLogs(logs || [])
    setRecentLogs(recent || [])

    // Ensure selected variant exists
    const variants = (planList || []).map(p => p.variant)
    if (!variants.includes(activeVariant) && variants.length) setActiveVariant(variants[0])

    // Load exercises for active variant's plan
    const plan = (planList || []).find(p => p.variant === activeVariant) || planList?.[0]
    if (plan) {
      const { data: exList } = await supabase.from('fitness_workout_exercises')
        .select('*').eq('plan_id', plan.id).order('order_idx')
      setExercises(exList || [])
    } else {
      setExercises([])
    }
    setLoading(false)
  }, [userId, activeProg, activeVariant])

  useEffect(() => { loadPrograms() }, [loadPrograms])
  useEffect(() => { loadPlan() }, [loadPlan])

  const currentPlan = plans.find(p => p.variant === activeVariant)
  const variants    = ['A', 'B', 'C'].filter(v => plans.some(p => p.variant === v))

  // Recent logs grouped by date
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
              flexShrink: 0, transition: 'background 0.15s',
            }}>
              {prog.name}
            </button>
          ))}
          <button onClick={() => setModal('prog')} style={{
            padding: '8px 12px', borderRadius: 'var(--r-full)',
            border: '1.5px dashed var(--c-border)', background: 'none', cursor: 'pointer',
            color: 'var(--c-text-300)', flexShrink: 0,
          }}>
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Variant tabs (A / B / C) */}
      {variants.length > 0 && (
        <div style={{ display: 'flex', margin: '0 var(--page-pad-x) 20px', borderBottom: '1px solid var(--c-border)', gap: 0 }}>
          {variants.map(v => {
            const active = activeVariant === v
            const logsToday = todayLogs.filter(l => l.plan_name?.includes(v) || plans.find(p => p.variant === v && l.plan_id === p.id))
            return (
              <button key={v} onClick={() => setActiveVariant(v)} style={{
                flex: 1, padding: '10px 0', border: 'none', background: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 500,
                color: active ? 'var(--c-text-900)' : 'var(--c-text-300)',
                borderBottom: `2px solid ${active ? 'var(--c-sage)' : 'transparent'}`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                transition: 'color 0.2s',
              }}>
                {v}
                <span style={{ fontSize: 9, fontFamily: 'var(--font-ui)', color: 'var(--c-text-300)', fontWeight: 400 }}>
                  {plans.find(p => p.variant === v)?.name || `Treino ${v}`}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* Exercise list */}
      <div style={{ padding: '0 var(--page-pad-x)', marginBottom: 32 }}>
        {loading ? (
          Array.from({ length: 4 }, (_, i) => (
            <div key={i} style={{ height: 70, marginBottom: 8, borderRadius: 'var(--r-sm)' }} className="loading-shimmer" />
          ))
        ) : exercises.length > 0 ? (
          <div className="card" style={{ padding: '0 16px' }}>
            {exercises.map(ex => (
              <ExerciseRow key={ex.id} exercise={ex} todayLogs={todayLogs}
                onLog={ex => setLogTarget(ex)} />
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
        <section style={{ padding: '0 var(--page-pad-x)' }}>
          <h2 className="section-title" style={{ marginBottom: 16 }}>Histórico recente</h2>
          {recentDates.map(dt => (
            <div key={dt} style={{ marginBottom: 20 }}>
              <p style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--c-text-300)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {formatDateShort(dt)}
              </p>
              <div className="card" style={{ padding: '4px 16px' }}>
                {byDate[dt].slice(0, 5).map((l, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < byDate[dt].length - 1 ? '1px solid var(--c-border-light)' : 'none' }}>
                    <span style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--c-text-700)' }}>
                      {l.exercise_name}
                    </span>
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

      {/* Log set modal */}
      {logTarget && (
        <LogModal exercise={logTarget} planId={currentPlan?.id} planName={currentPlan?.name}
          userId={userId} onClose={() => setLogTarget(null)} onSave={loadPlan} />
      )}

      {/* Add program modal */}
      {modal === 'prog' && (
        <AddProgramModal userId={userId} onClose={() => setModal(null)} onSave={loadPrograms} />
      )}
    </div>
  )
}
