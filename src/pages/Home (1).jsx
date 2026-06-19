import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Scale, Droplets, Moon, Dumbbell, UtensilsCrossed, BookOpen,
  FlaskConical, CalendarDays, Activity, ChevronRight, X, Check,
  Leaf, Star, Clock
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { HomeHeaderBotanical } from '../components/BotanicalBg'
import {
  today, daysAgo, last35Days, weekDates,
  greeting, dailyPhrase, cyclePhaseLabel,
  fmtWeight, fmtWater, fmtSleep, formatDate, formatDateShort,
  hashPin, randomSalt
} from '../lib/utils'

/* ─── DATA HOOK ─────────────────────────────────────────────────── */
function useHomeData(userId) {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const todayStr = today()
    const d7       = daysAgo(7)
    const d35      = daysAgo(35)

    const [
      { data: tracking },
      { data: weight },
      { data: consultations },
      { data: fertility },
      { data: wkLogs },
      { data: cardio },
      { data: diary },
    ] = await Promise.all([
      supabase.from('daily_tracking').select('date,water_ml,sleep_hours,protein_g,strength_done,aerobic_done,mood,energy,cycle_phase,notes,consistency_score')
        .eq('user_id', userId).gte('date', d35).order('date', { ascending: false }),
      supabase.from('physical_metrics').select('weight,date')
        .eq('user_id', userId).order('date', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('health_consultations').select('date,specialty,doctor,location')
        .eq('user_id', userId).gte('date', todayStr).order('date').limit(4),
      supabase.from('fertility_events').select('date,type,title,notes')
        .eq('user_id', userId).gte('date', todayStr).order('date').limit(4),
      supabase.from('fitness_workout_logs').select('date,plan_name,exercise_name')
        .eq('user_id', userId).gte('date', d7).order('date', { ascending: false }),
      supabase.from('cardio_logs').select('date,type,duration_min')
        .eq('user_id', userId).gte('date', d7).order('date', { ascending: false }),
      supabase.from('diary_entries').select('date,content,mood')
        .eq('user_id', userId).order('date', { ascending: false }).limit(3),
    ])

    const weekT = (tracking || []).filter(d => d.date >= d7)
    const uniqueWorkoutDays = [...new Set((wkLogs || []).map(l => l.date))].length
    const cardioDays        = [...new Set((cardio || []).map(l => l.date))].length
    const withProtein       = weekT.filter(d => d.protein_g > 0)
    const withSleep         = weekT.filter(d => d.sleep_hours > 0)
    const withWater         = weekT.filter(d => d.water_ml > 0)

    setData({
      tracking:    tracking || [],
      weight:      weight?.weight,
      weightDate:  weight?.date,
      cyclePhase:  (tracking || [])[0]?.cycle_phase,
      consultations: consultations || [],
      fertility:   fertility || [],
      diary:       diary || [],
      weekSummary: {
        treinos:  uniqueWorkoutDays,
        cardio:   cardioDays,
        proteina: withProtein.length
          ? Math.round(withProtein.reduce((s, d) => s + (d.protein_g || 0), 0) / withProtein.length)
          : null,
        agua: withWater.length
          ? Math.round(withWater.reduce((s, d) => s + (d.water_ml || 0), 0) / withWater.length)
          : null,
        sono: withSleep.length
          ? (withSleep.reduce((s, d) => s + (d.sleep_hours || 0), 0) / withSleep.length).toFixed(1)
          : null,
      },
      todayTracking: (tracking || []).find(d => d.date === todayStr) || null,
    })
    setLoading(false)
  }, [userId])

  useEffect(() => { load() }, [load])
  return { data, loading, reload: load }
}

/* ─── HEATMAP CALENDAR ──────────────────────────────────────────── */
function ConsistencyCalendar({ tracking }) {
  const days   = last35Days()
  const byDay  = Object.fromEntries((tracking || []).map(t => [t.date, t]))
  const todayStr = today()

  const MONTHS_PT = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']
  const BG = [
    'var(--c-base-2)',
    'rgba(212,165,165,0.28)',
    'rgba(212,165,165,0.52)',
    'rgba(212,165,165,0.76)',
    'rgba(212,165,165,1.0)',
  ]

  const intensity = (dt) => {
    const r = byDay[dt]
    if (!r) return 0
    let n = 0
    if (r.water_ml > 0) n++
    if (r.sleep_hours > 0) n++
    if (r.strength_done || r.aerobic_done) n++
    if (r.protein_g > 0) n++
    if (r.mood) n++
    if (r.notes) n++
    return Math.min(n, 4)
  }

  const firstDay = new Date(days[0] + 'T12:00:00').getDay()
  const offset   = (firstDay + 6) % 7

  const grid = [...Array(offset).fill(null), ...days]
  const weeks = []
  for (let i = 0; i < grid.length; i += 7) weeks.push(grid.slice(i, i + 7))

  const weekMonthLabel = (week) => {
    const first = week.find(d => d !== null)
    if (!first) return ''
    const d = new Date(first + 'T12:00:00')
    if (d.getDate() <= 7) return MONTHS_PT[d.getMonth()]
    return ''
  }

  return (
    <div style={{ padding: '0 var(--page-pad-x)' }}>
      <style>{`
        .hm-outer { display: grid; grid-template-columns: 24px 1fr; gap: 0 4px; }
        .hm-month { font-family: var(--font-ui); font-size: 9px; color: var(--c-text-300); text-align: right; text-transform: uppercase; letter-spacing: 0.04em; }
        .hm-row { display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px; margin-bottom: 3px; }
        .hm-dow-row { display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px; margin-bottom: 5px; }
        .hm-dow { font-family: var(--font-ui); font-size: 9px; color: var(--c-text-300); text-align: center; }
        .hm-cell {
          width: 100%; max-width: 40px; aspect-ratio: 1; border-radius: 5px;
          display: flex; align-items: flex-end; justify-content: flex-end;
          padding: 2px 3px; cursor: pointer; transition: transform 0.1s; box-sizing: border-box;
        }
        .hm-cell:active { transform: scale(0.88); }
        .hm-cell.is-today { box-shadow: 0 0 0 1.5px var(--c-rose-mid); }
        .hm-cell.is-empty { background: transparent !important; cursor: default; }
        .hm-num { font-family: var(--font-ui); font-size: 9px; font-weight: 400; pointer-events: none; }
      `}</style>

      <div className="hm-outer">
        <div />
        <div className="hm-dow-row">
          {['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'].map((d, i) => (
            <div key={i} className="hm-dow">{d}</div>
          ))}
        </div>
      </div>

      {weeks.map((week, wi) => (
        <div key={wi} className="hm-outer">
          <div className="hm-month" style={{ paddingTop: 4 }}>{weekMonthLabel(week)}</div>
          <div className="hm-row">
            {week.map((dt, di) => {
              if (!dt) return <div key={`e${di}`} className="hm-cell is-empty" />
              const lvl     = intensity(dt)
              const isToday = dt === todayStr
              const dayNum  = new Date(dt + 'T12:00:00').getDate()
              const numColor = lvl >= 3 ? 'rgba(255,255,255,0.65)' : 'var(--c-text-300)'
              return (
                <div key={dt} className={`hm-cell${isToday ? ' is-today' : ''}`}
                  style={{ background: BG[lvl] }} title={formatDate(dt)}>
                  <span className="hm-num" style={{ color: numColor }}>{dayNum}</span>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 8, justifyContent: 'flex-end' }}>
        <span style={{ fontSize: 9, color: 'var(--c-text-300)', fontFamily: 'var(--font-ui)' }}>Sem reg.</span>
        {BG.map((c, i) => (
          <div key={i} style={{ width: 10, height: 10, borderRadius: 2, background: c, border: i===0 ? '1px solid var(--c-border)' : 'none' }} />
        ))}
        <span style={{ fontSize: 9, color: 'var(--c-text-300)', fontFamily: 'var(--font-ui)' }}>Completo</span>
      </div>
    </div>
  )
}

/* ─── WEEK METRIC CARD ───────────────────────────────────────────── */
function WeekCard({ icon: Icon, label, value, unit, goal, color }) {
  const pct = goal && value != null ? Math.min((Number(value) / goal) * 100, 100) : null

  return (
    <div style={{
      background: 'var(--c-surface-raised)',
      border: '1px solid var(--c-border)',
      borderRadius: 'var(--r-md)',
      padding: '14px 14px 12px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      boxShadow: 'var(--shadow-xs)',
      minWidth: 110,
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Icon size={16} strokeWidth={1.8} style={{ color: color || 'var(--c-text-300)' }} />
        {pct != null && (
          <span style={{ fontSize: 10, color: 'var(--c-text-300)', fontFamily: 'var(--font-ui)' }}>
            {Math.round(pct)}%
          </span>
        )}
      </div>
      <div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 500, color: 'var(--c-text-900)', lineHeight: 1 }}>
          {value != null ? value : '—'}
          {value != null && unit && (
            <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--c-text-500)', marginLeft: 2 }}>{unit}</span>
          )}
        </div>
        <div style={{ fontSize: 11, color: 'var(--c-text-500)', fontFamily: 'var(--font-ui)', marginTop: 3 }}>{label}</div>
      </div>
      {pct != null && (
        <div style={{ height: 3, background: 'var(--c-base-2)', borderRadius: 2 }}>
          <div style={{ height: '100%', width: `${pct}%`, background: color || 'var(--c-rose)', borderRadius: 2, transition: 'width 0.5s ease' }} />
        </div>
      )}
    </div>
  )
}

/* ─── HEALTH SUMMARY CARD ───────────────────────────────────────── */
function HealthSummary({ weight, cyclePhase, consultations, fertility }) {
  const nextConsult  = consultations?.[0]
  const nextFertility = fertility?.[0]

  return (
    <div style={{ padding: '0 var(--page-pad-x)' }}>
      <div className="card" style={{ padding: 20, position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Peso */}
          <div>
            <div style={{ fontSize: 10, color: 'var(--c-text-300)', fontFamily: 'var(--font-ui)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Peso</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 500, color: 'var(--c-text-900)' }}>
              {fmtWeight(weight)}
            </div>
          </div>

          {/* Ciclo */}
          <div>
            <div style={{ fontSize: 10, color: 'var(--c-text-300)', fontFamily: 'var(--font-ui)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Ciclo</div>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 500, color: 'var(--c-text-700)' }}>
              {cyclePhaseLabel(cyclePhase) || '—'}
            </div>
          </div>

          {/* Próxima consulta */}
          <div style={{ gridColumn: '1 / -1', paddingTop: 12, borderTop: '1px solid var(--c-border-light)' }}>
            <div style={{ fontSize: 10, color: 'var(--c-text-300)', fontFamily: 'var(--font-ui)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Próxima consulta</div>
            {nextConsult ? (
              <div>
                <div style={{ fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 500, color: 'var(--c-text-900)' }}>
                  {nextConsult.specialty || nextConsult.doctor}
                </div>
                <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--c-text-500)', marginTop: 2 }}>
                  {formatDate(nextConsult.date)}
                  {nextConsult.location && ` · ${nextConsult.location}`}
                </div>
              </div>
            ) : (
              <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 13, color: 'var(--c-text-300)', fontStyle: 'italic' }}>
                Nenhuma consulta agendada
              </div>
            )}
          </div>

          {/* Próxima etapa FIV */}
          {nextFertility && (
            <div style={{ gridColumn: '1 / -1', paddingTop: 12, borderTop: '1px solid var(--c-border-light)' }}>
              <div style={{ fontSize: 10, color: 'var(--c-text-300)', fontFamily: 'var(--font-ui)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Próxima etapa FIV</div>
              <div>
                <div style={{ fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 500, color: 'var(--c-text-900)' }}>
                  {nextFertility.title || nextFertility.type}
                </div>
                <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--c-text-500)', marginTop: 2 }}>
                  {formatDate(nextFertility.date)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── QUICK ACTION CARD ─────────────────────────────────────────── */
function ActionCard({ icon: Icon, label, done, onClick, color }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
      padding: '14px 10px', minWidth: 78,
      background: done ? 'var(--c-base-1)' : 'var(--c-surface-raised)',
      border: `1px solid ${done ? 'var(--c-border)' : 'var(--c-border)'}`,
      borderRadius: 'var(--r-md)', cursor: 'pointer', flexShrink: 0,
      boxShadow: done ? 'none' : 'var(--shadow-xs)',
      transition: 'transform 0.1s, opacity 0.1s',
      position: 'relative', overflow: 'hidden',
    }}
    onTouchStart={e => e.currentTarget.style.transform = 'scale(0.95)'}
    onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
    onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
    onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: done ? 'var(--c-base-2)' : (color + '22'),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {done
          ? <Check size={16} strokeWidth={2.5} style={{ color: 'var(--c-sage)' }} />
          : <Icon size={16} strokeWidth={1.8} style={{ color }} />
        }
      </div>
      <span style={{
        fontSize: 10, fontFamily: 'var(--font-ui)', fontWeight: done ? 400 : 500,
        color: done ? 'var(--c-text-300)' : 'var(--c-text-700)',
        textAlign: 'center', lineHeight: 1.3,
      }}>
        {label}
      </span>
    </button>
  )
}

/* ─── UPCOMING EVENT ROW ─────────────────────────────────────────── */
function EventRow({ date, title, subtitle, type }) {
  const colors = {
    consultation: 'var(--c-rose)',
    fertility:    'var(--c-lavender)',
    exam:         'var(--c-sage)',
  }
  const color = colors[type] || 'var(--c-text-300)'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0' }}>
      <div style={{
        width: 40, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 2,
      }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 500, color: 'var(--c-text-900)', lineHeight: 1 }}>
          {new Date(date + 'T12:00:00').getDate()}
        </div>
        <div style={{ fontSize: 10, color: 'var(--c-text-300)', fontFamily: 'var(--font-ui)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short' })}
        </div>
      </div>
      <div style={{ width: 3, height: 36, borderRadius: 2, background: color, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 500, color: 'var(--c-text-900)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: 12, color: 'var(--c-text-500)', fontFamily: 'var(--font-ui)', marginTop: 2 }}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── JOURNEY TIMELINE ITEM ──────────────────────────────────────── */
function TimelineItem({ icon: Icon, title, subtitle, date, last }) {
  return (
    <div style={{ display: 'flex', gap: 14, paddingBottom: last ? 0 : 16 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'var(--c-rose-faint)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={14} strokeWidth={1.8} style={{ color: 'var(--c-rose-mid)' }} />
        </div>
        {!last && <div style={{ flex: 1, width: 1, background: 'var(--c-border)', marginTop: 6 }} />}
      </div>
      <div style={{ paddingTop: 6, flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 500, color: 'var(--c-text-900)' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: 'var(--c-text-500)', marginTop: 2 }}>{subtitle}</div>}
        <div style={{ fontSize: 11, color: 'var(--c-text-300)', marginTop: 4 }}>{formatDateShort(date)}</div>
      </div>
    </div>
  )
}

/* ─── REGISTER MODAL ─────────────────────────────────────────────── */
function RegisterModal({ type, userId, onClose, onSave }) {
  const [val, setVal]       = useState('')
  const [val2, setVal2]     = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const todayStr = today()

  const configs = {
    peso:  { title: 'Registrar peso',        label: 'Peso (kg)', placeholder: '0,0',    unit: 'kg', field: 'weight',     table: 'physical_metrics' },
    agua:  { title: 'Registrar água',         label: 'Quantidade (ml)', placeholder: '2500', unit: 'ml', field: 'water_ml',  table: 'daily_tracking' },
    sono:  { title: 'Registrar sono',         label: 'Horas dormidas', placeholder: '7',  unit: 'h', field: 'sleep_hours', table: 'daily_tracking' },
  }
  const cfg = configs[type]
  if (!cfg) return null

  const save = async () => {
    if (!val || saving) return
    setSaving(true)

    const numVal = parseFloat(val.replace(',', '.'))
    if (isNaN(numVal)) { setSaving(false); return }

    if (cfg.table === 'physical_metrics') {
      await supabase.from('physical_metrics')
        .insert({ user_id: userId, date: todayStr, [cfg.field]: numVal })
    } else {
      // Upsert into daily_tracking
      const { data: existing } = await supabase
        .from('daily_tracking').select('id').eq('user_id', userId).eq('date', todayStr).maybeSingle()
      if (existing) {
        await supabase.from('daily_tracking').update({ [cfg.field]: numVal }).eq('id', existing.id)
      } else {
        await supabase.from('daily_tracking').insert({ user_id: userId, date: todayStr, [cfg.field]: numVal })
      }
    }

    setSaved(true)
    setTimeout(() => { onSave?.(); onClose() }, 800)
  }

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 className="sheet-title" style={{ marginBottom: 0 }}>{cfg.title}</h2>
          <button onClick={onClose} className="btn-ghost" style={{ padding: 8 }}>
            <X size={18} strokeWidth={1.8} />
          </button>
        </div>

        {saved ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '24px 0' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--c-sage-faint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Check size={24} strokeWidth={2} style={{ color: 'var(--c-sage)' }} />
            </div>
            <p style={{ fontFamily: 'var(--font-editorial)', fontSize: 18, color: 'var(--c-text-700)', fontStyle: 'italic' }}>
              Registrado com sucesso
            </p>
          </div>
        ) : (
          <>
            <label className="input-label">{cfg.label}</label>
            <input
              className="input-field"
              type="text"
              inputMode="decimal"
              placeholder={cfg.placeholder}
              value={val}
              onChange={e => setVal(e.target.value)}
              style={{ fontSize: 24, textAlign: 'center', marginBottom: 24 }}
              autoFocus
            />
            <button className="btn-primary" onClick={save} disabled={!val || saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

/* ─── HOME PAGE ─────────────────────────────────────────────────── */
export default function Home({ userId }) {
  const { data, loading, reload } = useHomeData(userId)
  const [modal, setModal] = useState(null) // 'peso' | 'agua' | 'sono'
  const navigate = useNavigate()

  const todayData = data?.todayTracking

  const QUICK_ACTIONS = [
    { id: 'peso',       icon: Scale,            label: 'Peso',       color: 'var(--c-rose)',     done: false },
    { id: 'agua',       icon: Droplets,         label: 'Água',       color: '#6BA8D4',            done: todayData?.water_ml > 0 },
    { id: 'sono',       icon: Moon,             label: 'Sono',       color: '#9B8FC4',            done: todayData?.sleep_hours > 0 },
    { id: 'treino',     icon: Dumbbell,         label: 'Treino',     color: 'var(--c-sage)',      done: todayData?.strength_done || todayData?.aerobic_done },
    { id: 'alimentos',  icon: UtensilsCrossed,  label: 'Alimentação',color: '#C9A96E',            done: todayData?.protein_g > 0 },
    { id: 'diario',     icon: BookOpen,         label: 'Diário',     color: 'var(--c-rose-mid)', done: false },
    { id: 'exames',     icon: FlaskConical,     label: 'Exames',     color: 'var(--c-sage-deep)', done: false },
  ]

  const handleAction = (id) => {
    if (['peso', 'agua', 'sono'].includes(id)) {
      setModal(id)
    } else if (id === 'treino') {
      navigate('/treinos')
    } else if (id === 'alimentos' || id === 'diario') {
      navigate('/saude')
    } else {
      navigate('/saude')
    }
  }

  // Build upcoming events list (merge consultations + fertility)
  const upcoming = [
    ...(data?.consultations || []).map(c => ({
      date: c.date, type: 'consultation',
      title: c.specialty || c.doctor || 'Consulta',
      subtitle: c.doctor || c.location,
    })),
    ...(data?.fertility || []).map(f => ({
      date: f.date, type: 'fertility',
      title: f.title || f.type || 'Etapa FIV',
      subtitle: f.notes,
    })),
  ].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4)

  // Journey items from diary + recent tracking
  const journeyItems = []
  if (data?.diary?.[0]) {
    journeyItems.push({ icon: BookOpen, title: 'Diário', subtitle: data.diary[0].content?.slice(0, 60) + (data.diary[0].content?.length > 60 ? '…' : ''), date: data.diary[0].date })
  }
  if (data?.weight) {
    journeyItems.push({ icon: Scale, title: `Peso registrado: ${fmtWeight(data.weight)}`, subtitle: null, date: data.weightDate })
  }
  if (data?.tracking?.[0]?.sleep_hours) {
    journeyItems.push({ icon: Moon, title: `Sono: ${fmtSleep(data.tracking[0].sleep_hours)}`, subtitle: null, date: data.tracking[0].date })
  }
  journeyItems.sort((a, b) => b.date?.localeCompare(a.date || '')).slice(0, 4)

  return (
    <div>
      {/* ── HEADER ────────────────────────────────────────────── */}
      <div style={{ position: 'relative', padding: '52px var(--page-pad-x) 28px', overflow: 'hidden', minHeight: 140 }}>
        <HomeHeaderBotanical />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{
            fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)',
            color: 'var(--c-text-300)', marginBottom: 4,
            letterSpacing: '0.04em', textTransform: 'uppercase',
          }}>
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)',
            fontWeight: 500, color: 'var(--c-text-900)',
            letterSpacing: '-0.02em', marginBottom: 8, lineHeight: 1.1,
          }}>
            {greeting()},<br />Adriana
          </h1>
          <p style={{
            fontFamily: 'var(--font-editorial)', fontSize: 'var(--text-md)',
            color: 'var(--c-text-500)', fontStyle: 'italic', lineHeight: 1.5,
          }}>
            {dailyPhrase()}
          </p>
        </div>
      </div>

      {/* ── 1. CONSISTÊNCIA ─────────────────────────────────────── */}
      <section style={{ marginBottom: 32 }}>
        <div className="section-header">
          <h2 className="section-title">Consistência</h2>
          <span style={{ fontSize: 10, fontFamily: 'var(--font-ui)', color: 'var(--c-text-300)' }}>Últimos 35 dias</span>
        </div>
        {loading
          ? <div style={{ margin: '0 var(--page-pad-x)', height: 80 }} className="loading-shimmer" />
          : <ConsistencyCalendar tracking={data?.tracking} />
        }
      </section>

      {/* ── 2. EVOLUÇÃO DA SEMANA ────────────────────────────────── */}
      <section style={{ marginBottom: 32 }}>
        <div className="section-header">
          <h2 className="section-title">Esta semana</h2>
        </div>
        <div style={{ paddingLeft: 'var(--page-pad-x)', display: 'flex', gap: 10, overflowX: 'auto', paddingRight: 'var(--page-pad-x)', paddingBottom: 4 }}>
          {loading ? (
            Array.from({ length: 5 }, (_, i) => (
              <div key={i} style={{ minWidth: 110, height: 90, flexShrink: 0 }} className="loading-shimmer" />
            ))
          ) : (
            <>
              <WeekCard icon={Dumbbell} label="Treinos" value={data?.weekSummary.treinos} unit="x" goal={4} color="var(--c-sage)" />
              <WeekCard icon={Activity} label="Cardio" value={data?.weekSummary.cardio} unit="x" goal={6} color="#6BA8D4" />
              <WeekCard icon={FlaskConical} label="Proteína" value={data?.weekSummary.proteina} unit="g" goal={120} color="var(--c-gold)" />
              <WeekCard icon={Droplets} label="Água" value={data?.weekSummary.agua ? fmtWater(data.weekSummary.agua) : null} color="#6BA8D4" />
              <WeekCard icon={Moon} label="Sono" value={data?.weekSummary.sono} unit="h" goal={7} color="#9B8FC4" />
            </>
          )}
        </div>
      </section>

      {/* ── 3. RESUMO DE SAÚDE ──────────────────────────────────── */}
      <section style={{ marginBottom: 32 }}>
        <div className="section-header">
          <h2 className="section-title">Resumo de saúde</h2>
          <button className="section-link" onClick={() => navigate('/saude')}>Ver tudo</button>
        </div>
        {loading
          ? <div style={{ margin: '0 var(--page-pad-x)', height: 140 }} className="loading-shimmer card" />
          : <HealthSummary weight={data?.weight} cyclePhase={data?.cyclePhase}
              consultations={data?.consultations} fertility={data?.fertility} />
        }
      </section>

      {/* ── 4. AÇÕES DE HOJE ─────────────────────────────────────── */}
      <section style={{ marginBottom: 32 }}>
        <div className="section-header">
          <h2 className="section-title">Ações de hoje</h2>
        </div>
        <div style={{ paddingLeft: 'var(--page-pad-x)', display: 'flex', gap: 10, overflowX: 'auto', paddingRight: 'var(--page-pad-x)', paddingBottom: 4 }}>
          {QUICK_ACTIONS.map(a => (
            <ActionCard key={a.id} icon={a.icon} label={a.label} done={!!a.done}
              color={a.color} onClick={() => handleAction(a.id)} />
          ))}
        </div>
      </section>

      {/* ── 5. PRÓXIMOS EVENTOS ──────────────────────────────────── */}
      {upcoming.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <div className="section-header">
            <h2 className="section-title">Próximos eventos</h2>
            <button className="section-link" onClick={() => navigate('/saude')}>Ver todos</button>
          </div>
          <div className="card" style={{ margin: '0 var(--page-pad-x)', padding: '0 20px' }}>
            {upcoming.map((ev, i) => (
              <div key={i}>
                <EventRow {...ev} />
                {i < upcoming.length - 1 && <div style={{ height: 1, background: 'var(--c-border-light)' }} />}
              </div>
            ))}
          </div>
        </section>
      )}

      {upcoming.length === 0 && !loading && (
        <section style={{ marginBottom: 32 }}>
          <div className="section-header">
            <h2 className="section-title">Próximos eventos</h2>
          </div>
          <div style={{ padding: '0 var(--page-pad-x)' }}>
            <div className="card-inset empty-state" style={{ padding: '24px' }}>
              <CalendarDays size={28} style={{ color: 'var(--c-text-100)' }} />
              <p className="empty-state-text">Nenhum evento agendado</p>
            </div>
          </div>
        </section>
      )}

      {/* ── 6. JORNADA RECENTE ───────────────────────────────────── */}
      <section style={{ marginBottom: 40 }}>
        <div className="section-header">
          <h2 className="section-title">Jornada recente</h2>
          <button className="section-link" onClick={() => navigate('/jornada')}>Ver tudo</button>
        </div>
        <div style={{ padding: '0 var(--page-pad-x)' }}>
          {journeyItems.length > 0 ? (
            journeyItems.map((item, i) => (
              <TimelineItem key={i} {...item} last={i === journeyItems.length - 1} />
            ))
          ) : (
            <div className="card-inset empty-state">
              <Leaf size={28} style={{ color: 'var(--c-text-100)' }} />
              <p className="empty-state-text">
                Seus registros aparecem aqui
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── MODALS ───────────────────────────────────────────────── */}
      {modal && (
        <RegisterModal
          type={modal}
          userId={userId}
          onClose={() => setModal(null)}
          onSave={reload}
        />
      )}
    </div>
  )
}
