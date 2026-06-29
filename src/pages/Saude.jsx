import React, { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, Plus, X, Check, Stethoscope, Pill, FlaskConical,
         Scale, Moon, Droplets, Heart, ChevronRight, Calendar, CalendarDays, Activity } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { PageBotanical } from '../components/BotanicalBg'
import { today, daysAgo, formatDate, formatDateShort, fmtWeight, fmtSleep, fmtWater } from '../lib/utils'
import { useNavigate } from 'react-router-dom'

// ─── Cycle prediction (shared logic) ──────────────────────────────
function predictCycleSimple(entries) {
  const mens = [...(entries||[]).filter(e => e.type==='menstruacao')].sort((a,b)=>a.date.localeCompare(b.date))
  if (!mens.length) return { currentDay: null, phase: null, nextPeriod: null }
  const starts=[]
  let prev=null
  for(const e of mens){const d=new Date(e.date+'T12:00:00');if(!prev||(d-prev)>2*86400000)starts.push(e.date);prev=d}
  let cycleLength=28
  if(starts.length>=2){const gaps=[];for(let i=1;i<starts.length;i++){const a=new Date(starts[i-1]+'T12:00:00'),b=new Date(starts[i]+'T12:00:00');gaps.push(Math.round((b-a)/86400000))};cycleLength=Math.round(gaps.reduce((s,g)=>s+g,0)/gaps.length)}
  const lastStart=starts[starts.length-1]
  const lastDate=new Date(lastStart+'T12:00:00')
  const currentDay=Math.round((new Date()-lastDate)/86400000)+1
  const nextPeriod=new Date(lastDate.getTime()+cycleLength*86400000).toISOString().split('T')[0]
  const phase=currentDay<=5?'Menstrual':currentDay<=11?'Folicular':currentDay<=16?'Ovulatória':currentDay<=24?'Lútea':'Pré-menstrual'
  return { currentDay, phase, nextPeriod, cycleLength }
}

// ─── OVERVIEW DATA HOOK ───────────────────────────────────────────
function useOverviewData(userId) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const todayStr = today()
    const d7 = daysAgo(7), d90 = daysAgo(90)
    const [
      {data:consultas},{data:allConsultas},{data:meds},{data:cycles},
      {data:fivStages},{data:weights},{data:tracking},{data:labResults}
    ] = await Promise.all([
      supabase.from('health_consultations').select('date,specialty,doctor,time').eq('user_id',userId).gte('date',todayStr).order('date').limit(1).maybeSingle(),
      supabase.from('health_consultations').select('id,date,specialty,doctor').eq('user_id',userId).order('date',{ascending:false}),
      supabase.from('health_medications').select('*').eq('user_id',userId).order('active',{ascending:false}),
      supabase.from('cycle_entries').select('date,type,value').eq('user_id',userId).gte('date',d90).order('date'),
      supabase.from('vitta_fiv_stages').select('stage_key,stage_label,status,start_date').eq('user_id',userId),
      supabase.from('physical_metrics').select('weight,date').eq('user_id',userId).order('date',{ascending:false}).limit(2),
      supabase.from('daily_tracking').select('sleep_hours,water_ml,date').eq('user_id',userId).gte('date',d7),
      supabase.from('lab_results').select('id,category,date,status,scheduled_date').eq('user_id',userId).order('date',{ascending:false}),
    ])
    const activeMeds = (meds||[]).filter(m=>m.active)
    const continuosMeds = (meds||[]).filter(m=>m.active&&m.tipo!=='eventual')
    const eventualMeds = (meds||[]).filter(m=>m.active&&m.tipo==='eventual')
    const activeFiv  = (fivStages||[]).find(s=>s.status==='ativo')
    const doneCount  = (fivStages||[]).filter(s=>s.status==='concluido').length
    const weekT      = tracking||[]
    const withSleep  = weekT.filter(d=>d.sleep_hours>0)
    const withWater  = weekT.filter(d=>d.water_ml>0)
    const cycle      = predictCycleSimple(cycles)
    const nextExam   = (labResults||[]).find(e=>e.status==='agendado'||e.status==='pendente')
    setData({
      nextConsulta: consultas,
      allConsultas: allConsultas||[],
      meds: meds||[], activeMeds, continuosMeds, eventualMeds,
      cycle, activeFiv, doneCount, totalStages:8,
      currentWeight: weights?.[0]?.weight,
      prevWeight: weights?.[1]?.weight,
      weightDate: weights?.[0]?.date,
      avgSleep: withSleep.length ? (withSleep.reduce((s,d)=>s+(d.sleep_hours||0),0)/withSleep.length).toFixed(1) : null,
      avgWater: withWater.length ? Math.round(withWater.reduce((s,d)=>s+(d.water_ml||0),0)/withWater.length) : null,
      labResults: labResults||[], nextExam,
    })
    setLoading(false)
  }, [userId])
  useEffect(()=>{load()},[load])
  return {data, loading, reload:load}
}

// ─── SMALL INFO CARD ──────────────────────────────────────────────
function InfoCard({icon:Icon, label, value, sub, color='var(--c-rose)', onClick}) {
  return (
    <div onClick={onClick} style={{
      background:'var(--c-surface-raised)', border:'1px solid var(--c-border)',
      borderRadius:'var(--r-md)', padding:'14px 14px 12px', boxShadow:'var(--shadow-xs)',
      cursor:onClick?'pointer':'default', flex:1, minWidth:0,
    }}>
      <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:8}}>
        <Icon size={13} strokeWidth={1.8} style={{color}} />
        <span style={{fontSize:9,color:'var(--c-text-300)',fontFamily:'var(--font-ui)',textTransform:'uppercase',letterSpacing:'0.06em'}}>{label}</span>
      </div>
      <div style={{fontFamily:'var(--font-display)',fontSize:18,fontWeight:500,color:'var(--c-text-900)',lineHeight:1.1}}>{value||'—'}</div>
      {sub && <div style={{fontSize:11,color:'var(--c-text-300)',fontFamily:'var(--font-ui)',marginTop:3}}>{sub}</div>}
    </div>
  )
}

// ─── MODULE CARD ─────────────────────────────────────────────────
function ModuleCard({icon:Icon, title, stats, color, onOpen}) {
  return (
    <div style={{background:'var(--c-surface-raised)',border:'1px solid var(--c-border)',borderRadius:'var(--r-lg)',padding:'18px 18px 14px',boxShadow:'var(--shadow-sm)',marginBottom:12}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:36,height:36,borderRadius:10,background:color+'18',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <Icon size={18} strokeWidth={1.5} style={{color}} />
          </div>
          <span style={{fontFamily:'var(--font-display)',fontSize:18,fontWeight:500,color:'var(--c-text-900)'}}>{title}</span>
        </div>
        <button onClick={onOpen} style={{display:'flex',alignItems:'center',gap:4,padding:'7px 13px',borderRadius:'var(--r-full)',border:'none',cursor:'pointer',background:'var(--c-base-2)',color:'var(--c-text-700)',fontFamily:'var(--font-ui)',fontSize:12,fontWeight:500}}>
          Abrir <ChevronRight size={12} />
        </button>
      </div>
      <div style={{display:'flex',gap:16}}>
        {stats.map((s,i)=>(
          <div key={i}>
            <div style={{fontFamily:'var(--font-display)',fontSize:22,fontWeight:500,color:'var(--c-text-900)',lineHeight:1}}>{s.value}</div>
            <div style={{fontSize:11,color:'var(--c-text-300)',fontFamily:'var(--font-ui)',marginTop:2}}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── CONSULTA MODAL ───────────────────────────────────────────────
function ConsultaModal({item, userId, onClose, onSave}) {
  const isNew = !item?.id
  const [f,setF] = useState({
    date: item?.date||today(), time:'', specialty:item?.specialty||'',
    doctor:item?.doctor||'', location:item?.location||'',
    diagnosis:item?.diagnosis||'', notes:item?.notes||'', next_return_date:item?.next_return_date||''
  })
  const [saving,setSaving] = useState(false)
  const set=(k,v)=>setF(p=>({...p,[k]:v}))
  const save = async () => {
  if (!f.date || !f.specialty) return
  setSaving(true)
  // Converte strings vazias em null para colunas date/time
  const payload = {
    ...f,
    time:             f.time             || null,
    next_return_date: f.next_return_date  || null,
    diagnosis:        f.diagnosis         || null,
    location:         f.location          || null,
    doctor:           f.doctor            || null,
  }
  if (isNew) {
    await supabase.from('health_consultations').insert({ user_id: userId, ...payload })
  } else {
    await supabase.from('health_consultations').update(payload).eq('id', item.id)
  }
  onSave?.(); onClose()
}
  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={e=>e.stopPropagation()}>
        <div className="sheet-handle"/>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
          <h2 className="sheet-title" style={{marginBottom:0}}>{isNew?'Nova consulta':'Editar consulta'}</h2>
          <button onClick={onClose} className="btn-ghost" style={{padding:8}}><X size={18} strokeWidth={1.8}/></button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}>
          <div><label className="input-label">Data</label><input className="input-field" type="date" value={f.date} onChange={e=>set('date',e.target.value)}/></div>
          <div><label className="input-label">Horário</label><input className="input-field" type="time" value={f.time} onChange={e=>set('time',e.target.value)}/></div>
        </div>
        {[{k:'specialty',l:'Especialidade',p:'Ex: Endocrinologia'},{k:'doctor',l:'Médico/a',p:'Nome do profissional'},{k:'location',l:'Local',p:'Clínica ou hospital'},{k:'diagnosis',l:'Diagnóstico',p:'CID ou descrição'},{k:'next_return_date',l:'Próximo retorno',type:'date'}].map(({k,l,p,type})=>(
          <div key={k} style={{marginBottom:12}}>
            <label className="input-label">{l}</label>
            <input className="input-field" type={type||'text'} placeholder={p} value={f[k]} onChange={e=>set(k,e.target.value)}/>
          </div>
        ))}
        <div style={{marginBottom:20}}><label className="input-label">Orientações</label><textarea className="input-field" rows={3} value={f.notes} onChange={e=>set('notes',e.target.value)} style={{resize:'none'}}/></div>
        <button className="btn-primary" onClick={save} disabled={saving||!f.date||!f.specialty}>{saving?'Salvando...':'Salvar consulta'}</button>
      </div>
    </div>
  )
}

// ─── MED MODAL ────────────────────────────────────────────────────
function MedModal({userId, onClose, onSave}) {
  const [f,setF]=useState({name:'',dose:'',frequency:'',time:'',start_date:today(),notes:'',active:true,tipo:'continuo'})
  const [saving,setSaving]=useState(false)
  const set=(k,v)=>setF(p=>({...p,[k]:v}))
  const save=async()=>{if(!f.name)return;setSaving(true);await supabase.from('health_medications').insert({user_id:userId,...f});onSave?.();onClose()}
  const isEventual=f.tipo==='eventual'
  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={e=>e.stopPropagation()}>
        <div className="sheet-handle"/>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
          <h2 className="sheet-title" style={{marginBottom:0}}>Novo medicamento</h2>
          <button onClick={onClose} className="btn-ghost" style={{padding:8}}><X size={18} strokeWidth={1.8}/></button>
        </div>
        {/* Tipo selector */}
        <div style={{marginBottom:16}}>
          <label className="input-label">Tipo de uso</label>
          <div style={{display:'flex',gap:8,marginTop:6}}>
            {[{v:'continuo',l:'Contínuo',d:'Uso regular'},{v:'eventual',l:'Eventual',d:'Quando necessário'}].map(({v,l,d})=>(
              <button key={v} onClick={()=>set('tipo',v)} style={{
                flex:1,padding:'12px 10px',borderRadius:'var(--r-md)',border:'none',cursor:'pointer',textAlign:'left',
                background:f.tipo===v?(v==='eventual'?'rgba(201,169,110,0.18)':'rgba(138,158,140,0.18)'):'var(--c-base-1)',
                boxShadow:f.tipo===v?`0 0 0 1.5px ${v==='eventual'?'var(--c-gold)':'var(--c-sage)'}`:'none',
              }}>
                <div style={{fontFamily:'var(--font-ui)',fontSize:13,fontWeight:f.tipo===v?600:400,color:f.tipo===v?(v==='eventual'?'var(--c-gold-deep,#9a7b3a)':'var(--c-sage-deep)'):'var(--c-text-700)'}}>{l}</div>
                <div style={{fontSize:10,color:'var(--c-text-300)',fontFamily:'var(--font-ui)',marginTop:2}}>{d}</div>
              </button>
            ))}
          </div>
        </div>
        <div style={{marginBottom:12}}><label className="input-label">Nome</label><input className="input-field" placeholder={isEventual?'Ex: Bombinha de asma, Loratadina':'Ex: Progesterona'} value={f.name} onChange={e=>set('name',e.target.value)}/></div>
        <div style={{marginBottom:12}}><label className="input-label">Dose</label><input className="input-field" placeholder="Ex: 200mg, 2 jatos" value={f.dose} onChange={e=>set('dose',e.target.value)}/></div>
        {/* Frequência e horário só para contínuos */}
        {!isEventual&&(
          <>
            <div style={{marginBottom:12}}><label className="input-label">Frequência</label><input className="input-field" placeholder="Ex: 2x ao dia" value={f.frequency} onChange={e=>set('frequency',e.target.value)}/></div>
            <div style={{marginBottom:12}}><label className="input-label">Horário</label><input className="input-field" placeholder="Ex: Manhã / Noite" value={f.time} onChange={e=>set('time',e.target.value)}/></div>
          </>
        )}
        {isEventual&&(
          <div style={{marginBottom:12}}><label className="input-label">Indicação</label><input className="input-field" placeholder="Ex: Crise alérgica, falta de ar" value={f.frequency} onChange={e=>set('frequency',e.target.value)}/></div>
        )}
        <div style={{marginBottom:12}}><label className="input-label">Início</label><input className="input-field" type="date" value={f.start_date} onChange={e=>set('start_date',e.target.value)}/></div>
        <button className="btn-primary" onClick={save} disabled={saving||!f.name} style={{marginTop:8}}>{saving?'Salvando...':'Salvar'}</button>
      </div>
    </div>
  )
}

// ─── EXAM MODAL ───────────────────────────────────────────────────
function ExamModal({userId, onClose, onSave}) {
  const [f,setF]=useState({category:'',date:'',status:'agendado',scheduled_date:'',lab_name:'',notes:''})
  const [saving,setSaving]=useState(false)
  const set=(k,v)=>setF(p=>({...p,[k]:v}))
  const save=async()=>{if(!f.category)return;setSaving(true);await supabase.from('lab_results').insert({user_id:userId,...f});onSave?.();onClose()}
  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={e=>e.stopPropagation()}>
        <div className="sheet-handle"/>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
          <h2 className="sheet-title" style={{marginBottom:0}}>Novo exame</h2>
          <button onClick={onClose} className="btn-ghost" style={{padding:8}}><X size={18} strokeWidth={1.8}/></button>
        </div>
        <div style={{marginBottom:12}}><label className="input-label">Nome do exame</label><input className="input-field" placeholder="Ex: TSH, Hemograma" value={f.category} onChange={e=>set('category',e.target.value)}/></div>
        <div style={{marginBottom:12}}><label className="input-label">Status</label>
          <div style={{display:'flex',gap:8}}>
            {[{v:'pendente',l:'Pendente'},{v:'agendado',l:'Agendado'},{v:'realizado',l:'Realizado'}].map(({v,l})=>(
              <button key={v} onClick={()=>set('status',v)} style={{flex:1,padding:'8px 0',borderRadius:'var(--r-md)',border:'none',cursor:'pointer',background:f.status===v?'var(--c-base-3)':'var(--c-base-1)',fontFamily:'var(--font-ui)',fontSize:12,fontWeight:f.status===v?500:400,color:f.status===v?'var(--c-text-900)':'var(--c-text-400)'}}>{l}</button>
            ))}
          </div>
        </div>
        {(f.status==='agendado')&&<div style={{marginBottom:12}}><label className="input-label">Data agendada</label><input className="input-field" type="date" value={f.scheduled_date} onChange={e=>set('scheduled_date',e.target.value)}/></div>}
        {(f.status==='realizado')&&<div style={{marginBottom:12}}><label className="input-label">Data de realização</label><input className="input-field" type="date" value={f.date} onChange={e=>set('date',e.target.value)}/></div>}
        <div style={{marginBottom:12}}><label className="input-label">Laboratório</label><input className="input-field" placeholder="Nome do laboratório" value={f.lab_name} onChange={e=>set('lab_name',e.target.value)}/></div>
        <div style={{marginBottom:20}}><label className="input-label">Observações</label><textarea className="input-field" rows={2} value={f.notes} onChange={e=>set('notes',e.target.value)} style={{resize:'none'}}/></div>
        <button className="btn-primary" onClick={save} disabled={saving||!f.category}>{saving?'Salvando...':'Salvar'}</button>
      </div>
    </div>
  )
}

// ─── CONSULTAS VIEW ───────────────────────────────────────────────
function ConsultasView({userId, consultas, onBack, onReload}) {
  const [modal,setModal]=useState(null)
  const [selected,setSelected]=useState(null)
  const byMonth={}
  for(const c of consultas){
    const key=c.date?c.date.slice(0,7):''
    if(!byMonth[key])byMonth[key]=[]
    byMonth[key].push(c)
  }
  const months=Object.keys(byMonth).sort((a,b)=>b.localeCompare(a))
  const MONTHS=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
  const monthLabel=(k)=>{const [y,m]=k.split('-');return`${MONTHS[parseInt(m)-1]} ${y}`}
  return (
    <div>
      <div style={{display:'flex',alignItems:'center',gap:12,padding:'52px var(--page-pad-x) 20px',position:'relative',overflow:'hidden'}}>
        <PageBotanical/>
        <button onClick={onBack} className="btn-ghost" style={{padding:8,position:'relative',zIndex:1}}><ChevronLeft size={20} strokeWidth={1.8}/></button>
        <div style={{position:'relative',zIndex:1}}>
          <h1 style={{fontFamily:'var(--font-display)',fontSize:'var(--text-2xl)',fontWeight:500,color:'var(--c-text-900)',letterSpacing:'-0.02em'}}>Consultas</h1>
        </div>
      </div>
      <div style={{padding:'0 var(--page-pad-x)',marginBottom:20}}>
        <button className="btn-primary" onClick={()=>setModal('new')}>+ Nova consulta</button>
      </div>
      <div style={{padding:'0 var(--page-pad-x)'}}>
        {months.length===0&&<div className="empty-state"><Stethoscope size={32} style={{color:'var(--c-text-100)'}}/><p className="empty-state-text">Nenhuma consulta registrada</p></div>}
        {months.map(mk=>(
          <div key={mk} style={{marginBottom:24}}>
            <div style={{fontFamily:'var(--font-ui)',fontSize:11,color:'var(--c-text-300)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:10}}>{monthLabel(mk)}</div>
            <div className="card" style={{padding:'0 16px'}}>
              {byMonth[mk].map((c,i)=>(
                <div key={c.id} onClick={()=>setSelected(c)} style={{padding:'14px 0',borderBottom:i<byMonth[mk].length-1?'1px solid var(--c-border-light)':'none',cursor:'pointer'}}>
                  <div style={{display:'flex',alignItems:'center',gap:14}}>
                    <div style={{width:3,height:40,borderRadius:2,background:c.date>=today()?'var(--c-rose)':'var(--c-base-3)',flexShrink:0}}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontFamily:'var(--font-ui)',fontSize:14,fontWeight:500,color:'var(--c-text-900)'}}>{c.specialty||'Consulta'}</div>
                      <div style={{fontSize:12,color:'var(--c-text-500)',marginTop:2}}>{c.doctor&&`${c.doctor} · `}{formatDate(c.date)}{c.time&&` · ${c.time}`}</div>
                      {c.diagnosis&&<div style={{fontSize:11,color:'var(--c-text-400)',marginTop:3,fontStyle:'italic'}}>{c.diagnosis}</div>}
                    </div>
                    <ChevronRight size={14} style={{color:'var(--c-text-100)',flexShrink:0}}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {modal==='new'&&<ConsultaModal userId={userId} onClose={()=>setModal(null)} onSave={()=>{setModal(null);onReload()}}/>}
      {selected&&<ConsultaModal item={selected} userId={userId} onClose={()=>setSelected(null)} onSave={()=>{setSelected(null);onReload()}}/>}
    </div>
  )
}

// ─── MEDICAMENTOS VIEW ────────────────────────────────────────────
function MedicamentosView({userId, meds, onBack, onReload}) {
  const [modal,setModal]=useState(false)
  const [logs,setLogs]=useState([])
  const [usoModal,setUsoModal]=useState(null)  // medicamento eventual selecionado p/ registrar uso
  const [usosRecentes,setUsosRecentes]=useState({})  // medication_id -> count nos últimos 30d
  const todayStr=today()

  const loadLogs=useCallback(async()=>{
    if(!userId) return
    const {data}=await supabase.from('vitta_med_logs').select('medication_id').eq('user_id',userId).eq('date',todayStr)
    setLogs((data||[]).map(l=>l.medication_id))
    // Contagem de usos eventuais nos últimos 30 dias
    const {data:usos}=await supabase.from('vitta_med_uso_eventual').select('medication_id,used_at').eq('user_id',userId).gte('date',daysAgo(30))
    const counts={}
    for(const u of usos||[]){counts[u.medication_id]=(counts[u.medication_id]||0)+1}
    // Último uso
    const last={}
    for(const u of usos||[]){if(!last[u.medication_id]||u.used_at>last[u.medication_id])last[u.medication_id]=u.used_at}
    setUsosRecentes({counts,last})
  },[userId,todayStr])

  useEffect(()=>{loadLogs()},[loadLogs])

  const toggleTaken=async(medId)=>{
    const taken=logs.includes(medId)
    if(taken){await supabase.from('vitta_med_logs').delete().eq('user_id',userId).eq('medication_id',medId).eq('date',todayStr);setLogs(p=>p.filter(id=>id!==medId))}
    else{await supabase.from('vitta_med_logs').upsert({user_id:userId,medication_id:medId,date:todayStr,taken:true},{onConflict:'user_id,medication_id,date'});setLogs(p=>[...p,medId])}
  }

  const active=meds.filter(m=>m.active&&m.tipo!=='eventual')
  const eventual=meds.filter(m=>m.active&&m.tipo==='eventual')
  const inactive=meds.filter(m=>!m.active)

  const fmtUltimoUso=(iso)=>{
    if(!iso) return null
    const d=new Date(iso)
    const hoje=new Date()
    const diff=Math.floor((hoje-d)/86400000)
    const hora=`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
    if(diff===0) return `Hoje às ${hora}`
    if(diff===1) return `Ontem às ${hora}`
    return `${formatDate(d.toISOString().split('T')[0])}`
  }

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',gap:12,padding:'52px var(--page-pad-x) 20px',position:'relative',overflow:'hidden'}}>
        <PageBotanical/>
        <button onClick={onBack} className="btn-ghost" style={{padding:8,position:'relative',zIndex:1}}><ChevronLeft size={20} strokeWidth={1.8}/></button>
        <div style={{position:'relative',zIndex:1}}>
          <h1 style={{fontFamily:'var(--font-display)',fontSize:'var(--text-2xl)',fontWeight:500,color:'var(--c-text-900)',letterSpacing:'-0.02em'}}>Medicamentos</h1>
        </div>
      </div>
      <div style={{padding:'0 var(--page-pad-x)',marginBottom:20}}>
        <button className="btn-primary" onClick={()=>setModal(true)}>+ Novo medicamento</button>
      </div>
      <div style={{padding:'0 var(--page-pad-x)'}}>
        {/* Uso contínuo */}
        {active.length>0&&(
          <section style={{marginBottom:24}}>
            <div className="section-header"><h2 className="section-title" style={{fontSize:15}}>Uso contínuo</h2></div>
            <div className="card" style={{padding:'0 16px'}}>
              {active.map((m,i)=>{
                const taken=logs.includes(m.id)
                return(
                  <div key={m.id} style={{display:'flex',alignItems:'center',gap:14,padding:'14px 0',borderBottom:i<active.length-1?'1px solid var(--c-border-light)':'none'}}>
                    <div style={{width:36,height:36,borderRadius:10,background:'var(--c-lavender-faint)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                      <Pill size={16} strokeWidth={1.8} style={{color:'var(--c-lavender)'}}/>
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontFamily:'var(--font-ui)',fontSize:14,fontWeight:500,color:'var(--c-text-900)'}}>{m.name}</div>
                      <div style={{fontSize:12,color:'var(--c-text-500)',marginTop:2}}>{[m.dose,m.frequency,m.time].filter(Boolean).join(' · ')}</div>
                    </div>
                    <button onClick={()=>toggleTaken(m.id)} style={{padding:'6px 12px',borderRadius:'var(--r-full)',border:'none',cursor:'pointer',background:taken?'var(--c-sage-faint)':'var(--c-base-2)',color:taken?'var(--c-sage-deep)':'var(--c-text-400)',fontFamily:'var(--font-ui)',fontSize:11,fontWeight:500,display:'flex',alignItems:'center',gap:5,flexShrink:0}}>
                      {taken&&<Check size={11} strokeWidth={2.5}/>}{taken?'Tomado':'Marcar'}
                    </button>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Uso eventual / SOS */}
        {eventual.length>0&&(
          <section style={{marginBottom:24}}>
            <div className="section-header"><h2 className="section-title" style={{fontSize:15}}>Uso eventual</h2></div>
            <div className="card" style={{padding:'0 16px'}}>
              {eventual.map((m,i)=>{
                const count=usosRecentes.counts?.[m.id]||0
                const ultimo=fmtUltimoUso(usosRecentes.last?.[m.id])
                return(
                  <div key={m.id} style={{display:'flex',alignItems:'center',gap:14,padding:'14px 0',borderBottom:i<eventual.length-1?'1px solid var(--c-border-light)':'none'}}>
                    <div style={{width:36,height:36,borderRadius:10,background:'rgba(201,169,110,0.15)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                      <Pill size={16} strokeWidth={1.8} style={{color:'var(--c-gold)'}}/>
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontFamily:'var(--font-ui)',fontSize:14,fontWeight:500,color:'var(--c-text-900)'}}>{m.name}</div>
                      <div style={{fontSize:12,color:'var(--c-text-500)',marginTop:2}}>{[m.dose,m.frequency].filter(Boolean).join(' · ')}</div>
                      {ultimo&&<div style={{fontSize:11,color:'var(--c-text-400)',marginTop:3}}>Último uso: {ultimo}{count>1?` · ${count}x em 30d`:''}</div>}
                    </div>
                    <button onClick={()=>setUsoModal(m)} style={{padding:'7px 13px',borderRadius:'var(--r-full)',border:'none',cursor:'pointer',background:'var(--c-text-900)',color:'var(--c-base-0)',fontFamily:'var(--font-ui)',fontSize:11,fontWeight:500,display:'flex',alignItems:'center',gap:5,flexShrink:0}}>
                      <Plus size={11} strokeWidth={2.5}/>Registrar uso
                    </button>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Histórico (inativos) */}
        {inactive.length>0&&(
          <section style={{marginBottom:24}}>
            <div className="section-header"><h2 className="section-title" style={{fontSize:15,color:'var(--c-text-300)'}}>Histórico</h2></div>
            <div className="card" style={{padding:'0 16px'}}>
              {inactive.map((m,i)=>(
                <div key={m.id} style={{display:'flex',alignItems:'center',gap:14,padding:'12px 0',borderBottom:i<inactive.length-1?'1px solid var(--c-border-light)':'none',opacity:0.6}}>
                  <Pill size={16} strokeWidth={1.5} style={{color:'var(--c-text-300)'}}/>
                  <div style={{flex:1}}><div style={{fontFamily:'var(--font-ui)',fontSize:13,color:'var(--c-text-500)'}}>{m.name}</div><div style={{fontSize:11,color:'var(--c-text-300)'}}>{[m.dose,m.frequency].filter(Boolean).join(' · ')}</div></div>
                </div>
              ))}
            </div>
          </section>
        )}
        {meds.length===0&&<div className="empty-state"><Pill size={32} style={{color:'var(--c-text-100)'}}/><p className="empty-state-text">Nenhum medicamento</p></div>}
      </div>
      {modal&&<MedModal userId={userId} onClose={()=>setModal(false)} onSave={()=>{setModal(false);onReload()}}/>}
      {usoModal&&<UsoEventualModal med={usoModal} userId={userId} onClose={()=>setUsoModal(null)} onSave={()=>{setUsoModal(null);loadLogs()}}/>}
    </div>
  )
}

// ─── MODAL: registrar uso de medicamento eventual ──────────────────
function UsoEventualModal({med, userId, onClose, onSave}) {
  const [date,setDate]=useState(today())
  const [time,setTime]=useState(()=>{const d=new Date();return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`})
  const [notes,setNotes]=useState('')
  const [saving,setSaving]=useState(false)
  const [done,setDone]=useState(false)

  const save=async()=>{
    setSaving(true)
    const usedAt=new Date(`${date}T${time||'12:00'}:00`).toISOString()
    const {error}=await supabase.from('vitta_med_uso_eventual').insert({user_id:userId,medication_id:med.id,used_at:usedAt,date,notes:notes||null})
    if(error){setSaving(false);return}
    setDone(true);setTimeout(()=>{onSave?.();onClose()},700)
  }

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={e=>e.stopPropagation()}>
        <div className="sheet-handle"/>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6}}>
          <h2 className="sheet-title" style={{marginBottom:0}}>Registrar uso</h2>
          <button onClick={onClose} className="btn-ghost" style={{padding:8}}><X size={18} strokeWidth={1.8}/></button>
        </div>
        <p style={{fontFamily:'var(--font-editorial)',fontSize:14,color:'var(--c-text-500)',fontStyle:'italic',marginBottom:18}}>{med.name}{med.dose?` · ${med.dose}`:''}</p>
        {done?(
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:12,padding:'24px 0'}}>
            <div style={{width:52,height:52,borderRadius:'50%',background:'var(--c-sage-faint)',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <Check size={24} strokeWidth={2} style={{color:'var(--c-sage)'}}/>
            </div>
            <p style={{fontFamily:'var(--font-editorial)',fontSize:18,color:'var(--c-text-700)',fontStyle:'italic'}}>Uso registrado</p>
          </div>
        ):(
          <>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}>
              <div><label className="input-label">Data</label><input className="input-field" type="date" value={date} max={today()} onChange={e=>setDate(e.target.value)}/></div>
              <div><label className="input-label">Hora</label><input className="input-field" type="time" value={time} onChange={e=>setTime(e.target.value)}/></div>
            </div>
            <div style={{marginBottom:20}}><label className="input-label">Observação</label><textarea className="input-field" rows={2} value={notes} onChange={e=>setNotes(e.target.value)} style={{resize:'none'}} placeholder="Ex: crise alérgica, falta de ar..."/></div>
            <button className="btn-primary" onClick={save} disabled={saving}>{saving?'Salvando...':'Salvar uso'}</button>
          </>
        )}
      </div>
    </div>
  )
}

// ─── EXAMES VIEW ──────────────────────────────────────────────────
function ExamesView({userId, labResults, onBack, onReload}) {
  const [modal,setModal]=useState(false)
  const pendentes=labResults.filter(e=>e.status==='pendente')
  const agendados=labResults.filter(e=>e.status==='agendado')
  const realizados=labResults.filter(e=>e.status==='realizado'||!e.status)
  const ExRow=({e})=>(
    <div style={{display:'flex',alignItems:'center',gap:14,padding:'12px 0',borderBottom:'1px solid var(--c-border-light)'}}>
      <div style={{width:34,height:34,borderRadius:9,background:'var(--c-sage-faint)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
        <FlaskConical size={15} strokeWidth={1.8} style={{color:'var(--c-sage)'}}/>
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontFamily:'var(--font-ui)',fontSize:13,fontWeight:500,color:'var(--c-text-900)'}}>{e.category}</div>
        <div style={{fontSize:11,color:'var(--c-text-400)',marginTop:2}}>{e.lab_name&&`${e.lab_name} · `}{formatDate(e.scheduled_date||e.date)}</div>
      </div>
    </div>
  )
  const Section=({title,items,empty})=>items.length===0?null:(
    <section style={{marginBottom:24}}>
      <div className="section-header"><h2 className="section-title" style={{fontSize:15}}>{title}</h2></div>
      <div className="card" style={{padding:'0 16px'}}>{items.map(e=><ExRow key={e.id} e={e}/>)}</div>
    </section>
  )
  return (
    <div>
      <div style={{display:'flex',alignItems:'center',gap:12,padding:'52px var(--page-pad-x) 20px',position:'relative',overflow:'hidden'}}>
        <PageBotanical/>
        <button onClick={onBack} className="btn-ghost" style={{padding:8,position:'relative',zIndex:1}}><ChevronLeft size={20} strokeWidth={1.8}/></button>
        <div style={{position:'relative',zIndex:1}}>
          <h1 style={{fontFamily:'var(--font-display)',fontSize:'var(--text-2xl)',fontWeight:500,color:'var(--c-text-900)',letterSpacing:'-0.02em'}}>Exames</h1>
        </div>
      </div>
      <div style={{padding:'0 var(--page-pad-x)',marginBottom:20}}>
        <button className="btn-primary" onClick={()=>setModal(true)}>+ Novo exame</button>
      </div>
      <div style={{padding:'0 var(--page-pad-x)'}}>
        <Section title="Pendentes" items={pendentes}/>
        <Section title="Agendados" items={agendados}/>
        <Section title="Realizados" items={realizados}/>
        {labResults.length===0&&<div className="empty-state"><FlaskConical size={32} style={{color:'var(--c-text-100)'}}/><p className="empty-state-text">Nenhum exame registrado</p></div>}
      </div>
      {modal&&<ExamModal userId={userId} onClose={()=>setModal(false)} onSave={()=>{setModal(false);onReload()}}/>}
    </div>
  )
}


// ─── HISTÓRICO ──────────────────────────────────────────────────
const HIST_CATS = ['Vacina','Doença','Cirurgia','Procedimento','Internação','Diagnóstico','Sintoma importante','FIV','COVID / Gripe','Outro']
const HIST_COLORS = {
  'Vacina':'#8A9E8C','Doença':'#D4A5A5','Cirurgia':'#9B8FC4',
  'Procedimento':'#C4B8D4','Internação':'#C48E8E','Diagnóstico':'#C9A96E',
  'Sintoma importante':'#B8AEA9','FIV':'#C4B8D4','COVID / Gripe':'#D4A5A5','Outro':'#B8AEA9'
}

function HistoricoModal({userId, onClose, onSave}) {
  const [f,setF]=useState({date:today(),category:'Vacina',title:'',description:'',provider:'',notes:''})
  const [saving,setSaving]=useState(false)
  const [done,setDone]=useState(false)
  const set=(k,v)=>setF(p=>({...p,[k]:v}))
  const save=async()=>{
    if(!f.title||!f.date) return
    setSaving(true)
    const{error}=await supabase.from('vitta_historico').insert({user_id:userId,...f})
    if(error){setSaving(false);return}
    setDone(true);setTimeout(()=>{onSave?.();onClose()},700)
  }
  return(
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={e=>e.stopPropagation()}>
        <div className="sheet-handle"/>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
          <h2 className="sheet-title" style={{marginBottom:0}}>Novo registro</h2>
          <button onClick={onClose} className="btn-ghost" style={{padding:8}}><X size={18} strokeWidth={1.8}/></button>
        </div>
        {done?(
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:12,padding:'24px 0'}}>
            <div style={{width:52,height:52,borderRadius:'50%',background:'var(--c-sage-faint)',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <Check size={24} strokeWidth={2} style={{color:'var(--c-sage)'}}/>
            </div>
            <p style={{fontFamily:'var(--font-editorial)',fontSize:18,color:'var(--c-text-700)',fontStyle:'italic'}}>Registrado</p>
          </div>
        ):(
          <>
            <div style={{marginBottom:12}}>
              <label className="input-label">Data</label>
              <input className="input-field" type="date" value={f.date} onChange={e=>set('date',e.target.value)}/>
            </div>
            <div style={{marginBottom:12}}>
              <label className="input-label">Categoria</label>
              <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:6}}>
                {HIST_CATS.map(cat=>(
                  <button key={cat} onClick={()=>set('category',cat)} style={{
                    padding:'6px 12px',borderRadius:'var(--r-full)',border:'none',cursor:'pointer',
                    background:f.category===cat?HIST_COLORS[cat]+'28':'var(--c-base-2)',
                    color:f.category===cat?HIST_COLORS[cat]:'var(--c-text-500)',
                    fontFamily:'var(--font-ui)',fontSize:12,fontWeight:f.category===cat?500:400,
                    boxShadow:f.category===cat?`0 0 0 1.5px ${HIST_COLORS[cat]}`:'none',
                  }}>{cat}</button>
                ))}
              </div>
            </div>
            <div style={{marginBottom:12}}>
              <label className="input-label">Título</label>
              <input className="input-field" type="text" placeholder="Ex: Vacina Influenza, Diagnóstico de Anemia" value={f.title} onChange={e=>set('title',e.target.value)}/>
            </div>
            <div style={{marginBottom:12}}>
              <label className="input-label">Descrição</label>
              <textarea className="input-field" rows={3} value={f.description} onChange={e=>set('description',e.target.value)} style={{resize:'none'}} placeholder="Detalhes, observações, resultados..."/>
            </div>
            <div style={{marginBottom:20}}>
              <label className="input-label">Médico / Instituição</label>
              <input className="input-field" type="text" placeholder="Opcional" value={f.provider} onChange={e=>set('provider',e.target.value)}/>
            </div>
            <button className="btn-primary" onClick={save} disabled={saving||!f.title||!f.date}>
              {saving?'Salvando...':'Salvar registro'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function HistoricoView({userId, onBack, onReload}) {
  const [items,setItems]=useState([])
  const [loading,setLoading]=useState(true)
  const [modal,setModal]=useState(false)
  const [filterCat,setFilterCat]=useState('Todos')

  const load=useCallback(async()=>{
    if(!userId) return
    setLoading(true)
    const{data}=await supabase.from('vitta_historico').select('*').eq('user_id',userId).order('date',{ascending:false})
    setItems(data||[])
    setLoading(false)
  },[userId])

  useEffect(()=>{load()},[load])

  const filtered=filterCat==='Todos'?items:items.filter(i=>i.category===filterCat)

  // Group by year then month
  const MONTHS=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
  const byYear={}
  for(const item of filtered){
    const yr=item.date.slice(0,4)
    const mo=parseInt(item.date.slice(5,7))-1
    if(!byYear[yr])byYear[yr]={}
    if(!byYear[yr][mo])byYear[yr][mo]=[]
    byYear[yr][mo].push(item)
  }
  const years=Object.keys(byYear).sort((a,b)=>b-a)
  const usedCats=['Todos',...new Set(items.map(i=>i.category))]

  return(
    <div>
      <div style={{display:'flex',alignItems:'center',gap:12,padding:'52px var(--page-pad-x) 20px',position:'relative',overflow:'hidden'}}>
        <PageBotanical/>
        <button onClick={onBack} className="btn-ghost" style={{padding:8,position:'relative',zIndex:1}}><ChevronLeft size={20} strokeWidth={1.8}/></button>
        <div style={{position:'relative',zIndex:1}}>
          <h1 style={{fontFamily:'var(--font-display)',fontSize:'var(--text-2xl)',fontWeight:500,color:'var(--c-text-900)',letterSpacing:'-0.02em'}}>Histórico médico</h1>
        </div>
      </div>
      <div style={{padding:'0 var(--page-pad-x)',marginBottom:16}}>
        <button className="btn-primary" onClick={()=>setModal(true)}>+ Novo registro</button>
      </div>
      {items.length>1&&(
        <div style={{padding:'0 var(--page-pad-x)',marginBottom:16,display:'flex',gap:6,overflowX:'auto',paddingBottom:2}}>
          {usedCats.map(cat=>(
            <button key={cat} onClick={()=>setFilterCat(cat)} style={{
              padding:'6px 13px',borderRadius:'var(--r-full)',border:'none',cursor:'pointer',flexShrink:0,
              background:filterCat===cat?'var(--c-text-900)':'var(--c-base-2)',
              color:filterCat===cat?'var(--c-base-0)':'var(--c-text-500)',
              fontFamily:'var(--font-ui)',fontSize:12,fontWeight:filterCat===cat?500:400,
            }}>{cat}</button>
          ))}
        </div>
      )}
      <div style={{padding:'0 var(--page-pad-x)'}}>
        {loading&&<div style={{height:120}} className="loading-shimmer card"/>}
        {!loading&&filtered.length===0&&(
          <div className="empty-state" style={{paddingTop:40}}>
            <CalendarDays size={32} style={{color:'var(--c-text-100)'}}/>
            <p className="empty-state-text">Nenhum registro no histórico</p>
            <p style={{fontSize:12,color:'var(--c-text-300)',fontFamily:'var(--font-ui)',textAlign:'center',lineHeight:1.6,maxWidth:260}}>Registre vacinas, doenças, cirurgias e marcos importantes da sua jornada de saúde</p>
          </div>
        )}
        {!loading&&years.map(yr=>(
          <div key={yr} style={{marginBottom:28}}>
            <div style={{fontFamily:'var(--font-display)',fontSize:22,fontWeight:500,color:'var(--c-text-900)',marginBottom:16,letterSpacing:'-0.02em'}}>{yr}</div>
            {Object.keys(byYear[yr]).sort((a,b)=>b-a).map(mo=>(
              <div key={mo} style={{marginBottom:16}}>
                <div style={{fontFamily:'var(--font-ui)',fontSize:11,color:'var(--c-text-300)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:8}}>{MONTHS[parseInt(mo)]}</div>
                <div className="card" style={{padding:'0 16px'}}>
                  {byYear[yr][mo].map((item,i)=>{
                    const color=HIST_COLORS[item.category]||'var(--c-text-300)'
                    return(
                      <div key={item.id} style={{padding:'14px 0',borderBottom:i<byYear[yr][mo].length-1?'1px solid var(--c-border-light)':'none'}}>
                        <div style={{display:'flex',alignItems:'flex-start',gap:12}}>
                          <div style={{width:3,borderRadius:2,background:color,flexShrink:0,alignSelf:'stretch',marginTop:2}}/>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                              <span style={{fontSize:9,color:color,fontFamily:'var(--font-ui)',textTransform:'uppercase',letterSpacing:'0.06em',fontWeight:600}}>{item.category}</span>
                              <span style={{fontSize:10,color:'var(--c-text-300)',fontFamily:'var(--font-ui)'}}>{new Date(item.date+'T12:00:00').getDate()} de {MONTHS[parseInt(item.date.slice(5,7))-1].toLowerCase()}</span>
                            </div>
                            <div style={{fontFamily:'var(--font-ui)',fontSize:14,fontWeight:500,color:'var(--c-text-900)',marginBottom:item.description?4:0}}>{item.title}</div>
                            {item.description&&<p style={{fontFamily:'var(--font-editorial)',fontSize:13,color:'var(--c-text-600)',fontStyle:'italic',lineHeight:1.5,margin:0}}>{item.description}</p>}
                            {item.provider&&<div style={{fontSize:11,color:'var(--c-text-400)',fontFamily:'var(--font-ui)',marginTop:4}}>{item.provider}</div>}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      {modal&&<HistoricoModal userId={userId} onClose={()=>setModal(false)} onSave={()=>{setModal(false);load()}}/>}
    </div>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────
export default function Saude({userId}) {
  const [view,setView] = useState('overview')
  const [modal,setModal] = useState(null)
  const {data,loading,reload} = useOverviewData(userId)
  const navigate = useNavigate()

  if (view==='historico') return <HistoricoView userId={userId} onBack={()=>setView('overview')} onReload={reload}/>
  if (view==='consultas') return <ConsultasView userId={userId} consultas={data?.allConsultas||[]} onBack={()=>setView('overview')} onReload={reload}/>
  if (view==='medicamentos') return <MedicamentosView userId={userId} meds={data?.meds||[]} onBack={()=>setView('overview')} onReload={reload}/>
  if (view==='exames') return <ExamesView userId={userId} labResults={data?.labResults||[]} onBack={()=>setView('overview')} onReload={reload}/>

  const d = data||{}
  const weightDelta = d.currentWeight&&d.prevWeight ? (parseFloat(d.currentWeight)-parseFloat(d.prevWeight)).toFixed(1) : null

  return (
    <div style={{position:'relative',minHeight:'100%',paddingBottom:24}}>
      {/* Header */}
      <div style={{padding:'52px var(--page-pad-x) 24px',position:'relative',overflow:'hidden'}}>
        <PageBotanical/>
        <div style={{position:'relative',zIndex:1}}>
          <h1 style={{fontFamily:'var(--font-display)',fontSize:'var(--text-3xl)',fontWeight:500,color:'var(--c-text-900)',letterSpacing:'-0.02em',marginBottom:6}}>Saúde</h1>
          <p style={{fontFamily:'var(--font-editorial)',fontSize:16,color:'var(--c-text-500)',fontStyle:'italic'}}>Sua jornada de cuidado e acompanhamento.</p>
        </div>
      </div>

      {/* Seu momento atual */}
      <section style={{padding:'0 var(--page-pad-x)',marginBottom:28}}>
        <h2 className="section-title" style={{marginBottom:16}}>Seu momento atual</h2>
        {/* Row 1: Consulta + Exame */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
          <InfoCard icon={Stethoscope} label="Próxima consulta" color="var(--c-rose)"
            value={d.nextConsulta?.specialty||'—'}
            sub={d.nextConsulta?formatDate(d.nextConsulta.date):null}
            onClick={()=>setView('consultas')}/>
          <InfoCard icon={FlaskConical} label="Próximo exame" color="var(--c-sage)"
            value={d.nextExam?.category||'—'}
            sub={d.nextExam?formatDate(d.nextExam.scheduled_date||d.nextExam.date):null}
            onClick={()=>setView('exames')}/>
        </div>
        {/* Row 2: Meds + FIV+Ciclo */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
          <InfoCard icon={Pill} label="Medicamentos" color="var(--c-lavender)"
            value={d.activeMeds?.length||'0'}
            sub={d.activeMeds?.length===1?'em uso':`em uso`}
            onClick={()=>setView('medicamentos')}/>
          <InfoCard icon={Heart} label="Ciclo — dia" color="var(--c-rose-mid)"
            value={d.cycle?.currentDay?`${d.cycle.currentDay}º`:'—'}
            sub={d.cycle?.phase}
            onClick={()=>navigate('/ciclo')}/>
        </div>
        {/* Row 3: Peso + Sono + Água */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>
          <InfoCard icon={Scale} label="Peso" color="var(--c-rose)"
            value={d.currentWeight?`${parseFloat(d.currentWeight).toFixed(1)}`:'—'}
            sub={weightDelta?`${weightDelta>0?'+':''}${weightDelta} kg`:null}/>
          <InfoCard icon={Moon} label="Sono" color="#9B8FC4"
            value={d.avgSleep||'—'}
            sub={d.avgSleep?'h/noite (7d)':null}/>
          <InfoCard icon={Droplets} label="Água" color="#6BA8D4"
            value={d.avgWater?`${Math.round(d.avgWater/100)/10}L`:'—'}
            sub={d.avgWater?'média 7d':null}/>
        </div>
      </section>

      {/* Módulos */}
      <section style={{padding:'0 var(--page-pad-x)',marginBottom:28}}>
        <h2 className="section-title" style={{marginBottom:16}}>Módulos</h2>
        <ModuleCard icon={Stethoscope} title="Consultas" color="var(--c-rose)" onOpen={()=>setView('consultas')}
          stats={[{value:d.allConsultas?.length||0,label:'registradas'},{value:d.allConsultas?.filter(c=>c.date>=today()).length||0,label:'próximas'}]}/>
        <ModuleCard icon={Pill} title="Medicamentos" color="var(--c-lavender)" onOpen={()=>setView('medicamentos')}
          stats={[{value:d.continuosMeds?.length||0,label:'contínuos'},{value:d.eventualMeds?.length||0,label:'eventuais'}]}/>
        <ModuleCard icon={FlaskConical} title="Exames" color="var(--c-sage)" onOpen={()=>setView('exames')}
          stats={[{value:d.labResults?.filter(e=>e.status==='agendado').length||0,label:'agendados'},{value:d.labResults?.filter(e=>e.status==='realizado'||!e.status).length||0,label:'realizados'}]}/>
        <ModuleCard icon={Activity} title="Histórico" color="var(--c-gold)" onOpen={()=>setView('historico')}
          stats={[{value:'—',label:'eventos registrados'},{value:'—',label:'anos de história'}]}/>
      </section>

      {/* Saúde Reprodutiva */}
      <section style={{padding:'0 var(--page-pad-x)',marginBottom:24}}>
        <h2 className="section-title" style={{marginBottom:16}}>Saúde Reprodutiva</h2>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          {/* Ciclo card */}
          <div onClick={()=>navigate('/ciclo')} style={{background:'rgba(212,165,165,0.08)',border:'1px solid rgba(212,165,165,0.3)',borderRadius:'var(--r-lg)',padding:'16px 14px',cursor:'pointer'}}>
            <div style={{fontSize:10,color:'var(--c-rose-deep)',fontFamily:'var(--font-ui)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:8,fontWeight:500}}>Ciclo</div>
            <div style={{fontFamily:'var(--font-display)',fontSize:22,fontWeight:500,color:'var(--c-text-900)',marginBottom:4}}>{d.cycle?.currentDay?`Dia ${d.cycle.currentDay}`:'—'}</div>
            <div style={{fontSize:12,color:'var(--c-text-500)',fontFamily:'var(--font-ui)',marginBottom:2}}>{d.cycle?.phase||'Sem dados'}</div>
            {d.cycle?.nextPeriod&&<div style={{fontSize:11,color:'var(--c-text-300)',fontFamily:'var(--font-ui)'}}>Próx. {formatDateShort(d.cycle.nextPeriod)}</div>}
            <div style={{marginTop:12,fontSize:12,color:'var(--c-rose-mid)',fontFamily:'var(--font-ui)',fontWeight:500,display:'flex',alignItems:'center',gap:4}}>Ver ciclo <ChevronRight size={12}/></div>
          </div>
          {/* FIV card */}
          <div onClick={()=>navigate('/fiv')} style={{background:'rgba(196,184,212,0.1)',border:'1px solid rgba(196,184,212,0.3)',borderRadius:'var(--r-lg)',padding:'16px 14px',cursor:'pointer'}}>
            <div style={{fontSize:10,color:'#7B6FA0',fontFamily:'var(--font-ui)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:8,fontWeight:500}}>Jornada FIV</div>
            <div style={{fontFamily:'var(--font-display)',fontSize:22,fontWeight:500,color:'var(--c-text-900)',marginBottom:4}}>{d.activeFiv?.stage_label||`${d.doneCount||0}/8`}</div>
            <div style={{fontSize:12,color:'var(--c-text-500)',fontFamily:'var(--font-ui)',marginBottom:2}}>{d.activeFiv?'Em curso':d.doneCount?`${d.doneCount} concluída(s)`:'Não iniciada'}</div>
            {d.doneCount!=null&&<div style={{height:3,background:'var(--c-lavender-light)',borderRadius:2,marginTop:8}}><div style={{height:'100%',width:`${((d.doneCount||0)/8)*100}%`,background:'var(--c-lavender)',borderRadius:2}}/></div>}
            <div style={{marginTop:10,fontSize:12,color:'#7B6FA0',fontFamily:'var(--font-ui)',fontWeight:500,display:'flex',alignItems:'center',gap:4}}>Ver jornada <ChevronRight size={12}/></div>
          </div>
        </div>
      </section>
    </div>
  )
}
