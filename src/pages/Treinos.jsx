// src/pages/Treinos.jsx
import React, { useState, useEffect, useCallback } from 'react'
import { Plus, X, Check, Dumbbell, Zap, ChevronLeft, Trash2, Edit2, Clock, BarChart2, ChevronDown } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { PageBotanical } from '../components/BotanicalBg'
import { today, formatDateShort } from '../lib/utils'

/* ─── HELPERS ────────────────────────────────────────────────────── */
function getWeekStart() {
  const d = new Date()
  const day = d.getDay() || 7
  d.setDate(d.getDate() - day + 1)
  return d.toISOString().split('T')[0]
}

function fmtDate(iso) {
  if (!iso) return ''
  return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtShort(iso) {
  if (!iso) return ''
  return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function calcProgress(startDate, endDate) {
  if (!startDate) return null
  const start = new Date(startDate + 'T00:00:00')
  const now   = new Date()
  const end   = endDate ? new Date(endDate + 'T00:00:00') : null
  const daysElapsed = Math.max(0, Math.floor((now - start) / 86400000))
  const totalDays   = end ? Math.floor((end - start) / 86400000) : null
  const totalWeeks  = totalDays ? Math.ceil(totalDays / 7) : null
  const currentWeek = Math.floor(daysElapsed / 7) + 1
  const pct = totalDays ? Math.min(daysElapsed / totalDays, 1) : null
  return { daysElapsed, totalDays, totalWeeks, currentWeek, pct }
}

/* ─── FAB ────────────────────────────────────────────────────────── */
const QUICK_TYPES = ['Força', 'Corrida', 'Caminhada', 'Yoga', 'Pilates', 'Alongamento', 'Outro']

function FABMenu({ userId, programs, activeProg, plans, onClose, onSaved }) {
  const [step, setStep]         = useState('type')   // 'type' | 'strength' | 'cardio'
  const [type, setType]         = useState('')
  const [selProg, setSelProg]   = useState(activeProg)
  const [selPlan, setSelPlan]   = useState(null)
  const [progPlans, setProgPlans] = useState(plans)
  const [duration, setDuration] = useState('')
  const [distance, setDistance] = useState('')
  const [fc, setFc]             = useState('')
  const [notes, setNotes]       = useState('')
  const [saving, setSaving]     = useState(false)
  const [done, setDone]         = useState(false)

  useEffect(() => {
    if (selProg && selProg !== activeProg) {
      supabase.from('fitness_workout_plans')
        .select('id,name,variant').eq('program_id', selProg).order('order_idx')
        .then(({ data }) => setProgPlans(data || []))
    } else {
      setProgPlans(plans)
    }
  }, [selProg])

  const chooseType = (t) => {
    setType(t)
    setStep(t === 'Força' ? 'strength' : 'cardio')
  }

  const save = async () => {
    setSaving(true)
    const plan = progPlans.find(p => p.id === selPlan)
    const label = type === 'Força'
      ? `Força · Treino ${plan?.variant ?? ''}`
      : duration ? `${type} · ${duration} min` : type

    await supabase.from('fitness_workout_logs').insert({
      user_id: userId,
      date: today(),
      plan_id:   type === 'Força' ? (selPlan ?? null) : null,
      plan_name: type === 'Força' ? (plan?.name ?? null) : null,
      exercise_id:   null,
      exercise_name: label,
      set_number: 1,
      reps: null,
      load: null,
      notes: [
        distance && `Distância: ${distance} km`,
        fc && `FC: ${fc} bpm`,
        notes,
      ].filter(Boolean).join(' · ') || null,
    })
    setDone(true)
    setTimeout(() => { onSaved?.(); onClose() }, 700)
  }

  const s = { fontFamily: 'var(--font-ui)', fontSize: 13 }

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 className="sheet-title" style={{ marginBottom: 0, fontSize: 20 }}>
            {step === 'type' ? 'Registrar atividade' : type}
          </h2>
          <button onClick={onClose} className="btn-ghost" style={{ padding: 8 }}><X size={18} strokeWidth={1.8} /></button>
        </div>

        {done ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '20px 0' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--c-sage-faint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Check size={24} strokeWidth={2} style={{ color: 'var(--c-sage)' }} />
            </div>
            <p style={{ fontFamily: 'var(--font-editorial)', fontSize: 18, color: 'var(--c-text-700)', fontStyle: 'italic' }}>Registrado!</p>
          </div>
        ) : step === 'type' ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {QUICK_TYPES.map(t => (
              <button key={t} onClick={() => chooseType(t)} style={{
                padding: '10px 18px', borderRadius: 'var(--r-full)',
                border: '1.5px solid var(--c-border)',
                background: 'none', cursor: 'pointer',
                color: 'var(--c-text-700)', ...s,
              }}>{t}</button>
            ))}
          </div>
        ) : step === 'strength' ? (
          <>
            {programs.length > 1 && (
              <div style={{ marginBottom: 14 }}>
                <label className="input-label">Programa</label>
                <select className="input-field" value={selProg ?? ''} onChange={e => { setSelProg(e.target.value); setSelPlan(null) }}>
                  {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            )}
            <div style={{ marginBottom: 20 }}>
              <label className="input-label">Treino</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {progPlans.map(p => (
                  <button key={p.id} onClick={() => setSelPlan(p.id)} style={{
                    flex: 1, padding: '12px 0', borderRadius: 'var(--r-md)',
                    border: `1.5px solid ${selPlan === p.id ? 'var(--c-sage)' : 'var(--c-border)'}`,
                    background: selPlan === p.id ? 'var(--c-sage-faint)' : 'none',
                    color: selPlan === p.id ? 'var(--c-sage)' : 'var(--c-text-500)',
                    fontFamily: 'var(--font-display)', fontSize: 20, cursor: 'pointer',
                  }}>{p.variant}</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label className="input-label">Observação (opcional)</label>
              <input className="input-field" type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Ex: foco em quadríceps" />
            </div>
            <button className="btn-primary" onClick={save} disabled={saving || !selPlan}>
              {saving ? 'Salvando...' : '✓ Registrar sessão'}
            </button>
          </>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label className="input-label">Duração (min)</label>
                <input className="input-field" type="text" inputMode="numeric" placeholder="45" value={duration} onChange={e => setDuration(e.target.value)} style={{ textAlign: 'center', fontSize: 20 }} />
              </div>
              {(type === 'Corrida' || type === 'Caminhada') && (
                <div>
                  <label className="input-label">Distância (km)</label>
                  <input className="input-field" type="text" inputMode="decimal" placeholder="5.0" value={distance} onChange={e => setDistance(e.target.value)} style={{ textAlign: 'center', fontSize: 20 }} />
                </div>
              )}
            </div>
            {(type === 'Corrida' || type === 'Caminhada') && (
              <div style={{ marginBottom: 14 }}>
                <label className="input-label">FC média (bpm)</label>
                <input className="input-field" type="text" inputMode="numeric" placeholder="140" value={fc} onChange={e => setFc(e.target.value)} style={{ textAlign: 'center', fontSize: 20 }} />
              </div>
            )}
            <div style={{ marginBottom: 20 }}>
              <label className="input-label">Observação</label>
              <input className="input-field" type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Opcional" />
            </div>
            <button className="btn-primary" onClick={save} disabled={saving}>
              {saving ? 'Salvando...' : '✓ Registrar'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

/* ─── LOG EXERCISE MODAL ─────────────────────────────────────────── */
function LogModal({ exercise, planId, planName, userId, onClose, onSave }) {
  const [date, setDate]   = useState(today())
  const [sets, setSets]   = useState([{ load: exercise.target_load ? String(exercise.target_load) : '', reps: exercise.target_reps ? String(exercise.target_reps) : '' }])
  const [rpe, setRpe]     = useState(null)
  const [feel, setFeel]   = useState(null)
  const [lastSets, setLastSets] = useState([])
  const [saving, setSaving] = useState(false)
  const [done, setDone]   = useState(false)

  useEffect(() => {
    // Carrega última sessão deste exercício
    supabase.from('fitness_workout_logs')
      .select('date, load, reps, set_number')
      .eq('user_id', userId)
      .eq('exercise_id', exercise.id)
      .neq('load', null)
      .order('date', { ascending: false })
      .order('set_number', { ascending: true })
      .limit(10)
      .then(({ data }) => {
        if (!data?.length) return
        // Pega sets da sessão mais recente
        const lastDate = data[0].date
        const recent = data.filter(l => l.date === lastDate)
        setLastSets(recent)
        // Pré-preenche com cargas anteriores
        setSets(recent.map(l => ({ load: String(l.load ?? ''), reps: String(l.reps ?? exercise.target_reps ?? '') })))
      })
  }, [exercise.id])

  const updateSet = (i, field, val) => setSets(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s))
  const addSet = () => setSets(prev => [...prev, { load: prev[prev.length - 1]?.load ?? '', reps: prev[prev.length - 1]?.reps ?? '' }])
  const removeSet = (i) => { if (sets.length > 1) setSets(prev => prev.filter((_, idx) => idx !== i)) }

  const save = async () => {
    setSaving(true)
    const rows = sets.filter(s => s.load !== '' || s.reps !== '').map((s, i) => ({
      user_id: userId,
      date,
      plan_id: planId,
      plan_name: planName,
      exercise_id: exercise.id,
      exercise_name: exercise.name,
      set_number: i + 1,
      reps: s.reps ? parseInt(s.reps) : null,
      load: s.load ? parseFloat(String(s.load).replace(',', '.')) : null,
      notes: [rpe && `RPE ${rpe}`, feel].filter(Boolean).join(' · ') || null,
    }))
    if (rows.length) await supabase.from('fitness_workout_logs').insert(rows)
    setDone(true)
    setTimeout(() => { onSave?.(); onClose() }, 600)
  }

  const totalVol = sets.reduce((acc, s) => acc + ((parseFloat(s.load) || 0) * (parseInt(s.reps) || 0)), 0)

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" style={{ maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <h2 className="sheet-title" style={{ marginBottom: 0, fontSize: 20 }}>{exercise.name}</h2>
          <button onClick={onClose} className="btn-ghost" style={{ padding: 8 }}><X size={18} strokeWidth={1.8} /></button>
        </div>
        <p style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--c-text-300)', marginBottom: lastSets.length ? 8 : 20 }}>
          {[exercise.target_sets && `${exercise.target_sets} séries`, exercise.target_reps && `${exercise.target_reps} reps`, exercise.target_load && `${exercise.target_load} kg`].filter(Boolean).join(' · ')}
        </p>

        {lastSets.length > 0 && (
          <div style={{ background: 'var(--c-base-2)', borderRadius: 'var(--r-sm)', padding: '8px 12px', marginBottom: 20 }}>
            <p style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--c-text-300)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Última sessão
            </p>
            <p style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--c-text-700)', fontWeight: 500 }}>
              {lastSets.map(s => `${s.load}kg × ${s.reps}`).join(' · ')}
            </p>
          </div>
        )}

        {done ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '20px 0' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--c-sage-faint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Check size={24} strokeWidth={2} style={{ color: 'var(--c-sage)' }} />
            </div>
            <p style={{ fontFamily: 'var(--font-editorial)', fontSize: 18, color: 'var(--c-text-700)', fontStyle: 'italic' }}>Séries registradas</p>
          </div>
        ) : (
          <>
            {/* Data */}
            <div style={{ marginBottom: 16 }}>
              <label className="input-label">Data</label>
              <input className="input-field" type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>

            {/* Séries */}
            <div style={{ marginBottom: 4 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '20px 1fr 1fr 20px', gap: 8, marginBottom: 8 }}>
                <span />
                <label className="input-label" style={{ textAlign: 'center' }}>Peso (kg)</label>
                <label className="input-label" style={{ textAlign: 'center' }}>Reps</label>
                <span />
              </div>
              {sets.map((s, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '20px 1fr 1fr 20px', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--c-text-300)', textAlign: 'center' }}>{i + 1}</span>
                  <input className="input-field" type="text" inputMode="decimal" placeholder="0"
                    value={s.load} onChange={e => updateSet(i, 'load', e.target.value)}
                    style={{ textAlign: 'center', fontSize: 20, fontFamily: 'var(--font-display)', padding: '10px 8px' }} />
                  <input className="input-field" type="text" inputMode="numeric" placeholder="0"
                    value={s.reps} onChange={e => updateSet(i, 'reps', e.target.value)}
                    style={{ textAlign: 'center', fontSize: 20, fontFamily: 'var(--font-display)', padding: '10px 8px' }} />
                  <button onClick={() => removeSet(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-text-200)', fontSize: 18, lineHeight: 1 }}>×</button>
                </div>
              ))}
            </div>

            <button onClick={addSet} style={{
              width: '100%', padding: '10px', border: '1.5px dashed var(--c-border)',
              borderRadius: 'var(--r-sm)', background: 'none', cursor: 'pointer',
              color: 'var(--c-text-400)', fontFamily: 'var(--font-ui)', fontSize: 13, marginBottom: 16,
            }}>
              + Adicionar série
            </button>

            {totalVol > 0 && (
              <p style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--c-text-300)', textAlign: 'center', marginBottom: 16 }}>
                Volume total: <strong style={{ color: 'var(--c-text-700)' }}>{totalVol} kg</strong>
              </p>
            )}

            {/* RPE */}
            <div style={{ marginBottom: 14 }}>
              <label className="input-label" style={{ display: 'block', marginBottom: 8 }}>RPE (opcional)</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {[6,7,8,9,10].map(r => (
                  <button key={r} onClick={() => setRpe(rpe === r ? null : r)} style={{
                    flex: 1, padding: '8px 0', borderRadius: 'var(--r-sm)',
                    border: `1.5px solid ${rpe === r ? 'var(--c-sage)' : 'var(--c-border)'}`,
                    background: rpe === r ? 'var(--c-sage-faint)' : 'none',
                    color: rpe === r ? 'var(--c-sage)' : 'var(--c-text-400)',
                    fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 500, cursor: 'pointer',
                  }}>{r}</button>
                ))}
              </div>
            </div>

            {/* Sensação */}
            <div style={{ marginBottom: 24 }}>
              <label className="input-label" style={{ display: 'block', marginBottom: 8 }}>Como foi?</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[['facil','🙂 Fácil'],['moderado','😐 Moderado'],['dificil','😮 Difícil']].map(([k,l]) => (
                  <button key={k} onClick={() => setFeel(feel === k ? null : k)} style={{
                    flex: 1, padding: '9px 0', borderRadius: 'var(--r-sm)',
                    border: `1.5px solid ${feel === k ? 'var(--c-text-900)' : 'var(--c-border)'}`,
                    background: feel === k ? 'var(--c-text-900)' : 'none',
                    color: feel === k ? 'var(--c-base-0)' : 'var(--c-text-500)',
                    fontFamily: 'var(--font-ui)', fontSize: 12, cursor: 'pointer',
                  }}>{l}</button>
                ))}
              </div>
            </div>

            <button className="btn-primary" onClick={save} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

/* ─── EXERCISE HISTORY MODAL ─────────────────────────────────────── */
function HistoryModal({ exercise, userId, onClose }) {
  const [logs, setLogs]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('fitness_workout_logs')
      .select('date, load, reps, set_number')
      .eq('user_id', userId).eq('exercise_id', exercise.id)
      .order('date', { ascending: false }).order('set_number', { ascending: true })
      .limit(60)
      .then(({ data }) => { setLogs(data || []); setLoading(false) })
  }, [])

  // Agrupar por data
  const byDate = logs.reduce((acc, l) => {
    if (!acc[l.date]) acc[l.date] = []
    acc[l.date].push(l)
    return acc
  }, {})
  const dates = Object.keys(byDate).sort((a,b) => b.localeCompare(a))

  const maxLoad  = logs.length ? Math.max(...logs.map(l => l.load ?? 0)) : 0
  const firstLoad = dates.length ? (byDate[dates[dates.length-1]][0]?.load ?? 0) : 0
  const lastLoad  = dates.length ? (byDate[dates[0]][0]?.load ?? 0) : 0
  const delta = lastLoad - firstLoad

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" style={{ maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <h2 className="sheet-title" style={{ marginBottom: 0, fontSize: 20 }}>{exercise.name}</h2>
          <button onClick={onClose} className="btn-ghost" style={{ padding: 8 }}><X size={18} strokeWidth={1.8} /></button>
        </div>

        {!loading && logs.length > 0 && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, marginTop: 12 }}>
            {[
              ['Maior carga', `${maxLoad} kg`],
              ['Evolução', delta >= 0 ? `+${delta} kg` : `${delta} kg`],
              ['Sessões', String(dates.length)],
            ].map(([label, val]) => (
              <div key={label} style={{ flex: 1, background: 'var(--c-base-2)', borderRadius: 'var(--r-sm)', padding: '10px 8px', textAlign: 'center' }}>
                <p style={{ fontFamily: 'var(--font-ui)', fontSize: 10, color: 'var(--c-text-300)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>{label}</p>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 500, color: delta > 0 && label === 'Evolução' ? 'var(--c-sage)' : 'var(--c-text-900)' }}>{val}</p>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--c-text-300)', fontFamily: 'var(--font-ui)', fontSize: 13 }}>Carregando...</div>
        ) : dates.length === 0 ? (
          <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--c-text-300)', fontFamily: 'var(--font-ui)', fontSize: 13 }}>Nenhum registro ainda</div>
        ) : (
          dates.map(dt => (
            <div key={dt} style={{ marginBottom: 16 }}>
              <p style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--c-text-300)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
                {fmtShort(dt)}
              </p>
              <div className="card" style={{ padding: '6px 14px' }}>
                {byDate[dt].map((l, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: i < byDate[dt].length - 1 ? '1px solid var(--c-border-light)' : 'none',
                  }}>
                    <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--c-text-400)' }}>Série {l.set_number}</span>
                    <span style={{ fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 500, color: 'var(--c-text-800)' }}>
                      {[l.load && `${l.load} kg`, l.reps && `× ${l.reps}`].filter(Boolean).join(' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

/* ─── ADD/EDIT EXERCISE MODAL ────────────────────────────────────── */
function AddExerciseModal({ planId, userId, exercise, onClose, onSave }) {
  const [name, setName]   = useState(exercise?.name ?? '')
  const [sets, setSets]   = useState(exercise?.target_sets ? String(exercise.target_sets) : '3')
  const [reps, setReps]   = useState(exercise?.target_reps ? String(exercise.target_reps) : '12')
  const [load, setLoad]   = useState(exercise?.target_load ? String(exercise.target_load) : '')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!name.trim()) return
    setSaving(true)
    if (exercise) {
      await supabase.from('fitness_workout_exercises').update({
        name: name.trim(),
        target_sets: parseInt(sets) || null,
        target_reps: parseInt(reps) || null,
        target_load: load ? parseFloat(load) : null,
      }).eq('id', exercise.id)
    } else {
      const { data: last } = await supabase.from('fitness_workout_exercises')
        .select('order_idx').eq('plan_id', planId).order('order_idx', { ascending: false }).limit(1).maybeSingle()
      await supabase.from('fitness_workout_exercises').insert({
  plan_id: planId,
  user_id: userId,
  name: name.trim(),
  target_sets: parseInt(sets) || 3,
  target_reps: parseInt(reps) || 12,
  target_load: load ? parseFloat(load) : null,
  order_idx: (last?.order_idx ?? -1) + 1,
})
    }
    onSave?.(); onClose()
  }

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        <h2 className="sheet-title">{exercise ? 'Editar exercício' : 'Adicionar exercício'}</h2>

        <label className="input-label">Nome do exercício</label>
        <input className="input-field" type="text" value={name} onChange={e => setName(e.target.value)}
          placeholder="Ex: Leg Press" autoFocus style={{ marginBottom: 14 }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
          <div><label className="input-label">Séries</label><input className="input-field" type="text" inputMode="numeric" value={sets} onChange={e => setSets(e.target.value)} style={{ textAlign: 'center' }} /></div>
          <div><label className="input-label">Reps</label><input className="input-field" type="text" inputMode="numeric" value={reps} onChange={e => setReps(e.target.value)} style={{ textAlign: 'center' }} /></div>
          <div><label className="input-label">Carga kg</label><input className="input-field" type="text" inputMode="decimal" value={load} onChange={e => setLoad(e.target.value)} placeholder="—" style={{ textAlign: 'center' }} /></div>
        </div>

        <button className="btn-primary" onClick={save} disabled={!name.trim() || saving}>
          {saving ? 'Salvando...' : exercise ? 'Salvar alterações' : 'Adicionar'}
        </button>
      </div>
    </div>
  )
}

/* ─── CREATE PROGRAM MODAL ───────────────────────────────────────── */
const OBJECTIVES = [
  { key: 'hipertrofia', label: 'Hipertrofia' },
  { key: 'emagrecimento', label: 'Emagrecimento' },
  { key: 'condicionamento', label: 'Condicionamento' },
  { key: 'manutencao', label: 'Manutenção' },
  { key: 'corrida', label: 'Corrida' },
  { key: 'retorno', label: 'Retorno' },
]

function CreateProgramModal({ userId, onClose, onSave }) {
  const [name, setName]           = useState('')
  const [objective, setObjective] = useState('hipertrofia')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate]     = useState('')
  const [variants, setVariants]   = useState(['A', 'B'])
  const [saving, setSaving]       = useState(false)

  const toggleVariant = (v) => {
    setVariants(prev =>
      prev.includes(v) ? (prev.length > 1 ? prev.filter(x => x !== v) : prev) : [...prev, v].sort()
    )
  }

  const save = async () => {
    if (!name.trim()) return
    setSaving(true)
    const { data: last } = await supabase.from('vitta_programs')
      .select('order_idx').eq('user_id', userId).order('order_idx', { ascending: false }).limit(1).maybeSingle()

    const { data: prog } = await supabase.from('vitta_programs').insert({
      user_id: userId, name: name.trim(),
      order_idx: (last?.order_idx ?? -1) + 1,
      active: true,
      start_date: startDate || null,
      end_date: endDate || null,
    }).select().single()

    if (prog) {
      for (let i = 0; i < variants.length; i++) {
        await supabase.from('fitness_workout_plans').insert({
          user_id: userId, program_id: prog.id,
          name: `Treino ${variants[i]}`, variant: variants[i], order_idx: i,
        })
      }
    }
    onSave?.(); onClose()
  }

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" style={{ maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        <h2 className="sheet-title">Novo programa</h2>

        <label className="input-label">Nome</label>
        <input className="input-field" type="text" placeholder="Ex: Retorno · Hipertrofia 2"
          value={name} onChange={e => setName(e.target.value)} autoFocus style={{ marginBottom: 18 }} />

        <label className="input-label" style={{ display: 'block', marginBottom: 10 }}>Objetivo</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          {OBJECTIVES.map(o => (
            <button key={o.key} onClick={() => setObjective(o.key)} style={{
              padding: '8px 14px', borderRadius: 'var(--r-full)', cursor: 'pointer',
              border: `1.5px solid ${objective === o.key ? 'var(--c-sage)' : 'var(--c-border)'}`,
              background: objective === o.key ? 'var(--c-sage-faint)' : 'none',
              color: objective === o.key ? 'var(--c-sage)' : 'var(--c-text-500)',
              fontFamily: 'var(--font-ui)', fontSize: 13,
            }}>{o.label}</button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <div><label className="input-label">Início</label><input className="input-field" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
          <div><label className="input-label">Fim (opcional)</label><input className="input-field" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
        </div>

        <label className="input-label" style={{ display: 'block', marginBottom: 10 }}>Treinos</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {['A','B','C','D'].map(v => (
            <button key={v} onClick={() => toggleVariant(v)} style={{
              width: 48, height: 48, borderRadius: 'var(--r-sm)',
              border: `1.5px solid ${variants.includes(v) ? 'var(--c-sage)' : 'var(--c-border)'}`,
              background: variants.includes(v) ? 'var(--c-sage-faint)' : 'none',
              color: variants.includes(v) ? 'var(--c-sage)' : 'var(--c-text-300)',
              fontFamily: 'var(--font-display)', fontSize: 20, cursor: 'pointer',
            }}>{v}</button>
          ))}
        </div>

        <button className="btn-primary" onClick={save} disabled={!name.trim() || saving}>
          {saving ? 'Criando...' : 'Criar programa'}
        </button>
      </div>
    </div>
  )
}

/* ─── PROGRAM HISTORY MODAL ──────────────────────────────────────── */
function ProgramHistoryModal({ userId, activeProg, onClose, onSwitch }) {
  const [programs, setPrograms] = useState([])

  useEffect(() => {
    supabase.from('vitta_programs')
      .select('id,name,start_date,end_date,active')
      .eq('user_id', userId).order('order_idx', { ascending: false })
      .then(({ data }) => setPrograms(data || []))
  }, [])

  const setActive = async (id) => {
    await supabase.from('vitta_programs').update({ active: false }).eq('user_id', userId)
    await supabase.from('vitta_programs').update({ active: true }).eq('id', id)
    onSwitch?.(); onClose()
  }

  const deleteProgram = async (id) => {
    if (!confirm('Excluir este programa?')) return
    await supabase.from('vitta_programs').delete().eq('id', id)
    setPrograms(prev => prev.filter(p => p.id !== id))
  }

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" style={{ maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        <h2 className="sheet-title">Programas</h2>
        {programs.map(p => (
          <div key={p.id} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 0', borderBottom: '1px solid var(--c-border-light)',
          }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: p.active ? 600 : 400, color: p.active ? 'var(--c-text-900)' : 'var(--c-text-600)' }}>
                {p.name} {p.active && <span style={{ fontSize: 11, color: 'var(--c-sage)', fontWeight: 400, marginLeft: 4 }}>ativo</span>}
              </p>
              {p.start_date && (
                <p style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--c-text-300)' }}>
                  {fmtShort(p.start_date)}{p.end_date ? ` → ${fmtShort(p.end_date)}` : ''}
                </p>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {!p.active && (
                <button onClick={() => setActive(p.id)} style={{
                  padding: '6px 12px', borderRadius: 'var(--r-full)',
                  border: '1.5px solid var(--c-border)', background: 'none', cursor: 'pointer',
                  fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--c-text-500)',
                }}>Ativar</button>
              )}
              <button onClick={() => deleteProgram(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-text-200)', padding: 4 }}>
                <Trash2 size={15} strokeWidth={1.8} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
/* ─── COPY WEIGHTS POPUP ─────────────────────────────────────────── */
function CopyWeightsPopup({ onYes, onNo }) {
  return (
    <div style={{ position:'fixed', inset:0, zIndex:60, display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
      <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.35)' }} onClick={onNo} />
      <div style={{
        position:'relative', width:'100%', maxWidth:480,
        background:'var(--c-base-0)', borderRadius:'24px 24px 0 0',
        padding:'28px 24px 40px', boxShadow:'0 -8px 40px rgba(0,0,0,0.12)',
      }}>
        <div style={{ width:32, height:4, borderRadius:2, background:'var(--c-border)', margin:'0 auto 24px' }} />
        <p style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:500, color:'var(--c-text-900)', marginBottom:8, textAlign:'center' }}>
          Copiar cargas anteriores?
        </p>
        <p style={{ fontFamily:'var(--font-ui)', fontSize:13, color:'var(--c-text-400)', textAlign:'center', marginBottom:28, lineHeight:1.6 }}>
          Os pesos do último treino serão preenchidos automaticamente.
          Ajuste apenas o que aumentar.
        </p>
        <div style={{ display:'flex', gap:12 }}>
          <button onClick={onNo} style={{
            flex:1, padding:'14px 0', borderRadius:'var(--r-full)',
            border:'1.5px solid var(--c-border)', background:'none',
            fontFamily:'var(--font-ui)', fontSize:14, color:'var(--c-text-500)', cursor:'pointer',
          }}>Não</button>
          <button onClick={onYes} style={{
            flex:2, padding:'14px 0', borderRadius:'var(--r-full)',
            border:'none', background:'var(--c-text-900)',
            fontFamily:'var(--font-ui)', fontSize:14, fontWeight:600, color:'var(--c-base-0)', cursor:'pointer',
          }}>Sim, copiar</button>
        </div>
      </div>
    </div>
  )
}

/* ─── SESSION SUMMARY SHEET ──────────────────────────────────────── */
function SessionSummarySheet({ durationSecs, exercises, sessionLogs, onClose, onDone }) {
  const fmtDur = (s) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    if (m >= 60) return `${Math.floor(m/60)}h ${m%60}min`
    return `${m}min ${String(sec).padStart(2,'0')}s`
  }

  const totalVol = sessionLogs.reduce((acc, l) => acc + ((l.load||0) * (l.reps||0)), 0)
  const maxLoad  = sessionLogs.length ? Math.max(...sessionLogs.map(l => l.load||0)) : 0
  const sets     = sessionLogs.length

  // PRs: exercícios onde a carga hoje > carga anterior
  const prs = exercises.filter(ex => {
    const todaySets = sessionLogs.filter(l => l.exercise_id === ex.id)
    const todayMax  = todaySets.length ? Math.max(...todaySets.map(l => l.load||0)) : 0
    const prevMax   = ex._prevMax || 0
    return todayMax > 0 && todayMax > prevMax
  })

  return (
    <div style={{ position:'fixed', inset:0, zIndex:60, display:'flex', alignItems:'flex-end' }}>
      <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.4)' }} />
      <div style={{
        position:'relative', width:'100%', background:'var(--c-base-0)',
        borderRadius:'24px 24px 0 0', padding:'28px 24px 48px',
        maxHeight:'88vh', overflowY:'auto',
      }}>
        <div style={{ width:32, height:4, borderRadius:2, background:'var(--c-border)', margin:'0 auto 24px' }} />

        {/* Header */}
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{
            width:64, height:64, borderRadius:'50%', background:'var(--c-sage-faint)',
            display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px',
          }}>
            <Check size={28} strokeWidth={2.5} style={{ color:'var(--c-sage)' }} />
          </div>
          <h2 style={{ fontFamily:'var(--font-display)', fontSize:24, fontWeight:500, color:'var(--c-text-900)', marginBottom:4 }}>
            Treino finalizado
          </h2>
          <p style={{ fontFamily:'var(--font-editorial)', fontSize:15, color:'var(--c-text-400)', fontStyle:'italic' }}>
            Excelente trabalho hoje.
          </p>
        </div>

        {/* Stats grid */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:20 }}>
          {[
            { label:'Duração', value: fmtDur(durationSecs) },
            { label:'Séries totais', value: String(sets) },
            { label:'Volume total', value: totalVol > 0 ? `${totalVol.toLocaleString('pt-BR')} kg` : '—' },
            { label:'Maior carga', value: maxLoad > 0 ? `${maxLoad} kg` : '—' },
          ].map(({ label, value }) => (
            <div key={label} style={{
              background:'var(--c-base-1)', borderRadius:'var(--r-md)',
              padding:'14px 14px 12px', textAlign:'center',
            }}>
              <p style={{ fontFamily:'var(--font-ui)', fontSize:10, color:'var(--c-text-300)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>{label}</p>
              <p style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:500, color:'var(--c-text-900)' }}>{value}</p>
            </div>
          ))}
        </div>

        {/* PRs */}
        {prs.length > 0 && (
          <div style={{ background:'rgba(138,158,140,0.1)', border:'1px solid rgba(138,158,140,0.25)', borderRadius:'var(--r-md)', padding:'14px 16px', marginBottom:20 }}>
            <p style={{ fontFamily:'var(--font-ui)', fontSize:11, color:'var(--c-sage)', textTransform:'uppercase', letterSpacing:'0.06em', fontWeight:600, marginBottom:10 }}>
              Recordes pessoais
            </p>
            {prs.map(ex => {
              const todaySets = sessionLogs.filter(l => l.exercise_id === ex.id)
              const todayMax  = Math.max(...todaySets.map(l => l.load||0))
              const delta     = todayMax - (ex._prevMax||0)
              return (
                <div key={ex.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                  <span style={{ fontFamily:'var(--font-ui)', fontSize:13, color:'var(--c-text-700)' }}>{ex.name}</span>
                  <span style={{ fontFamily:'var(--font-ui)', fontSize:13, fontWeight:600, color:'var(--c-sage)' }}>
                    {ex._prevMax ? `+${delta} kg` : 'Primeiro registro'}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        <button onClick={onDone} style={{
          width:'100%', padding:'16px 0', borderRadius:'var(--r-full)',
          border:'none', background:'var(--c-text-900)',
          fontFamily:'var(--font-ui)', fontSize:15, fontWeight:600,
          color:'var(--c-base-0)', cursor:'pointer',
        }}>
          Concluir
        </button>
      </div>
    </div>
  )
}

/* ─── WORKOUT VIEW ───────────────────────────────────────────────── */
function WorkoutView({ plan, userId, prog, onBack, onRefresh }) {
  const [exercises, setExercises]     = useState([])
  const [lastLogs, setLastLogs]       = useState({})
  const [logTarget, setLogTarget]     = useState(null)
  const [histTarget, setHistTarget]   = useState(null)
  const [addModal, setAddModal]       = useState(false)
  const [editTarget, setEditTarget]   = useState(null)
  const [loading, setLoading]         = useState(true)

  // Session state
  const [sessionMode, setSessionMode]       = useState(false)
  const [showCopyPopup, setShowCopyPopup]   = useState(false)
  const [completedIds, setCompletedIds]     = useState(new Set())
  const [sessionStart, setSessionStart]     = useState(null)
  const [elapsed, setElapsed]               = useState(0)
  const [sessionLogs, setSessionLogs]       = useState([])
  const [showSummary, setShowSummary]       = useState(false)
  const [copyWeights, setCopyWeights]       = useState(false)

  // Timer
  useEffect(() => {
    if (!sessionMode || !sessionStart) return
    const iv = setInterval(() => setElapsed(Math.floor((Date.now() - sessionStart) / 1000)), 1000)
    return () => clearInterval(iv)
  }, [sessionMode, sessionStart])

  const fmtElapsed = (s) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
  }

  const load = useCallback(async () => {
    setLoading(true)
    const { data: exs } = await supabase.from('fitness_workout_exercises')
      .select('*').eq('plan_id', plan.id).order('order_idx')
    const list = exs || []

    if (list.length) {
      const ids = list.map(e => e.id)
      const { data: logs } = await supabase.from('fitness_workout_logs')
        .select('date, load, reps, set_number, exercise_id')
        .in('exercise_id', ids).eq('user_id', userId)
        .order('date', { ascending: false })
        .order('set_number', { ascending: true })
        .limit(300)

      const map = {}
      if (logs) {
        logs.forEach(l => {
          if (!map[l.exercise_id]) map[l.exercise_id] = { date: l.date, sets: [], maxLoad: 0 }
          if (l.date === map[l.exercise_id].date) map[l.exercise_id].sets.push(l)
          map[l.exercise_id].maxLoad = Math.max(map[l.exercise_id].maxLoad, l.load || 0)
        })
      }
      // Attach _prevMax to each exercise for PR detection
      list.forEach(ex => { ex._prevMax = map[ex.id]?.maxLoad || 0 })
      setLastLogs(map)
    }
    setExercises(list)
    setLoading(false)
  }, [plan.id, userId])

  useEffect(() => { load() }, [load])

  const startSession = (withCopy) => {
    setCopyWeights(withCopy)
    setShowCopyPopup(false)
    setSessionMode(true)
    setSessionStart(Date.now())
    setElapsed(0)
    setCompletedIds(new Set())
    setSessionLogs([])
  }

  const handleExerciseLogged = (exerciseId, newLogs) => {
    setCompletedIds(prev => new Set([...prev, exerciseId]))
    setSessionLogs(prev => [...prev.filter(l => l.exercise_id !== exerciseId), ...newLogs])
    setLogTarget(null)
  }

  const handleFinalize = async () => {
    const durationMins = Math.round(elapsed / 60)
    const totalVol = sessionLogs.reduce((acc, l) => acc + ((l.load||0) * (l.reps||0)), 0)
    // Salva resumo da sessão no log (uma entrada especial)
    await supabase.from('fitness_workout_logs').insert({
      user_id: userId,
      date: today(),
      plan_id: plan.id,
      plan_name: plan.name,
      exercise_id: null,
      exercise_name: `Sessão · Treino ${plan.variant} · ${durationMins}min · ${totalVol}kg vol`,
      set_number: 0,
    })
    setShowSummary(true)
  }

  const deleteExercise = async (id) => {
    if (!confirm('Excluir exercício?')) return
    await supabase.from('fitness_workout_exercises').delete().eq('id', id)
    load()
  }

  const allDone = exercises.length > 0 && completedIds.size >= exercises.length
  const progress = exercises.length ? (completedIds.size / exercises.length) : 0

  return (
    <div style={{ minHeight:'100%', paddingBottom: sessionMode ? 120 : 100 }}>

      {/* Header */}
      <div style={{
        padding:'52px var(--page-pad-x) 16px',
        borderBottom:'1px solid var(--c-border-light)',
      }}>
        <div style={{ display:'flex', alignItems:'flex-end', gap:12 }}>
          <button onClick={onBack} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--c-text-400)', padding:'0 0 2px', flexShrink:0 }}>
            <ChevronLeft size={22} strokeWidth={1.8} />
          </button>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontFamily:'var(--font-ui)', fontSize:11, color:'var(--c-text-300)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:2 }}>
              {prog?.name}
            </p>
            <h1 style={{ fontFamily:'var(--font-display)', fontSize:28, fontWeight:500, color:'var(--c-text-900)', letterSpacing:'-0.02em' }}>
              Treino {plan.variant}
            </h1>
          </div>
          {/* Timer */}
          {sessionMode && (
            <div style={{
              background:'var(--c-text-900)', borderRadius:'var(--r-full)',
              padding:'6px 14px', flexShrink:0,
            }}>
              <span style={{ fontFamily:'var(--font-ui)', fontSize:14, fontWeight:600, color:'var(--c-base-0)', fontVariantNumeric:'tabular-nums' }}>
                {fmtElapsed(elapsed)}
              </span>
            </div>
          )}
        </div>

        {/* Session progress bar */}
        {sessionMode && exercises.length > 0 && (
          <div style={{ marginTop:14 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
              <span style={{ fontFamily:'var(--font-ui)', fontSize:12, color:'var(--c-text-400)' }}>
                {completedIds.size} de {exercises.length} exercícios
              </span>
              <span style={{ fontFamily:'var(--font-ui)', fontSize:12, color:'var(--c-sage)', fontWeight:500 }}>
                {Math.round(progress * 100)}%
              </span>
            </div>
            <div style={{ height:4, background:'var(--c-base-2)', borderRadius:99, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${progress * 100}%`, background:'var(--c-sage)', borderRadius:99, transition:'width 0.4s' }} />
            </div>
          </div>
        )}
      </div>

      {/* Exercises */}
      <div style={{ padding:'16px var(--page-pad-x)', display:'flex', flexDirection:'column', gap:10 }}>
        {loading ? (
          Array.from({ length: 4 }, (_, i) => (
            <div key={i} style={{ height:88, borderRadius:'var(--r-md)' }} className="loading-shimmer" />
          ))
        ) : exercises.length === 0 ? (
          <div className="empty-state">
            <Dumbbell size={28} style={{ color:'var(--c-text-100)' }} />
            <p className="empty-state-text">Nenhum exercício. Adicione abaixo.</p>
          </div>
        ) : exercises.map(ex => {
          const last = lastLogs[ex.id]
          const done = completedIds.has(ex.id)

          // Progressão: compara carga da sessão atual com carga anterior
          const sessionExLogs = sessionLogs.filter(l => l.exercise_id === ex.id)
          const sessionMax    = sessionExLogs.length ? Math.max(...sessionExLogs.map(l => l.load||0)) : 0
          const prevMax       = ex._prevMax || 0
          const isNewPR       = sessionMax > 0 && sessionMax > prevMax
          const delta         = sessionMax - prevMax

          return (
            <div key={ex.id} className="card" style={{
              padding:'14px 16px',
              opacity: sessionMode && done ? 0.6 : 1,
              transition:'opacity 0.3s',
              border: done ? '1.5px solid var(--c-sage)' : undefined,
            }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:8 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  {/* Checkbox in session mode */}
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                    {sessionMode && (
                      <div style={{
                        width:20, height:20, borderRadius:6, flexShrink:0,
                        background: done ? 'var(--c-sage)' : 'transparent',
                        border: `1.5px solid ${done ? 'var(--c-sage)' : 'var(--c-border)'}`,
                        display:'flex', alignItems:'center', justifyContent:'center',
                      }}>
                        {done && <Check size={11} strokeWidth={3} style={{ color:'white' }} />}
                      </div>
                    )}
                    <p style={{ fontFamily:'var(--font-ui)', fontSize:15, fontWeight:500, color:'var(--c-text-900)', textDecoration: done ? 'line-through' : 'none' }}>
                      {ex.name}
                    </p>
                  </div>
                  <p style={{ fontFamily:'var(--font-ui)', fontSize:12, color:'var(--c-text-400)', marginLeft: sessionMode ? 28 : 0 }}>
                    {[ex.target_sets && `${ex.target_sets} séries`, ex.target_reps && `${ex.target_reps} reps`, ex.target_load && `${ex.target_load} kg`].filter(Boolean).join(' · ')}
                  </p>
                </div>

                {/* Actions — só em modo visualização */}
                {!sessionMode && (
                  <div style={{ display:'flex', gap:4, flexShrink:0, marginLeft:8 }}>
                    <button onClick={() => setHistTarget(ex)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--c-text-300)', padding:4 }}><BarChart2 size={15} strokeWidth={1.8} /></button>
                    <button onClick={() => setEditTarget(ex)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--c-text-300)', padding:4 }}><Edit2 size={14} strokeWidth={1.8} /></button>
                    <button onClick={() => deleteExercise(ex.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--c-text-200)', padding:4 }}><Trash2 size={14} strokeWidth={1.8} /></button>
                  </div>
                )}

                {/* Badge PR */}
                {isNewPR && (
                  <div style={{
                    background:'var(--c-sage-faint)', borderRadius:'var(--r-full)',
                    padding:'3px 10px', flexShrink:0,
                  }}>
                    <span style={{ fontFamily:'var(--font-ui)', fontSize:11, fontWeight:600, color:'var(--c-sage)' }}>
                      ▲ {prevMax > 0 ? `+${delta} kg` : 'Novo'}
                    </span>
                  </div>
                )}
              </div>

              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginLeft: sessionMode ? 28 : 0 }}>
                {last ? (
                  <div style={{ background:'var(--c-base-2)', borderRadius:'var(--r-sm)', padding:'6px 10px' }}>
                    <p style={{ fontFamily:'var(--font-ui)', fontSize:10, color:'var(--c-text-300)', marginBottom:2, textTransform:'uppercase', letterSpacing:'0.04em' }}>
                      Último · {fmtShort(last.date)}
                    </p>
                    <p style={{ fontFamily:'var(--font-ui)', fontSize:13, fontWeight:500, color:'var(--c-text-700)' }}>
                      {last.sets.map(s => `${s.load ?? '?'}kg`).join(' · ')}
                      <span style={{ fontWeight:400, color:'var(--c-text-400)' }}> × {last.sets[0]?.reps}</span>
                    </p>
                  </div>
                ) : (
                  <p style={{ fontFamily:'var(--font-ui)', fontSize:12, color:'var(--c-text-200)', fontStyle:'italic' }}>
                    {sessionMode ? 'Primeiro registro' : 'Sem registro anterior'}
                  </p>
                )}

                <button
                  onClick={() => setLogTarget(ex)}
                  disabled={sessionMode && done}
                  style={{
                    padding:'9px 16px', borderRadius:'var(--r-full)', border:'none', cursor:'pointer',
                    background: done ? 'var(--c-sage-faint)' : 'var(--c-text-900)',
                    color: done ? 'var(--c-sage)' : 'var(--c-base-0)',
                    fontFamily:'var(--font-ui)', fontSize:13, fontWeight:500,
                    opacity: sessionMode && done ? 0.7 : 1,
                    display:'flex', alignItems:'center', gap:5,
                  }}
                >
                  {done ? <><Check size={12} strokeWidth={2.5} /> Feito</> : 'Registrar'}
                </button>
              </div>
            </div>
          )
        })}

        {/* Add exercise — só fora de sessão */}
        {!sessionMode && (
          <button onClick={() => setAddModal(true)} style={{
            width:'100%', padding:'13px', borderRadius:'var(--r-md)',
            border:'1.5px dashed var(--c-border)', background:'none', cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            color:'var(--c-text-400)', fontFamily:'var(--font-ui)', fontSize:13, marginTop:4,
          }}>
            <Plus size={15} strokeWidth={2} /> Adicionar exercício
          </button>
        )}
      </div>

      {/* ── BOTÃO FIXO INFERIOR ── */}
      <div style={{
        position:'fixed', bottom:0, left:0, right:0, zIndex:30,
        padding:'16px 24px 32px',
        background:'linear-gradient(to top, var(--c-base-0) 80%, transparent)',
      }}>
        {!sessionMode ? (
          <button
            onClick={() => setShowCopyPopup(true)}
            style={{
              width:'100%', padding:'16px 0', borderRadius:'var(--r-full)',
              border:'none', background:'var(--c-text-900)',
              fontFamily:'var(--font-ui)', fontSize:15, fontWeight:700,
              color:'var(--c-base-0)', cursor:'pointer',
              letterSpacing:'0.02em',
            }}
          >
            Iniciar treino
          </button>
        ) : allDone ? (
          <button
            onClick={handleFinalize}
            style={{
              width:'100%', padding:'16px 0', borderRadius:'var(--r-full)',
              border:'none', background:'var(--c-sage)',
              fontFamily:'var(--font-ui)', fontSize:15, fontWeight:700,
              color:'white', cursor:'pointer',
              letterSpacing:'0.02em',
              animation:'pulse 1.5s infinite',
            }}
          >
            Finalizar treino
          </button>
        ) : (
          <div style={{
            background:'var(--c-base-1)', borderRadius:'var(--r-full)',
            padding:'12px 20px', display:'flex', alignItems:'center', justifyContent:'space-between',
          }}>
            <span style={{ fontFamily:'var(--font-ui)', fontSize:13, color:'var(--c-text-500)' }}>
              {completedIds.size}/{exercises.length} concluídos
            </span>
            <span style={{ fontFamily:'var(--font-ui)', fontSize:13, fontWeight:600, color:'var(--c-text-900)' }}>
              {fmtElapsed(elapsed)}
            </span>
          </div>
        )}
      </div>

      {/* Popups & Modals */}
      {showCopyPopup && (
        <CopyWeightsPopup
          onYes={() => startSession(true)}
          onNo={() => startSession(false)}
        />
      )}

      {logTarget && (
        <LogModal
          exercise={logTarget}
          planId={plan.id}
          planName={plan.name}
          userId={userId}
          prefillFromLast={copyWeights}
          lastSetsData={lastLogs[logTarget.id]?.sets || []}
          onClose={() => setLogTarget(null)}
          onSave={(newLogs) => {
            if (sessionMode) handleExerciseLogged(logTarget.id, newLogs)
            else { setLogTarget(null); load() }
          }}
        />
      )}
      {histTarget && (
        <HistoryModal exercise={histTarget} userId={userId} onClose={() => setHistTarget(null)} />
      )}
      {(addModal || editTarget) && (
        <AddExerciseModal
          planId={plan.id}
          userId={userId}
          exercise={editTarget ?? null}
          onClose={() => { setAddModal(false); setEditTarget(null) }}
          onSave={load}
        />
      )}
      {showSummary && (
        <SessionSummarySheet
          durationSecs={elapsed}
          exercises={exercises}
          sessionLogs={sessionLogs}
          onDone={() => { setShowSummary(false); onBack(); onRefresh?.() }}
          onClose={() => setShowSummary(false)}
        />
      )}
    </div>
  )
}

/* ─── MAIN PAGE ──────────────────────────────────────────────────── */
export default function Treinos({ userId }) {
  const [programs, setPrograms]     = useState([])
  const [activeProg, setActiveProg] = useState(null)
  const [plans, setPlans]           = useState([])
  const [weekLogs, setWeekLogs]     = useState([])
  const [progLogs, setProgLogs]     = useState([])
  const [loading, setLoading]       = useState(true)

  // Modals
  const [showFAB, setShowFAB]             = useState(false)
  const [showCreate, setShowCreate]       = useState(false)
  const [showHistory, setShowHistory]     = useState(false)
  const [activeWorkout, setActiveWorkout] = useState(null) // fitness_workout_plans row
  const [refreshKey, setRefreshKey]       = useState(0)

  const refresh = () => setRefreshKey(k => k + 1)

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    supabase.from('vitta_programs')
      .select('id,name,order_idx,active,start_date,end_date')
      .eq('user_id', userId).eq('active', true)
      .order('order_idx', { ascending: false })
      .then(({ data }) => {
        const list = data || []
        setPrograms(list)
        const prog = list[0] ?? null
        setActiveProg(prog)
        if (!prog) setLoading(false)
      })
  }, [userId, refreshKey])

  useEffect(() => {
    if (!userId || !activeProg) return
    let cancelled = false
    setLoading(true)

    const run = async () => {
      try {
        const weekStart = getWeekStart()

        const [{ data: planList }, { data: wLogs }, { data: pLogs }] = await Promise.all([
          supabase.from('fitness_workout_plans')
            .select('id,name,variant,order_idx').eq('user_id', userId).eq('program_id', activeProg.id).order('order_idx'),
          supabase.from('fitness_workout_logs')
            .select('date,exercise_id,exercise_name,plan_id,load,reps,set_number')
            .eq('user_id', userId).gte('date', weekStart).order('date', { ascending: false }),
          supabase.from('fitness_workout_logs')
            .select('date,exercise_id,exercise_name,load,reps')
            .eq('user_id', userId)
            .gte('date', activeProg.start_date ?? '2000-01-01')
            .order('date', { ascending: true }),
        ])

        if (cancelled) return
        setPlans(planList || [])
        setWeekLogs(wLogs || [])
        setProgLogs(pLogs || [])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()
    return () => { cancelled = true }
  }, [userId, activeProg, refreshKey])

  // Week summary
  const weekForce   = weekLogs.filter(l => l.exercise_id).map(l => l.date)
  const weekCardio  = weekLogs.filter(l => !l.exercise_id)
  const uniqueForceDates = [...new Set(weekForce)].length
  const lastSession = weekLogs.find(l => !l.exercise_id && l.exercise_name)

  // Evolution: primeiro e último load por exercício
  const evolution = (() => {
    const byEx = {}
    progLogs.filter(l => l.exercise_id && l.load).forEach(l => {
      if (!byEx[l.exercise_name]) byEx[l.exercise_name] = { first: l.load, last: l.load }
      else byEx[l.exercise_name].last = l.load
    })
    return Object.entries(byEx)
      .map(([name, { first, last }]) => ({ name, first, last, delta: last - first }))
      .filter(e => e.delta > 0)
      .sort((a, b) => b.delta - a.delta)
      .slice(0, 3)
  })()

  const prog = calcProgress(activeProg?.start_date, activeProg?.end_date)
  const variants = ['A','B','C','D'].filter(v => plans.some(p => p.variant === v))

  if (activeWorkout) {
    return (
      <WorkoutView
        plan={activeWorkout}
        userId={userId}
        prog={activeProg}
        onBack={() => { setActiveWorkout(null); refresh() }}
        onRefresh={refresh}
      />
    )
  }

  return (
    <div style={{ position: 'relative', minHeight: '100%', paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ padding: '52px var(--page-pad-x) 0', position: 'relative', overflow: 'hidden', marginBottom: 20 }}>
        <PageBotanical />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 500, color: 'var(--c-text-900)', letterSpacing: '-0.02em', marginBottom: 4 }}>Treinos</h1>
            <p style={{ fontFamily: 'var(--font-editorial)', fontSize: 15, color: 'var(--c-text-400)', fontStyle: 'italic' }}>Evolução de cargas e consistência</p>
          </div>
          <button onClick={() => setShowCreate(true)} style={{
            padding: '8px 14px', borderRadius: 'var(--r-full)', border: '1.5px solid var(--c-border)',
            background: 'none', cursor: 'pointer', color: 'var(--c-text-500)',
            fontFamily: 'var(--font-ui)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <Plus size={13} strokeWidth={2.5} /> Programa
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '0 var(--page-pad-x)' }}>
          {Array.from({ length: 3 }, (_, i) => <div key={i} style={{ height: 80, marginBottom: 10, borderRadius: 'var(--r-md)' }} className="loading-shimmer" />)}
        </div>
      ) : !activeProg ? (
        <div style={{ padding: '0 var(--page-pad-x)' }}>
          <div className="empty-state" style={{ marginTop: 32 }}>
            <Dumbbell size={32} style={{ color: 'var(--c-text-100)' }} />
            <p className="empty-state-text">Nenhum programa ativo</p>
            <button className="btn-primary" onClick={() => setShowCreate(true)} style={{ marginTop: 12 }}>Criar primeiro programa</button>
          </div>
        </div>
      ) : (
        <>
          {/* ── PROGRAM CARD ── */}
          <div style={{ margin: '0 var(--page-pad-x) 12px' }}>
            <div className="card" style={{ padding: '18px 18px 14px' }}>
              {/* Name + actions */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
                <div>
                  <p style={{ fontFamily: 'var(--font-ui)', fontSize: 10, color: 'var(--c-text-300)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
                    Programa ativo
                  </p>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 500, color: 'var(--c-text-900)', letterSpacing: '-0.02em' }}>
                    {activeProg.name}
                  </h2>
                </div>
                <button onClick={() => setShowHistory(true)} style={{
                  padding: '6px 10px', borderRadius: 'var(--r-full)', border: '1.5px solid var(--c-border)',
                  background: 'none', cursor: 'pointer', color: 'var(--c-text-400)',
                  fontFamily: 'var(--font-ui)', fontSize: 11,
                }}>Trocar</button>
              </div>

              {/* Dates */}
              {activeProg.start_date && (
                <p style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--c-text-300)', marginBottom: 14 }}>
                  {fmtShort(activeProg.start_date)}{activeProg.end_date ? ` → ${fmtShort(activeProg.end_date)}` : ''}
                </p>
              )}

              {/* Progress bar */}
              {prog && prog.pct !== null && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--c-text-400)' }}>
                      Semana {Math.min(prog.currentWeek, prog.totalWeeks)} de {prog.totalWeeks}
                    </span>
                    <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--c-text-300)' }}>
                      {Math.round(prog.pct * 100)}%
                    </span>
                  </div>
                  <div style={{ width: '100%', height: 5, background: 'var(--c-base-2)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ width: `${prog.pct * 100}%`, height: '100%', background: 'var(--c-sage)', borderRadius: 99, transition: 'width 0.4s' }} />
                  </div>
                </div>
              )}

              {/* A B C D buttons */}
              {variants.length > 0 && (
                <div style={{ display: 'flex', gap: 8 }}>
                  {variants.map(v => {
                    const plan = plans.find(p => p.variant === v)
                    return (
                      <button key={v} onClick={() => plan && setActiveWorkout(plan)} style={{
                        flex: 1, padding: '12px 0', borderRadius: 'var(--r-md)',
                        border: '1.5px solid var(--c-border-light)',
                        background: 'var(--c-base-1, #fafaf9)', cursor: 'pointer',
                        fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 500,
                        color: 'var(--c-text-700)', transition: 'background 0.15s',
                      }}>{v}</button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── WEEK SUMMARY ── */}
          <div style={{ margin: '0 var(--page-pad-x) 12px' }}>
            <div className="card" style={{ padding: '14px 16px' }}>
              <p style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--c-text-300)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Semana atual</p>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <Check size={13} strokeWidth={2.5} style={{ color: 'var(--c-sage)', flexShrink: 0 }} />
                  <span style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--c-text-700)' }}>
                    {uniqueForceDates} treino{uniqueForceDates !== 1 ? 's' : ''} de força
                  </span>
                </div>
                {weekCardio.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <Check size={13} strokeWidth={2.5} style={{ color: 'var(--c-sage)', flexShrink: 0 }} />
                    <span style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--c-text-700)' }}>
                      {weekCardio.length} sess. cardio/outro
                    </span>
                  </div>
                )}
                {lastSession && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <Clock size={12} strokeWidth={2} style={{ color: 'var(--c-text-300)', flexShrink: 0 }} />
                    <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--c-text-400)' }}>
                      Último: {lastSession.exercise_name}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── EVOLUTION CARD ── */}
          {(evolution.length > 0 || progLogs.length > 0) && (
            <div style={{ margin: '0 var(--page-pad-x) 24px' }}>
              <div className="card" style={{ padding: '14px 16px' }}>
                <p style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--c-text-300)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                  Evolução · {activeProg.name}
                </p>

                <div style={{ display: 'flex', gap: 10, marginBottom: evolution.length ? 14 : 0 }}>
                  <div style={{ flex: 1, background: 'var(--c-base-2)', borderRadius: 'var(--r-sm)', padding: '10px 10px' }}>
                    <p style={{ fontFamily: 'var(--font-ui)', fontSize: 10, color: 'var(--c-text-300)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Treinos realizados</p>
                    <p style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 500, color: 'var(--c-text-900)' }}>
                      {[...new Set(progLogs.filter(l=>l.exercise_id).map(l=>l.date))].length}
                    </p>
                  </div>
                  {prog && (
                    <div style={{ flex: 1, background: 'var(--c-base-2)', borderRadius: 'var(--r-sm)', padding: '10px 10px' }}>
                      <p style={{ fontFamily: 'var(--font-ui)', fontSize: 10, color: 'var(--c-text-300)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Dias de programa</p>
                      <p style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 500, color: 'var(--c-text-900)' }}>{prog.daysElapsed}</p>
                    </div>
                  )}
                </div>

                {evolution.length > 0 && (
                  <>
                    <p style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--c-text-300)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Maior progresso</p>
                    {evolution.map(e => (
                      <div key={e.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--c-text-700)' }}>{e.name}</span>
                        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--c-sage)', fontWeight: 600 }}>
                          {e.first} → {e.last} kg <span style={{ fontWeight: 400, color: 'var(--c-text-300)' }}>(+{e.delta})</span>
                        </span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── FAB ── */}
      <button onClick={() => setShowFAB(true)} style={{
        position: 'fixed', bottom: 88, right: 20, zIndex: 40,
        width: 52, height: 52, borderRadius: '50%',
        background: 'var(--c-text-900)', border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
      }}>
        <Zap size={20} strokeWidth={2} style={{ color: 'var(--c-base-0)' }} />
      </button>

      {/* Modals */}
      {showFAB && (
        <FABMenu userId={userId} programs={programs} activeProg={activeProg?.id}
          plans={plans} onClose={() => setShowFAB(false)} onSaved={refresh} />
      )}
      {showCreate && (
        <CreateProgramModal userId={userId} onClose={() => setShowCreate(false)} onSave={refresh} />
      )}
      {showHistory && (
        <ProgramHistoryModal userId={userId} activeProg={activeProg?.id}
          onClose={() => setShowHistory(false)} onSwitch={refresh} />
      )}
    </div>
  )
}
