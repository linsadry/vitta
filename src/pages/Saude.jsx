import React, { useState, useEffect, useCallback } from 'react'
import { Plus, X, Check, CalendarDays, Pill, Stethoscope, FlaskConical, Activity, ChevronRight, Heart, Flower2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { PageBotanical } from '../components/BotanicalBg'
import { useNavigate } from 'react-router-dom'
import { today, formatDate, formatDateShort } from '../lib/utils'

/* ─── CONSULTATION CARD ─────────────────────────────────────────── */
function ConsultCard({ item, onPress }) {
  const isPast = item.date < today()
  return (
    <div onClick={onPress} style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0',
      borderBottom: '1px solid var(--c-border-light)', cursor: 'pointer',
    }}>
      <div style={{ width: 44, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 500, color: isPast ? 'var(--c-text-300)' : 'var(--c-text-900)', lineHeight: 1 }}>
          {new Date(item.date + 'T12:00:00').getDate()}
        </span>
        <span style={{ fontSize: 10, color: 'var(--c-text-300)', fontFamily: 'var(--font-ui)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {new Date(item.date + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short' })}
        </span>
      </div>
      <div style={{ width: 3, height: 40, borderRadius: 2, background: isPast ? 'var(--c-base-3)' : 'var(--c-rose)', flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 500, color: isPast ? 'var(--c-text-500)' : 'var(--c-text-900)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.specialty || 'Consulta'}
        </div>
        {item.doctor && <div style={{ fontSize: 12, color: 'var(--c-text-300)', marginTop: 2 }}>{item.doctor}</div>}
        {item.location && <div style={{ fontSize: 11, color: 'var(--c-text-300)', marginTop: 1 }}>{item.location}</div>}
      </div>
      <ChevronRight size={16} style={{ color: 'var(--c-text-100)', flexShrink: 0 }} />
    </div>
  )
}

/* ─── MED CARD ───────────────────────────────────────────────────── */
function MedCard({ item }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: '1px solid var(--c-border-light)' }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--c-lavender-faint)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Pill size={16} strokeWidth={1.8} style={{ color: 'var(--c-lavender)' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 500, color: 'var(--c-text-900)' }}>{item.name}</div>
        <div style={{ fontSize: 12, color: 'var(--c-text-500)', marginTop: 2 }}>
          {[item.dose, item.frequency].filter(Boolean).join(' · ')}
        </div>
      </div>
      <div style={{ flexShrink: 0 }}>
        <span className="pill pill-lavender">{item.active ? 'Ativo' : 'Inativo'}</span>
      </div>
    </div>
  )
}

/* ─── EXAM ROW ───────────────────────────────────────────────────── */
function ExamRow({ item }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: '1px solid var(--c-border-light)' }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--c-sage-faint)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <FlaskConical size={16} strokeWidth={1.8} style={{ color: 'var(--c-sage)' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 500, color: 'var(--c-text-900)' }}>{item.category || 'Exame'}</div>
        <div style={{ fontSize: 12, color: 'var(--c-text-500)', marginTop: 2 }}>{formatDate(item.date)}</div>
      </div>
      {item.notes && (
        <div style={{ fontSize: 11, color: 'var(--c-text-300)', maxWidth: 100, textAlign: 'right', lineHeight: 1.3 }}>
          {item.notes.slice(0, 50)}
        </div>
      )}
    </div>
  )
}

/* ─── CONSULTA MODAL ─────────────────────────────────────────────── */
function ConsultaModal({ userId, onClose, onSave }) {
  const [f, setF] = useState({ date: today(), specialty: '', doctor: '', location: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const [done, setDone]     = useState(false)
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))

  const save = async () => {
    if (!f.date) return
    setSaving(true)
    await supabase.from('health_consultations').insert({ user_id: userId, ...f })
    setDone(true)
    setTimeout(() => { onSave?.(); onClose() }, 700)
  }

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 className="sheet-title" style={{ marginBottom: 0 }}>Nova consulta</h2>
          <button onClick={onClose} className="btn-ghost" style={{ padding: 8 }}><X size={18} strokeWidth={1.8} /></button>
        </div>
        {done ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '24px 0' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--c-sage-faint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Check size={24} strokeWidth={2} style={{ color: 'var(--c-sage)' }} />
            </div>
            <p style={{ fontFamily: 'var(--font-editorial)', fontSize: 18, color: 'var(--c-text-700)', fontStyle: 'italic' }}>Consulta registrada</p>
          </div>
        ) : (
          <>
            {[
              { key: 'date',      label: 'Data',          type: 'date' },
              { key: 'specialty', label: 'Especialidade', placeholder: 'Ex: Endocrinologia' },
              { key: 'doctor',    label: 'Médico/a',      placeholder: 'Nome do profissional' },
              { key: 'location',  label: 'Local',         placeholder: 'Clínica ou hospital' },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key} style={{ marginBottom: 14 }}>
                <label className="input-label">{label}</label>
                <input className="input-field" type={type || 'text'} placeholder={placeholder}
                  value={f[key]} onChange={e => set(key, e.target.value)} />
              </div>
            ))}
            <div style={{ marginBottom: 20 }}>
              <label className="input-label">Observações</label>
              <textarea className="input-field" rows={3} placeholder="Orientações, exames solicitados..."
                value={f.notes} onChange={e => set('notes', e.target.value)}
                style={{ resize: 'none', lineHeight: 1.5 }} />
            </div>
            <button className="btn-primary" onClick={save} disabled={saving || !f.date}>
              {saving ? 'Salvando...' : 'Salvar consulta'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

/* ─── MEDICAMENTO MODAL ──────────────────────────────────────────── */
function MedModal({ userId, onClose, onSave }) {
  const [f, setF] = useState({ name: '', dose: '', frequency: '', start_date: today(), notes: '', active: true })
  const [saving, setSaving] = useState(false)
  const [done, setDone]     = useState(false)
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))

  const save = async () => {
    if (!f.name) return
    setSaving(true)
    await supabase.from('health_medications').insert({ user_id: userId, ...f })
    setDone(true)
    setTimeout(() => { onSave?.(); onClose() }, 700)
  }

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 className="sheet-title" style={{ marginBottom: 0 }}>Novo medicamento</h2>
          <button onClick={onClose} className="btn-ghost" style={{ padding: 8 }}><X size={18} strokeWidth={1.8} /></button>
        </div>
        {done ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '24px 0' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--c-sage-faint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Check size={24} strokeWidth={2} style={{ color: 'var(--c-sage)' }} />
            </div>
            <p style={{ fontFamily: 'var(--font-editorial)', fontSize: 18, color: 'var(--c-text-700)', fontStyle: 'italic' }}>Medicamento salvo</p>
          </div>
        ) : (
          <>
            {[
              { key: 'name',       label: 'Nome',       placeholder: 'Ex: Progesterona 200mg' },
              { key: 'dose',       label: 'Dose',       placeholder: 'Ex: 200mg' },
              { key: 'frequency',  label: 'Frequência', placeholder: 'Ex: 2x ao dia' },
              { key: 'start_date', label: 'Início',     type: 'date' },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key} style={{ marginBottom: 14 }}>
                <label className="input-label">{label}</label>
                <input className="input-field" type={type || 'text'} placeholder={placeholder}
                  value={f[key]} onChange={e => set(key, e.target.value)} />
              </div>
            ))}
            <button className="btn-primary" onClick={save} disabled={saving || !f.name}>
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

/* ─── MAIN PAGE ──────────────────────────────────────────────────── */
export default function Saude({ userId }) {
  const navigate = useNavigate()
  const [tab, setTab]       = useState('consultas')
  const [modal, setModal]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [data, setData]     = useState({ consultas: [], meds: [], exames: [] })

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const [
      { data: consultas },
      { data: meds },
      { data: exames },
    ] = await Promise.all([
      supabase.from('health_consultations').select('*').eq('user_id', userId).order('date', { ascending: false }),
      supabase.from('health_medications').select('*').eq('user_id', userId).order('active', { ascending: false }),
      supabase.from('lab_results').select('id,date,category,notes').eq('user_id', userId).order('date', { ascending: false }).limit(20),
    ])
    setData({ consultas: consultas || [], meds: meds || [], exames: exames || [] })
    setLoading(false)
  }, [userId])

  useEffect(() => { load() }, [load])

  const TABS = [
    { key: 'consultas', label: 'Consultas', icon: Stethoscope },
    { key: 'medicamentos', label: 'Medicamentos', icon: Pill },
    { key: 'exames', label: 'Exames', icon: FlaskConical },
  ]

  const TAB_STYLE = (active) => ({
    flex: 1, padding: '10px 4px', border: 'none', cursor: 'pointer', background: 'none',
    fontFamily: 'var(--font-ui)', fontSize: 13,
    fontWeight: active ? 500 : 400,
    color: active ? 'var(--c-text-900)' : 'var(--c-text-300)',
    borderBottom: `2px solid ${active ? 'var(--c-rose)' : 'transparent'}`,
    transition: 'color 0.2s, border-color 0.2s',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
  })

  // Split consultas: upcoming + past
  const upcoming = data.consultas.filter(c => c.date >= today())
  const past     = data.consultas.filter(c => c.date < today())
  const activeMeds   = data.meds.filter(m => m.active)
  const inactiveMeds = data.meds.filter(m => !m.active)

  return (
    <div style={{ position: 'relative', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ padding: '52px var(--page-pad-x) 0', position: 'relative', overflow: 'hidden', marginBottom: 20 }}>
        <PageBotanical />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 500, color: 'var(--c-text-900)', letterSpacing: '-0.02em', marginBottom: 4 }}>
            Saúde
          </h1>
          <p style={{ fontFamily: 'var(--font-editorial)', fontSize: 16, color: 'var(--c-text-500)', fontStyle: 'italic', marginBottom: 16 }}>
            Consultas, medicamentos e exames
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => navigate('/ciclo')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 'var(--r-full)', border: 'none', cursor: 'pointer', background: 'rgba(212,165,165,0.15)', color: 'var(--c-rose-deep)', fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 500 }}>
              Ciclo
            </button>
            <button onClick={() => navigate('/fiv')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 'var(--r-full)', border: 'none', cursor: 'pointer', background: 'rgba(196,184,212,0.2)', color: '#7B6FA0', fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 500 }}>
              Jornada FIV
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--c-border)', margin: '0 var(--page-pad-x) 20px' }}>
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} style={TAB_STYLE(tab === key)} onClick={() => setTab(key)}>
            <Icon size={14} strokeWidth={1.8} />
            {label}
          </button>
        ))}
      </div>

      {/* CONSULTAS */}
      {tab === 'consultas' && (
        <div style={{ padding: '0 var(--page-pad-x)' }}>
          <button className="btn-primary" style={{ marginBottom: 24 }} onClick={() => setModal('consulta')}>
            + Nova consulta
          </button>

          {upcoming.length > 0 && (
            <section style={{ marginBottom: 28 }}>
              <h3 className="section-title" style={{ marginBottom: 12, fontSize: 15 }}>Próximas</h3>
              <div className="card" style={{ padding: '0 16px' }}>
                {upcoming.map(c => <ConsultCard key={c.id} item={c} />)}
              </div>
            </section>
          )}

          {past.length > 0 && (
            <section style={{ marginBottom: 28 }}>
              <h3 className="section-title" style={{ marginBottom: 12, fontSize: 15, color: 'var(--c-text-500)' }}>Anteriores</h3>
              <div className="card" style={{ padding: '0 16px' }}>
                {past.slice(0, 10).map(c => <ConsultCard key={c.id} item={c} />)}
              </div>
            </section>
          )}

          {data.consultas.length === 0 && !loading && (
            <div className="empty-state">
              <CalendarDays size={32} style={{ color: 'var(--c-text-100)' }} />
              <p className="empty-state-text">Nenhuma consulta registrada</p>
            </div>
          )}
        </div>
      )}

      {/* MEDICAMENTOS */}
      {tab === 'medicamentos' && (
        <div style={{ padding: '0 var(--page-pad-x)' }}>
          <button className="btn-primary" style={{ marginBottom: 24 }} onClick={() => setModal('med')}>
            + Novo medicamento
          </button>

          {activeMeds.length > 0 && (
            <section style={{ marginBottom: 28 }}>
              <h3 className="section-title" style={{ marginBottom: 12, fontSize: 15 }}>Em uso</h3>
              <div className="card" style={{ padding: '0 16px' }}>
                {activeMeds.map(m => <MedCard key={m.id} item={m} />)}
              </div>
            </section>
          )}

          {inactiveMeds.length > 0 && (
            <section style={{ marginBottom: 28 }}>
              <h3 className="section-title" style={{ marginBottom: 12, fontSize: 15, color: 'var(--c-text-300)' }}>Histórico</h3>
              <div className="card" style={{ padding: '0 16px' }}>
                {inactiveMeds.map(m => <MedCard key={m.id} item={m} />)}
              </div>
            </section>
          )}

          {data.meds.length === 0 && !loading && (
            <div className="empty-state">
              <Pill size={32} style={{ color: 'var(--c-text-100)' }} />
              <p className="empty-state-text">Nenhum medicamento registrado</p>
            </div>
          )}
        </div>
      )}

      {/* EXAMES */}
      {tab === 'exames' && (
        <div style={{ padding: '0 var(--page-pad-x)' }}>
          {data.exames.length > 0 ? (
            <div className="card" style={{ padding: '0 16px', marginBottom: 24 }}>
              {data.exames.map(e => <ExamRow key={e.id} item={e} />)}
            </div>
          ) : (
            <div className="empty-state" style={{ paddingTop: 40 }}>
              <FlaskConical size={32} style={{ color: 'var(--c-text-100)' }} />
              <p className="empty-state-text">Nenhum exame registrado</p>
              <p style={{ fontSize: 13, color: 'var(--c-text-300)', fontFamily: 'var(--font-ui)', textAlign: 'center', lineHeight: 1.6 }}>
                Os resultados de exames são registrados na aba Evolução
              </p>
            </div>
          )}
        </div>
      )}

      {modal === 'consulta' && <ConsultaModal userId={userId} onClose={() => setModal(null)} onSave={load} />}
      {modal === 'med'      && <MedModal      userId={userId} onClose={() => setModal(null)} onSave={load} />}
    </div>
  )
}
