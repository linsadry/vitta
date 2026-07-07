import React, { useState, useEffect, useCallback } from 'react'
import { BookOpen, UtensilsCrossed, Check } from 'lucide-react'
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

/* ─── ALIMENTACAO TAB (simplificado) ─────────────────────────────── */
function AlimentacaoTab({ userId }) {
  const [entry, setEntry]             = useState(null)
  const [kcal, setKcal]               = useState('')
  const [protein, setProtein]         = useState('')
  const [carbs, setCarbs]             = useState('')
  const [fat, setFat]                 = useState('')
  const [mealsCount, setMealsCount]   = useState('')
  const [dietEscape, setDietEscape]         = useState(false)
  const [dietEscapeNote, setDietEscapeNote] = useState('')
  const [alcohol, setAlcohol]         = useState(false)
  const [alcoholNote, setAlcoholNote] = useState('')
  const [saving, setSaving]           = useState(false)
  const [saved, setSaved]             = useState(false)
  const todayStr = today()

  const load = useCallback(async () => {
    if (!userId) return
    const { data } = await supabase.from('nutrition_days')
      .select('*').eq('user_id', userId).eq('date', todayStr).maybeSingle()
    if (data) {
      setEntry(data)
      setKcal(data.kcal != null ? String(data.kcal) : '')
      setProtein(data.protein_g != null ? String(data.protein_g) : '')
      setCarbs(data.carbs_g != null ? String(data.carbs_g) : '')
      setFat(data.fat_g != null ? String(data.fat_g) : '')
      setMealsCount(data.meals_count != null ? String(data.meals_count) : '')
      setDietEscape(!!data.diet_escape)
      setDietEscapeNote(data.diet_escape_note || '')
      setAlcohol(!!data.alcohol)
      setAlcoholNote(data.alcohol_note || '')
    } else {
      setEntry(null)
      setKcal(''); setProtein(''); setCarbs(''); setFat('')
      setMealsCount(''); setDietEscape(false); setDietEscapeNote('')
      setAlcohol(false); setAlcoholNote('')
    }
  }, [userId, todayStr])

  useEffect(() => { load() }, [load])

  const toN = (v) => v ? parseFloat(String(v).replace(',', '.')) || null : null
  const toI = (v) => v ? parseInt(v, 10) || null : null

  const save = async () => {
    setSaving(true)
    const row = {
      user_id: userId, date: todayStr,
      kcal: toN(kcal), protein_g: toN(protein), carbs_g: toN(carbs), fat_g: toN(fat),
      meals_count: toI(mealsCount),
      diet_escape: dietEscape, diet_escape_note: dietEscape ? (dietEscapeNote || null) : null,
      alcohol: alcohol, alcohol_note: alcohol ? (alcoholNote || null) : null,
      updated_at: new Date().toISOString(),
    }
    if (entry) {
      await supabase.from('nutrition_days').update(row).eq('id', entry.id)
    } else {
      await supabase.from('nutrition_days').insert(row)
    }
    setSaved(true)
    setTimeout(() => { setSaved(false); load() }, 1200)
    setSaving(false)
  }

  const ToggleRow = ({ label, active, onToggle }) => (
    <button onClick={onToggle} style={{
      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
      border: `1px solid ${active ? 'var(--c-rose)' : 'var(--c-border)'}`,
      background: active ? 'var(--c-rose)11' : 'transparent',
    }}>
      <span style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--c-text-700)' }}>{label}</span>
      <span style={{
        width: 18, height: 18, borderRadius: 5, border: `1.5px solid ${active ? 'var(--c-rose)' : 'var(--c-text-100)'}`,
        background: active ? 'var(--c-rose)' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        {active && <Check size={12} color="#fff" strokeWidth={2.5} />}
      </span>
    </button>
  )

  return (
    <div style={{ padding: '0 var(--page-pad-x)' }}>
      <div className="card" style={{ padding: '18px 18px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 500, color: 'var(--c-text-900)' }}>Hoje</h3>
          {saved && <span style={{ fontSize: 11, color: 'var(--c-sage)', fontFamily: 'var(--font-ui)' }}>Salvo</span>}
        </div>

        {/* Macros manuais */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          {[
            { label: 'Calorias (kcal)', state: kcal, set: setKcal },
            { label: 'Proteína (g)', state: protein, set: setProtein },
            { label: 'Carboidratos (g)', state: carbs, set: setCarbs },
            { label: 'Gordura (g)', state: fat, set: setFat },
          ].map(f => (
            <div key={f.label}>
              <label className="input-label">{f.label}</label>
              <input className="input-field" type="text" inputMode="decimal" placeholder="0"
                value={f.state} onChange={e => f.set(e.target.value)} />
            </div>
          ))}
        </div>

        {/* Número de refeições */}
        <div style={{ marginBottom: 18 }}>
          <label className="input-label">Número de refeições</label>
          <input className="input-field" type="text" inputMode="numeric" placeholder="Ex: 4"
            value={mealsCount} onChange={e => setMealsCount(e.target.value.replace(/\D/g, ''))} />
        </div>

        {/* Escapada da dieta */}
        <div style={{ marginBottom: dietEscape ? 10 : 14 }}>
          <ToggleRow label="Teve escapada da dieta?" active={dietEscape} onToggle={() => setDietEscape(v => !v)} />
        </div>
        {dietEscape && (
          <div style={{ marginBottom: 16 }}>
            <input className="input-field" type="text" placeholder="Anotação (opcional)"
              value={dietEscapeNote} onChange={e => setDietEscapeNote(e.target.value)} />
          </div>
        )}

        {/* Álcool */}
        <div style={{ marginBottom: alcohol ? 10 : 20 }}>
          <ToggleRow label="Teve ingestão de bebida alcoólica?" active={alcohol} onToggle={() => setAlcohol(v => !v)} />
        </div>
        {alcohol && (
          <div style={{ marginBottom: 20 }}>
            <input className="input-field" type="text" placeholder="Anotação (opcional)"
              value={alcoholNote} onChange={e => setAlcoholNote(e.target.value)} />
          </div>
        )}

        <button className="btn-primary" onClick={save} disabled={saving}>
          {saving ? 'Salvando...' : saved ? 'Salvo!' : 'Salvar'}
        </button>
      </div>
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
