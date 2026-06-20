import React, { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Plus, X, Check, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { PageBotanical } from '../components/BotanicalBg'

/* ─── DATE HELPERS (timezone-safe) ─────────────────────────────── */
const todayStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

const dateStrFromParts = (y, m, d=1) => {
  // m = 0-indexed month
  let yr = y, mo = m
  while (mo < 0)  { mo += 12; yr-- }
  while (mo > 11) { mo -= 12; yr++ }
  return `${yr}-${String(mo+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
}

const daysInMonth = (y, m) => new Date(y, m+1, 0).getDate()

const firstDOW = (y, m) => (new Date(y, m, 1).getDay() + 6) % 7  // Mon=0

const fmtDate = (s) => {
  if (!s) return '—'
  const [y, m, d] = s.split('-')
  const months = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']
  return `${parseInt(d)} ${months[parseInt(m)-1]} ${y}`
}

/* ─── CYCLE PREDICTION ──────────────────────────────────────────── */
function predictCycle(entries) {
  const mens = [...(entries||[]).filter(e=>e.type==='menstruacao')]
    .sort((a,b)=>a.date.localeCompare(b.date))
  if (!mens.length) return {}

  const starts=[]
  let prev=null
  for(const e of mens){
    const d=new Date(e.date+'T12:00:00')
    if(!prev||(d-prev)>2*86400000) starts.push(e.date)
    prev=d
  }

  let cycleLen=28
  if(starts.length>=2){
    const gaps=[]
    for(let i=1;i<starts.length;i++){
      const a=new Date(starts[i-1]+'T12:00:00')
      const b=new Date(starts[i]+'T12:00:00')
      gaps.push(Math.round((b-a)/86400000))
    }
    cycleLen=Math.round(gaps.reduce((s,g)=>s+g,0)/gaps.length)
  }

  const lastStart=starts[starts.length-1]
  const lastDate=new Date(lastStart+'T12:00:00')
  const now=new Date()
  const nextPeriodDate=new Date(lastDate.getTime()+cycleLen*86400000)
  const fertileStartDate=new Date(lastDate.getTime()+11*86400000)
  const fertileEndDate=new Date(lastDate.getTime()+16*86400000)

  const fmt=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  const currentDay=Math.round((now-lastDate)/86400000)+1
  const daysUntilNext=Math.round((nextPeriodDate-now)/86400000)

  const phase=currentDay<=5?'Menstrual':currentDay<=11?'Folicular':currentDay<=16?'Ovulatória':currentDay<=24?'Lútea':'Pré-menstrual'

  return {
    lastStart, currentDay, daysUntilNext, cycleLen, phase,
    nextPeriod: fmt(nextPeriodDate),
    fertileStart: fmt(fertileStartDate),
    fertileEnd: fmt(fertileEndDate),
  }
}

/* ─── REGISTER MODAL ─────────────────────────────────────────────── */
const FLUXO   = ['Leve','Moderado','Intenso','Muito intenso']
const SINTOMAS = ['Cólica','Dor de cabeça','Inchaço','Sensibilidade mamária','Acne','Fadiga','Náusea','Lombalgia','Enxaqueca']
const MUCO    = ['Seco','Cremoso','Aquoso','Elástico (fio)']

function RegisterModal({ date, userId, existingEntries, onClose, onSave }) {
  const [tab, setTab]       = useState('menstruacao')
  const [modalDate, setModalDate] = useState(date||todayStr())
  const [fluxo, setFluxo]   = useState('')
  const [sintomas, setSintomas] = useState([])
  const [humor, setHumor]   = useState(null)
  const [energia, setEnergia] = useState(null)
  const [muco, setMuco]     = useState('')
  const [notas, setNotas]   = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [error, setError]   = useState('')

  const toggleSintoma = s => setSintomas(p=>p.includes(s)?p.filter(x=>x!==s):[...p,s])

  const hasData =
    (tab==='menstruacao' && fluxo) ||
    (tab==='sintomas'    && sintomas.length>0) ||
    (tab==='bem_estar'   && (humor||energia||muco))

  const save = async () => {
    if (!hasData || saving) return
    setSaving(true); setError('')
    try {
      const toInsert = []
      if (tab==='menstruacao' && fluxo)
        toInsert.push({ user_id:userId, date:modalDate, type:'menstruacao', value:fluxo.toLowerCase() })
      if (tab==='sintomas' && sintomas.length)
        sintomas.forEach(s=>toInsert.push({ user_id:userId, date:modalDate, type:'sintoma', value:s, notes:notas||null }))
      if (tab==='bem_estar') {
        if (humor)  toInsert.push({ user_id:userId, date:modalDate, type:'humor',   value:String(humor) })
        if (energia) toInsert.push({ user_id:userId, date:modalDate, type:'energia', value:String(energia) })
        if (muco)   toInsert.push({ user_id:userId, date:modalDate, type:'muco',    value:muco.toLowerCase() })
      }

      // Remove duplicates (same date + type) before inserting
      const types=[...new Set(toInsert.map(r=>r.type))]
      for(const t of types){
        await supabase.from('cycle_entries').delete()
          .eq('user_id',userId).eq('date',modalDate).eq('type',t)
      }

      const { error:dbErr } = await supabase.from('cycle_entries').insert(toInsert)
      if (dbErr) { setError(`Erro: ${dbErr.message}`); setSaving(false); return }

      setSaved(true)
      setTimeout(()=>{ onSave?.(); onClose() }, 700)
    } catch(e) {
      setError('Erro inesperado. Tente novamente.')
      setSaving(false)
    }
  }

  const TABS = [
    { key:'menstruacao', label:'Fluxo' },
    { key:'sintomas',    label:'Sintomas' },
    { key:'bem_estar',   label:'Bem-estar' },
  ]

  const tStyle = k => ({
    flex:1, padding:'9px 0', border:'none', background:'none', cursor:'pointer',
    fontFamily:'var(--font-ui)', fontSize:13,
    fontWeight:tab===k?500:400,
    color:tab===k?'var(--c-text-900)':'var(--c-text-300)',
    borderBottom:`2px solid ${tab===k?'var(--c-rose)':'transparent'}`,
  })

  const ScaleBtn = ({ n, active, onTap, color }) => (
    <button onClick={()=>onTap(active===n?null:n)} style={{
      flex:1, aspectRatio:'1', maxHeight:48, borderRadius:10, border:'none', cursor:'pointer',
      background:active===n?color:'var(--c-base-2)',
      color:active===n?'white':'var(--c-text-500)',
      fontFamily:'var(--font-display)', fontSize:17, fontWeight:500,
      transition:'background 0.12s',
    }}>{n}</button>
  )

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={e=>e.stopPropagation()}>
        <div className="sheet-handle"/>

        {saved ? (
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:14,padding:'32px 0'}}>
            <div style={{width:56,height:56,borderRadius:'50%',background:'var(--c-sage-faint)',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <Check size={26} strokeWidth={2.5} style={{color:'var(--c-sage)'}}/>
            </div>
            <p style={{fontFamily:'var(--font-editorial)',fontSize:19,color:'var(--c-text-700)',fontStyle:'italic'}}>Registrado com sucesso</p>
          </div>
        ) : (
          <>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
              <h2 style={{fontFamily:'var(--font-display)',fontSize:20,fontWeight:500,color:'var(--c-text-900)',margin:0}}>Registrar no ciclo</h2>
              <button onClick={onClose} className="btn-ghost" style={{padding:8}}><X size={18} strokeWidth={1.8}/></button>
            </div>

            {/* Date selector */}
            <div style={{marginBottom:14}}>
              <label className="input-label">Data</label>
              <input className="input-field" type="date" value={modalDate}
                max={todayStr()} onChange={e=>setModalDate(e.target.value)}/>
            </div>

            {/* Tabs */}
            <div style={{display:'flex',borderBottom:'1px solid var(--c-border)',marginBottom:18}}>
              {TABS.map(t=><button key={t.key} style={tStyle(t.key)} onClick={()=>setTab(t.key)}>{t.label}</button>)}
            </div>

            {/* Fluxo */}
            {tab==='menstruacao' && (
              <>
                <label className="input-label" style={{marginBottom:10}}>Intensidade do fluxo</label>
                <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:20}}>
                  {FLUXO.map(f=>(
                    <button key={f} onClick={()=>setFluxo(fluxo===f?'':f)} style={{
                      padding:'13px 16px', borderRadius:'var(--r-md)', border:'none', cursor:'pointer', textAlign:'left',
                      background:fluxo===f?'rgba(212,165,165,0.18)':'var(--c-base-1)',
                      fontFamily:'var(--font-ui)', fontSize:14,
                      color:fluxo===f?'var(--c-rose-deep)':'var(--c-text-700)',
                      fontWeight:fluxo===f?500:400,
                      boxShadow:fluxo===f?'0 0 0 1.5px var(--c-rose)':'none',
                    }}>{f}</button>
                  ))}
                </div>
              </>
            )}

            {/* Sintomas */}
            {tab==='sintomas' && (
              <>
                <label className="input-label" style={{marginBottom:10}}>Sintomas do dia</label>
                <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:16}}>
                  {SINTOMAS.map(s=>(
                    <button key={s} onClick={()=>toggleSintoma(s)} style={{
                      padding:'8px 14px', borderRadius:'var(--r-full)', border:'none', cursor:'pointer',
                      background:sintomas.includes(s)?'rgba(155,143,196,0.2)':'var(--c-base-2)',
                      fontFamily:'var(--font-ui)', fontSize:13,
                      color:sintomas.includes(s)?'#7B6FA0':'var(--c-text-500)',
                      boxShadow:sintomas.includes(s)?'0 0 0 1.5px #C4B8D4':'none',
                    }}>{s}</button>
                  ))}
                </div>
                <div style={{marginBottom:16}}>
                  <label className="input-label">Observação</label>
                  <textarea className="input-field" rows={2} value={notas} onChange={e=>setNotas(e.target.value)}
                    style={{resize:'none'}} placeholder="Detalhes..."/>
                </div>
              </>
            )}

            {/* Bem-estar */}
            {tab==='bem_estar' && (
              <>
                <div style={{marginBottom:16}}>
                  <label className="input-label" style={{marginBottom:8}}>Humor (1 = muito baixo, 5 = muito alto)</label>
                  <div style={{display:'flex',gap:8}}>
                    {[1,2,3,4,5].map(n=><ScaleBtn key={n} n={n} active={humor} onTap={setHumor} color="#C9A96E"/>)}
                  </div>
                </div>
                <div style={{marginBottom:16}}>
                  <label className="input-label" style={{marginBottom:8}}>Energia</label>
                  <div style={{display:'flex',gap:8}}>
                    {[1,2,3,4,5].map(n=><ScaleBtn key={n} n={n} active={energia} onTap={setEnergia} color="#8A9E8C"/>)}
                  </div>
                </div>
                <div style={{marginBottom:20}}>
                  <label className="input-label" style={{marginBottom:8}}>Muco cervical</label>
                  <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                    {MUCO.map(m=>(
                      <button key={m} onClick={()=>setMuco(muco===m?'':m)} style={{
                        padding:'8px 12px', borderRadius:'var(--r-full)', border:'none', cursor:'pointer',
                        background:muco===m?'rgba(107,168,212,0.2)':'var(--c-base-2)',
                        fontFamily:'var(--font-ui)', fontSize:12,
                        color:muco===m?'#4A8BAD':'var(--c-text-500)',
                        boxShadow:muco===m?'0 0 0 1.5px #6BA8D4':'none',
                      }}>{m}</button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {error && <p style={{fontSize:12,color:'var(--c-rose-deep)',textAlign:'center',marginBottom:10}}>{error}</p>}
            <button className="btn-primary" onClick={save} disabled={saving||!hasData}>
              {saving?'Salvando...':'Salvar registro'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

/* ─── CYCLE CALENDAR ────────────────────────────────────────────── */
function CycleCalendar({ year, month, entries, prediction, selected, onSelect }) {
  const byDate={}
  for(const e of entries){if(!byDate[e.date])byDate[e.date]=[];byDate[e.date].push(e)}

  const ds = (d) => {
    const m=String(month+1).padStart(2,'0'), dd=String(d).padStart(2,'0')
    return `${year}-${m}-${dd}`
  }

  const cellBg = (dt) => {
    const es=byDate[dt]||[]
    if(es.some(e=>e.type==='menstruacao')) return '#D4A5A5'
    if(prediction?.fertileStart && dt>=prediction.fertileStart && dt<=prediction.fertileEnd)
      return 'rgba(138,158,140,0.30)'
    if(prediction?.nextPeriod){
      const nextEnd=new Date(new Date(prediction.nextPeriod+'T12:00:00').getTime()+4*86400000)
      const nextEndStr=`${nextEnd.getFullYear()}-${String(nextEnd.getMonth()+1).padStart(2,'0')}-${String(nextEnd.getDate()).padStart(2,'0')}`
      if(dt>=prediction.nextPeriod && dt<=nextEndStr) return 'rgba(212,165,165,0.22)'
    }
    return 'var(--c-base-2)'
  }

  const textColor = (dt) => {
    const es=byDate[dt]||[]
    return es.some(e=>e.type==='menstruacao') ? 'white' : 'var(--c-text-600)'
  }

  const dots = (dt) => {
    const types=[...new Set((byDate[dt]||[]).map(e=>e.type))]
    const map={sintoma:'#9B8FC4',humor:'#C9A96E',energia:'#8A9E8C',muco:'#6BA8D4'}
    return types.filter(t=>t!=='menstruacao').map(t=>map[t]||'#B8AEA9').slice(0,3)
  }

  const dim=daysInMonth(year,month)
  const off=firstDOW(year,month)
  const tod=todayStr()
  const DOW=['Seg','Ter','Qua','Qui','Sex','Sáb','Dom']

  return (
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:4,marginBottom:6}}>
        {DOW.map(d=><div key={d} style={{textAlign:'center',fontSize:9,color:'var(--c-text-300)',fontFamily:'var(--font-ui)'}}>{d}</div>)}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:4}}>
        {Array.from({length:off},(_,i)=><div key={`p${i}`}/>)}
        {Array.from({length:dim},(_,i)=>{
          const day=i+1, dt=ds(day)
          const sel=dt===selected, isToday=dt===tod
          return (
            <div key={dt} onClick={()=>onSelect(dt)} style={{
              aspectRatio:'1', borderRadius:7, background:cellBg(dt),
              display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
              cursor:'pointer', boxShadow:sel?'0 0 0 2px var(--c-text-700)':isToday?'0 0 0 1.5px var(--c-rose-mid)':'none',
            }}>
              <span style={{fontFamily:'var(--font-ui)',fontSize:12,fontWeight:isToday?600:400,color:textColor(dt),lineHeight:1}}>{day}</span>
              {dots(dt).length>0&&(
                <div style={{display:'flex',gap:2,marginTop:2}}>
                  {dots(dt).map((c,j)=><div key={j} style={{width:4,height:4,borderRadius:'50%',background:c}}/>)}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─── MAIN PAGE ──────────────────────────────────────────────────── */
const MONTHS_PT=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const TYPE_LABELS={menstruacao:'Menstruação',sintoma:'Sintoma',humor:'Humor',energia:'Energia',muco:'Muco'}

export default function Ciclo({ userId }) {
  const now = new Date()
  const [year, setYear]   = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [entries, setEntries] = useState([])
  const [selected, setSelected] = useState(todayStr())
  const [modal, setModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null) // entry id being deleted

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    // Load 4 months back for prediction, timezone-safe
    const fromStr = dateStrFromParts(year, month-4)
    const toStr   = dateStrFromParts(year, month+1) // first day of next month

    const { data, error } = await supabase.from('cycle_entries')
      .select('*')
      .eq('user_id', userId)
      .gte('date', fromStr)
      .lt('date', toStr)        // less-than next month's first day
      .order('date')

    if (!error) setEntries(data || [])
    setLoading(false)
  }, [userId, year, month])

  useEffect(() => { load() }, [load])

  const prevMonth = () => {
    if (month===0) { setYear(y=>y-1); setMonth(11) } else setMonth(m=>m-1)
  }
  const nextMonth = () => {
    if (month===11) { setYear(y=>y+1); setMonth(0) } else setMonth(m=>m+1)
  }

  const deleteEntry = async (id) => {
    setDeleting(id)
    await supabase.from('cycle_entries').delete().eq('id', id).eq('user_id', userId)
    setDeleting(null)
    load()
  }

  const prediction     = predictCycle(entries)
  const selectedDay    = entries.filter(e=>e.date===selected)

  return (
    <div style={{position:'relative',minHeight:'100%',paddingBottom:24}}>

      {/* Header */}
      <div style={{padding:'52px var(--page-pad-x) 0',position:'relative',overflow:'hidden',marginBottom:16}}>
        <PageBotanical/>
        <div style={{position:'relative',zIndex:1}}>
          <h1 style={{fontFamily:'var(--font-display)',fontSize:'var(--text-2xl)',fontWeight:500,color:'var(--c-text-900)',letterSpacing:'-0.02em',marginBottom:4}}>Ciclo</h1>
          <p style={{fontFamily:'var(--font-editorial)',fontSize:16,color:'var(--c-text-500)',fontStyle:'italic'}}>Acompanhe seu ciclo menstrual</p>
        </div>
      </div>

      {/* Cycle info strip (only if has data) */}
      {prediction.lastStart ? (
        <div style={{margin:'0 var(--page-pad-x) 20px'}}>
          <div className="card" style={{padding:'16px 18px'}}>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,textAlign:'center'}}>
              <div>
                <div style={{fontSize:9,color:'var(--c-text-300)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:5}}>Fase atual</div>
                <div style={{fontFamily:'var(--font-ui)',fontSize:12,fontWeight:500,color:'var(--c-text-900)'}}>{prediction.phase}</div>
              </div>
              <div>
                <div style={{fontSize:9,color:'var(--c-text-300)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:5}}>Dia do ciclo</div>
                <div style={{fontFamily:'var(--font-display)',fontSize:22,fontWeight:500,color:'var(--c-text-900)',lineHeight:1}}>{prediction.currentDay}</div>
                <div style={{fontSize:9,color:'var(--c-text-300)',marginTop:2}}>de {prediction.cycleLen}d</div>
              </div>
              <div>
                <div style={{fontSize:9,color:'var(--c-text-300)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:5}}>Próx. período</div>
                <div style={{fontFamily:'var(--font-ui)',fontSize:12,fontWeight:500,
                  color:prediction.daysUntilNext<=3?'var(--c-rose-deep)':'var(--c-text-700)'}}>
                  {prediction.daysUntilNext<=0?'Hoje':`em ${prediction.daysUntilNext}d`}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{margin:'0 var(--page-pad-x) 20px',padding:'14px 16px',background:'var(--c-rose-faint)',borderRadius:'var(--r-md)',border:'1px solid var(--c-rose-light)'}}>
          <p style={{fontFamily:'var(--font-editorial)',fontSize:14,color:'var(--c-rose-mid)',fontStyle:'italic',textAlign:'center',margin:0}}>
            Registre o início da sua menstruação para ativar as previsões
          </p>
        </div>
      )}

      {/* Month navigation */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 var(--page-pad-x)',marginBottom:10}}>
        <button onClick={prevMonth} className="btn-ghost" style={{padding:8}}><ChevronLeft size={18} strokeWidth={1.8}/></button>
        <span style={{fontFamily:'var(--font-display)',fontSize:18,fontWeight:500,color:'var(--c-text-900)'}}>{MONTHS_PT[month]} {year}</span>
        <button onClick={nextMonth} className="btn-ghost" style={{padding:8}}><ChevronRight size={18} strokeWidth={1.8}/></button>
      </div>

      {/* Legend */}
      <div style={{display:'flex',gap:14,padding:'0 var(--page-pad-x)',marginBottom:12}}>
        {[{c:'#D4A5A5',l:'Menstruação'},{c:'rgba(138,158,140,0.5)',l:'Fértil'},{c:'rgba(212,165,165,0.3)',l:'Previsão'}].map(({c,l})=>(
          <div key={l} style={{display:'flex',alignItems:'center',gap:5}}>
            <div style={{width:10,height:10,borderRadius:3,background:c}}/>
            <span style={{fontSize:10,color:'var(--c-text-300)',fontFamily:'var(--font-ui)'}}>{l}</span>
          </div>
        ))}
      </div>

      {/* Calendar */}
      <div style={{padding:'0 var(--page-pad-x)',marginBottom:20}}>
        {loading
          ? <div style={{height:200}} className="loading-shimmer card"/>
          : <CycleCalendar year={year} month={month} entries={entries}
              prediction={prediction} selected={selected} onSelect={setSelected}/>
        }
      </div>

      {/* Selected day panel */}
      <div style={{margin:'0 var(--page-pad-x) 24px'}}>
        <div className="card" style={{padding:'14px 16px'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
            <span style={{fontFamily:'var(--font-ui)',fontSize:13,fontWeight:500,color:'var(--c-text-700)'}}>{fmtDate(selected)}</span>
            <button onClick={()=>setModal(true)} style={{
              display:'flex',alignItems:'center',gap:5,padding:'7px 14px',
              borderRadius:'var(--r-full)',border:'none',cursor:'pointer',
              background:'var(--c-text-900)',color:'var(--c-base-0)',
              fontFamily:'var(--font-ui)',fontSize:12,fontWeight:500,
            }}>
              <Plus size={13} strokeWidth={2.5}/> Registrar
            </button>
          </div>

          {selectedDay.length>0 ? (
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {selectedDay.map(e=>(
                <div key={e.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 10px',background:'var(--c-base-1)',borderRadius:'var(--r-sm)'}}>
                  <div>
                    <span style={{fontSize:12,fontWeight:500,color:'var(--c-text-700)',fontFamily:'var(--font-ui)'}}>
                      {TYPE_LABELS[e.type]||e.type}
                    </span>
                    {e.value&&<span style={{fontSize:11,color:'var(--c-text-500)',fontFamily:'var(--font-ui)',marginLeft:6}}>· {e.value}</span>}
                    {e.notes&&<span style={{fontSize:10,color:'var(--c-text-400)',fontFamily:'var(--font-ui)',marginLeft:6,fontStyle:'italic'}}>{e.notes}</span>}
                  </div>
                  <button onClick={()=>deleteEntry(e.id)} disabled={deleting===e.id}
                    style={{background:'none',border:'none',cursor:'pointer',padding:6,color:'var(--c-text-200)',borderRadius:6}}>
                    <Trash2 size={13} strokeWidth={1.8}/>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p style={{fontFamily:'var(--font-editorial)',fontSize:14,color:'var(--c-text-300)',fontStyle:'italic',margin:0}}>
              Nenhum registro para este dia. Toque em Registrar para adicionar.
            </p>
          )}
        </div>
      </div>

      {modal && (
        <RegisterModal date={selected} userId={userId} existingEntries={selectedDay}
          onClose={()=>setModal(false)} onSave={()=>{ setModal(false); load() }}/>
      )}
    </div>
  )
}
