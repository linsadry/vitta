import React, { useState, useEffect, useCallback } from 'react'
import { BookOpen, UtensilsCrossed, Plus, X, Check, ChevronDown } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { PageBotanical } from '../components/BotanicalBg'
import { today, daysAgo, formatDate } from '../lib/utils'

/* ─── MOOD FACE SVG ──────────────────────────────────────────────── */
function MoodFace({ level, size = 32, selected, onClick }) {
  const configs = {
    1: { mouth: 'M 6 15 Q 12 20 18 15', eyes: 9,   color: '#C9A96E' },
    2: { mouth: 'M 7 15 Q 12 18 17 15', eyes: 9.5, color: '#8A9E8C' },
    3: { mouth: 'M 7 15 L 17 15',        eyes: 10,  color: '#B8AEA9' },
    4: { mouth: 'M 7 15 Q 12 12 17 15', eyes: 9.5, color: '#D4A5A5' },
    5: { mouth: 'M 6 16 Q 12 11 18 16', eyes: 9,   color: '#C48E8E' },
  }
  const c = configs[level]
  return (
    <button onClick={onClick} style={{
      background: selected ? `${c.color}22` : 'transparent',
      border: selected ? `1.5px solid ${c.color}` : '1.5px solid transparent',
      borderRadius: 12, padding: 6, cursor: 'pointer',
      transition: 'background 0.15s, border-color 0.15s',
    }}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke={c.color} strokeWidth="1.5" />
        <circle cx="8.5" cy={c.eyes} r="1.2" fill={c.color} />
        <circle cx="15.5" cy={c.eyes} r="1.2" fill={c.color} />
        <path d={c.mouth} stroke={c.color} strokeWidth="1.5" strokeLinecap="round" fill="none" />
      </svg>
    </button>
  )
}

const MOOD_LABELS = { 1: 'Muito feliz', 2: 'Bem', 3: 'Neutro', 4: 'Triste', 5: 'Muito triste' }

/* ─── DIARY ENTRY CARD ───────────────────────────────────────────── */
function DiaryCard({ entry }) {
  return (
    <div className="card" style={{ padding: '16px 18px', marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--c-text-300)' }}>{formatDate(entry.date)}</span>
        {entry.mood && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <MoodFace level={entry.mood} size={20} />
            <span style={{ fontSize: 11, color: 'var(--c-text-300)', fontFamily: 'var(--font-ui)' }}>{MOOD_LABELS[entry.mood]}</span>
          </div>
        )}
      </div>
      {entry.content && (
        <p style={{ fontFamily: 'var(--font-editorial)', fontSize: 15, color: 'var(--c-text-700)', lineHeight: 1.6, marginBottom: entry.gratitude ? 10 : 0 }}>
          {entry.content}
        </p>
      )}
      {entry.gratitude && (
        <div style={{ borderLeft: '2px solid var(--c-gold-light)', paddingLeft: 10, marginTop: 8 }}>
          <p style={{ fontFamily: 'var(--font-editorial)', fontSize: 13, color: 'var(--c-text-500)', fontStyle: 'italic', lineHeight: 1.5 }}>
            Gratidão: {entry.gratitude}
          </p>
        </div>
      )}
    </div>
  )
}

/* ─── DIARY TAB ──────────────────────────────────────────────────── */
function DiarioTab({ userId }) {
  const [entries, setEntries]   = useState([])
  const [todayEntry, setToday]  = useState(null)
  const [mood, setMood]         = useState(null)
  const [content, setContent]   = useState('')
  const [gratitude, setGratitude] = useState('')
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const todayStr = today()

  const load = useCallback(async () => {
    if (!userId) return
    const { data } = await supabase.from('diary_entries')
      .select('*').eq('user_id', userId)
      .order('date', { ascending: false }).limit(30)
    const list  = data || []
    const todayE = list.find(e => e.date === todayStr)
    setEntries(list.filter(e => e.date !== todayStr))
    if (todayE) {
      setToday(todayE)
      setMood(todayE.mood ? parseInt(todayE.mood) : null)
      setContent(todayE.content || '')
      setGratitude(todayE.gratitude || '')
    }
  }, [userId, todayStr])

  useEffect(() => { load() }, [load])

  const save = async () => {
    if (!content && !mood) return
    setSaving(true)
    const row = { user_id: userId, date: todayStr, content: content || null, mood: mood ? String(mood) : null, gratitude: gratitude || null }
    if (todayEntry) {
      await supabase.from('diary_entries').update(row).eq('id', todayEntry.id)
    } else {
      await supabase.from('diary_entries').insert(row)
    }
    setSaved(true)
    setTimeout(() => { setSaved(false); load() }, 1200)
    setSaving(false)
  }

  return (
    <div style={{ padding: '0 var(--page-pad-x)' }}>
      {/* Today entry */}
      <div className="card" style={{ padding: '18px 18px', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 500, color: 'var(--c-text-900)' }}>
            Hoje — {new Date().toLocaleDateString('pt-BR', { weekday: 'long' })}
          </h3>
          {saved && <span style={{ fontSize: 11, color: 'var(--c-sage)', fontFamily: 'var(--font-ui)' }}>Salvo</span>}
        </div>

        {/* Mood picker */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontFamily: 'var(--font-ui)', fontSize: 10, color: 'var(--c-text-300)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Como você está?
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
            {[1, 2, 3, 4, 5].map(n => (
              <MoodFace key={n} level={n} size={30} selected={mood === n} onClick={() => setMood(p => p === n ? null : n)} />
            ))}
          </div>
          {mood && (
            <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--c-text-300)', fontFamily: 'var(--font-ui)', marginTop: 6 }}>
              {MOOD_LABELS[mood]}
            </p>
          )}
        </div>

        {/* Content */}
        <div style={{ marginBottom: 12 }}>
          <label className="input-label">Reflexões do dia</label>
          <textarea className="input-field" rows={4} placeholder="Como foi seu dia? O que você sente agora?"
            value={content} onChange={e => setContent(e.target.value)} style={{ resize: 'none', lineHeight: 1.6 }} />
        </div>

        {/* Gratitude */}
        <div style={{ marginBottom: 16 }}>
          <label className="input-label">Gratidão</label>
          <input className="input-field" type="text" placeholder="Hoje sou grata por..."
            value={gratitude} onChange={e => setGratitude(e.target.value)} />
        </div>

        <button className="btn-primary" onClick={save} disabled={saving || (!content && !mood)}>
          {saving ? 'Salvando...' : saved ? 'Salvo!' : 'Salvar registro'}
        </button>
      </div>

      {/* Past entries */}
      {entries.length > 0 && (
        <div>
          <h3 className="section-title" style={{ marginBottom: 12, fontSize: 15 }}>Registros anteriores</h3>
          {entries.map(e => <DiaryCard key={e.id} entry={{ ...e, mood: e.mood ? parseInt(e.mood) : null }} />)}
        </div>
      )}
    </div>
  )
}

/* ─── MEAL CARD ──────────────────────────────────────────────────── */
function MealCard({ meal }) {
  const macros = [
    { label: 'Kcal', value: meal.kcal,      color: '#C9A96E' },
    { label: 'Prot', value: meal.protein_g, color: '#8A9E8C', unit: 'g' },
    { label: 'Carb', value: meal.carbs_g,   color: '#6BA8D4', unit: 'g' },
    { label: 'Gord', value: meal.fat_g,     color: '#D4A5A5', unit: 'g' },
  ]
  return (
    <div style={{ padding: '12px 0', borderBottom: '1px solid var(--c-border-light)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 500, color: 'var(--c-text-900)' }}>{meal.name || 'Refeição'}</div>
          {meal.time && <div style={{ fontSize: 11, color: 'var(--c-text-300)', marginTop: 2 }}>{meal.time}</div>}
          {meal.raw_text && <div style={{ fontSize: 12, color: 'var(--c-text-500)', marginTop: 2, lineHeight: 1.4 }}>{meal.raw_text}</div>}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {macros.filter(m => m.value).map(m => (
          <div key={m.label} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: m.color, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: 'var(--c-text-500)', fontFamily: 'var(--font-ui)' }}>
              {Math.round(m.value)}{m.unit || ''} {m.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── ADD MEAL MODAL ─────────────────────────────────────────────── */
function AddMealModal({ userId, onClose, onSave }) {
  const [name, setName]         = useState('')
  const [desc, setDesc]         = useState('')
  const [time, setTime]         = useState('')
  const [kcal, setKcal]         = useState('')
  const [protein, setProtein]   = useState('')
  const [carbs, setCarbs]       = useState('')
  const [fat, setFat]           = useState('')
  const [showMacros, setShowMacros] = useState(false)
  const [saving, setSaving]     = useState(false)

  const toN = (v) => v ? parseFloat(v.replace(',', '.')) || null : null

  const save = async () => {
    if (!name && !desc) return
    setSaving(true)
    await supabase.from('fitness_meals').insert({
      user_id: userId, date: today(), name: name || desc.slice(0, 40) || 'Refeição',
      raw_text: desc || null, time: time || null,
      kcal: toN(kcal), protein_g: toN(protein), carbs_g: toN(carbs), fat_g: toN(fat),
    })
    onSave?.(); onClose()
  }

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 className="sheet-title" style={{ marginBottom: 0 }}>Registrar refeição</h2>
          <button onClick={onClose} className="btn-ghost" style={{ padding: 8 }}><X size={18} strokeWidth={1.8} /></button>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label className="input-label">Nome</label>
          <input className="input-field" type="text" placeholder="Ex: Almoço, Café da manhã"
            value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label className="input-label">O que você comeu?</label>
          <textarea className="input-field" rows={3} placeholder="Ex: Arroz, feijão, frango grelhado, salada..."
            value={desc} onChange={e => setDesc(e.target.value)} style={{ resize: 'none' }} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label className="input-label">Horário</label>
          <input className="input-field" type="time" value={time} onChange={e => setTime(e.target.value)} />
        </div>

        <button onClick={() => setShowMacros(v => !v)} className="btn-ghost" style={{ width: '100%', padding: '10px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: showMacros ? 14 : 20 }}>
          <span>Adicionar macros manualmente</span>
          <ChevronDown size={14} style={{ transform: showMacros ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>

        {showMacros && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
            {[
              { key: 'kcal',    label: 'Calorias', state: kcal,    set: setKcal,    unit: 'kcal' },
              { key: 'protein', label: 'Proteína', state: protein, set: setProtein, unit: 'g' },
              { key: 'carbs',   label: 'Carboidratos', state: carbs, set: setCarbs, unit: 'g' },
              { key: 'fat',     label: 'Gordura',  state: fat,     set: setFat,     unit: 'g' },
            ].map(f => (
              <div key={f.key}>
                <label className="input-label">{f.label} ({f.unit})</label>
                <input className="input-field" type="text" inputMode="decimal" placeholder="0"
                  value={f.state} onChange={e => f.set(e.target.value)} />
              </div>
            ))}
          </div>
        )}

        <button className="btn-primary" onClick={save} disabled={saving || (!name && !desc)}>
          {saving ? 'Salvando...' : 'Salvar refeição'}
        </button>
      </div>
    </div>
  )
}

/* ─── ALIMENTACAO TAB ────────────────────────────────────────────── */
function AlimentacaoTab({ userId }) {
  const [meals, setMeals]     = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const todayStr = today()

  const load = useCallback(async () => {
    if (!userId) return
    const { data } = await supabase.from('fitness_meals')
      .select('*').eq('user_id', userId).eq('date', todayStr).order('created_at')
    setMeals(data || [])
  }, [userId, todayStr])

  useEffect(() => { load() }, [load])

  const totals = meals.reduce((acc, m) => ({
    kcal:      acc.kcal      + (m.kcal      || 0),
    protein_g: acc.protein_g + (m.protein_g || 0),
    carbs_g:   acc.carbs_g   + (m.carbs_g   || 0),
    fat_g:     acc.fat_g     + (m.fat_g     || 0),
  }), { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 })

  const GOALS = { kcal: 1800, protein_g: 120, carbs_g: 200, fat_g: 60 }

  return (
    <div style={{ padding: '0 var(--page-pad-x)' }}>
      {/* Daily summary */}
      {meals.length > 0 && (
        <div className="card" style={{ padding: '16px 18px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 500, color: 'var(--c-text-900)' }}>Resumo de hoje</h3>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 500, color: 'var(--c-text-900)' }}>
              {Math.round(totals.kcal)} <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--c-text-300)' }}>kcal</span>
            </span>
          </div>
          {[
            { label: 'Proteína', value: totals.protein_g, goal: GOALS.protein_g, color: '#8A9E8C', unit: 'g' },
            { label: 'Carboidratos', value: totals.carbs_g, goal: GOALS.carbs_g, color: '#6BA8D4', unit: 'g' },
            { label: 'Gordura', value: totals.fat_g, goal: GOALS.fat_g, color: '#D4A5A5', unit: 'g' },
          ].map(m => (
            <div key={m.label} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: 'var(--c-text-500)', fontFamily: 'var(--font-ui)' }}>{m.label}</span>
                <span style={{ fontSize: 12, color: 'var(--c-text-700)', fontFamily: 'var(--font-ui)' }}>
                  {Math.round(m.value)}{m.unit} / {m.goal}{m.unit}
                </span>
              </div>
              <div style={{ height: 4, background: 'var(--c-base-2)', borderRadius: 2 }}>
                <div style={{ height: '100%', width: `${Math.min((m.value / m.goal) * 100, 100)}%`, background: m.color, borderRadius: 2, transition: 'width 0.4s ease' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add meal button */}
      <button className="btn-primary" style={{ marginBottom: 20 }} onClick={() => setShowAdd(true)}>
        + Registrar refeição
      </button>

      {/* Meal list */}
      {meals.length > 0 ? (
        <div className="card" style={{ padding: '0 16px' }}>
          {meals.map(m => <MealCard key={m.id} meal={m} />)}
        </div>
      ) : (
        <div className="empty-state" style={{ paddingTop: 32 }}>
          <UtensilsCrossed size={32} style={{ color: 'var(--c-text-100)' }} />
          <p className="empty-state-text">Nenhuma refeição registrada hoje</p>
        </div>
      )}

      {showAdd && <AddMealModal userId={userId} onClose={() => setShowAdd(false)} onSave={load} />}
    </div>
  )
}

/* ─── MAIN PAGE ──────────────────────────────────────────────────── */
export default function Diario({ userId }) {
  const [tab, setTab] = useState('diario')

  const TAB_STYLE = (active) => ({
    flex: 1, padding: '10px 0', border: 'none', cursor: 'pointer', background: 'none',
    fontFamily: 'var(--font-ui)', fontSize: 14,
    fontWeight: active ? 500 : 400,
    color: active ? 'var(--c-text-900)' : 'var(--c-text-300)',
    borderBottom: `2px solid ${active ? 'var(--c-rose)' : 'transparent'}`,
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
  })

  return (
    <div style={{ position: 'relative', minHeight: '100%', paddingBottom: 24 }}>
      <div style={{ padding: '52px var(--page-pad-x) 0', position: 'relative', overflow: 'hidden', marginBottom: 20 }}>
        <PageBotanical />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 500, color: 'var(--c-text-900)', letterSpacing: '-0.02em', marginBottom: 4 }}>
            Registros
          </h1>
          <p style={{ fontFamily: 'var(--font-editorial)', fontSize: 16, color: 'var(--c-text-500)', fontStyle: 'italic' }}>
            Diário pessoal e alimentação
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid var(--c-border)', margin: '0 var(--page-pad-x) 24px' }}>
        <button style={TAB_STYLE(tab === 'diario')} onClick={() => setTab('diario')}>
          <BookOpen size={14} strokeWidth={1.8} />
          Diário
        </button>
        <button style={TAB_STYLE(tab === 'alimentacao')} onClick={() => setTab('alimentacao')}>
          <UtensilsCrossed size={14} strokeWidth={1.8} />
          Alimentação
        </button>
      </div>

      {tab === 'diario'      && <DiarioTab      userId={userId} />}
      {tab === 'alimentacao' && <AlimentacaoTab userId={userId} />}
    </div>
  )
}
