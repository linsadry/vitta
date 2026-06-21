import React, { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Filter, Calendar, LayoutGrid } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { PageBotanical } from '../components/BotanicalBg'
import { daysAgo, formatDate, fmtWeight, fmtSleep, fmtWater } from '../lib/utils'

/* ─── HELPERS ────────────────────────────────────────────────────── */
const fmt = (s) => {
  if(!s) return '—'
  const [y,m,d]=s.split('-')
  const mo=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']
  return `${parseInt(d)} ${mo[parseInt(m)-1]} ${y}`
}
const fmtMonth = (s) => {
  if(!s) return ''
  const [y,m]=s.split('-')
  const mo=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
  return `${mo[parseInt(m)-1]} ${y}`
}
const todayStr = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` }

/* ─── EVENT COLORS & LABELS ─────────────────────────────────────── */
const TYPE_CONFIG = {
  peso:     { label:'Peso',          color:'#D4A5A5', cat:'saude' },
  consulta: { label:'Consulta',      color:'#9B8FC4', cat:'saude' },
  exame:    { label:'Exame',         color:'#8A9E8C', cat:'saude' },
  ciclo:    { label:'Ciclo',         color:'#D4A5A5', cat:'saude' },
  fiv:      { label:'FIV',           color:'#C4B8D4', cat:'saude' },
  treino:   { label:'Treino',        color:'#8A9E8C', cat:'treinos' },
  diario:   { label:'Diário',        color:'#C9A96E', cat:'diario' },
  habitos:  { label:'Hábitos',       color:'#6BA8D4', cat:'habitos' },
}
const CYCLE_TYPE = { menstruacao:'Menstruação', sintoma:'Sintoma', humor:'Humor', energia:'Energia', muco:'Muco' }

/* ─── EVENT CARD ──────────────────────────────────────────────────── */
function EventCard({ event }) {
  const cfg = TYPE_CONFIG[event.type] || { label: event.type, color: 'var(--c-text-300)' }
  const { data: d } = event

  const content = () => {
    switch(event.type) {
      case 'peso':    return <span style={{fontFamily:'var(--font-display)',fontSize:16,fontWeight:500}}>{fmtWeight(d.weight)}</span>
      case 'consulta': return <><div style={{fontFamily:'var(--font-ui)',fontSize:13,fontWeight:500,color:'var(--c-text-900)'}}>{d.specialty||'Consulta'}</div>{d.doctor&&<div style={{fontSize:11,color:'var(--c-text-500)',marginTop:2}}>{d.doctor}</div>}{d.diagnosis&&<div style={{fontSize:11,color:'var(--c-text-400)',fontStyle:'italic',marginTop:2}}>{d.diagnosis}</div>}</>
      case 'exame':   return <><div style={{fontFamily:'var(--font-ui)',fontSize:13,fontWeight:500,color:'var(--c-text-900)'}}>{d.category}</div>{d.lab_name&&<div style={{fontSize:11,color:'var(--c-text-500)',marginTop:2}}>{d.lab_name}</div>}{d.result&&<div style={{fontSize:11,color:'var(--c-text-400)',marginTop:2}}>Resultado: {d.result} {d.unit}</div>}</>
      case 'ciclo':   return <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>{(Array.isArray(d)?d:[d]).map((e,i)=><span key={i} style={{fontSize:11,background:'rgba(212,165,165,0.15)',color:'var(--c-rose-deep)',padding:'3px 8px',borderRadius:20}}>{CYCLE_TYPE[e.type]||e.type}: {e.value}</span>)}</div>
      case 'fiv':     return <><div style={{fontFamily:'var(--font-ui)',fontSize:13,fontWeight:500,color:'var(--c-text-900)'}}>{d.stage_label}</div>{d.start_date&&<div style={{fontSize:11,color:'var(--c-text-500)',marginTop:2}}>Início: {fmt(d.start_date)}</div>}</>
      case 'treino':  return <><div style={{fontSize:13,fontWeight:500,color:'var(--c-text-900)',fontFamily:'var(--font-ui)'}}>{[...new Set((Array.isArray(d)?d:[d]).map(l=>l.plan_name))].filter(Boolean).join(', ')||'Treino realizado'}</div><div style={{fontSize:11,color:'var(--c-text-500)',marginTop:2}}>{(Array.isArray(d)?d:[d]).length} série(s)</div></>
      case 'diario':  return <><p style={{fontFamily:'var(--font-editorial)',fontSize:13,color:'var(--c-text-700)',fontStyle:'italic',lineHeight:1.5,margin:0}}>{(d.content||'').slice(0,120)}{(d.content||'').length>120?'…':''}</p></>
      case 'habitos': return <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>{d.water_ml>0&&<span style={{fontSize:11,color:'var(--c-text-500)',fontFamily:'var(--font-ui)'}}>Água {fmtWater(d.water_ml)}</span>}{d.sleep_hours>0&&<span style={{fontSize:11,color:'var(--c-text-500)',fontFamily:'var(--font-ui)'}}>Sono {fmtSleep(d.sleep_hours)}</span>}</div>
      default:        return null
    }
  }

  return (
    <div style={{display:'flex',gap:12,padding:'12px 0',borderBottom:'1px solid var(--c-border-light)'}}>
      <div style={{width:4,borderRadius:2,background:cfg.color,flexShrink:0,marginTop:2,alignSelf:'stretch'}}/>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:9,color:cfg.color,fontFamily:'var(--font-ui)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:5,fontWeight:600}}>{cfg.label}</div>
        {content()}
      </div>
    </div>
  )
}

/* ─── ANNUAL VIEW ─────────────────────────────────────────────────── */
function AnnualView({ tracking }) {
  const now = new Date()
  const yearStart = new Date(now.getFullYear(), 0, 1)
  const byDate = Object.fromEntries((tracking||[]).map(t=>[t.date,t]))

  const score = (dt) => {
    const r=byDate[dt]; if(!r) return 0; let n=0
    if(r.water_ml>0) n++; if(r.sleep_hours>0) n++
    if(r.strength_done||r.aerobic_done) n++; if(r.protein_g>0) n++
    if(r.mood) n++; if(r.notes) n++
    return Math.min(n,6)
  }
  const bg = (s) => {
    if(s===0) return 'var(--c-base-2)'
    if(s<=2)  return 'rgba(212,165,165,0.30)'
    if(s<=4)  return 'rgba(212,165,165,0.60)'
    if(s===5) return 'rgba(212,165,165,0.80)'
    return 'rgba(212,165,165,1.00)'
  }
  const todStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`

  // Build 52 weeks of the current year
  const firstDOW = (yearStart.getDay()+6)%7  // Mon=0
  const allDays = []
  for(let i=0;i<365+(now.getFullYear()%4===0?1:0);i++){
    const d=new Date(yearStart); d.setDate(d.getDate()+i)
    allDays.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`)
  }
  const grid = [...Array(firstDOW).fill(null), ...allDays]
  const weeks=[];for(let i=0;i<grid.length;i+=7)weeks.push(grid.slice(i,i+7))

  const MONTHS=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  const monthPositions={}
  weeks.forEach((w,wi)=>{
    const first=w.find(d=>d)
    if(first){const m=parseInt(first.split('-')[1])-1;if(!monthPositions[m])monthPositions[m]=wi}
  })

  return (
    <div style={{overflowX:'auto',paddingBottom:8}}>
      <div style={{position:'relative',minWidth:700}}>
        {/* Month labels */}
        <div style={{display:'flex',marginBottom:4,paddingLeft:24}}>
          {weeks.map((_,wi)=>{
            const entry=Object.entries(monthPositions).find(([_,pos])=>pos===wi)
            return <div key={wi} style={{width:13,flexShrink:0,fontSize:8,color:'var(--c-text-300)',fontFamily:'var(--font-ui)'}}>{entry?MONTHS[parseInt(entry[0])]:''}</div>
          })}
        </div>
        {/* DOW labels + grid */}
        <div style={{display:'flex',gap:2}}>
          <div style={{display:'flex',flexDirection:'column',gap:2,paddingTop:0,marginRight:2}}>
            {['S','T','Q','Q','S','S','D'].map((d,i)=><div key={i} style={{height:11,fontSize:7,color:'var(--c-text-300)',fontFamily:'var(--font-ui)',lineHeight:'11px'}}>{i%2===1?d:''}</div>)}
          </div>
          {weeks.map((week,wi)=>(
            <div key={wi} style={{display:'flex',flexDirection:'column',gap:2}}>
              {week.map((dt,di)=>{
                if(!dt) return <div key={`e${di}`} style={{width:11,height:11}}/>
                const s=score(dt), isT=dt===todStr, isFuture=dt>todStr
                return(
                  <div key={dt} style={{
                    width:11,height:11,borderRadius:2,
                    background:isFuture?'transparent':bg(s),
                    opacity:isFuture?0.15:1,
                    boxShadow:isT?'0 0 0 1px var(--c-rose-mid)':'none',
                  }} title={dt}/>
                )
              })}
            </div>
          ))}
        </div>
        {/* Legend */}
        <div style={{display:'flex',alignItems:'center',gap:6,marginTop:10,justifyContent:'flex-end'}}>
          <span style={{fontSize:8,color:'var(--c-text-300)',fontFamily:'var(--font-ui)'}}>Menos</span>
          {['var(--c-base-2)','rgba(212,165,165,0.30)','rgba(212,165,165,0.60)','rgba(212,165,165,0.85)','rgba(212,165,165,1)'].map((clr,i)=>(
            <div key={i} style={{width:11,height:11,borderRadius:2,background:clr}}/>
          ))}
          <span style={{fontSize:8,color:'var(--c-text-300)',fontFamily:'var(--font-ui)'}}>Mais</span>
        </div>
      </div>
    </div>
  )
}

/* ─── MAIN PAGE ──────────────────────────────────────────────────── */
const CATEGORIES = [
  { key:'todos',   label:'Todos' },
  { key:'saude',   label:'Saúde' },
  { key:'treinos', label:'Treinos' },
  { key:'habitos', label:'Hábitos' },
  { key:'diario',  label:'Diário' },
]

export default function Jornada({ userId }) {
  const [view, setView]     = useState('timeline')  // 'timeline' | 'anual'
  const [cat, setCat]       = useState('todos')
  const [events, setEvents] = useState([])
  const [tracking365, setTracking365] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage]     = useState(0)
  const PAGE_SIZE = 40

  const load = useCallback(async () => {
    if(!userId) return
    setLoading(true)
    const d365 = daysAgo(365)
    const [
      {data:weights},{data:consultations},{data:labResults},
      {data:cycleEntries},{data:fivStages},{data:diaryEntries},
      {data:workoutLogs},{data:tracking},
    ] = await Promise.all([
      supabase.from('physical_metrics').select('weight,date').eq('user_id',userId).gte('date',d365).order('date',{ascending:false}),
      supabase.from('health_consultations').select('*').eq('user_id',userId).order('date',{ascending:false}),
      supabase.from('lab_results').select('*').eq('user_id',userId).order('date',{ascending:false}).limit(100),
      supabase.from('cycle_entries').select('*').eq('user_id',userId).gte('date',d365).order('date',{ascending:false}),
      supabase.from('vitta_fiv_stages').select('*').eq('user_id',userId).not('start_date','is',null).order('start_date',{ascending:false}),
      supabase.from('diary_entries').select('*').eq('user_id',userId).order('date',{ascending:false}).limit(100),
      supabase.from('fitness_workout_logs').select('date,plan_name,exercise_name,load,reps').eq('user_id',userId).gte('date',d365).order('date',{ascending:false}),
      supabase.from('daily_tracking').select('*').eq('user_id',userId).gte('date',d365).order('date',{ascending:false}),
    ])

    setTracking365(tracking||[])

    const ev=[]
    for(const w of weights||[])                if(w.weight) ev.push({date:w.date,type:'peso',cat:'saude',data:w})
    for(const c of consultations||[])          ev.push({date:c.date,type:'consulta',cat:'saude',data:c})
    for(const l of labResults||[])             if(l.date) ev.push({date:l.date,type:'exame',cat:'saude',data:l})
    for(const s of fivStages||[])              if(s.start_date) ev.push({date:s.start_date,type:'fiv',cat:'saude',data:s})

    // Cycle entries grouped by date
    const cycleDates=[...new Set((cycleEntries||[]).map(e=>e.date))]
    for(const d of cycleDates){const dayE=(cycleEntries||[]).filter(e=>e.date===d);ev.push({date:d,type:'ciclo',cat:'saude',data:dayE})}

    // Diary entries
    for(const d of diaryEntries||[])           ev.push({date:d.date,type:'diario',cat:'diario',data:d})

    // Workout logs grouped by date
    const wkDates=[...new Set((workoutLogs||[]).map(l=>l.date))]
    for(const d of wkDates){const dl=(workoutLogs||[]).filter(l=>l.date===d);ev.push({date:d,type:'treino',cat:'treinos',data:dl})}

    // Daily habits (water, sleep — only if has data)
    for(const t of tracking||[]){
      if(t.water_ml>0||t.sleep_hours>0)
        ev.push({date:t.date,type:'habitos',cat:'habitos',data:t})
    }

    ev.sort((a,b)=>b.date.localeCompare(a.date))
    setEvents(ev)
    setLoading(false)
  },[userId])

  useEffect(()=>{load()},[load])

  const filtered = cat==='todos' ? events : events.filter(e=>e.cat===cat)

  // Group by date
  const grouped={}
  for(const ev of filtered){if(!grouped[ev.date])grouped[ev.date]=[];grouped[ev.date].push(ev)}
  const dates=Object.keys(grouped).sort((a,b)=>b.localeCompare(a))
  const paginatedDates = dates.slice(0, (page+1)*PAGE_SIZE)
  const hasMore = dates.length > paginatedDates.length

  return (
    <div style={{position:'relative',minHeight:'100%',paddingBottom:24}}>
      {/* Header */}
      <div style={{padding:'52px var(--page-pad-x) 0',position:'relative',overflow:'hidden',marginBottom:20}}>
        <PageBotanical/>
        <div style={{position:'relative',zIndex:1}}>
          <h1 style={{fontFamily:'var(--font-display)',fontSize:'var(--text-2xl)',fontWeight:500,color:'var(--c-text-900)',letterSpacing:'-0.02em',marginBottom:4}}>Minha Jornada</h1>
          <p style={{fontFamily:'var(--font-editorial)',fontSize:16,color:'var(--c-text-500)',fontStyle:'italic'}}>Toda a sua história de saúde e bem-estar</p>
        </div>
      </div>

      {/* View toggle */}
      <div style={{padding:'0 var(--page-pad-x)',marginBottom:16,display:'flex',gap:8}}>
        <button onClick={()=>setView('timeline')} style={{display:'flex',alignItems:'center',gap:5,padding:'7px 14px',borderRadius:'var(--r-full)',border:'none',cursor:'pointer',background:view==='timeline'?'var(--c-text-900)':'var(--c-base-2)',color:view==='timeline'?'var(--c-base-0)':'var(--c-text-500)',fontFamily:'var(--font-ui)',fontSize:12,fontWeight:500}}>
          <ChevronLeft size={12}/><ChevronRight size={12}/> Timeline
        </button>
        <button onClick={()=>setView('anual')} style={{display:'flex',alignItems:'center',gap:5,padding:'7px 14px',borderRadius:'var(--r-full)',border:'none',cursor:'pointer',background:view==='anual'?'var(--c-text-900)':'var(--c-base-2)',color:view==='anual'?'var(--c-base-0)':'var(--c-text-500)',fontFamily:'var(--font-ui)',fontSize:12,fontWeight:500}}>
          <LayoutGrid size={12}/> Vista anual
        </button>
      </div>

      {view==='anual' ? (
        <div style={{padding:'0 var(--page-pad-x)'}}>
          <div className="card" style={{padding:16}}>
            <div style={{fontFamily:'var(--font-ui)',fontSize:11,color:'var(--c-text-300)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:12}}>{new Date().getFullYear()} · Consistência diária</div>
            {loading ? <div style={{height:120}} className="loading-shimmer"/> : <AnnualView tracking={tracking365}/>}
          </div>
        </div>
      ) : (
        <>
          {/* Category filters */}
          <div style={{padding:'0 var(--page-pad-x)',marginBottom:16,display:'flex',gap:8,overflowX:'auto',paddingBottom:2}}>
            {CATEGORIES.map(({key,label})=>(
              <button key={key} onClick={()=>{setCat(key);setPage(0)}} style={{
                padding:'7px 14px',borderRadius:'var(--r-full)',border:'none',cursor:'pointer',flexShrink:0,
                background:cat===key?'var(--c-text-900)':'var(--c-base-2)',
                color:cat===key?'var(--c-base-0)':'var(--c-text-500)',
                fontFamily:'var(--font-ui)',fontSize:12,fontWeight:cat===key?500:400,
              }}>{label}</button>
            ))}
          </div>

          {/* Timeline */}
          <div style={{padding:'0 var(--page-pad-x)'}}>
            {loading&&<div style={{height:200}} className="loading-shimmer card"/>}
            {!loading&&filtered.length===0&&(
              <div className="empty-state">
                <Calendar size={32} style={{color:'var(--c-text-100)'}}/>
                <p className="empty-state-text">Nenhum registro encontrado</p>
              </div>
            )}
            {!loading&&paginatedDates.map(date=>{
              const month=date.slice(0,7)
              const prevDate=paginatedDates[paginatedDates.indexOf(date)-1]
              const showMonth=!prevDate||prevDate.slice(0,7)!==month
              return (
                <div key={date}>
                  {showMonth&&(
                    <div style={{fontFamily:'var(--font-display)',fontSize:15,fontWeight:500,color:'var(--c-text-700)',marginBottom:10,marginTop:showMonth&&paginatedDates.indexOf(date)>0?20:0}}>
                      {fmtMonth(date)}
                    </div>
                  )}
                  <div className="card" style={{padding:'0 16px',marginBottom:10}}>
                    <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 0 8px',borderBottom:'1px solid var(--c-border-light)'}}>
                      <div style={{fontFamily:'var(--font-display)',fontSize:18,fontWeight:500,color:'var(--c-text-900)',lineHeight:1}}>{new Date(date+'T12:00:00').getDate()}</div>
                      <div style={{fontSize:11,color:'var(--c-text-300)',fontFamily:'var(--font-ui)',textTransform:'uppercase',letterSpacing:'.04em'}}>{new Date(date+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'long'})}</div>
                    </div>
                    {grouped[date].map((ev,i)=><EventCard key={i} event={ev}/>)}
                  </div>
                </div>
              )
            })}
            {hasMore&&(
              <button onClick={()=>setPage(p=>p+1)} className="btn-ghost" style={{width:'100%',padding:16,textAlign:'center',color:'var(--c-text-400)'}}>
                Carregar mais registros
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
