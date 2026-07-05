import ProgressPhotos from '../components/ProgressPhotos'
import React, { useState, useEffect, useCallback } from 'react'
import { Scale, Ruler, Moon, Droplets, TrendingUp, TrendingDown, Minus, Plus, X, Check, FlaskConical, Sparkles } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { PageBotanical } from '../components/BotanicalBg'
import { today, daysAgo, formatDate, formatDateShort, fmtWeight, fmtSleep, fmtWater } from '../lib/utils'

/* ─── SMOOTH SVG LINE CHART ─────────────────────────────────────── */
function WeightChart({ data, goalKg }) {
  if (!data?.length) {
    return (
      <div style={{ height: 160, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <Scale size={28} style={{ color: 'var(--c-text-100)' }} />
        <p style={{ fontFamily: 'var(--font-editorial)', fontSize: 15, color: 'var(--c-text-300)', fontStyle: 'italic' }}>
          Nenhum registro de peso ainda
        </p>
      </div>
    )
  }

  const W = 320, H = 140
  const PAD = { t: 16, r: 16, b: 28, l: 40 }
  const plotW = W - PAD.l - PAD.r
  const plotH = H - PAD.t - PAD.b

  const weights = data.map(d => parseFloat(d.weight))
  const rawMin  = Math.min(...weights)
  const rawMax  = Math.max(...weights)
  const range   = Math.max(rawMax - rawMin, 2)
  const minW    = rawMin - range * 0.15
  const maxW    = rawMax + range * 0.15

  const xScale = (i) => PAD.l + (i / Math.max(data.length - 1, 1)) * plotW
  const yScale = (w) => PAD.t + plotH - ((w - minW) / (maxW - minW)) * plotH

  const pts = data.map((d, i) => ({ x: xScale(i), y: yScale(parseFloat(d.weight)), ...d }))

  // Smooth cubic bezier path
  const smooth = (points) => {
    if (points.length < 2) return `M ${points[0].x} ${points[0].y}`
    let d = `M ${points[0].x} ${points[0].y}`
    for (let i = 1; i < points.length; i++) {
      const p = points[i - 1], c = points[i]
      const cp1x = p.x + (c.x - p.x) / 3
      const cp2x = c.x - (c.x - p.x) / 3
      d += ` C ${cp1x} ${p.y} ${cp2x} ${c.y} ${c.x} ${c.y}`
    }
    return d
  }

  const linePath = smooth(pts)
  const lastPt   = pts[pts.length - 1]
  const firstPt  = pts[0]
  const areaPath = `${linePath} L ${lastPt.x} ${H - PAD.b} L ${firstPt.x} ${H - PAD.b} Z`

  // Y-axis labels
  const yLabels = [rawMin, (rawMin + rawMax) / 2, rawMax].map(v => ({
    v, y: yScale(v), label: v.toFixed(1)
  }))

  // X-axis: first + last date
  const xLabels = [
    { label: formatDateShort(data[0].date),              x: PAD.l },
    { label: formatDateShort(data[data.length-1].date), x: lastPt.x },
  ]

  // Goal line
  const goalY = goalKg ? yScale(goalKg) : null

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', overflow: 'visible' }}>
      <defs>
        <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D4A5A5" stopOpacity="0.10" />
          <stop offset="100%" stopColor="#D4A5A5" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {yLabels.map(({ y }, i) => (
        <line key={i} x1={PAD.l} x2={W - PAD.r} y1={y} y2={y}
          stroke="rgba(62,50,44,0.04)" strokeWidth="0.75" />
      ))}

      {/* Goal line */}
      {goalY && (
        <line x1={PAD.l} x2={W - PAD.r} y1={goalY} y2={goalY}
          stroke="#C9A96E" strokeWidth="1" strokeDasharray="4 3" opacity={0.6} />
      )}

      {/* Area fill */}
      <path d={areaPath} fill="url(#wGrad)" />

      {/* Line */}
      <path d={linePath} stroke="#D4A5A5" strokeWidth="1.5" fill="none"
        strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />

      {/* Dots at each point (only if few points) */}
      {data.length <= 12 && pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="white" stroke="#D4A5A5" strokeWidth="1.5" />
      ))}

      {/* Last point highlighted */}
      <circle cx={lastPt.x} cy={lastPt.y} r="4.5" fill="white" stroke="#D4A5A5" strokeWidth="2" />

      {/* Y labels */}
      {yLabels.map(({ y, label }, i) => (
        <text key={i} x={PAD.l - 6} y={y + 3.5} textAnchor="end"
          fontSize="9" fill="var(--c-text-300)" fontFamily="Inter, sans-serif">{label}</text>
      ))}

      {/* X labels */}
      {xLabels.map(({ label, x }, i) => (
        <text key={i} x={x} y={H - 4} textAnchor={i === 0 ? 'start' : 'end'}
          fontSize="9" fill="var(--c-text-300)" fontFamily="Inter, sans-serif">{label}</text>
      ))}
    </svg>
  )
}

/* ─── MEASURE ROW ────────────────────────────────────────────────── */
function MeasureRow({ label, value, unit, prev }) {
  const diff = value && prev ? (parseFloat(value) - parseFloat(prev)).toFixed(1) : null
  const Icon = diff === null ? null : parseFloat(diff) < 0 ? TrendingDown : parseFloat(diff) > 0 ? TrendingUp : Minus
  const diffColor = diff === null ? '' : parseFloat(diff) < 0 ? 'var(--c-sage)' : parseFloat(diff) > 0 ? 'var(--c-rose-mid)' : 'var(--c-text-300)'

  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--c-border-light)' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--c-text-500)' }}>{label}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {diff !== null && Icon && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Icon size={12} style={{ color: diffColor }} />
            <span style={{ fontSize: 11, color: diffColor, fontFamily: 'var(--font-ui)' }}>{Math.abs(parseFloat(diff))}</span>
          </div>
        )}
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 500, color: 'var(--c-text-900)', minWidth: 60, textAlign: 'right' }}>
          {value ? `${parseFloat(value).toFixed(1)}` : '—'}
          {value && <span style={{ fontSize: 11, color: 'var(--c-text-500)', fontWeight: 400 }}> {unit}</span>}
        </div>
      </div>
    </div>
  )
}

/* ─── HABIT WEEK STRIP ───────────────────────────────────────────── */
function HabitStrip({ label, icon: Icon, color, data, field, getValue, goal, unit, fmt }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const dt = daysAgo(6 - i)
    const row = data?.find(d => d.date === dt)
    const val = row ? (getValue ? getValue(row) : (row[field] || 0)) : 0
    return { dt, val }
  })
  const filled = days.filter(d => d.val > 0).length
  const avg    = days.filter(d => d.val > 0).length
    ? (days.reduce((s, d) => s + (d.val || 0), 0) / days.filter(d => d.val > 0).length)
    : 0

  return (
    <div style={{ padding: '14px 0', borderBottom: '1px solid var(--c-border-light)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon size={15} strokeWidth={1.8} style={{ color }} />
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--c-text-700)' }}>{label}</span>
        </div>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, color: 'var(--c-text-900)' }}>
          {avg > 0 ? fmt(avg) : '—'}
          {avg > 0 && goal && <span style={{ fontSize: 11, color: 'var(--c-text-300)', marginLeft: 3 }}>/ {fmt(goal)}</span>}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        {days.map(({ dt, val }, i) => {
          const has = val > 0
          const pct = goal && val ? Math.min(val / goal, 1) : (has ? 1 : 0)
          return (
            <div key={dt} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <div style={{ height: 28, width: '100%', borderRadius: 4, background: 'var(--c-base-2)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${pct * 100}%`, background: color, opacity: 0.6, borderRadius: 4, transition: 'height 0.4s ease' }} />
              </div>
              <span style={{ fontSize: 8, color: 'var(--c-text-300)', fontFamily: 'var(--font-ui)' }}>
                {new Date(dt + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'narrow' })}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─── REGISTER MODAL ─────────────────────────────────────────────── */
function RegModal({ type, userId, onClose, onSave }) {
  const [vals, setVals]     = useState({})
  const [date, setDate]     = useState(today())
  const [saving, setSaving] = useState(false)
  const [done, setDone]     = useState(false)

  const set = (k, v) => setVals(p => ({ ...p, [k]: v }))

  const save = async () => {
    setSaving(true)
    const toNum = (v) => v ? parseFloat(String(v).replace(',', '.')) || null : null

    const { data: existing } = await supabase.from('physical_metrics')
      .select('id').eq('user_id', userId).eq('date', date).maybeSingle()

    if (type === 'peso') {
      const w = toNum(vals.weight)
      if (!w) { setSaving(false); return }
      if (existing) await supabase.from('physical_metrics').update({ weight: w }).eq('id', existing.id)
      else           await supabase.from('physical_metrics').insert({ user_id: userId, date, weight: w })
    } else if (type === 'medidas') {
      const row = {}
      const fields = {
        waist_cm: vals.waist, abdomen_cm: vals.abdomen, hip_cm: vals.hip, chest_cm: vals.chest,
        arm_right_cm: vals.arm, arm_left_cm: vals.armLeft,
        thigh_right_cm: vals.thigh, thigh_left_cm: vals.thighLeft,
        calf_right_cm: vals.calfRight, calf_left_cm: vals.calfLeft,
      }
      Object.entries(fields).forEach(([k, v]) => { const n = toNum(v); if (n) row[k] = n })
      if (existing) await supabase.from('physical_metrics').update(row).eq('id', existing.id)
      else           await supabase.from('physical_metrics').insert({ user_id: userId, date, ...row })
    }

    setDone(true)
    setTimeout(() => { onSave?.(); onClose() }, 700)
  }

  const fields = type === 'peso'
    ? [{ key: 'weight', label: 'Peso (kg)', placeholder: '0,0' }]
    : [
        { key: 'chest',     label: 'Busto (cm)',        placeholder: '0,0' },
        { key: 'waist',     label: 'Cintura (cm)',      placeholder: '0,0' },
        { key: 'abdomen',   label: 'Abdômen (cm)',      placeholder: '0,0' },
        { key: 'hip',       label: 'Quadril (cm)',      placeholder: '0,0' },
        { key: 'arm',       label: 'Braço D (cm)',      placeholder: '0,0' },
        { key: 'armLeft',   label: 'Braço E (cm)',      placeholder: '0,0' },
        { key: 'thigh',     label: 'Coxa D (cm)',       placeholder: '0,0' },
        { key: 'thighLeft', label: 'Coxa E (cm)',       placeholder: '0,0' },
        { key: 'calfRight', label: 'Panturrilha D (cm)',placeholder: '0,0' },
        { key: 'calfLeft',  label: 'Panturrilha E (cm)',placeholder: '0,0' },
      ]

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 className="sheet-title" style={{ marginBottom: 0 }}>
            {type === 'peso' ? 'Registrar peso' : 'Registrar medidas'}
          </h2>
          <button onClick={onClose} className="btn-ghost" style={{ padding: 8 }}><X size={18} strokeWidth={1.8} /></button>
        </div>
        {done ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '24px 0' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--c-sage-faint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Check size={24} strokeWidth={2} style={{ color: 'var(--c-sage)' }} />
            </div>
            <p style={{ fontFamily: 'var(--font-editorial)', fontSize: 18, color: 'var(--c-text-700)', fontStyle: 'italic' }}>Registrado</p>
          </div>
       ) : (
  <>
    {/* Data — sempre primeiro */}
    <div style={{ marginBottom: 16 }}>
      <label className="input-label">Data</label>
              <input className="input-field" type="date"
                value={date} max={today()}
                onChange={e => setDate(e.target.value)} />
            </div>
            {fields.map(f => (
              <div key={f.key} style={{ marginBottom: 16 }}>
                <label className="input-label">{f.label}</label>
                <input className="input-field" type="text" inputMode="decimal"
                  placeholder={f.placeholder} value={vals[f.key] || ''}
                  onChange={e => set(f.key, e.target.value)} />
              </div>
            ))}
            <button className="btn-primary" onClick={save} disabled={saving} style={{ marginTop: 8 }}>
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

/* ─── EVOLUÇÃO DE INDICADORES ────────────────────────────────────── */
function MiniChart({ data, color }) {
  if (!data || data.length < 2) {
    return <div style={{ height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontSize: 11, color: 'var(--c-text-300)', fontFamily: 'var(--font-ui)', fontStyle: 'italic' }}>1 ponto</span>
    </div>
  }
  const W = 200, H = 44, PAD = { t: 6, r: 8, b: 6, l: 8 }
  const vals = data.map(d => parseFloat(d.result)).filter(v => !isNaN(v))
  if (!vals.length) return null
  const minV = Math.min(...vals), maxV = Math.max(...vals)
  const range = Math.max(maxV - minV, 0.01)
  const xS = (i) => PAD.l + (i / (data.length - 1)) * (W - PAD.l - PAD.r)
  const yS = (v) => PAD.t + (H - PAD.t - PAD.b) - ((v - minV) / range) * (H - PAD.t - PAD.b)
  const smooth = (pts) => {
    let d = `M ${pts[0].x} ${pts[0].y}`
    for (let i = 1; i < pts.length; i++) {
      const p = pts[i-1], cur = pts[i]
      d += ` C ${p.x + (cur.x-p.x)/3} ${p.y} ${cur.x - (cur.x-p.x)/3} ${cur.y} ${cur.x} ${cur.y}`
    }
    return d
  }
  const pts = data.map((d, i) => ({ x: xS(i), y: yS(parseFloat(d.result)) }))
  const line = smooth(pts)
  const last = pts[pts.length - 1]
  const trend = vals[vals.length-1] > vals[0] ? '↑' : vals[vals.length-1] < vals[0] ? '↓' : '→'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ flex: 1, height: 44 }}>
        <path d={line} stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={last.x} cy={last.y} r="3" fill="white" stroke={color} strokeWidth="1.5" />
      </svg>
      <span style={{ fontSize: 12, color, fontWeight: 500 }}>{trend}</span>
    </div>
  )
}

function IndicadoresSection({ labResults }) {
  const COLORS = ['#D4A5A5','#8A9E8C','#C9A96E','#9B8FC4','#6BA8D4','#C48E8E']
  const grouped = {}
  for (const r of labResults || []) {
    if (!grouped[r.category]) grouped[r.category] = []
    grouped[r.category].push(r)
  }
  const cats = Object.keys(grouped).filter(k => grouped[k].length >= 1)
  if (!cats.length) return null
  return (
    <section style={{ padding: '0 var(--page-pad-x)', marginBottom: 28 }}>
      <h2 className="section-title" style={{ marginBottom: 16 }}>Evolução de indicadores</h2>
      {cats.map((cat, idx) => {
        const items = grouped[cat].sort((a, b) => a.date.localeCompare(b.date))
        const last = items[items.length - 1]
        const color = COLORS[idx % COLORS.length]
        return (
          <div key={cat} className="card" style={{ padding: '14px 16px', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 500, color: 'var(--c-text-900)' }}>{cat}</div>
                <div style={{ fontSize: 11, color: 'var(--c-text-300)', fontFamily: 'var(--font-ui)', marginTop: 2 }}>
                  {items.length} medição{items.length !== 1 ? 'ões' : ''}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 500, color: 'var(--c-text-900)' }}>
                  {last?.result}
                </div>
                {last?.unit && <div style={{ fontSize: 10, color: 'var(--c-text-300)' }}>{last.unit}</div>}
              </div>
            </div>
            <MiniChart data={items} color={color} />
          </div>
        )
      })}
    </section>
  )
}


/* ─── MAIN PAGE ──────────────────────────────────────────────────── */
export default function Evolucao({ userId }) {
  const [tab, setTab]       = useState('corpo')
  const [modal, setModal]   = useState(null)
  const [showHistory, setShowHistory] = useState(false)
const [editEntry, setEditEntry] = useState(null)
  const [loading, setLoading] = useState(true)
  const [data, setData]     = useState(null)

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const d90 = daysAgo(90)
    const d7  = daysAgo(7)

    const [
      { data: physList },
      { data: trackList },
      { data: settings },
      { data: labResults },
    ] = await Promise.all([
      supabase.from('physical_metrics').select('*').eq('user_id', userId).gte('date', d90).order('date'),
      supabase.from('daily_tracking').select('date,water_ml,sleep_hours,protein_g,strength_done,aerobic_done,skincare_am,skincare_pm').eq('user_id', userId).gte('date', d7).order('date'),
      supabase.from('fitness_settings').select('weight_goal1_kg').eq('user_id', userId).maybeSingle(),
      supabase.from('lab_results').select('category,date,result,unit,status').eq('user_id', userId).eq('status', 'realizado').not('result', 'is', null).order('date'),
    ])

    const latest  = physList?.length ? physList[physList.length - 1] : null
    const prev    = physList?.length > 1 ? physList[physList.length - 2] : null
    const weightHistory = (physList || []).filter(r => r.weight).map(r => ({ date: r.date, weight: r.weight }))

    setData({ physList: physList || [], latest, prev, weightHistory, trackList: trackList || [], goalKg: settings?.weight_goal1_kg, labResults: labResults || [] })
    setLoading(false)
  }, [userId])

  useEffect(() => { load() }, [load])

  const TAB_STYLE = (active) => ({
    flex: 1, padding: '10px 0', border: 'none', cursor: 'pointer', background: 'none',
    fontFamily: 'var(--font-ui)', fontSize: 14,
    fontWeight: active ? 500 : 400,
    color: active ? 'var(--c-text-900)' : 'var(--c-text-300)',
    borderBottom: `2px solid ${active ? 'var(--c-rose)' : 'transparent'}`,
    transition: 'color 0.2s, border-color 0.2s',
  })

  const l = data?.latest
  const p = data?.prev

  return (
    <div style={{ position: 'relative', minHeight: '100%', paddingBottom: 20 }}>
      {/* Header */}
      <div style={{ padding: '52px var(--page-pad-x) 0', position: 'relative', overflow: 'hidden', marginBottom: 24 }}>
        <PageBotanical />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 500, color: 'var(--c-text-900)', letterSpacing: '-0.02em', marginBottom: 4 }}>
            Evolução
          </h1>
          <p style={{ fontFamily: 'var(--font-editorial)', fontSize: 16, color: 'var(--c-text-500)', fontStyle: 'italic' }}>
            Seu progresso ao longo do tempo
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--c-border)', margin: '0 var(--page-pad-x) 24px', gap: 0 }}>
        <button style={TAB_STYLE(tab === 'corpo')} onClick={() => setTab('corpo')}>Corpo</button>
        <button style={TAB_STYLE(tab === 'habitos')} onClick={() => setTab('habitos')}>Hábitos</button>
      </div>

      {tab === 'corpo' && (
        <>
          {/* Weight chart */}
          <section style={{ padding: '0 var(--page-pad-x)', marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 500, color: 'var(--c-text-900)' }}>
                  {l?.weight ? parseFloat(l.weight).toFixed(1) : '—'}
                </span>
                {l?.weight && <span style={{ fontSize: 14, color: 'var(--c-text-500)', marginLeft: 4 }}>kg</span>}
              </div>
              <div style={{ textAlign: 'right' }}>
                {p?.weight && l?.weight && (
                  <div style={{ fontSize: 13, color: parseFloat(l.weight) < parseFloat(p.weight) ? 'var(--c-sage)' : 'var(--c-rose-mid)' }}>
                    {parseFloat(l.weight) < parseFloat(p.weight) ? '↓' : '↑'}{' '}
                    {Math.abs(parseFloat(l.weight) - parseFloat(p.weight)).toFixed(1)} kg
                  </div>
                )}
                {data?.goalKg && (
                  <div style={{ fontSize: 11, color: 'var(--c-text-300)', fontFamily: 'var(--font-ui)', marginTop: 2 }}>
                    Meta: {parseFloat(data.goalKg).toFixed(1)} kg
                  </div>
                )}
                {l?.date && <div style={{ fontSize: 11, color: 'var(--c-text-300)', fontFamily: 'var(--font-ui)' }}>{formatDate(l.date)}</div>}
              </div>
            </div>
            <div className="card" style={{ padding: '16px 12px 8px' }}>
              <WeightChart data={data?.weightHistory} goalKg={data?.goalKg} />
            </div>
          </section>

          /* ─── MEASURES EVOLUTION CHART ──────────────────────────────────── */
function MeasuresChart({ data, field, color }) {
  const points = (data || []).filter(d => d[field] != null).map(d => ({ date: d.date, value: parseFloat(d[field]) }))
  if (points.length < 2) {
    return (
      <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--c-text-300)', fontStyle: 'italic' }}>
          {points.length === 0 ? 'Sem registros ainda' : 'Só 1 registro ainda'}
        </span>
      </div>
    )
  }
  const W = 320, H = 110, PAD = { t: 10, r: 14, b: 20, l: 34 }
  const plotW = W - PAD.l - PAD.r, plotH = H - PAD.t - PAD.b
  const vals = points.map(p => p.value)
  const rawMin = Math.min(...vals), rawMax = Math.max(...vals)
  const range = Math.max(rawMax - rawMin, 1)
  const minV = rawMin - range * 0.15, maxV = rawMax + range * 0.15
  const xS = (i) => PAD.l + (i / Math.max(points.length - 1, 1)) * plotW
  const yS = (v) => PAD.t + plotH - ((v - minV) / (maxV - minV)) * plotH
  const pts = points.map((p, i) => ({ x: xS(i), y: yS(p.value), ...p }))
  const smooth = (ps) => {
    let d = `M ${ps[0].x} ${ps[0].y}`
    for (let i = 1; i < ps.length; i++) {
      const p = ps[i - 1], c = ps[i]
      d += ` C ${p.x + (c.x - p.x) / 3} ${p.y} ${c.x - (c.x - p.x) / 3} ${c.y} ${c.x} ${c.y}`
    }
    return d
  }
  const line = smooth(pts)
  const last = pts[pts.length - 1]
  const delta = (points[points.length - 1].value - points[0].value).toFixed(1)

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', overflow: 'visible' }}>
        <path d={line} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />
        {points.length <= 12 && pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="white" stroke={color} strokeWidth="1.2" />
        ))}
        <circle cx={last.x} cy={last.y} r="3.5" fill="white" stroke={color} strokeWidth="1.6" />
        <text x={PAD.l} y={H - 4} fontSize="9" fill="var(--c-text-300)" fontFamily="Inter, sans-serif">{formatDateShort(points[0].date)}</text>
        <text x={last.x} y={H - 4} textAnchor="end" fontSize="9" fill="var(--c-text-300)" fontFamily="Inter, sans-serif">{formatDateShort(points[points.length - 1].date)}</text>
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--c-text-300)' }}>{points.length} registros</span>
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 500, color: parseFloat(delta) < 0 ? 'var(--c-sage)' : parseFloat(delta) > 0 ? 'var(--c-rose-mid)' : 'var(--c-text-300)' }}>
          {parseFloat(delta) > 0 ? '+' : ''}{delta} cm desde o início
        </span>
      </div>
    </div>
  )
}

const MEASURE_FIELDS = [
  { key: 'waist_cm', label: 'Cintura' },
  { key: 'abdomen_cm', label: 'Abdômen' },
  { key: 'hip_cm', label: 'Quadril' },
  { key: 'chest_cm', label: 'Busto' },
  { key: 'arm_right_cm', label: 'Braço D' },
  { key: 'arm_left_cm', label: 'Braço E' },
  { key: 'thigh_right_cm', label: 'Coxa D' },
  { key: 'thigh_left_cm', label: 'Coxa E' },
  { key: 'calf_right_cm', label: 'Pant. D' },
  { key: 'calf_left_cm', label: 'Pant. E' },
]

function MeasuresEvolutionSection({ physList }) {
  const available = MEASURE_FIELDS.filter(f => (physList || []).filter(r => r[f.key] != null).length >= 2)
  const [sel, setSel] = useState(available[0]?.key)
  if (!available.length) return null
  const activeSel = available.some(f => f.key === sel) ? sel : available[0].key

  return (
    <section style={{ padding: '0 var(--page-pad-x)', marginBottom: 28 }}>
      <h2 className="section-title" style={{ marginBottom: 12 }}>Evolução das medidas</h2>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {available.map(f => (
          <button key={f.key} onClick={() => setSel(f.key)} style={{
            padding: '6px 12px', borderRadius: 'var(--r-full)', cursor: 'pointer',
            border: `1.5px solid ${activeSel === f.key ? 'var(--c-sage)' : 'var(--c-border)'}`,
            background: activeSel === f.key ? 'var(--c-sage-faint)' : 'none',
            color: activeSel === f.key ? 'var(--c-sage)' : 'var(--c-text-500)',
            fontFamily: 'var(--font-ui)', fontSize: 12,
          }}>{f.label}</button>
        ))}
      </div>
      <div className="card" style={{ padding: '14px 16px 10px' }}>
        <MeasuresChart data={physList} field={activeSel} color="#8A9E8C" />
      </div>
    </section>
  )
}

          {/* Measurements */}
          <section style={{ padding: '0 var(--page-pad-x)', marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h2 className="section-title">Medidas</h2>
              {l?.date && <span style={{ fontSize: 11, color: 'var(--c-text-300)', fontFamily: 'var(--font-ui)' }}>
                {formatDate(l.date)}
              </span>}
            </div>
            <div className="card" style={{ padding: '4px 16px 4px' }}>
              <MeasureRow label="Busto"         value={l?.chest_cm}       unit="cm" prev={p?.chest_cm} />
              <MeasureRow label="Cintura"       value={l?.waist_cm}       unit="cm" prev={p?.waist_cm} />
              <MeasureRow label="Abdômen"       value={l?.abdomen_cm}     unit="cm" prev={p?.abdomen_cm} />
              <MeasureRow label="Quadril"       value={l?.hip_cm}         unit="cm" prev={p?.hip_cm} />
              <MeasureRow label="Braço D"       value={l?.arm_right_cm}   unit="cm" prev={p?.arm_right_cm} />
              <MeasureRow label="Braço E"       value={l?.arm_left_cm}    unit="cm" prev={p?.arm_left_cm} />
              <MeasureRow label="Coxa D"        value={l?.thigh_right_cm} unit="cm" prev={p?.thigh_right_cm} />
              <MeasureRow label="Coxa E"        value={l?.thigh_left_cm}  unit="cm" prev={p?.thigh_left_cm} />
              <MeasureRow label="Panturrilha D" value={l?.calf_right_cm}  unit="cm" prev={p?.calf_right_cm} />
              <MeasureRow label="Panturrilha E" value={l?.calf_left_cm}   unit="cm" prev={p?.calf_left_cm} />
            </div>
            {(data?.physList?.length > 0) && (
              <button onClick={() => setShowHistory(s => !s)} style={{
                width: '100%', textAlign: 'center', padding: '10px 0', marginTop: 8,
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--c-text-400)',
              }}>{showHistory ? 'Ocultar histórico' : 'Ver / editar registros anteriores'}</button>
            )}
            {showHistory && (
              <div className="card" style={{ padding: '4px 16px', marginTop: 4 }}>
                {[...data.physList].reverse().map(row => (
                  <div key={row.id} onClick={() => setEditEntry(row)} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 0', borderBottom: '1px solid var(--c-border-light)', cursor: 'pointer',
                  }}>
                    <span style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--c-text-700)' }}>{formatDate(row.date)}</span>
                    <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--c-text-300)' }}>
                      {[row.weight && `${row.weight}kg`, row.waist_cm && `Cint. ${row.waist_cm}`, row.chest_cm && `Busto ${row.chest_cm}`].filter(Boolean).join(' · ') || 'editar'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <MeasuresEvolutionSection physList={data?.physList} />

          {/* Action buttons */}
          <div style={{ padding: '0 var(--page-pad-x)', display: 'flex', gap: 10, marginBottom: 32 }}>
            <button className="btn-primary" style={{ flex: 1 }} onClick={() => setModal('peso')}>
              + Registrar peso
            </button>
            <button className="btn-primary" style={{ flex: 1, background: 'var(--c-base-2)', color: 'var(--c-text-700)' }}
              onClick={() => setModal('medidas')}>
              + Medidas
            </button>
          </div>

          {/* ── Fotos de progresso ── */}
          

          {/* ── Fotos de progresso ── */}
          <div style={{ padding: '0 var(--page-pad-x)', marginBottom: 28 }}>
            <ProgressPhotos userId={userId} />
          </div>

          {/* Evolução de indicadores */}
          {data?.labResults?.length > 0 && (
            <IndicadoresSection labResults={data.labResults} />
          )}
        </>
      )}

      {tab === 'habitos' && (
        <section style={{ padding: '0 var(--page-pad-x)' }}>
          <p style={{ fontFamily: 'var(--font-editorial)', fontSize: 14, color: 'var(--c-text-300)', fontStyle: 'italic', marginBottom: 20, lineHeight: 1.6 }}>
            Últimos 7 dias — média de dias com registro
          </p>
          <div className="card" style={{ padding: '0 16px' }}>
            <HabitStrip label="Água" icon={Droplets} color="#6BA8D4" data={data?.trackList}
              field="water_ml" goal={2500} unit="ml"
              fmt={v => v >= 1000 ? `${(v/1000).toFixed(1)}L` : `${Math.round(v)}ml`} />
            <HabitStrip label="Sono" icon={Moon} color="#9B8FC4" data={data?.trackList}
              field="sleep_hours" goal={7} unit="h"
              fmt={v => `${parseFloat(v).toFixed(1)}h`} />
            <HabitStrip label="Proteína" icon={FlaskConical} color="var(--c-gold)" data={data?.trackList}
              field="protein_g" goal={120} unit="g"
              fmt={v => `${Math.round(v)}g`} />
            <HabitStrip label="Skincare" icon={Sparkles} color="#C4B8D4" data={data?.trackList}
              getValue={r => (r.skincare_am ? 1 : 0) + (r.skincare_pm ? 1 : 0)}
              goal={2} unit=""
              fmt={v => `${Math.round(v*10)/10}/2`} />
          </div>
        </section>
      )}

      {modal && (
        <RegModal type={modal} userId={userId} onClose={() => setModal(null)} onSave={load} />
      )}
      {editEntry && (
        <RegModal type="medidas" userId={userId} editData={editEntry}
          onClose={() => setEditEntry(null)} onSave={() => { load(); setEditEntry(null) }} />
      )}
    </div>
  )
}
