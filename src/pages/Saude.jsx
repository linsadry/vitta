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
      {data:fivStages},{data:weights},{data:tracking},{data:labResults},
      {data:historico},
    ] = await Promise.all([
      supabase.from('health_consultations').select('date,specialty,doctor,time').eq('user_id',userId).gte('date',todayStr).order('date').limit(1).maybeSingle(),
      supabase.from('health_consultations').select('*').eq('user_id',userId).order('date',{ascending:false}),
      supabase.from('health_medications').select('*').eq('user_id',userId).order('active',{ascending:false}),
      supabase.from('cycle_entries').select('date,type,value').eq('user_id',userId).gte('date',d90).order('date'),
      supabase.from('vitta_fiv_stages').select('stage_key,stage_label,status,start_date').eq('user_id',userId),
      supabase.from('physical_metrics').select('weight,date').eq('user_id',userId).order('date',{ascending:false}).limit(2),
      supabase.from('daily_tracking').select('sleep_hours,water_ml,date').eq('user_id',userId).gte('date',d7),
      supabase.from('lab_results').select('id,category,date,status,scheduled_date,location,notes').eq('user_id',userId).order('date',{ascending:false}),
      supabase.from('vitta_historico').select('date').eq('user_id',userId),
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
    const histList = historico || []
    const historicoYears = histList.length ? new Set(histList.map(h => h.date.slice(0,4))).size : 0
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
      historicoCount: histList.length, historicoYears,
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
      <div style={{display:'flex',alignItems:'cente
