import React, { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Plus, X, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { PageBotanical } from '../components/BotanicalBg'
import { today, formatDate } from '../lib/utils'

/* ─── CYCLE PREDICTION ──────────────────────────────────────────── */
function predictCycle(entries) {
  const mens = [...(entries || []).filter(e => e.type === 'menstruacao')]
    .sort((a, b) => a.date.localeCompare(b.date))
  if (!mens.length) return { lastStart: null, nextPeriod: null, cycleLength: 28, fertileStart: null, fertileEnd: null, daysUntilNext: null, currentDay: null }

  // Find period starts (gap > 2 days = new period)
  const starts = []
  let prev = null
  for (const e of mens) {
    const d = new Date(e.date + 'T12:00:00')
    if (!prev || (d - prev) > 2 * 86400000) starts.push(e.date)
    prev = d
  }

  let cycleLength = 28
  if (starts.length >= 2) {
    const gaps = []
    for (let i = 1; i < starts.length; i++) {
      const a = new Date(starts[i - 1] + 'T12:00:00')
      const b = new Date(starts[i] + 'T12:00:00')
      gaps.push(Math.round((b - a) / 86400000))
    }
    cycleLength = Math.round(gaps.reduce((s, g) => s + g, 0) / gaps.length)
  }

  const lastStart    = starts[starts.length - 1]
  const lastDate     = new Date(lastStart + 'T12:00:00')
  const now          = new Date()
  const nextPeriod   = new Date(lastDate.getTime() + cycleLength * 86400000)
  const fertileStart = new Date(lastDate.getTime() + 11 * 86400000)
  const fertileEnd   = new Date(lastDate.getTime() + 16 * 86400000)
  const currentDay   = Math.round((now - lastDate) / 86400000) + 1
  const daysUntilNext = Math.round((nextPeriod - now) / 86400000)

  const fmt = d => d.toISOString().split('T')[0]
  return { lastStart, nextPeriod: fmt(nextPeriod), cycleLength, fertileStart: fmt(fertileStart), fertileEnd: fmt(fertileEnd), daysUntilNext, currentDay }
}

/* ─── CYCLE CALENDAR ────────────────────────────────────────────── */
function CycleCalendar({ year, month, entries, prediction, selectedDate, onSelectDate }) {
  const DAYS_PT   = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDOW    = (new Date(year, month, 1).getDay() + 6) % 7 // Mon=0

  const byDate = {}
  for (const e of entries) {
    if (!byDate[e.date]) byDate[e.date] = []
    byDate[e.date].push(e)
  }

  const dateStr = (d) => {
    const m = String(month + 1).padStart(2, '0')
    const dd = String(d).padStart(2, '0')
    return `${year}-${m}-${dd}`
  }

  const getCellStyle = (dt) => {
    const es = byDate[dt] || []
    const hasMens   = es.some(e => e.type === 'menstruacao')
    const isFertile = prediction?.fertileStart && dt >= prediction.fertileStart && dt <= prediction.fertileEnd
    const isPredicted = prediction?.nextPeriod && dt >= prediction.nextPeriod &&
      dt <= new Date(new Date(prediction.nextPeriod + 'T12:00:00').getTime() + 4 * 86400000).toISOString().split('T')[0]

    if (hasMens)    return { bg: '#D4A5A5', textColor: 'white' }
    if (isFertile)  return { bg: 'rgba(138,158,140,0.25)', textColor: 'var(--c-text-700)' }
    if (isPredicted) return { bg: 'rgba(212,165,165,0.2)', textColor: 'var(--c-text-700)' }
    return { bg: 'var(--c-base-2)', textColor: 'var(--c-text-500)' }
  }

  const dots = (dt) => {
    const types = [...new Set((byDate[dt] || []).map(e => e.type))]
    const colors = { sintoma: '#9B8FC4', humor: '#C9A96E', energia: '#8A9E8C', muco: '#6BA8D4', libido: '#D4A5A5' }
    return types.filter(t => t !== 'menstruacao').map(t => colors[t] || '#B8AEA9')
  }

  const cells = [
    ...Array(firstDOW).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 4 }}>
        {DAYS_PT.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 9, color: 'var(--c-text-300)', fontFamily: 'var(--font-ui)', paddingBottom: 4 }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={`e${i}`} />
          const dt  = dateStr(day)
          const sel = dt === selectedDate
          const tod = dt === today()
          const { bg, textColor } = getCellStyle(dt)
          const ds  = dots(dt)
          return (
            <div key={dt} onClick={() => onSelectDate(dt)} style={{
              borderRadius: 7, background: bg, aspectRatio: '1',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', position: 'relative',
              boxShadow: sel ? '0 0 0 2px var(--c-text-700)' : tod ? '0 0 0 1.5px var(--c-rose-mid)' : 'none',
            }}>
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: tod ? 600 : 400, color: textColor, lineHeight: 1 }}>{day}</span>
              {ds.length > 0 && (
                <div style={{ display: 'flex', gap: 2, marginTop: 2 }}>
                  {ds.slice(0, 3).map((c, j) => <div key={j} style={{ width: 4, height: 4, borderRadius: '50%', background: c }} />)}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─── REGISTER MODAL ─────────────────────────────────────────────── */
const SYMPTOM_OPTIONS = ['Cólica','Dor de cabeça','Inchaço','Sensibilidade mamária','Acne','Fadiga','Náusea','Lombalgia','Enxaqueca']
const FLUXO_OPTIONS   = ['Leve','Moderado','Intenso','Muito intenso']
const MUCO_OPTIONS    = ['Seco','Cremoso','Aquoso','Elástico (fio)']

function RegisterModal({ date, entries, userId, onClose, onSave }) {
  const [tab, setTab]     = useState('menstruacao')
  const [fluxo, setFluxo] = useState('')
  const [sintomas, setSintomas] = useState([])
  const [humor, setHumor] = useState(null)
  const [energia, setEnergia] = useState(null)
  const [muco, setMuco]   = useState('')
  const [notas, setNotas] = useState('')
  const [saving, setSaving] = useState(false)

  const toggleSintoma = (s) => setSintomas(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])

  const save = async () => {
    setSaving(true)
    const toInsert = []
    if (tab === 'menstruacao' && fluxo)
      toInsert.push({ user_id: userId, date, type: 'menstruacao', value: fluxo.toLowerCase() })
    if (tab === 'sintomas' && sintomas.length)
      sintomas.forEach(s => toInsert.push({ user_id: userId, date, type: 'sintoma', value: s, notes: notas || null }))
    if (tab === 'bem_estar') {
      if (humor)  toInsert.push({ user_id: userId, date, type: 'humor',  value: String(humor) })
      if (energia) toInsert.push({ user_id: userId, date, type: 'energia', value: String(energia) })
      if (muco)   toInsert.push({ user_id: userId, date, type: 'muco',   value: muco.toLowerCase() })
    }
    if (toInsert.length) await supabase.from('cycle_entries').insert(toInsert)
    onSave?.()
    onClose()
  }

  const TABS = [
    { key: 'menstruacao', label: 'Fluxo' },
    { key: 'sintomas',    label: 'Sintomas' },
    { key: 'bem_estar',   label: 'Bem-estar' },
  ]

  const tStyle = (k) => ({
    flex: 1, padding: '8px 0', border: 'none', background: 'none', cursor: 'pointer',
    fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: tab === k ? 500 : 400,
    color: tab === k ? 'var(--c-text-900)' : 'var(--c-text-300)',
    borderBottom: `2px solid ${tab === k ? 'var(--c-rose)' : 'transparent'}`,
  })

  const ScaleRow = ({ label, value, onChange, color }) => (
    <div style={{ marginBottom: 16 }}>
      <label className="input-label">{label}</label>
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        {[1,2,3,4,5].map(n => (
          <button key={n} onClick={() => onChange(n)} style={{
            flex: 1, aspectRatio: '1', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: value === n ? color : 'var(--c-base-2)',
            color: value === n ? 'white' : 'var(--c-text-500)',
            fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 500,
          }}>{n}</button>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        <span style={{ fontSize: 9, color: 'var(--c-text-300)' }}>Muito baixo</span>
        <span style={{ fontSize: 9, color: 'var(--c-text-300)' }}>Muito alto</span>
      </div>
    </div>
  )

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <h2 className="sheet-title" style={{ marginBottom: 0, fontSize: 18 }}>{formatDate(date)}</h2>
          <button onClick={onClose} className="btn-ghost" style={{ padding: 8 }}><X size={18} strokeWidth={1.8} /></button>
        </div>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--c-border)', marginBottom: 20 }}>
          {TABS.map(t => <button key={t.key} style={tStyle(t.key)} onClick={() => setTab(t.key)}>{t.label}</button>)}
        </div>

        {tab === 'menstruacao' && (
          <>
            <label className="input-label">Intensidade do fluxo</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {FLUXO_OPTIONS.map(f => (
                <button key={f} onClick={() => setFluxo(f)} style={{
                  padding: '12px 16px', borderRadius: 'var(--r-md)', border: 'none', cursor: 'pointer', textAlign: 'left',
                  background: fluxo === f ? 'rgba(212,165,165,0.2)' : 'var(--c-base-1)',
                  fontFamily: 'var(--font-ui)', fontSize: 14,
                  color: fluxo === f ? 'var(--c-rose-deep)' : 'var(--c-text-700)',
                  fontWeight: fluxo === f ? 500 : 400,
                  boxShadow: fluxo === f ? '0 0 0 1.5px var(--c-rose)' : 'none',
                }}>{f}</button>
              ))}
            </div>
          </>
        )}

        {tab === 'sintomas' && (
          <>
            <label className="input-label" style={{ marginBottom: 12 }}>Sintomas do dia</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {SYMPTOM_OPTIONS.map(s => (
                <button key={s} onClick={() => toggleSintoma(s)} style={{
                  padding: '8px 14px', borderRadius: 'var(--r-full)', border: 'none', cursor: 'pointer',
                  background: sintomas.includes(s) ? 'rgba(155,143,196,0.2)' : 'var(--c-base-2)',
                  fontFamily: 'var(--font-ui)', fontSize: 13,
                  color: sintomas.includes(s) ? '#7B6FA0' : 'var(--c-text-500)',
                  boxShadow: sintomas.includes(s) ? '0 0 0 1.5px #C4B8D4' : 'none',
                }}>{s}</button>
              ))}
            </div>
            <label className="input-label">Observação</label>
            <textarea className="input-field" rows={2} value={notas}
              onChange={e => setNotas(e.target.value)} style={{ resize: 'none', marginBottom: 16 }} />
          </>
        )}

        {tab === 'bem_estar' && (
          <>
            <ScaleRow label="Humor (1 = muito baixo)" value={humor} onChange={setHumor} color="#C9A96E" />
            <ScaleRow label="Energia" value={energia} onChange={setEnergia} color="#8A9E8C" />
            <label className="input-label">Muco cervical</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
              {MUCO_OPTIONS.map(m => (
                <button key={m} onClick={() => setMuco(m)} style={{
                  padding: '8px 12px', borderRadius: 'var(--r-full)', border: 'none', cursor: 'pointer',
                  background: muco === m ? 'rgba(107,168,212,0.2)' : 'var(--c-base-2)',
                  fontFamily: 'var(--font-ui)', fontSize: 12,
                  color: muco === m ? '#4A8BAD' : 'var(--c-text-500)',
                  boxShadow: muco === m ? '0 0 0 1.5px #6BA8D4' : 'none',
                }}>{m}</button>
              ))}
            </div>
          </>
        )}

        <button className="btn-primary" onClick={save} disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </div>
  )
}

/* ─── MAIN PAGE ──────────────────────────────────────────────────── */
export default function Ciclo({ userId }) {
  const now = new Date()
  const [year, setYear]     = useState(now.getFullYear())
  const [month, setMonth]   = useState(now.getMonth())
  const [entries, setEntries] = useState([])
  const [selected, setSelected] = useState(today())
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const from = `${year}-${String(month + 1).padStart(2,'0')}-01`
    const to   = `${year}-${String(month + 1).padStart(2,'0')}-31`
    // Load 3 months for prediction
    const { data } = await supabase.from('cycle_entries')
      .select('*').eq('user_id', userId)
      .gte('date', new Date(year, month - 3, 1).toISOString().split('T')[0])
      .lte('date', to).order('date')
    setEntries(data || [])
    setLoading(false)
  }, [userId, year, month])

  useEffect(() => { load() }, [load])

  const prevMonth = () => { if (month === 0) { setYear(y => y - 1); setMonth(11) } else setMonth(m => m - 1) }
  const nextMonth = () => { if (month === 11) { setYear(y => y + 1); setMonth(0) } else setMonth(m => m + 1) }

  const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
  const prediction = predictCycle(entries)
  const selectedEntries = entries.filter(e => e.date === selected)

  const PHASE_LABELS = {
    1: 'Fase Menstrual', 7: 'Fase Folicular', 12: 'Ovulação',
    15: 'Fase Lútea', 22: 'Fase Pré-menstrual',
  }

  const getCurrentPhaseLabel = () => {
    if (!prediction.currentDay) return '—'
    const day = prediction.currentDay
    if (day <= 5)  return 'Fase Menstrual'
    if (day <= 11) return 'Fase Folicular'
    if (day <= 16) return 'Ovulação'
    if (day <= 24) return 'Fase Lútea'
    return 'Fase Pré-menstrual'
  }

  return (
    <div style={{ position: 'relative', minHeight: '100%', paddingBottom: 24 }}>
      <div style={{ padding: '52px var(--page-pad-x) 0', position: 'relative', overflow: 'hidden', marginBottom: 20 }}>
        <PageBotanical />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 500, color: 'var(--c-text-900)', letterSpacing: '-0.02em', marginBottom: 4 }}>
            Ciclo
          </h1>
          <p style={{ fontFamily: 'var(--font-editorial)', fontSize: 16, color: 'var(--c-text-500)', fontStyle: 'italic' }}>
            Acompanhe seu ciclo menstrual
          </p>
        </div>
      </div>

      {/* Cycle info strip */}
      {prediction.lastStart && (
        <div style={{ margin: '0 var(--page-pad-x) 20px' }}>
          <div className="card" style={{ padding: '14px 16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: 10, color: 'var(--c-text-300)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Fase atual</div>
                <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 500, color: 'var(--c-text-900)' }}>{getCurrentPhaseLabel()}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'var(--c-text-300)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Dia do ciclo</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 500, color: 'var(--c-text-900)' }}>{prediction.currentDay}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'var(--c-text-300)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Próx. período</div>
                <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 500, color: prediction.daysUntilNext <= 3 ? 'var(--c-rose-deep)' : 'var(--c-text-700)' }}>
                  {prediction.daysUntilNext != null ? (prediction.daysUntilNext <= 0 ? 'Hoje' : `em ${prediction.daysUntilNext}d`) : '—'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Month navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 var(--page-pad-x)', marginBottom: 12 }}>
        <button onClick={prevMonth} className="btn-ghost" style={{ padding: 8 }}><ChevronLeft size={18} strokeWidth={1.8} /></button>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 500, color: 'var(--c-text-900)' }}>
          {MONTHS_PT[month]} {year}
        </span>
        <button onClick={nextMonth} className="btn-ghost" style={{ padding: 8 }}><ChevronRight size={18} strokeWidth={1.8} /></button>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, padding: '0 var(--page-pad-x)', marginBottom: 12 }}>
        {[
          { color: '#D4A5A5', label: 'Menstruação' },
          { color: 'rgba(138,158,140,0.5)', label: 'Fértil' },
          { color: 'rgba(212,165,165,0.3)', label: 'Previsão' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
            <span style={{ fontSize: 10, color: 'var(--c-text-300)', fontFamily: 'var(--font-ui)' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Calendar */}
      <div style={{ padding: '0 var(--page-pad-x)', marginBottom: 20 }}>
        <CycleCalendar year={year} month={month} entries={entries}
          prediction={prediction} selectedDate={selected} onSelectDate={setSelected} />
      </div>

      {/* Selected day panel */}
      <div style={{ margin: '0 var(--page-pad-x)', marginBottom: 20 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: selectedEntries.length ? 12 : 0 }}>
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 500, color: 'var(--c-text-700)' }}>
              {formatDate(selected)}
            </span>
            <button onClick={() => setShowModal(true)} style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '7px 13px',
              borderRadius: 'var(--r-full)', border: 'none', cursor: 'pointer',
              background: 'var(--c-text-900)', color: 'var(--c-base-0)',
              fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 500,
            }}>
              <Plus size={13} strokeWidth={2.5} /> Registrar
            </button>
          </div>
          {selectedEntries.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {selectedEntries.map(e => {
                const labels = { menstruacao:'Menstruação', sintoma:'Sintoma', humor:'Humor', energia:'Energia', muco:'Muco' }
                return (
                  <span key={e.id} className="pill pill-rose" style={{ fontSize: 11 }}>
                    {labels[e.type] || e.type}: {e.value}
                  </span>
                )
              })}
            </div>
          ) : (
            <p style={{ fontFamily: 'var(--font-editorial)', fontSize: 14, color: 'var(--c-text-300)', fontStyle: 'italic', marginTop: 4 }}>
              Nenhum registro para este dia
            </p>
          )}
        </div>
      </div>

      {showModal && (
        <RegisterModal date={selected} entries={selectedEntries}
          userId={userId} onClose={() => setShowModal(false)} onSave={load} />
      )}
    </div>
  )
}
