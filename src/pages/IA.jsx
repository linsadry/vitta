import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Send, Sparkles, TrendingUp } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { PageBotanical } from '../components/BotanicalBg'
import { daysAgo, today } from '../lib/utils'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const SUGGESTIONS = [
  'Como está minha consistência este mês?',
  'Há relação entre meu sono e meu humor?',
  'Como está minha evolução de peso?',
  'O que posso melhorar nos meus hábitos?',
]

/* Build a compact context string from the user's recent data */
async function buildContext(userId) {
  const d30 = daysAgo(30)
  const [
    {data:tracking},{data:weights},{data:cycles},
    {data:diary},{data:workouts},{data:fivStages},
  ] = await Promise.all([
    supabase.from('daily_tracking').select('date,water_ml,sleep_hours,protein_g,mood,strength_done,aerobic_done').eq('user_id',userId).gte('date',d30).order('date'),
    supabase.from('physical_metrics').select('date,weight').eq('user_id',userId).order('date',{ascending:false}).limit(10),
    supabase.from('cycle_entries').select('date,type,value').eq('user_id',userId).gte('date',daysAgo(60)).order('date'),
    supabase.from('diary_entries').select('date,mood').eq('user_id',userId).gte('date',d30).order('date'),
    supabase.from('fitness_workout_logs').select('date').eq('user_id',userId).gte('date',d30),
    supabase.from('vitta_fiv_stages').select('stage_label,status').eq('user_id',userId).eq('status','ativo'),
  ])

  const t = tracking||[]
  const avgSleep = t.filter(d=>d.sleep_hours>0)
  const avgWater = t.filter(d=>d.water_ml>0)
  const moods = t.filter(d=>d.mood).map(d=>parseInt(d.mood))
  const wkDays = [...new Set((workouts||[]).map(w=>w.date))].length
  const menstr = (cycles||[]).filter(c=>c.type==='menstruacao')

  const lines = []
  lines.push(`Período: últimos 30 dias`)
  if(weights?.length) lines.push(`Peso atual: ${weights[0].weight}kg (${weights.length} registros recentes)`)
  if(avgSleep.length) lines.push(`Sono médio: ${(avgSleep.reduce((s,d)=>s+d.sleep_hours,0)/avgSleep.length).toFixed(1)}h em ${avgSleep.length} dias`)
  if(avgWater.length) lines.push(`Água média: ${Math.round(avgWater.reduce((s,d)=>s+d.water_ml,0)/avgWater.length)}ml em ${avgWater.length} dias`)
  if(moods.length) lines.push(`Humor médio: ${(moods.reduce((s,m)=>s+m,0)/moods.length).toFixed(1)} (escala 1=ótimo a 5=difícil), ${moods.length} registros`)
  lines.push(`Treinos: ${wkDays} dias com treino registrado`)
  if(menstr.length) lines.push(`Menstruação registrada em ${menstr.length} dias nos últimos 60 dias`)
  if(fivStages?.length) lines.push(`Jornada FIV ativa: etapa ${fivStages[0].stage_label}`)

  // Daily mood+sleep pairs for correlation
  const pairs = t.filter(d=>d.mood&&d.sleep_hours>0).map(d=>`${d.date}: sono ${d.sleep_hours}h, humor ${d.mood}`)
  if(pairs.length) lines.push(`\nDias com sono e humor: ${pairs.slice(-10).join('; ')}`)

  return lines.join('\n')
}

export default function IA({ userId }) {
  const [messages, setMessages] = useState([])  // {role, text}
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [contextReady, setContextReady] = useState(false)
  const contextRef = useRef('')
  const scrollRef = useRef(null)

  useEffect(()=>{
    if(!userId) return
    buildContext(userId).then(ctx=>{ contextRef.current=ctx; setContextReady(true) })
  },[userId])

  useEffect(()=>{
    scrollRef.current?.scrollTo({ top:scrollRef.current.scrollHeight, behavior:'smooth' })
  },[messages,loading])

  const ask = async (question) => {
    if(!question.trim()||loading) return
    setInput('')
    setMessages(m=>[...m,{role:'user',text:question}])
    setLoading(true)
    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/vitta-ia`, {
        method:'POST',
        headers:{ 'Content-Type':'application/json', 'Authorization':`Bearer ${ANON_KEY}` },
        body: JSON.stringify({ context: contextRef.current, question }),
      })
      const data = await resp.json()
      if(data.answer){
        setMessages(m=>[...m,{role:'assistant',text:data.answer}])
      } else {
        setMessages(m=>[...m,{role:'assistant',text:'Não consegui responder agora. Verifique se a função de IA está configurada no Supabase.',error:true}])
      }
    } catch(e) {
      setMessages(m=>[...m,{role:'assistant',text:'Erro de conexão com o assistente.',error:true}])
    }
    setLoading(false)
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', position:'relative' }}>
      {/* Header */}
      <div style={{ padding:'52px var(--page-pad-x) 16px', position:'relative', overflow:'hidden', flexShrink:0 }}>
        <PageBotanical/>
        <div style={{ position:'relative', zIndex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
            <Sparkles size={20} strokeWidth={1.6} style={{ color:'var(--c-lavender)' }}/>
            <h1 style={{ fontFamily:'var(--font-display)', fontSize:'var(--text-2xl)', fontWeight:500, color:'var(--c-text-900)', letterSpacing:'-0.02em' }}>Assistente Vitta</h1>
          </div>
          <p style={{ fontFamily:'var(--font-editorial)', fontSize:16, color:'var(--c-text-500)', fontStyle:'italic' }}>Insights sobre sua jornada de saúde</p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{ flex:1, overflowY:'auto', padding:'0 var(--page-pad-x)', WebkitOverflowScrolling:'touch' }}>
        {messages.length===0 && (
          <div style={{ paddingTop:8 }}>
            <div className="card" style={{ padding:'18px 18px', marginBottom:20, background:'rgba(196,184,212,0.08)', border:'1px solid rgba(196,184,212,0.25)' }}>
              <p style={{ fontFamily:'var(--font-editorial)', fontSize:15, color:'var(--c-text-700)', fontStyle:'italic', lineHeight:1.6 }}>
                Olá, Adriana. Posso analisar seus padrões de sono, humor, ciclo, treinos e evolução. Pergunte o que quiser sobre sua jornada.
              </p>
            </div>
            <p style={{ fontSize:11, color:'var(--c-text-300)', fontFamily:'var(--font-ui)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:12 }}>Sugestões</p>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {SUGGESTIONS.map((s,i)=>(
                <button key={i} onClick={()=>ask(s)} disabled={!contextReady} style={{
                  textAlign:'left', padding:'13px 16px', borderRadius:'var(--r-md)', border:'1px solid var(--c-border)',
                  background:'var(--c-surface-raised)', cursor:contextReady?'pointer':'wait',
                  fontFamily:'var(--font-ui)', fontSize:14, color:'var(--c-text-700)',
                  display:'flex', alignItems:'center', gap:10, opacity:contextReady?1:0.5,
                }}>
                  <TrendingUp size={14} strokeWidth={1.8} style={{ color:'var(--c-lavender)', flexShrink:0 }}/>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m,i)=>(
          <div key={i} style={{ marginBottom:14, display:'flex', justifyContent:m.role==='user'?'flex-end':'flex-start' }}>
            <div style={{
              maxWidth:'85%', padding:'12px 16px', borderRadius:16,
              background: m.role==='user' ? 'var(--c-text-900)' : m.error ? 'var(--c-rose-faint)' : 'var(--c-surface-raised)',
              border: m.role==='user' ? 'none' : '1px solid var(--c-border)',
              color: m.role==='user' ? 'var(--c-base-0)' : 'var(--c-text-700)',
            }}>
              <p style={{
                fontFamily: m.role==='user' ? 'var(--font-ui)' : 'var(--font-editorial)',
                fontSize: m.role==='user' ? 14 : 15,
                lineHeight:1.6, margin:0, whiteSpace:'pre-wrap',
                fontStyle: m.role==='assistant'&&!m.error ? 'normal' : 'normal',
              }}>{m.text}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ marginBottom:14, display:'flex', justifyContent:'flex-start' }}>
            <div style={{ padding:'14px 18px', borderRadius:16, background:'var(--c-surface-raised)', border:'1px solid var(--c-border)' }}>
              <div style={{ display:'flex', gap:5 }}>
                {[0,1,2].map(i=><div key={i} style={{ width:6, height:6, borderRadius:'50%', background:'var(--c-lavender)', opacity:0.5, animation:`pulse 1.2s ease-in-out ${i*0.2}s infinite` }}/>)}
              </div>
              <style>{`@keyframes pulse{0%,100%{opacity:0.3;transform:scale(1)}50%{opacity:0.9;transform:scale(1.3)}}`}</style>
            </div>
          </div>
        )}
        <div style={{ height:16 }}/>
      </div>

      {/* Input */}
      <div style={{ flexShrink:0, padding:'12px var(--page-pad-x)', paddingBottom:'calc(env(safe-area-inset-bottom,0px) + 12px)', borderTop:'1px solid var(--c-border-light)', background:'var(--c-base-0)' }}>
        <div style={{ display:'flex', gap:8, alignItems:'flex-end' }}>
          <input
            className="input-field" type="text" value={input} placeholder={contextReady?'Pergunte sobre sua saúde...':'Carregando seus dados...'}
            disabled={!contextReady||loading}
            onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&ask(input)}
            style={{ flex:1, marginBottom:0 }}
          />
          <button onClick={()=>ask(input)} disabled={!input.trim()||loading||!contextReady} style={{
            width:44, height:44, borderRadius:'50%', border:'none', flexShrink:0,
            background: input.trim()&&!loading ? 'var(--c-text-900)' : 'var(--c-base-3)',
            cursor: input.trim()&&!loading ? 'pointer' : 'default',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <Send size={17} strokeWidth={2} style={{ color:'var(--c-base-0)' }}/>
          </button>
        </div>
        <p style={{ fontSize:10, color:'var(--c-text-200)', fontFamily:'var(--font-ui)', textAlign:'center', marginTop:8 }}>
          Insights gerais — não substituem avaliação médica
        </p>
      </div>
    </div>
  )
}
