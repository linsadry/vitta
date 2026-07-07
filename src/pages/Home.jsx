import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Scale, Droplets, Moon, Dumbbell, UtensilsCrossed, BookOpen,
  FlaskConical, CalendarDays, X, Check, ChevronRight, ChevronLeft, Heart, Activity, Settings
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { HomeHeaderBotanical } from '../components/BotanicalBg'
import {
  today, daysAgo, last35Days, greeting, dailyPhrase,
  formatDate, formatDateShort, fmtWeight, fmtSleep, fmtWater
} from '../lib/utils'

/* ─── CYCLE PREDICTION ──────────────────────────────────────────── */
function predictCycle(entries) {
  const mens = [...(entries||[]).filter(e=>e.type==='menstruacao')].sort((a,b)=>a.date.localeCompare(b.date))
  if (!mens.length) return {}
  const starts=[];let prev=null
  for(const e of mens){const d=new Date(e.date+'T12:00:00');if(!prev||(d-prev)>2*86400000)starts.push(e.date);prev=d}
  let cycleLen=28
  if(starts.length>=2){const g=[];for(let i=1;i<starts.length;i++){const a=new Date(starts[i-1]+'T12:00:00'),b=new Date(starts[i]+'T12:00:00');g.push(Math.round((b-a)/86400000))};cycleLen=Math.round(g.reduce((s,v)=>s+v,0)/g.length)}
  const last=starts[starts.length-1],ld=new Date(last+'T12:00:00'),now=new Date()
  const fmt=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  const nextP=new Date(ld.getTime()+cycleLen*86400000)
  const fertS=new Date(ld.getTime()+11*86400000)
  const fertE=new Date(ld.getTime()+16*86400000)
  const currentDay=Math.round((now-ld)/86400000)+1
  const phase=currentDay<=5?'Menstrual':currentDay<=11?'Folicular':currentDay<=16?'Ovulatória':currentDay<=24?'Lútea':'Pré-menstrual'
  return {currentDay,phase,nextPeriod:fmt(nextP),daysUntilNext:Math.round((nextP-now)/86400000),cycleLen}
}

/* ─── FACE ICONS (sem emoji) ─────────────────────────────────────── */
const MOOD_CFG = {
  1:{label:'Muito bem',mouth:'M6 16 Q12 21 18 16',ey:9,  color:'#C9A96E'},
  2:{label:'Bem',      mouth:'M7 16 Q12 19 17 16',ey:10, color:'#8A9E8C'},
  3:{label:'Neutra',   mouth:'M7 15 L17 15',       ey:10, color:'#B8AEA9'},
  4:{label:'Cansada',  mouth:'M7 15 Q12 12 17 15', ey:11, color:'#D4A5A5'},
  5:{label:'Difícil',  mouth:'M6 17 Q12 11 18 17', ey:10, color:'#C48E8E'},
}

function FaceIcon({ level, selected, onClick, size=30 }) {
  const c=MOOD_CFG[level]
  return (
    <button onClick={onClick} style={{
      background:selected?c.color+'1A':'transparent',
      border:`1.5px solid ${selected?c.color:'transparent'}`,
      borderRadius:10,padding:5,cursor:'pointer',
      display:'flex',flexDirection:'column',alignItems:'center',gap:3,
    }}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke={c.color} strokeWidth="1.5"/>
        <circle cx="8.5" cy={c.ey} r="1.2" fill={c.color}/>
        <circle cx="15.5" cy={c.ey} r="1.2" fill={c.color}/>
        <path d={c.mouth} stroke={c.color} strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      </svg>
      <span style={{fontSize:8,fontFamily:'var(--font-ui)',color:selected?c.color:'var(--c-text-300)',fontWeight:selected?500:400,lineHeight:1}}>{c.label}</span>
    </button>
  )
}

/* ─── DATA HOOK ─────────────────────────────────────────────────── */
function useHomeData(userId) {
  const [data,setData]=useState(null)
  const [loading,setLoading]=useState(true)

  const load = useCallback(async () => {
    if(!userId) return
    setLoading(true)
    const todayStr=today(), d35=daysAgo(35), d7=daysAgo(7), d90=daysAgo(90)
    const [
      {data:tracking},{data:weights},{data:firstW},
      {data:nextConsult},{data:nextExam},{data:fivStages},
      {data:todayWk},{data:todayNutrition},{data:todayDiary},
      {data:cycleEntries},{data:upConsults},{data:pastConsults},{data:profile},
    ] = await Promise.all([
      supabase.from('daily_tracking').select('*').eq('user_id',userId).gte('date',daysAgo(120)).order('date',{ascending:false}),
      supabase.from('physical_metrics').select('weight,date').eq('user_id',userId).order('date',{ascending:false}).limit(2),
      supabase.from('physical_metrics').select('weight,date').eq('user_id',userId).order('date').limit(1).maybeSingle(),
      supabase.from('health_consultations').select('date,specialty,doctor').eq('user_id',userId).gte('date',todayStr).order('date').limit(1).maybeSingle(),
      supabase.from('lab_results').select('category,scheduled_date,status').eq('user_id',userId).in('status',['agendado']).order('scheduled_date').limit(1).maybeSingle(),
      supabase.from('vitta_fiv_stages').select('*').eq('user_id',userId),
      supabase.from('fitness_workout_logs').select('date').eq('user_id',userId).eq('date',todayStr).limit(1).maybeSingle(),
      supabase.from('nutrition_days').select('id').eq('user_id',userId).eq('date',todayStr).maybeSingle(),
      supabase.from('diary_entries').select('id,mood,date').eq('user_id',userId).eq('date',todayStr).maybeSingle(),
      supabase.from('cycle_entries').select('date,type').eq('user_id',userId).gte('date',d90).order('date'),
      supabase.from('health_consultations').select('*').eq('user_id',userId).gte('date',todayStr).order('date').limit(4),
      supabase.from('health_consultations').select('date').eq('user_id',userId).gte('date',d35).lt('date',todayStr).order('date'),
      supabase.from('vitta_profile').select('*').eq('user_id',userId).maybeSingle(),
    ])

    const todayTracking=(tracking||[]).find(d=>d.date===todayStr)
    const currentW=weights?.[0]?.weight
    const prevW=weights?.[1]?.weight
    const weightDelta=currentW&&prevW?(parseFloat(currentW)-parseFloat(prevW)).toFixed(1):null
    const weightStart=currentW&&firstW?.weight?(parseFloat(currentW)-parseFloat(firstW.weight)).toFixed(1):null
    const cycle=predictCycle(cycleEntries)
    const fivList=fivStages||[]
    const activeFiv=fivList.find(s=>s.status==='ativo')
    const doneCount=fivList.filter(s=>s.status==='concluido').length

    const cycleByDate={}
    for(const e of cycleEntries||[]){if(!cycleByDate[e.date])cycleByDate[e.date]=[];cycleByDate[e.date].push(e)}
    const consultDateSet=new Set([...(pastConsults||[]).map(x=>x.date),...(upConsults||[]).map(x=>x.date)])

    setData({
      tracking:tracking||[], todayTracking,
      currentW, prevW, weightDelta, weightStart, weightDate:weights?.[0]?.date,
      nextConsult, nextExam,
      fivList, activeFiv, doneCount,
      todayDiaryId:todayDiary?.id,
      todayMood:todayTracking?.mood!=null?parseInt(todayTracking.mood):(todayDiary?.mood?parseInt(todayDiary.mood):null),
      todayPeso:weights?.[0]?.date===todayStr,
      todayAgua:(todayTracking?.water_ml||0)>0,
      todaySono:(todayTracking?.sleep_hours||0)>0,
      todayTreino:!!todayWk,
      todayRefeicao:!!todayNutrition,
      todaySkincare:(todayTracking?.skincare_am?1:0)+(todayTracking?.skincare_pm?1:0),
      skincare_am:!!todayTracking?.skincare_am,
      skincare_pm:!!todayTracking?.skincare_pm,
      cycle, cycleByDate, consultDateSet,
      upConsults:upConsults||[],
      profile: profile||{},
      displayName: profile?.display_name||'Adriana',
    })
    setLoading(false)
  },[userId])

  useEffect(()=>{load()},[load])
  return {data,loading,reload:load}
}

/* ─── CONSISTENCY HEATMAP (enhanced) ──────────────────────────── */
function ConsistencyCalendar({ tracking, cycleByDate, consultDateSet, onDayClick, year, month, onPrevMonth, onNextMonth }) {
  const todayStr = today()
  const byDate = Object.fromEntries((tracking||[]).map(t=>[t.date,t]))
  const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

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

  // Streak (always counts back from today regardless of viewed month)
  const streak = (() => {
    let count=0, curr=todayStr
    while(true){
      const r=byDate[curr]
      if(!r || score(curr)===0) break
      count++
      const d=new Date(curr+'T12:00:00'); d.setDate(d.getDate()-1)
      curr=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    }
    return count
  })()

  const getDots = (dt) => {
    const dots=[]
    const r=byDate[dt]
    if(r?.water_ml>0)          dots.push('#6BA8D4')
    if(r?.strength_done||r?.aerobic_done) dots.push('#8A9E8C')
    if(r?.mood)                 dots.push('#C9A96E')
    if((cycleByDate||{})[dt]?.some(e=>e.type==='menstruacao')) dots.push('#D4A5A5')
    if((consultDateSet||new Set()).has(dt)) dots.push('#9B8FC4')
    return dots.slice(0,4)
  }

  // Build month grid (timezone-safe)
  const dim = new Date(year, month+1, 0).getDate()
  const firstDOW = (new Date(year, month, 1).getDay()+6)%7  // Mon=0
  const dayStr = (d) => `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
  const cells = [...Array(firstDOW).fill(null), ...Array.from({length:dim},(_,i)=>i+1)]
  const isCurrentMonth = year===new Date().getFullYear() && month===new Date().getMonth()
  const isFutureMonth = new Date(year, month, 1) > new Date(new Date().getFullYear(), new Date().getMonth(), 1)

  return (
    <div>
      {/* Streak counter */}
      {streak>0 && (
        <div style={{marginBottom:12,padding:'10px 14px',background:'rgba(212,165,165,0.1)',borderRadius:'var(--r-md)',display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:6,height:6,borderRadius:'50%',background:'var(--c-rose)',flexShrink:0}}/>
          <span style={{fontFamily:'var(--font-editorial)',fontSize:14,color:'var(--c-text-700)',fontStyle:'italic'}}>
            {streak} {streak===1?'dia consecutivo':'dias consecutivos'} registrando sua jornada
          </span>
        </div>
      )}

      {/* Month navigation */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
        <button onClick={onPrevMonth} style={{background:'none',border:'none',cursor:'pointer',padding:6,color:'var(--c-text-400)'}}>
          <ChevronLeft size={18} strokeWidth={1.8}/>
        </button>
        <span style={{fontFamily:'var(--font-display)',fontSize:16,fontWeight:500,color:'var(--c-text-900)'}}>{MONTHS[month]} {year}</span>
        <button onClick={isFutureMonth?undefined:onNextMonth} disabled={isCurrentMonth} style={{background:'none',border:'none',cursor:isCurrentMonth?'default':'pointer',padding:6,color:isCurrentMonth?'var(--c-text-100)':'var(--c-text-400)',opacity:isCurrentMonth?0.4:1}}>
          <ChevronRight size={18} strokeWidth={1.8}/>
        </button>
      </div>

      {/* DOW headers */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:4,marginBottom:5}}>
        {['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'].map(d=>(
          <div key={d} style={{textAlign:'center',fontSize:9,color:'var(--c-text-300)',fontFamily:'var(--font-ui)'}}>{d}</div>
        ))}
      </div>

      {/* Day grid */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:4}}>
        {cells.map((day,i)=>{
          if(!day) return <div key={`e${i}`}/>
          const dt=dayStr(day), s=score(dt), isT=dt===todayStr, isFuture=dt>todayStr
          const numC=s>=4?'rgba(255,255,255,.7)':'var(--c-text-400)'
          const dots=getDots(dt)
          return(
            <div key={dt} onClick={()=>!isFuture&&onDayClick(dt)} style={{
              aspectRatio:'1',borderRadius:6,background:isFuture?'transparent':bg(s),
              border:isFuture?'1px dashed var(--c-border-light)':'none',
              display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
              cursor:isFuture?'default':'pointer',gap:2,
              boxShadow:isT?'0 0 0 1.5px var(--c-rose-mid)':'none',opacity:isFuture?0.4:1,
            }}>
              <span style={{fontFamily:'var(--font-ui)',fontSize:11,fontWeight:isT?600:400,color:isFuture?'var(--c-text-200)':numC,lineHeight:1}}>{day}</span>
              {dots.length>0&&(
                <div style={{display:'flex',gap:2}}>
                  {dots.map((clr,j)=><div key={j} style={{width:3,height:3,borderRadius:'50%',background:clr,opacity:s>=4?0.9:0.75}}/>)}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div style={{display:'flex',alignItems:'center',gap:6,marginTop:12,justifyContent:'flex-end',flexWrap:'wrap'}}>
        {['Muito leve','Leve','Moderado','Consistente','Completo'].map((lbl,i)=>(
          <div key={lbl} style={{display:'flex',alignItems:'center',gap:3}}>
            <div style={{width:10,height:10,borderRadius:2,background:['var(--c-base-2)','rgba(212,165,165,0.30)','rgba(212,165,165,0.60)','rgba(212,165,165,0.80)','rgba(212,165,165,1)'][i],border:i===0?'1px solid var(--c-border)':'none'}}/>
            <span style={{fontSize:8,color:'var(--c-text-300)',fontFamily:'var(--font-ui)'}}>{lbl}</span>
          </div>
        ))}
      </div>

      {/* Dot legend */}
      <div style={{display:'flex',gap:10,marginTop:8,flexWrap:'wrap'}}>
        {[['#6BA8D4','Água'],['#8A9E8C','Treino'],['#C9A96E','Humor'],['#D4A5A5','Ciclo'],['#9B8FC4','Consulta']].map(([clr,lbl])=>(
          <div key={lbl} style={{display:'flex',alignItems:'center',gap:4}}>
            <div style={{width:6,height:6,borderRadius:'50%',background:clr}}/>
            <span style={{fontSize:8,color:'var(--c-text-300)',fontFamily:'var(--font-ui)'}}>{lbl}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── HEALTH SUMMARY GRID ───────────────────────────────────────── */
function HealthSummaryGrid({ data, navigate }) {
  if (!data) return null
  const {currentW,weightDelta,weightStart,cycle,nextConsult,nextExam,activeFiv,doneCount} = data

  const Cell = ({label,value,sub,accent,onClick}) => (
    <div onClick={onClick} style={{
      padding:'14px 14px 12px',cursor:onClick?'pointer':'default',
    }}>
      <div style={{fontSize:9,color:'var(--c-text-300)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:5,fontFamily:'var(--font-ui)'}}>{label}</div>
      <div style={{fontFamily:'var(--font-display)',fontSize:19,fontWeight:500,color:'var(--c-text-900)',lineHeight:1.1,marginBottom:sub?3:0}}>{value||'—'}</div>
      {sub&&<div style={{fontSize:11,color:accent||'var(--c-text-400)',fontFamily:'var(--font-ui)',lineHeight:1.3}}>{sub}</div>}
    </div>
  )

  const wDeltaStr = weightDelta ? `${parseFloat(weightDelta)>0?'+':''}${weightDelta} kg desde último` : weightStart ? `${parseFloat(weightStart)>0?'+':''}${weightStart} kg desde início` : null

  return (
    <div className="card" style={{margin:'0 var(--page-pad-x)',overflow:'hidden'}}>
      {/* Row 1: Peso + Ciclo */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',borderBottom:'1px solid var(--c-border-light)'}}>
        <div style={{borderRight:'1px solid var(--c-border-light)'}}>
          <Cell label="Peso" value={currentW?`${parseFloat(currentW).toFixed(1)} kg`:null} sub={wDeltaStr} accent={weightDelta&&parseFloat(weightDelta)<0?'var(--c-sage)':'var(--c-rose-mid)'} onClick={()=>navigate('/evolucao')}/>
        </div>
        <div>
          <Cell label="Ciclo" value={cycle?.currentDay?`Dia ${cycle.currentDay}`:null} sub={cycle?.phase||(cycle?.currentDay?null:'Sem dados')} onClick={()=>navigate('/ciclo')}/>
        </div>
      </div>
      {/* Row 2: Próxima consulta */}
      <div style={{borderBottom:'1px solid var(--c-border-light)'}}>
        <Cell label="Próxima consulta"
          value={nextConsult?.specialty||'Nenhuma agendada'}
          sub={nextConsult?`${formatDateShort(nextConsult.date)}${nextConsult.doctor?' · '+nextConsult.doctor:''}`:null}
          onClick={()=>navigate('/saude')}/>
      </div>
      {/* Row 3: Próximo exame */}
      <div style={{borderBottom:activeFiv?'1px solid var(--c-border-light)':'none'}}>
        <Cell label="Próximo exame"
          value={nextExam?.category||'Nenhum agendado'}
          sub={nextExam?.scheduled_date?formatDateShort(nextExam.scheduled_date):null}
          onClick={()=>navigate('/saude')}/>
      </div>
      {/* Row 4: FIV (if active) */}
      {activeFiv&&(
        <Cell label="FIV" value={activeFiv.stage_label} sub={`Etapa ${doneCount+1} de 8`} onClick={()=>navigate('/fiv')}/>
      )}
    </div>
  )
}

/* ─── JORNADA REPRODUTIVA CARD ──────────────────────────────────── */
function JornadaFivCard({ data, navigate }) {
  if (!data?.activeFiv) return null
  const {activeFiv, doneCount, fivList} = data
  const FIV_ORDER=['preparacao','estimulacao','coleta','fertilizacao','cultivo','transferencia','beta','acompanhamento']
  const activeIdx=FIV_ORDER.indexOf(activeFiv.stage_key)
  const nextStage=fivList?.find(s=>s.stage_key===FIV_ORDER[activeIdx+1])
  const mainMed=activeFiv.medications?.[0]
  const pct=Math.round((doneCount/8)*100)

  return (
    <div style={{margin:'0 var(--page-pad-x)'}}>
      <div onClick={()=>navigate('/fiv')} style={{
        background:'linear-gradient(135deg,rgba(212,165,165,0.08),rgba(196,184,212,0.12))',
        border:'1px solid rgba(196,184,212,0.35)',
        borderRadius:'var(--r-lg)',padding:'18px 18px 16px',cursor:'pointer',
      }}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
          <span style={{fontFamily:'var(--font-display)',fontSize:17,fontWeight:500,color:'var(--c-text-900)'}}>Jornada Reprodutiva</span>
          <ChevronRight size={16} style={{color:'var(--c-text-300)'}}/>
        </div>
        <div style={{fontFamily:'var(--font-display)',fontSize:21,fontWeight:500,color:'var(--c-text-900)',marginBottom:3}}>{activeFiv.stage_label}</div>
        {nextStage&&<div style={{fontSize:12,color:'var(--c-text-500)',fontFamily:'var(--font-ui)',marginBottom:3}}>Próxima: {nextStage.stage_label}</div>}
        {mainMed&&<div style={{fontSize:12,color:'var(--c-text-400)',fontFamily:'var(--font-ui)',marginBottom:10}}>Medicação: {mainMed.name}{mainMed.dose&&` ${mainMed.dose}`}</div>}
        <div style={{height:4,background:'var(--c-lavender-light)',borderRadius:2,marginBottom:4}}>
          <div style={{height:'100%',width:`${pct}%`,background:'var(--c-lavender)',borderRadius:2,transition:'width .5s ease'}}/>
        </div>
        <div style={{fontSize:10,color:'var(--c-text-300)',fontFamily:'var(--font-ui)'}}>{doneCount} de 8 etapas concluídas</div>
      </div>
    </div>
  )
}

/* ─── PENDÊNCIAS DE HOJE ─────────────────────────────────────────── */
function PendenciasHoje({ data, onAction }) {
  const ITEMS = [
    {id:'peso',       icon:Scale,           label:'Registrar peso',       done:data?.todayPeso},
    {id:'agua',       icon:Droplets,         label:'Registrar água',        done:data?.todayAgua},
    {id:'sono',       icon:Moon,             label:'Registrar sono',        done:data?.todaySono},
    {id:'treino',     icon:Dumbbell,         label:'Registrar treino',      done:data?.todayTreino},
    {id:'refeicao',   icon:UtensilsCrossed,  label:'Registrar alimentação', done:data?.todayRefeicao},
    {id:'humor',      icon:Heart,            label:'Registrar humor',       done:data?.todayMood!=null},
    {id:'skincare',   icon:Activity,         label:'Skincare',              done:(data?.todaySkincare||0)>=2, skincare:true, count:data?.todaySkincare||0},
  ]
  const pending = ITEMS.filter(i=>!i.done)
  const done    = ITEMS.filter(i=>i.done)

  return (
    <div>
      {pending.map((item,idx)=>{
        const {icon:Icon}=item
        return (
          <div key={item.id} onClick={()=>onAction(item.id)} style={{
            display:'flex',alignItems:'center',gap:14,padding:'12px 0',
            borderBottom:idx<pending.length-1?'1px solid var(--c-border-light)':'none',
            cursor:'pointer',
          }}>
            <div style={{width:34,height:34,borderRadius:9,background:'var(--c-base-1)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <Icon size={16} strokeWidth={1.8} style={{color:'var(--c-text-400)'}}/>
            </div>
            <span style={{flex:1,fontFamily:'var(--font-ui)',fontSize:14,color:'var(--c-text-700)'}}>{item.label}</span>
            <span style={{fontSize:11,color:'var(--c-text-300)',fontFamily:'var(--font-ui)'}}>+</span>
          </div>
        )
      })}
      {done.length>0&&pending.length>0&&<div style={{height:1,background:'var(--c-border-light)',margin:'4px 0'}}/>}
      {done.map((item,idx)=>{
        const {icon:Icon}=item
        return (
          <div key={item.id} style={{
            display:'flex',alignItems:'center',gap:14,padding:'10px 0',
            borderBottom:idx<done.length-1?'1px solid var(--c-border-light)':'none',
            opacity:0.45,
          }}>
            <div style={{width:34,height:34,borderRadius:9,background:'var(--c-sage-faint)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <Check size={14} strokeWidth={2.5} style={{color:'var(--c-sage)'}}/>
            </div>
            <span style={{flex:1,fontFamily:'var(--font-ui)',fontSize:13,color:'var(--c-text-500)',textDecoration:'line-through'}}>{item.label}</span>
          </div>
        )
      })}
    </div>
  )
}

/* ─── DAY DETAIL SHEET ───────────────────────────────────────────── */
function DayDetailSheet({ date, userId, onClose, onReload }) {
  const [dayData, setDayData]     = useState(null)
  const [adding, setAdding]       = useState(null)
  const [addVal, setAddVal]       = useState('')
  const [moodSel, setMoodSel]     = useState(null)
  const [trainType, setTrainType] = useState('Aeróbico')
  const [trainDur, setTrainDur]   = useState('')
  const [saving, setSaving]       = useState(false)
  const [rk, setRk]               = useState(0)
  const [skincareAm, setSkincareAm] = useState(false)
const [skincarePm, setSkincarePm] = useState(false)

  const MOOD_L    = { 1:'Muito bem', 2:'Bem', 3:'Neutra', 4:'Cansada', 5:'Difícil' }
  const TRAIN_T   = ['Força','Aeróbico','Yoga','Pilates','Caminhada','Outro']
  const NUM_CFG   = {
    peso: { label:'Peso (kg)', ph:'65,0', field:'weight',      table:'physical_metrics', acc:false },
    agua: { label:'Água (ml)', ph:'500',  field:'water_ml',    table:'daily_tracking',   acc:true  },
    sono: { label:'Sono (h)',  ph:'7,5',  field:'sleep_hours', table:'daily_tracking',   acc:false },
  }

  useEffect(() => {
    if (!date || !userId) return
    setDayData(null)
    const load = async () => {
      const [{ data:dt },{ data:diary },{ data:wkLogs },{ data:nutrition },{ data:weight }] = await Promise.all([
        supabase.from('daily_tracking').select('*').eq('user_id',userId).eq('date',date).maybeSingle(),
        supabase.from('diary_entries').select('mood,content,id').eq('user_id',userId).eq('date',date).maybeSingle(),
        supabase.from('fitness_workout_logs').select('exercise_name,load,reps').eq('user_id',userId).eq('date',date).limit(10),
        supabase.from('nutrition_days').select('kcal,protein_g,carbs_g,fat_g,meals_count,diet_escape,diet_escape_note,alcohol,alcohol_note').eq('user_id',userId).eq('date',date).maybeSingle(),
        supabase.from('physical_metrics').select('weight').eq('user_id',userId).eq('date',date).maybeSingle(),
      ])
      setDayData({ dt, diary, wkLogs:wkLogs||[], nutrition, weight })
    }
    load()
  }, [date, userId, rk])

  const startAdding = (type) => {
  setAdding(type); setAddVal(''); setMoodSel(null); setTrainType('Aeróbico'); setTrainDur('')
  setSkincareAm(!!dayData?.dt?.skincare_am); setSkincarePm(!!dayData?.dt?.skincare_pm)
}

  const afterSave = () => {
    setAdding(null); setSaving(false); setRk(k=>k+1); onReload?.()
  }

  const saveNumeric = async () => {
    const cfg = NUM_CFG[adding]
    if (!cfg || saving) return
    const n = parseFloat(addVal.replace(',','.'))
    if (isNaN(n)) return
    setSaving(true)
    if (cfg.table === 'physical_metrics') {
      await supabase.from('physical_metrics').insert({ user_id:userId, date, [cfg.field]:n })
    } else {
      const { data:ex } = await supabase.from('daily_tracking').select('id,'+cfg.field).eq('user_id',userId).eq('date',date).maybeSingle()
      if (ex) await supabase.from('daily_tracking').update({ [cfg.field]: cfg.acc ? (ex[cfg.field]||0)+n : n }).eq('id',ex.id)
      else     await supabase.from('daily_tracking').insert({ user_id:userId, date, [cfg.field]:n })
    }
    afterSave()
  }

  const saveMoodDate = async () => {
    if (!moodSel || saving) return
    setSaving(true)
    const mv = String(moodSel)
    const { data:de } = await supabase.from('diary_entries').select('id').eq('user_id',userId).eq('date',date).maybeSingle()
    if (de) await supabase.from('diary_entries').update({ mood:mv }).eq('id',de.id)
    else     await supabase.from('diary_entries').insert({ user_id:userId, date, mood:mv, content:'' })
    const { data:dt } = await supabase.from('daily_tracking').select('id').eq('user_id',userId).eq('date',date).maybeSingle()
    if (dt) await supabase.from('daily_tracking').update({ mood:mv }).eq('id',dt.id)
    else     await supabase.from('daily_tracking').insert({ user_id:userId, date, mood:mv })
    afterSave()
  }

  const saveTreino = async () => {
    if (saving) return
    setSaving(true)
    const label = trainDur ? `${trainType} · ${trainDur} min` : trainType
    await supabase.from('fitness_workout_logs').insert({
      user_id:userId, date, exercise_id:null, exercise_name:label, set_number:1, reps:null, load:null,
    })
    afterSave()
  }

  const saveSkincare = async () => {
  if (saving) return
  setSaving(true)
  const { data:ex } = await supabase.from('daily_tracking').select('id').eq('user_id',userId).eq('date',date).maybeSingle()
  if (ex) await supabase.from('daily_tracking').update({ skincare_am:skincareAm, skincare_pm:skincarePm }).eq('id',ex.id)
  else     await supabase.from('daily_tracking').insert({ user_id:userId, date, skincare_am:skincareAm, skincare_pm:skincarePm })
  afterSave()
}

  const dt = dayData?.dt
  const hasAny = dayData && (dt || dayData.diary || dayData.wkLogs?.length || dayData.nutrition || dayData.weight)

  const btnCancel = {
    flex:1, padding:'11px 0', borderRadius:'var(--r-md)',
    border:'1.5px solid var(--c-border)', background:'none',
    fontFamily:'var(--font-ui)', fontSize:13, color:'var(--c-text-500)', cursor:'pointer',
  }

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={e=>e.stopPropagation()}>
        <div className="sheet-handle"/>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
          <h2 style={{fontFamily:'var(--font-display)',fontSize:20,fontWeight:500,color:'var(--c-text-900)',margin:0}}>
            {formatDate(date)}
          </h2>
          <button onClick={onClose} className="btn-ghost" style={{padding:8}}><X size={18} strokeWidth={1.8}/></button>
        </div>

        {!dayData && <div style={{height:80}} className="loading-shimmer card"/>}

        {dayData && (
          <div style={{display:'flex',flexDirection:'column',gap:10}}>

            {/* ── Data atual do dia ── */}
            {dayData.weight?.weight && (
              <div className="card-inset" style={{padding:'12px 14px'}}>
                <span style={{fontSize:10,color:'var(--c-text-300)',textTransform:'uppercase',letterSpacing:'.06em'}}>Peso</span>
                <div style={{fontFamily:'var(--font-display)',fontSize:18,fontWeight:500,marginTop:3}}>
                  {parseFloat(dayData.weight.weight).toFixed(1)} kg
                </div>
              </div>
            )}

            {dt && (dt.water_ml || dt.sleep_hours || dt.mood || dt.skincare_am || dt.skincare_pm) && (
              <div className="card-inset" style={{padding:'12px 14px'}}>
                <span style={{fontSize:10,color:'var(--c-text-300)',textTransform:'uppercase',letterSpacing:'.06em'}}>Hábitos</span>
                <div style={{display:'flex',gap:16,marginTop:6,flexWrap:'wrap'}}>
                  {dt.water_ml>0 && <span style={{fontSize:13,color:'var(--c-text-700)',fontFamily:'var(--font-ui)'}}>Água {fmtWater(dt.water_ml)}</span>}
                  {dt.sleep_hours>0 && <span style={{fontSize:13,color:'var(--c-text-700)',fontFamily:'var(--font-ui)'}}>Sono {fmtSleep(dt.sleep_hours)}</span>}
                  {dt.mood && <span style={{fontSize:13,color:'var(--c-text-700)',fontFamily:'var(--font-ui)'}}>Humor: {MOOD_L[parseInt(dt.mood)]||dt.mood}</span>}
                {(dt.skincare_am||dt.skincare_pm) && <span style={{fontSize:13,color:'var(--c-text-700)',fontFamily:'var(--font-ui)'}}>Skincare: {dt.skincare_am&&dt.skincare_pm?'Manhã e noite':dt.skincare_am?'Manhã':'Noite'}</span>}
                </div>
              </div>
            )}

            {dayData.wkLogs?.length > 0 && (
              <div className="card-inset" style={{padding:'12px 14px'}}>
                <span style={{fontSize:10,color:'var(--c-text-300)',textTransform:'uppercase',letterSpacing:'.06em'}}>Treino</span>
                {dayData.wkLogs.map((l,i) => (
                  <div key={i} style={{fontSize:13,color:'var(--c-text-700)',fontFamily:'var(--font-ui)',marginTop:4}}>
                    {l.exercise_name}{l.load?` · ${l.load}kg`:''}{l.reps?` × ${l.reps}`:''}
                  </div>
                ))}
              </div>
            )}

            {dayData.nutrition && (
              <div className="card-inset" style={{padding:'12px 14px'}}>
                <span style={{fontSize:10,color:'var(--c-text-300)',textTransform:'uppercase',letterSpacing:'.06em'}}>Alimentação</span>
                <div style={{display:'flex',gap:16,marginTop:6,flexWrap:'wrap'}}>
                  {dayData.nutrition.kcal!=null && <span style={{fontSize:13,color:'var(--c-text-700)',fontFamily:'var(--font-ui)'}}>{Math.round(dayData.nutrition.kcal)} kcal</span>}
                  {dayData.nutrition.protein_g!=null && <span style={{fontSize:13,color:'var(--c-text-700)',fontFamily:'var(--font-ui)'}}>Prot {Math.round(dayData.nutrition.protein_g)}g</span>}
                  {dayData.nutrition.carbs_g!=null && <span style={{fontSize:13,color:'var(--c-text-700)',fontFamily:'var(--font-ui)'}}>Carb {Math.round(dayData.nutrition.carbs_g)}g</span>}
                  {dayData.nutrition.fat_g!=null && <span style={{fontSize:13,color:'var(--c-text-700)',fontFamily:'var(--font-ui)'}}>Gord {Math.round(dayData.nutrition.fat_g)}g</span>}
                  {dayData.nutrition.meals_count!=null && <span style={{fontSize:13,color:'var(--c-text-700)',fontFamily:'var(--font-ui)'}}>{dayData.nutrition.meals_count} refeições</span>}
                </div>
                {dayData.nutrition.diet_escape && (
                  <div style={{fontSize:12,color:'var(--c-rose-mid)',fontFamily:'var(--font-ui)',marginTop:6}}>
                    Escapada da dieta{dayData.nutrition.diet_escape_note?`: ${dayData.nutrition.diet_escape_note}`:''}
                  </div>
                )}
                {dayData.nutrition.alcohol && (
                  <div style={{fontSize:12,color:'var(--c-rose-mid)',fontFamily:'var(--font-ui)',marginTop:4}}>
                    Bebida alcoólica{dayData.nutrition.alcohol_note?`: ${dayData.nutrition.alcohol_note}`:''}
                  </div>
                )}
              </div>
            )}

            {dayData.diary?.content && (
              <div className="card-inset" style={{padding:'12px 14px'}}>
                <span style={{fontSize:10,color:'var(--c-text-300)',textTransform:'uppercase',letterSpacing:'.06em'}}>Diário</span>
                <p style={{fontFamily:'var(--font-editorial)',fontSize:14,color:'var(--c-text-700)',fontStyle:'italic',marginTop:4,lineHeight:1.5}}>
                  {dayData.diary.content}
                </p>
              </div>
            )}

            {!hasAny && !adding && (
              <p style={{fontFamily:'var(--font-editorial)',fontSize:15,color:'var(--c-text-300)',fontStyle:'italic',textAlign:'center',padding:'16px 0'}}>
                Nenhum registro para este dia
              </p>
            )}

            {/* ── Formulário de adição ── */}
            {adding && (
              <div style={{borderTop:'1px solid var(--c-border-light)',paddingTop:16}}>

                {/* Peso / Água / Sono */}
                {NUM_CFG[adding] && (
                  <>
                    <p style={{fontSize:11,color:'var(--c-text-300)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:12}}>
                      {NUM_CFG[adding].label}
                    </p>
                    <input className="input-field" type="text" inputMode="decimal"
                      placeholder={NUM_CFG[adding].ph} value={addVal}
                      onChange={e=>setAddVal(e.target.value)}
                      style={{textAlign:'center',fontSize:28,fontFamily:'var(--font-display)',marginBottom:14}} autoFocus/>
                    <div style={{display:'flex',gap:10}}>
                      <button onClick={()=>setAdding(null)} style={btnCancel}>Cancelar</button>
                      <button onClick={saveNumeric} disabled={!addVal||saving} className="btn-primary" style={{flex:2}}>
                        {saving?'Salvando...':'Salvar'}
                      </button>
                    </div>
                  </>
                )}

                {/* Humor */}
                {adding === 'humor' && (
                  <>
                    <p style={{fontSize:11,color:'var(--c-text-300)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:14}}>Humor</p>
                    <div style={{display:'flex',justifyContent:'space-between',gap:4,marginBottom:20}}>
                      {[1,2,3,4,5].map(n=>(
                        <FaceIcon key={n} level={n} selected={moodSel===n} onClick={()=>setMoodSel(n)} size={28}/>
                      ))}
                    </div>
                    <div style={{display:'flex',gap:10}}>
                      <button onClick={()=>setAdding(null)} style={btnCancel}>Cancelar</button>
                      <button onClick={saveMoodDate} disabled={!moodSel||saving} className="btn-primary" style={{flex:2}}>
                        {saving?'Salvando...':'Salvar humor'}
                      </button>
                    </div>
                  </>
                )}

                {/* Treino */}
                {adding === 'treino' && (
                  <>
                    <p style={{fontSize:11,color:'var(--c-text-300)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:12}}>Sessão de treino</p>
                    <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:14}}>
                      {TRAIN_T.map(t=>(
                        <button key={t} onClick={()=>setTrainType(t)} style={{
                          padding:'7px 12px',borderRadius:'var(--r-full)',
                          border:`1.5px solid ${trainType===t?'var(--c-sage)':'var(--c-border)'}`,
                          background:trainType===t?'var(--c-sage-faint)':'none',
                          color:trainType===t?'var(--c-sage)':'var(--c-text-500)',
                          fontFamily:'var(--font-ui)',fontSize:12,cursor:'pointer',
                        }}>{t}</button>
                      ))}
                    </div>
                    <label className="input-label">Duração (min)</label>
                    <input className="input-field" type="text" inputMode="numeric"
                      placeholder="45" value={trainDur} onChange={e=>setTrainDur(e.target.value)}
                      style={{textAlign:'center',fontSize:20,fontFamily:'var(--font-display)',marginBottom:14}}/>
                    <div style={{display:'flex',gap:10}}>
                      <button onClick={()=>setAdding(null)} style={btnCancel}>Cancelar</button>
                      <button onClick={saveTreino} disabled={saving} className="btn-primary" style={{flex:2}}>
                        {saving?'Salvando...':'✓ Registrar'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {adding === 'skincare' && (
  <>
    <p style={{fontSize:11,color:'var(--c-text-300)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:14}}>Skincare</p>
    <div style={{display:'flex',gap:12,marginBottom:20}}>
      {[{key:'am',label:'Manhã',val:skincareAm,set:setSkincareAm},{key:'pm',label:'Noite',val:skincarePm,set:setSkincarePm}].map(({key,label,val,set})=>(
        <button key={key} onClick={()=>set(v=>!v)} style={{
          flex:1,padding:'16px 0',borderRadius:'var(--r-lg)',border:'none',cursor:'pointer',
          background:val?'rgba(138,158,140,0.18)':'var(--c-base-1)',
          boxShadow:val?'0 0 0 1.5px var(--c-sage)':'none',
          display:'flex',flexDirection:'column',alignItems:'center',gap:8,
        }}>
          <div style={{width:32,height:32,borderRadius:'50%',background:val?'var(--c-sage)':'var(--c-base-2)',display:'flex',alignItems:'center',justifyContent:'center'}}>
            {val&&<Check size={16} strokeWidth={2.5} style={{color:'white'}}/>}
          </div>
          <span style={{fontFamily:'var(--font-ui)',fontSize:12,fontWeight:val?500:400,color:val?'var(--c-sage-deep)':'var(--c-text-500)'}}>{label}</span>
        </button>
      ))}
    </div>
    <div style={{display:'flex',gap:10}}>
      <button onClick={()=>setAdding(null)} style={btnCancel}>Cancelar</button>
      <button onClick={saveSkincare} disabled={saving} className="btn-primary" style={{flex:2}}>
        {saving?'Salvando...':'Salvar'}
      </button>
    </div>
  </>
)}
            
            {/* ── Botões de adição ── */}
            {!adding && (
              <div style={{paddingTop:12,borderTop:'1px solid var(--c-border-light)'}}>
                <p style={{fontSize:10,color:'var(--c-text-300)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:10}}>
                  Adicionar para este dia
                </p>
                <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                  {[
                    {id:'peso',label:'+ Peso'},
                    {id:'agua',label:'+ Água'},
                    {id:'sono',label:'+ Sono'},
                    {id:'humor',label:'+ Humor'},
                    {id:'skincare',label:'+ Skincare'},
                    {id:'treino',label:'+ Treino'},
                  ].map(({id,label})=>(
                    <button key={id} onClick={()=>startAdding(id)} style={{
                      padding:'7px 12px',borderRadius:'var(--r-full)',
                      border:'1.5px solid var(--c-border)',background:'none',
                      fontFamily:'var(--font-ui)',fontSize:12,color:'var(--c-text-500)',cursor:'pointer',
                    }}>{label}</button>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  )
}

/* ─── SKINCARE MODAL ─────────────────────────────────────────────── */
function SkincareModal({ userId, skincareAm, skincarePm, onClose, onSave }) {
  const [am, setAm] = useState(skincareAm)
  const [pm, setPm] = useState(skincarePm)
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    const todayStr = today()
    const {data:ex} = await supabase.from('daily_tracking').select('id').eq('user_id',userId).eq('date',todayStr).maybeSingle()
    if(ex) {
      await supabase.from('daily_tracking').update({skincare_am:am, skincare_pm:pm}).eq('id',ex.id)
    } else {
      await supabase.from('daily_tracking').insert({user_id:userId,date:todayStr,skincare_am:am,skincare_pm:pm})
    }
    onSave?.(); onClose()
  }

  const done = (am?1:0)+(pm?1:0)

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={e=>e.stopPropagation()}>
        <div className="sheet-handle"/>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
          <h2 className="sheet-title" style={{marginBottom:0}}>Skincare</h2>
          <button onClick={onClose} className="btn-ghost" style={{padding:8}}><X size={18} strokeWidth={1.8}/></button>
        </div>
        <div style={{display:'flex',gap:12,marginBottom:24}}>
          {[{key:'am',label:'Manhã',val:am,set:setAm},{key:'pm',label:'Noite',val:pm,set:setPm}].map(({key,label,val,set})=>(
            <button key={key} onClick={()=>set(v=>!v)} style={{
              flex:1,padding:'18px 0',borderRadius:'var(--r-lg)',border:'none',cursor:'pointer',
              background:val?'rgba(138,158,140,0.18)':'var(--c-base-1)',
              boxShadow:val?'0 0 0 1.5px var(--c-sage)':'none',
              display:'flex',flexDirection:'column',alignItems:'center',gap:10,
            }}>
              <div style={{width:40,height:40,borderRadius:'50%',background:val?'var(--c-sage)':'var(--c-base-2)',display:'flex',alignItems:'center',justifyContent:'center',transition:'background .15s'}}>
                {val&&<Check size={20} strokeWidth={2.5} style={{color:'white'}}/>}
              </div>
              <span style={{fontFamily:'var(--font-ui)',fontSize:13,fontWeight:val?500:400,color:val?'var(--c-sage-deep)':'var(--c-text-500)'}}>{label}</span>
            </button>
          ))}
        </div>
        <p style={{fontFamily:'var(--font-editorial)',fontSize:14,color:'var(--c-text-400)',fontStyle:'italic',textAlign:'center',marginBottom:20}}>
          {done===0?'Nenhuma etapa concluída':done===1?'1 de 2 etapas concluída':'Skincare completo hoje'}
        </p>
        <button className="btn-primary" onClick={save} disabled={saving}>{saving?'Salvando...':'Salvar'}</button>
      </div>
    </div>
  )
}


/* ─── REGISTER MODAL ─────────────────────────────────────────────── */
function RegisterModal({ type, userId, onClose, onSave, data }) {
  const [val,setVal]=useState('')
  const [regDate,setRegDate]=useState(today())
  const [saving,setSaving]=useState(false)
  const [saved,setSaved]=useState(false)
  const cfg={
    peso:  {title:'Registrar peso', label:'Peso (kg)', placeholder:'0,0', field:'weight',     table:'physical_metrics'},
    agua:  {title:'Registrar água', label:'Adicionar água (ml)', placeholder:'500',field:'water_ml',  table:'daily_tracking'},
    sono:  {title:'Registrar sono', label:'Horas dormidas', placeholder:'7',   field:'sleep_hours',table:'daily_tracking'},
  }[type]
  if(!cfg) return null

  const save=async()=>{
    if(!val||saving) return
    setSaving(true)
    const numVal=parseFloat(val.replace(',','.'))
    if(isNaN(numVal)){setSaving(false);return}
    if(cfg.table==='physical_metrics'){
      await supabase.from('physical_metrics').insert({user_id:userId,date:regDate,[cfg.field]:numVal})
    } else {
      const{data:ex}=await supabase.from('daily_tracking').select('id,water_ml').eq('user_id',userId).eq('date',regDate).maybeSingle()
      if(ex){
        // Água: acumula (soma) — outros campos: substituem
        const newVal = cfg.field==='water_ml' ? (ex.water_ml||0)+numVal : numVal
        await supabase.from('daily_tracking').update({[cfg.field]:newVal}).eq('id',ex.id)
      } else {
        await supabase.from('daily_tracking').insert({user_id:userId,date:regDate,[cfg.field]:numVal})
      }
    }
    setSaved(true)
    setTimeout(()=>{onSave?.();onClose()},700)
  }

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={e=>e.stopPropagation()}>
        <div className="sheet-handle"/>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
          <h2 className="sheet-title" style={{marginBottom:0}}>{cfg.title}</h2>
          <button onClick={onClose} className="btn-ghost" style={{padding:8}}><X size={18} strokeWidth={1.8}/></button>
        </div>
        {saved?(
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:12,padding:'24px 0'}}>
            <div style={{width:52,height:52,borderRadius:'50%',background:'var(--c-sage-faint)',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <Check size={24} strokeWidth={2} style={{color:'var(--c-sage)'}}/>
            </div>
            <p style={{fontFamily:'var(--font-editorial)',fontSize:18,color:'var(--c-text-700)',fontStyle:'italic'}}>Registrado com sucesso</p>
          </div>
        ):(
          <>
            <div style={{marginBottom:14}}>
              <label className="input-label">Data</label>
              <input className="input-field" type="date" value={regDate} max={today()} onChange={e=>setRegDate(e.target.value)}/>
            </div>
            <label className="input-label">{cfg.label}</label>
            <input className="input-field" type="text" inputMode="decimal" placeholder={cfg.placeholder}
              value={val} onChange={e=>setVal(e.target.value)}
              style={{fontSize:24,textAlign:'center',marginBottom:24}} autoFocus/>
            <button className="btn-primary" onClick={save} disabled={!val||saving}>
              {saving?'Salvando...':'Salvar'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

/* ─── MAIN PAGE ─────────────────────────────────────────────────── */
export default function Home({ userId }) {
  const [hmYear,setHmYear]=useState(new Date().getFullYear())
  const [hmMonth,setHmMonth]=useState(new Date().getMonth())
  const {data,loading,reload}=useHomeData(userId)
  const [modal,setModal]=useState(null)   // 'peso'|'agua'|'sono'
  const [daySheet,setDaySheet]=useState(null) // date string
  const [todayMoodLocal,setTodayMoodLocal]=useState(null)
  const [moodDiaryId,setMoodDiaryId]=useState(null)
  const navigate=useNavigate()

  useEffect(()=>{
    if(data?.todayMood!=null) setTodayMoodLocal(data.todayMood)
    if(data?.todayDiaryId) setMoodDiaryId(data.todayDiaryId)
  },[data])

  const saveMood = async (level) => {
  const same = todayMoodLocal === level
  const newLevel = same ? null : level
  setTodayMoodLocal(newLevel)
  const todayStr = today()
  const moodVal = newLevel ? String(newLevel) : null

  // Sempre busca antes de decidir INSERT ou UPDATE
  const { data: de } = await supabase.from('diary_entries')
    .select('id').eq('user_id', userId).eq('date', todayStr).maybeSingle()

  if (de) {
    await supabase.from('diary_entries').update({ mood: moodVal }).eq('id', de.id)
    setMoodDiaryId(de.id)
 } else if (newLevel) {
    const { data: nd } = await supabase.from('diary_entries')
      .insert({ user_id: userId, date: todayStr, mood: moodVal, content: '' })
      .select('id').maybeSingle()
    if (nd?.id) setMoodDiaryId(nd.id)
  }

  const { data: dt } = await supabase.from('daily_tracking')
    .select('id').eq('user_id', userId).eq('date', todayStr).maybeSingle()
  if (dt) await supabase.from('daily_tracking').update({ mood: moodVal }).eq('id', dt.id)
  else if (newLevel) await supabase.from('daily_tracking')
    .insert({ user_id: userId, date: todayStr, mood: moodVal })

  reload()
}

  const hmPrev=()=>{ if(hmMonth===0){setHmYear(y=>y-1);setHmMonth(11)}else setHmMonth(m=>m-1) }
  const hmNext=()=>{ if(hmMonth===11){setHmYear(y=>y+1);setHmMonth(0)}else setHmMonth(m=>m+1) }

  const handleAction=(id)=>{
    if(['peso','agua','sono'].includes(id)) setModal(id)
    else if(id==='treino')    navigate('/treinos')
    else if(id==='refeicao')  navigate('/diario')
    else if(id==='humor')     document.getElementById('mood-picker')?.scrollIntoView({behavior:'smooth'})
  else if(id==='skincare')   setModal('skincare')
  }
  
const location = useLocation()
useEffect(() => {
  const wanted = location.state?.openModal
  if (!wanted || !data) return
  handleAction(wanted)
  window.history.replaceState({}, document.title)
}, [location.state, data])
  
  const today_=today()
  const upcomingEvents = data?.upConsults?.map(c=>({date:c.date,type:'consultation',title:c.specialty||'Consulta',subtitle:c.doctor||c.location})) || []
  return (
    <div style={{paddingBottom:8}}>

      {/* ─ HEADER ─────────────────────────────────────────────── */}
      <div style={{position:'relative',padding:'52px var(--page-pad-x) 20px',overflow:'hidden',minHeight:160}}>
        <HomeHeaderBotanical/>
        <button onClick={()=>navigate('/config')} className="btn-ghost" style={{position:'absolute',top:52,right:'var(--page-pad-x)',zIndex:2,padding:8}}>
          <Settings size={20} strokeWidth={1.6} style={{color:'var(--c-text-300)'}}/>
        </button>
        <div style={{position:'relative',zIndex:1}}>
          <p style={{fontFamily:'var(--font-ui)',fontSize:'var(--text-sm)',color:'var(--c-text-300)',marginBottom:4,letterSpacing:'.04em',textTransform:'uppercase'}}>
            {new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'})}
          </p>
          <h1 style={{fontFamily:'var(--font-display)',fontSize:'var(--text-3xl)',fontWeight:500,color:'var(--c-text-900)',letterSpacing:'-0.02em',marginBottom:8,lineHeight:1.1}}>
            {greeting()},<br/>{data?.displayName||'Adriana'}
          </h1>
          <p style={{fontFamily:'var(--font-editorial)',fontSize:'var(--text-md)',color:'var(--c-text-500)',fontStyle:'italic',lineHeight:1.5}}>{dailyPhrase()}</p>
        </div>
      </div>

      {/* ─ MOOD PICKER ─────────────────────────────────────────── */}
      <section style={{padding:'0 var(--page-pad-x)',marginBottom:28}} id="mood-picker">
        <p style={{fontFamily:'var(--font-editorial)',fontSize:15,color:'var(--c-text-500)',fontStyle:'italic',marginBottom:12,textAlign:'center'}}>Como você está hoje?</p>
        <div style={{display:'flex',justifyContent:'space-between',gap:4}}>
          {[1,2,3,4,5].map(n=>(
            <FaceIcon key={n} level={n} selected={todayMoodLocal===n} onClick={()=>saveMood(n)} size={28}/>
          ))}
        </div>
      </section>

      {/* ─ HEALTH SUMMARY ──────────────────────────────────────── */}
      <section style={{marginBottom:20}}>
        <div className="section-header">
          <h2 className="section-title">Seu momento atual</h2>
          <button className="section-link" onClick={()=>navigate('/saude')}>Ver painel</button>
        </div>
        {loading
          ? <div style={{margin:'0 var(--page-pad-x)',height:160}} className="loading-shimmer card"/>
          : <HealthSummaryGrid data={data} navigate={navigate}/>
        }
      </section>

      {/* ─ JORNADA FIV (only if active) ─────────────────────── */}
      {data?.activeFiv && (
        <section style={{marginBottom:28}}>
          <JornadaFivCard data={data} navigate={navigate}/>
        </section>
      )}

      {/* ─ PENDÊNCIAS DE HOJE ──────────────────────────────────── */}
      <section style={{marginBottom:28}}>
        <div className="section-header">
          <h2 className="section-title">Pendências de hoje</h2>
        </div>
        <div style={{padding:'0 var(--page-pad-x)'}}>
          <div className="card" style={{padding:'4px 16px'}}>
            {loading
              ? <div style={{height:120}} className="loading-shimmer"/>
              : <PendenciasHoje data={data} onAction={handleAction}/>
            }
          </div>
        </div>
      </section>

      {/* ─ CONSISTÊNCIA ────────────────────────────────────────── */}
      <section style={{marginBottom:28}}>
        <div className="section-header">
          <h2 className="section-title">Consistência</h2>
          <span style={{fontSize:9,color:'var(--c-text-300)',fontFamily:'var(--font-ui)'}}>Toque para ver o dia</span>
        </div>
        <div style={{padding:'0 var(--page-pad-x)'}}>
          {loading
            ? <div style={{height:100}} className="loading-shimmer"/>
