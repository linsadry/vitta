import React, { useState, useEffect, useRef } from 'react'
import { Plus, X, Check, Dumbbell } from 'lucide-react'
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
  const [load, setLoad]   = useState(exercise.target_load ? String(exercise.target_load) : '')
  const [reps, setReps]   = useState(exercise.target_reps ? String(exercise.target_reps) : '')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone]   = useState(false)

  const save = async () => {
    setSaving(true)
    await supabase.from('fitness_workout_logs').insert({
      user_id: userId, date: today(),
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
    const { data: last } = await supabase.from('vitta_programs')
      .select('order_idx').eq('user_id', userId).order('order_idx', { ascending: false }).limit(1).maybeSingle()
    await supabase.from('vitta_programs').insert({ user_id: userId, name: name.trim(), order_idx: (last?.order_idx ?? -1) + 1 })
    onSave?.(); onClose()
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
  const [programs, setPrograms]     = useState([])
  const [activeProg, setActiveProg] = useState(null)
  const [activeVariant, setActiveVariant] = useState('A')
  const [plans, setPlans]           = useState([])
  const [exercises, setExercises]   = useState([])
  const [todayLogs, setTodayLogs]   = useState([])
  const [recentLogs, setRecentLogs] = useState([])
  const [loading, setLoading]       = useState(true)
  const [logTarget, setLogTarget]   = useState(null)
  const [modal, setModal]           = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const refresh = () => setRefreshKey(k => k + 1)

  // ── Effect 1: load programs once (no activeProg dep → no loop) ──
  useEffect(() => {
    if (!userId) return
    supabase.from('vitta_programs')
      .select('*').eq('user_id', userId).eq('active', true).order('order_idx')
      .then(({ data }) => {
        const list = data || []
        setPrograms(list)
        if (list.length) {
          setActiveProg(prev => prev ?? list[0].id)
        } else {
          setLoading(false) // No programs found → stop loading
        }
      })
  }, [userId, refreshKey])

  // ── Effect 2: load plan data when program/variant changes ──────
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
            .select('date,plan_name,exercise_name,load,reps')
            .eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
        ])
        if (cancelled) return

        const pList = planList || []
        setPlans(pList)
        setTodayLogs(logs || [])
        setRecentLogs(recent || [])

        // Find the plan for the current variant, fallback to first
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
            }}>
              {prog.name}
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
        <div style={{ display: 'flex', margin: '0 var(--page-pad-x) 20px', borderBottom: '1px solid var(--c-border)' }}>
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

      {/* Log set modal */}
      {logTarget && (
        <LogModal exercise={logTarget} planId={currentPlan?.id} planName={currentPlan?.name}
          userId={userId} onClose={() => setLogTarget(null)} onSave={refresh} />
      )}

      {/* Add program modal */}
      {modal === 'prog' && (
        <AddProgramModal userId={userId} onClose={() => setModal(null)} onSave={refresh} />
      )}
    </div>
  )
}
