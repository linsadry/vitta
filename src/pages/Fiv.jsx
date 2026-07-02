import React, { useState, useEffect, useCallback } from 'react'
import { Check, Plus, X, ChevronRight, Circle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { PageBotanical } from '../components/BotanicalBg'
import { formatDate, today } from '../lib/utils'

const FIV_STAGES = [
  { key: 'preparacao',    label: 'Preparação',    desc: 'Avaliação hormonal e preparação endometrial' },
  { key: 'estimulacao',   label: 'Estimulação',   desc: 'Injeções de hormônios para crescimento folicular' },
  { key: 'coleta',        label: 'Coleta',        desc: 'Aspiração folicular para captação dos óvulos' },
  { key: 'fertilizacao',  label: 'Fertilização',  desc: 'Fertilização em laboratório (FIV ou ICSI)' },
  { key: 'cultivo',       label: 'Cultivo',       desc: 'Desenvolvimento embrionário por 3 a 5 dias' },
  { key: 'transferencia', label: 'Transferência', desc: 'Transferência do embrião para o útero' },
  { key: 'beta',          label: 'Beta-hCG',      desc: 'Teste de gravidez 10 a 14 dias após transferência' },
  { key: 'acompanhamento',label: 'Acompanhamento',desc: 'Monitoramento hormonal e ultrassonográfico' },
]

const STATUS_CONFIG = {
  pendente:  { label: 'Pendente',  bg: 'var(--c-base-2)',        color: 'var(--c-text-300)',  ring: 'var(--c-base-3)' },
  ativo:     { label: 'Em curso',  bg: 'rgba(212,165,165,0.15)', color: 'var(--c-rose-deep)', ring: 'var(--c-rose)' },
  concluido: { label: 'Concluído', bg: 'rgba(138,158,140,0.15)', color: 'var(--c-sage-deep)', ring: 'var(--c-sage)' },
}

/* ─── STAGE DETAIL MODAL ─────────────────────────────────────────── */
function StageModal({ stage, stageData, userId, onClose, onSave }) {
  const sd = stageData || {}
  const [status, setStatus]   = useState(sd.status || 'pendente')
  const [startDate, setStart] = useState(sd.start_date || '')
  const [endDate, setEnd]     = useState(sd.end_date || '')
  const [notes, setNotes]     = useState(sd.notes || '')
  const [checklist, setChecklist] = useState(sd.checklist || [])
  const [meds, setMeds]       = useState(sd.medications || [])
  const [newItem, setNewItem] = useState('')
  const [newMed, setNewMed]   = useState({ name: '', dose: '', frequency: '' })
  const [addingItem, setAddingItem] = useState(false)
  const [addingMed, setAddingMed]   = useState(false)
  const [saving, setSaving]   = useState(false)

  const toggleCheck = (id) =>
    setChecklist(prev => prev.map(item =>
      item.id === id ? { ...item, done: !item.done, done_at: !item.done ? new Date().toISOString() : null } : item
    ))

  const addCheckItem = () => {
    if (!newItem.trim()) return
    setChecklist(prev => [...prev, { id: crypto.randomUUID(), item: newItem.trim(), done: false, done_at: null }])
    setNewItem('')
    setAddingItem(false)
  }

  const removeCheck = (id) => setChecklist(prev => prev.filter(i => i.id !== id))

  const addMed = () => {
    if (!newMed.name.trim()) return
    setMeds(prev => [...prev, { id: crypto.randomUUID(), ...newMed }])
    setNewMed({ name: '', dose: '', frequency: '' })
    setAddingMed(false)
  }

  const removeMed = (id) => setMeds(prev => prev.filter(m => m.id !== id))

  const save = async () => {
    setSaving(true)
    const row = {
      user_id: userId, stage_key: stage.key, stage_label: stage.label,
      status, start_date: startDate || null, end_date: endDate || null,
      notes: notes || null, checklist, medications: meds, updated_at: new Date().toISOString(),
    }
    if (sd.id) {
      await supabase.from('vitta_fiv_stages').update(row).eq('id', sd.id)
    } else {
      await supabase.from('vitta_fiv_stages').insert(row)
    }
    onSave?.()
    onClose()
  }

  const cfg = STATUS_CONFIG[status]

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()} style={{ maxHeight: '85vh' }}>
        <div className="sheet-handle" />
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
          <div>
            <h2 className="sheet-title" style={{ marginBottom: 2, fontSize: 20 }}>{stage.label}</h2>
            <p style={{ fontFamily: 'var(--font-editorial)', fontSize: 13, color: 'var(--c-text-500)', fontStyle: 'italic' }}>{stage.desc}</p>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ padding: 8, flexShrink: 0 }}><X size={18} strokeWidth={1.8} /></button>
        </div>

        {/* Status selector */}
        <div style={{ display: 'flex', gap: 8, margin: '16px 0' }}>
          {Object.entries(STATUS_CONFIG).map(([k, c]) => (
            <button key={k} onClick={() => setStatus(k)} style={{
              flex: 1, padding: '8px 4px', borderRadius: 'var(--r-md)', border: 'none', cursor: 'pointer',
              background: status === k ? c.bg : 'var(--c-base-1)',
              color: status === k ? c.color : 'var(--c-text-300)',
              fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: status === k ? 600 : 400,
              boxShadow: status === k ? `0 0 0 1.5px ${c.ring}` : 'none',
            }}>{c.label}</button>
          ))}
        </div>

        {/* Dates */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <label className="input-label">Início</label>
            <input className="input-field" type="date" value={startDate} onChange={e => setStart(e.target.value)} />
          </div>
          <div>
            <label className="input-label">Fim</label>
            <input className="input-field" type="date" value={endDate} onChange={e => setEnd(e.target.value)} />
          </div>
        </div>

        {/* Checklist */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <label className="input-label" style={{ margin: 0 }}>Checklist</label>
            <button onClick={() => setAddingItem(v => !v)} className="btn-ghost" style={{ padding: '4px 8px', fontSize: 12 }}>
              + Item
            </button>
          </div>
          {addingItem && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input className="input-field" style={{ flex: 1 }} placeholder="Ex: Exame AMH" value={newItem}
                onChange={e => setNewItem(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCheckItem()} autoFocus />
              <button onClick={addCheckItem} className="btn-primary" style={{ width: 44, padding: 0, flexShrink: 0 }}>
                <Check size={16} />
              </button>
            </div>
          )}
          {checklist.map(item => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--c-border-light)' }}>
              <button onClick={() => toggleCheck(item.id)} style={{
                width: 22, height: 22, borderRadius: 6, border: `1.5px solid ${item.done ? 'var(--c-sage)' : 'var(--c-border)'}`,
                background: item.done ? 'var(--c-sage)' : 'transparent', cursor: 'pointer', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {item.done && <Check size={13} strokeWidth={2.5} style={{ color: 'white' }} />}
              </button>
              <span style={{ flex: 1, fontFamily: 'var(--font-ui)', fontSize: 13, color: item.done ? 'var(--c-text-300)' : 'var(--c-text-700)', textDecoration: item.done ? 'line-through' : 'none' }}>
                {item.item}
              </span>
              <button onClick={() => removeCheck(item.id)} className="btn-ghost" style={{ padding: 4, color: 'var(--c-text-100)' }}>
                <X size={12} />
              </button>
            </div>
          ))}
          {checklist.length === 0 && !addingItem && (
            <p style={{ fontSize: 12, color: 'var(--c-text-300)', fontFamily: 'var(--font-ui)', fontStyle: 'italic' }}>Nenhum item</p>
          )}
        </div>

        {/* Medications */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <label className="input-label" style={{ margin: 0 }}>Medicamentos</label>
            <button onClick={() => setAddingMed(v => !v)} className="btn-ghost" style={{ padding: '4px 8px', fontSize: 12 }}>
              + Medicamento
            </button>
          </div>
          {addingMed && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12, padding: 12, background: 'var(--c-base-1)', borderRadius: 'var(--r-md)' }}>
              <input className="input-field" placeholder="Nome (ex: Gonal-F)" value={newMed.name}
                onChange={e => setNewMed(p => ({ ...p, name: e.target.value }))} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <input className="input-field" placeholder="Dose (ex: 150 UI)" value={newMed.dose}
                  onChange={e => setNewMed(p => ({ ...p, dose: e.target.value }))} />
                <input className="input-field" placeholder="Frequência" value={newMed.frequency}
                  onChange={e => setNewMed(p => ({ ...p, frequency: e.target.value }))} />
              </div>
              <button onClick={addMed} className="btn-primary">Adicionar</button>
            </div>
          )}
          {meds.map(m => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--c-border-light)' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 500, color: 'var(--c-text-900)' }}>{m.name}</div>
                <div style={{ fontSize: 11, color: 'var(--c-text-400)' }}>{[m.dose, m.frequency].filter(Boolean).join(' · ')}</div>
              </div>
              <button onClick={() => removeMed(m.id)} className="btn-ghost" style={{ padding: 4 }}><X size={12} /></button>
            </div>
          ))}
        </div>

        {/* Notes */}
        <div style={{ marginBottom: 20 }}>
          <label className="input-label">Observações</label>
          <textarea className="input-field" rows={3} value={notes}
            onChange={e => setNotes(e.target.value)} style={{ resize: 'none' }} />
        </div>

        <button className="btn-primary" onClick={save} disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar etapa'}
        </button>
      </div>
    </div>
  )
}

/* ─── MAIN PAGE ──────────────────────────────────────────────────── */
export default function Fiv({ userId }) {
  const [stages, setStages]     = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading]   = useState(true)

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const { data } = await supabase.from('vitta_fiv_stages')
      .select('*').eq('user_id', userId)
    setStages(data || [])
    setLoading(false)
  }, [userId])

  useEffect(() => { load() }, [load])

  const getStageData = (key) => stages.find(s => s.stage_key === key)

  const activeStage = FIV_STAGES.find(s => getStageData(s.key)?.status === 'ativo')
  const doneCount   = FIV_STAGES.filter(s => getStageData(s.key)?.status === 'concluido').length
  const totalStages = FIV_STAGES.length

  const selectedFivStage = FIV_STAGES.find(s => s.key === selected)

  return (
    <div style={{ position: 'relative', minHeight: '100%', paddingBottom: 24 }}>
      <div style={{ padding: '52px var(--page-pad-x) 0', position: 'relative', overflow: 'hidden', marginBottom: 20 }}>
        <PageBotanical />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 500, color: 'var(--c-text-900)', letterSpacing: '-0.02em', marginBottom: 4 }}>
            Jornada FIV
          </h1>
          <p style={{ fontFamily: 'var(--font-editorial)', fontSize: 16, color: 'var(--c-text-500)', fontStyle: 'italic' }}>
            Cada etapa, um passo mais perto
          </p>
        </div>
      </div>

      {/* Progress summary */}
      <div style={{ margin: '0 var(--page-pad-x) 24px' }}>
        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 500, color: 'var(--c-text-900)' }}>
                {doneCount}<span style={{ fontSize: 16, fontWeight: 400, color: 'var(--c-text-300)' }}>/{totalStages}</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--c-text-300)', fontFamily: 'var(--font-ui)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                etapas concluídas
              </div>
            </div>
            {activeStage && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10, color: 'var(--c-text-300)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Em curso</div>
                <div className="pill pill-rose">{activeStage.label}</div>
              </div>
            )}
          </div>
          {/* Progress bar */}
          <div style={{ height: 4, background: 'var(--c-base-2)', borderRadius: 2 }}>
            <div style={{ height: '100%', width: `${(doneCount / totalStages) * 100}%`, background: 'var(--c-sage)', borderRadius: 2, transition: 'width 0.5s ease' }} />
          </div>
        </div>
      </div>

      {/* Stage cards */}
      <div style={{ padding: '0 var(--page-pad-x)' }}>
        <h2 className="section-title" style={{ marginBottom: 16 }}>Etapas</h2>
        {loading
          ? Array.from({ length: 4 }, (_, i) => <div key={i} style={{ height: 76, marginBottom: 10, borderRadius: 'var(--r-md)' }} className="loading-shimmer" />)
          : FIV_STAGES.map((stage, idx) => {
              const sd  = getStageData(stage.key)
              const st  = sd?.status || 'pendente'
              const cfg = STATUS_CONFIG[st]
              const checkDone = (sd?.checklist || []).filter(c => c.done).length
              const checkTotal = (sd?.checklist || []).length
              const medCount = (sd?.medications || []).length

              return (
                <div key={stage.key} style={{ marginBottom: 10 }}>
                  {/* Connector line (except first) */}
                  {idx > 0 && (
                    <div style={{ width: 2, height: 10, background: st === 'concluido' ? 'var(--c-sage-light)' : 'var(--c-base-3)', marginLeft: 20, marginBottom: -2, marginTop: -2 }} />
                  )}
                  <div onClick={() => setSelected(stage.key)} style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                    background: 'var(--c-surface-raised)', border: `1px solid ${cfg.ring}22`,
                    borderRadius: 'var(--r-md)', cursor: 'pointer',
                    boxShadow: st === 'ativo' ? `0 0 0 1.5px ${cfg.ring}` : 'var(--shadow-xs)',
                  }}>
                    {/* Status circle */}
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                      background: st === 'concluido' ? 'var(--c-sage)' : st === 'ativo' ? 'rgba(212,165,165,0.3)' : 'var(--c-base-2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: st !== 'pendente' ? `0 0 0 2px ${cfg.ring}` : 'none',
                    }}>
                      {st === 'concluido'
                        ? <Check size={18} strokeWidth={2.5} style={{ color: 'white' }} />
                        : <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 500, color: cfg.color }}>{idx + 1}</span>
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 500, color: 'var(--c-text-900)', marginBottom: 2 }}>
                        {stage.label}
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 10, color: cfg.color, fontFamily: 'var(--font-ui)', fontWeight: 500 }}>{cfg.label}</span>
                        {sd?.start_date && <span style={{ fontSize: 10, color: 'var(--c-text-300)', fontFamily: 'var(--font-ui)' }}>{formatDate(sd.start_date)}</span>}
                        {checkTotal > 0 && <span style={{ fontSize: 10, color: 'var(--c-text-300)', fontFamily: 'var(--font-ui)' }}>{checkDone}/{checkTotal} itens</span>}
                        {medCount > 0 && <span style={{ fontSize: 10, color: 'var(--c-lavender)', fontFamily: 'var(--font-ui)' }}>{medCount} med.</span>}
                      </div>
                    </div>
                    <ChevronRight size={16} style={{ color: 'var(--c-text-100)', flexShrink: 0 }} />
                  </div>
                </div>
              )
            })
        }
      </div>

      {selected && selectedFivStage && (
        <StageModal
          stage={selectedFivStage}
          stageData={getStageData(selected)}
          userId={userId}
          onClose={() => setSelected(null)}
          onSave={load}
        />
      )}
    </div>
  )
}
