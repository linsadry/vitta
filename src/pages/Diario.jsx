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
function DiaryCard({ entry, onClick }) {
  return (
    <div className="card" onClick={onClick} style={{ padding: '16px 18px', marginBottom: 10, cursor: onClick ? 'pointer' : 'default' }}>
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

/* ─── EDIT PAST ENTRY MODAL ──────────────────────────────────────── */
function DiaryEntryModal({ entry, onClose, onSave }) {
  const [mood, setMood]         = useState(entry.mood ? parseInt(entry.mood) : null)
  const [content, setContent]   = useState(entry.content || '')
  const [gratitude, setGratitude] = useState(entry.gratitude || '')
  const [saving, setSaving]     = useState(false)

  const save = async () => {
    setSaving(true)
    await supabase.from('diary_entries').update({
      mood: mood ? String(mood) : null,
      content: content || null,
      gratitude: gratitude || null,
    }).eq('id', entry.id)
    onSave?.(); onClose()
  }

  const remove = async () => {
    if (!window.confirm('Excluir este registro do diário?')) return
    setSaving(true)
    await supabase.from('diary_entries').delete().eq('id', entry.id)
    onSave?.(); onClose()
  }

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 className="sheet-title" style={{ marginBottom: 0 }}>{formatDate(entry.date)}</h2>
          <button onClick={onClose} className="btn-ghost" style={{ padding: 8 }}><X size={18} strokeWidth={1.8} /></button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <p style={{ fontFamily: 'var(--font-ui)', fontSize: 10, color: 'var(--c-text-300)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Como você estava?
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
            {[1, 2, 3, 4, 5].map(n => (
              <MoodFace key={n} level={n} size={28} selected={mood === n} onClick={() => setMood(p => p === n ? null : n)} />
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label className="input-label">Reflexões do dia</label>
          <textarea className="input-field" rows={4} value={content} onChange={e => setContent(e.target.value)} style={{ resize: 'none', lineHeight: 1.6 }} />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label className="input-label">Gratidão</label>
          <input className="input-field" type="text" value={gratitude} onChange={e => setGratitude(e.target.value)} />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={remove} disabled={saving} style={{
            flex: 1, padding: '13px 0', borderRadius: 'var(--r-full)',
            border: '1.5px solid var(--c-rose-mid)', background: 'none',
            color: 'var(--c-rose-mid)', fontFamily: 'var(--font-ui)', fontSize: 14, cursor: 'pointer',
          }}>Excluir</button>
          <button className="btn-primary" onClick={save} disabled={saving} style={{ flex: 2 }}>
            {saving ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>
      </div>
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
  const [editingEntry, setEditingEntry] = useState(null)
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
          <p style={{ fontSize: 11, color: 'var(--c-text-300)', fontFamily: 'var(--font-ui)', fontStyle: 'italic', marginBottom: 10 }}>
            Toque num registro para editar
          </p>
          {entries.map(e => (
            <DiaryCard key={e.id} entry={{ ...e, mood: e.mood ? parseInt(e.mood) : null }} onClick={() => setEditingEntry(e)} />
          ))}
        </div>
      )}

      {editingEntry && (
        <DiaryEntryModal entry={editingEntry} onClose={() => setEditingEntry(null)} onSave={load} />
      )}
    </div>
  )
}

/* ─── NUTRITION CARD (registros anteriores) ──────────────────────── */
function NutritionCard({ entry, onClick }) {
  return (
    <div className="card" onClick={onClick} style={{ padding: '14px 18px', marginBottom: 10, cursor: onClick ? 'pointer' : 'default' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: entry.kcal || entry.protein_g ? 8 : 0 }}>
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--c-text-300)' }}>{formatDate(entry.date)}</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {entry.diet_escape && (
            <span style={{ fontSize: 10, fontFamily: 'var(--font-ui)', color: 'var(--c-rose-mid)', background: 'var(--c-rose)15', padding: '2px 8px', borderRadius: 'var(--r-full)' }}>
              Escapada
            </span>
          )}
          {entry.alcohol && (
            <span style={{ fontSize: 10, fontFamily: 'var(--font-ui)', color: 'var(--c-gold)', background: 'rgba(201,169,110,0.15)', padding: '2px 8px', borderRadius: 'var(--r-full)' }}>
              Álcool
            </span>
          )}
        </div>
      </div>
      {(entry.kcal != null || entry.protein_g != null || entry.meals_count != null) && (
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          {entry.kcal != null && <span style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--c-text-700)' }}>{Math.round(entry.kcal)} kcal</span>}
          {entry.protein_g != null && <span style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--c-text-700)' }}>Prot {Math.round(entry.protein_g)}g</span>}
          {entry.carbs_g != null && <span style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--c-text-700)' }}>Carb {Math.round(entry.carbs_g)}g</span>}
          {entry.fat_g != null && <span style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--c-text-700)' }}>Gord {Math.round(entry.fat_g)}g</span>}
          {entry.meals_count != null && <span style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--c-text-700)' }}>{entry.meals_count} refeições</span>}
        </div>
      )}
      {(entry.diet_escape_note || entry.alcohol_note) && (
        <div style={{ borderLeft: '2px solid var(--c-gold-light)', paddingLeft: 10, marginTop: 8 }}>
          {entry.diet_escape_note && (
            <p style={{ fontFamily: 'var(--font-editorial)', fontSize: 13, color: 'var(--c-text-500)', fontStyle: 'italic', lineHeight: 1.5, margin: 0 }}>
              {entry.diet_escape_note}
            </p>
          )}
          {entry.alcohol_note && (
            <p style={{ fontFamily: 'var(--font-editorial)', fontSize: 13, color: 'var(--c-text-500)', fontStyle: 'italic', lineHeight: 1.5, margin: 0 }}>
              {entry.alcohol_note}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── EDIT PAST NUTRITION ENTRY MODAL ────────────────────────────── */
function NutritionEntryModal({ entry, userId, onClose, onSave }) {
  const [kcal, setKcal]               = useState(entry.kcal != null ? String(entry.kcal) : '')
  const [protein, setProtein]         = useState(entry.protein_g != null ? String(entry.protein_g) : '')
  const [carbs, setCarbs]             = useState(entry.carbs_g != null ? String(entry.carbs_g) : '')
  const [fat, setFat]                 = useState(entry.fat_g != null ? String(entry.fat_g) : '')
  const [mealsCount, setMealsCount]   = useState(entry.meals_count != null ? String(entry.meals_count) : '')
  const [dietEscape, setDietEscape]         = useState(!!entry.diet_escape)
  const [dietEscapeNote, setDietEscapeNote] = useState(entry.diet_escape_note || '')
  const [alcohol, setAlcohol]         = useState(!!entry.alcohol)
  const [alcoholNote, setAlcoholNote] = useState(entry.alcohol_note || '')
  const [saving, setSaving]           = useState(false)

  const toN = (v) => v ? parseFloat(String(v).replace(',', '.')) || null : null
  const toI = (v) => v ? parseInt(v, 10) || null : null

  const save = async () => {
    setSaving(true)
    const proteinVal = toN(protein)
    await supabase.from('nutrition_days').update({
      kcal: toN(kcal), protein_g: proteinVal, carbs_g: toN(carbs), fat_g: toN(fat),
      meals_count: toI(mealsCount),
      diet_escape: dietEscape, diet_escape_note: dietEscape ? (dietEscapeNote || null) : null,
      alcohol: alcohol, alcohol_note: alcohol ? (alcoholNote || null) : null,
      updated_at: new Date().toISOString(),
    }).eq('id', entry.id)

    // Sincroniza proteína com daily_tracking também nos registros passados
    const { data: dt } = await supabase.from('daily_tracking').select('id').eq('user_id', userId).eq('date', entry.date).maybeSingle()
    if (dt) await supabase.from('daily_tracking').update({ protein_g: proteinVal }).eq('id', dt.id)
    else if (proteinVal) await supabase.from('daily_tracking').insert({ user_id: userId, date: entry.date, protein_g: proteinVal })

    onSave?.(); onClose()
  }

  const remove = async () => {
    if (!window.confirm('Excluir este registro de alimentação?')) return
    setSaving(true)
    await supabase.from('nutrition_days').delete().eq('id', entry.id)
    onSave?.(); onClose()
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
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 className="sheet-title" style={{ marginBottom: 0 }}>{formatDate(entry.date)}</h2>
          <button onClick={onClose} className="btn-ghost" style={{ padding: 8 }}><X size={18} strokeWidth={1.8} /></button>
        </div>

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

        <div style={{ marginBottom: 18 }}>
          <label className="input-label">Número de refeições</label>
          <input className="input-field" type="text" inputMode="numeric" placeholder="Ex: 4"
            value={mealsCount} onChange={e => setMealsCount(e.target.value.replace(/\D/g, ''))} />
        </div>

        <div style={{ marginBottom: dietEscape ? 10 : 14 }}>
          <ToggleRow label="Teve escapada da dieta?" active={dietEscape} onToggle={() => setDietEscape(v => !v)} />
        </div>
        {dietEscape && (
          <div style={{ marginBottom: 16 }}>
            <input className="input-field" type="text" placeholder="Anotação (opcional)"
              value={dietEscapeNote} onChange={e => setDietEscapeNote(e.target.value)} />
          </div>
        )}

        <div style={{ marginBottom: alcohol ? 10 : 20 }}>
          <ToggleRow label="Teve ingestão de bebida alcoólica?" active={alcohol} onToggle={() => setAlcohol(v => !v)} />
        </div>
        {alcohol && (
          <div style={{ marginBottom: 20 }}>
            <input className="input-field" type="text" placeholder="Anotação (opcional)"
              value={alcoholNote} onChange={e => setAlcoholNote(e.target.value)} />
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={remove} disabled={saving} style={{
            flex: 1, padding: '13px 0', borderRadius: 'var(--r-full)',
            border: '1.5px solid var(--c-rose-mid)', background: 'none',
            color: 'var(--c-rose-mid)', fontFamily: 'var(--font-ui)', fontSize: 14, cursor: 'pointer',
          }}>Excluir</button>
          <button className="btn-primary" onClick={save} disabled={saving} style={{ flex: 2 }}>
            {saving ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── ALIMENTACAO TAB (simplificado) ─────────────────────────────── */
function AlimentacaoTab({ userId }) {
  const [entry, setEntry]             = useState(null)
  const [pastEntries, setPastEntries] = useState([])
  const [editingEntry, setEditingEntry] = useState(null)
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
      .select('*').eq('user_id', userId)
      .order('date', { ascending: false }).limit(30)
    const list = data || []
    const todayE = list.find(e => e.date === todayStr)
    setPastEntries(list.filter(e => e.date !== todayStr))
    if (todayE) {
      setEntry(todayE)
      setKcal(todayE.kcal != null ? String(todayE.kcal) : '')
      setProtein(todayE.protein_g != null ? String(todayE.protein_g) : '')
      setCarbs(todayE.carbs_g != null ? String(todayE.carbs_g) : '')
      setFat(todayE.fat_g != null ? String(todayE.fat_g) : '')
      setMealsCount(todayE.meals_count != null ? String(todayE.meals_count) : '')
      setDietEscape(!!todayE.diet_escape)
      setDietEscapeNote(todayE.diet_escape_note || '')
      setAlcohol(!!todayE.alcohol)
      setAlcoholNote(todayE.alcohol_note || '')
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
    const proteinVal = toN(protein)
    const row = {
      user_id: userId, date: todayStr,
      kcal: toN(kcal), protein_g: proteinVal, carbs_g: toN(carbs), fat_g: toN(fat),
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

    // Sincroniza a proteína com daily_tracking, que alimenta o gráfico de
    // Hábitos na Evolução e o cálculo de Consistência na Home.
    const { data: dt } = await supabase.from('daily_tracking').select('id').eq('user_id', userId).eq('date', todayStr).maybeSingle()
    if (dt) {
      await supabase.from('daily_tracking').update({ protein_g: proteinVal }).eq('id', dt.id)
    } else if (proteinVal) {
      await supabase.from('daily_tracking').insert({ user_id: userId, date: todayStr, protein_g: proteinVal })
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

      {/* Registros anteriores */}
      {pastEntries.length > 0 && (
        <div>
          <h3 className="section-title" style={{ marginBottom: 12, fontSize: 15 }}>Registros anteriores</h3>
          <p style={{ fontSize: 11, color: 'var(--c-text-300)', fontFamily: 'var(--font-ui)', fontStyle: 'italic', marginBottom: 10 }}>
            Toque num registro para editar
          </p>
          {pastEntries.map(e => (
            <NutritionCard key={e.id} entry={e} onClick={() => setEditingEntry(e)} />
          ))}
        </div>
      )}

      {editingEntry && (
        <NutritionEntryModal entry={editingEntry} userId={userId} onClose={() => setEditingEntry(null)} onSave={load} />
      )}
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
