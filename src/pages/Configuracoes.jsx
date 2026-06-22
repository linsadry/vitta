import React, { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, User, Ruler, Target, Bell, Check, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { PageBotanical } from '../components/BotanicalBg'

// Standalone field component (defined outside to preserve identity across renders)
function Field({ label, value, onChange, type='text', placeholder, suffix }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label className="input-label">{label}</label>
      <div style={{ position:'relative' }}>
        <input className="input-field" type={type} inputMode={type==='number'?'decimal':undefined}
          value={value} placeholder={placeholder} onChange={e=>onChange(e.target.value)}
          style={{ paddingRight: suffix?44:undefined }} />
        {suffix && <span style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', fontSize:13, color:'var(--c-text-300)', fontFamily:'var(--font-ui)' }}>{suffix}</span>}
      </div>
    </div>
  )
}

export default function Configuracoes({ userId, onBack }) {
  const navigate = useNavigate()
  const goBack = () => onBack ? onBack() : navigate('/')
  const [profile, setProfile] = useState({
    display_name:'', height_cm:'', goal_weight_kg:'',
    goal_water_ml:2500, goal_sleep_h:7, goal_protein_g:120, goal_skincare:2,
    push_enabled:false,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [pushStatus, setPushStatus] = useState('')

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const { data } = await supabase.from('vitta_profile').select('*').eq('user_id', userId).maybeSingle()
    if (data) setProfile(p => ({ ...p, ...data,
      height_cm: data.height_cm||'', goal_weight_kg: data.goal_weight_kg||'' }))
    setLoading(false)
  }, [userId])

  useEffect(()=>{ load() }, [load])

  const set = (k,v) => setProfile(p=>({...p,[k]:v}))
  const toN = (v) => v===''||v==null ? null : parseFloat(String(v).replace(',','.'))

  const save = async () => {
    setSaving(true)
    const row = {
      user_id: userId,
      display_name: profile.display_name||null,
      height_cm: toN(profile.height_cm),
      goal_weight_kg: toN(profile.goal_weight_kg),
      goal_water_ml: parseInt(profile.goal_water_ml)||2500,
      goal_sleep_h: toN(profile.goal_sleep_h)||7,
      goal_protein_g: parseInt(profile.goal_protein_g)||120,
      goal_skincare: parseInt(profile.goal_skincare)||2,
      updated_at: new Date().toISOString(),
    }
    await supabase.from('vitta_profile').upsert(row, { onConflict:'user_id' })
    setSaved(true)
    setSaving(false)
    setTimeout(()=>setSaved(false), 1500)
  }

  // ─── Push notifications ───────────────────────────────────────
  const enablePush = async () => {
    setPushStatus('')
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setPushStatus('Seu dispositivo não suporta notificações.')
      return
    }
    const perm = await Notification.requestPermission()
    if (perm !== 'granted') {
      setPushStatus('Permissão negada. Ative nas configurações do navegador.')
      return
    }
    // Save preference. (Full Web Push needs VAPID keys configured on the server;
    // local notifications via the SW work immediately.)
    await supabase.from('vitta_profile').upsert(
      { user_id:userId, push_enabled:true, updated_at:new Date().toISOString() },
      { onConflict:'user_id' }
    )
    set('push_enabled', true)
    setPushStatus('Notificações ativadas.')
    // Show a confirmation notification
    const reg = await navigator.serviceWorker.ready
    reg.showNotification('Vitta+', { body:'Notificações ativadas com sucesso.', icon:'/icon-192.png' })
  }

  const logout = async () => { await supabase.auth.signOut() }

  // IMC preview
  const imc = (() => {
    const h = toN(profile.height_cm), w = toN(profile.goal_weight_kg)
    if (!h || !w) return null
    return (w / Math.pow(h/100, 2)).toFixed(1)
  })()

  return (
    <div style={{ position:'relative', minHeight:'100%', paddingBottom:40 }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'52px var(--page-pad-x) 24px', position:'relative', overflow:'hidden' }}>
        <PageBotanical/>
        <button onClick={goBack} className="btn-ghost" style={{ padding:8, position:'relative', zIndex:1 }}><ChevronLeft size={20} strokeWidth={1.8}/></button>
        <div style={{ position:'relative', zIndex:1 }}>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:'var(--text-2xl)', fontWeight:500, color:'var(--c-text-900)', letterSpacing:'-0.02em' }}>Configurações</h1>
        </div>
      </div>

      {loading ? (
        <div style={{ padding:'0 var(--page-pad-x)' }}><div style={{ height:300 }} className="loading-shimmer card"/></div>
      ) : (
        <div style={{ padding:'0 var(--page-pad-x)' }}>
          {/* Perfil */}
          <section style={{ marginBottom:28 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
              <User size={16} strokeWidth={1.8} style={{ color:'var(--c-rose)' }}/>
              <h2 className="section-title" style={{ margin:0 }}>Perfil</h2>
            </div>
            <div className="card" style={{ padding:'16px 16px 4px' }}>
              <Field label="Nome de exibição" value={profile.display_name} onChange={v=>set('display_name',v)} placeholder="Adriana"/>
              <Field label="Altura" value={profile.height_cm} onChange={v=>set('height_cm',v)} type="number" placeholder="165" suffix="cm"/>
            </div>
          </section>

          {/* Metas */}
          <section style={{ marginBottom:28 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
              <Target size={16} strokeWidth={1.8} style={{ color:'var(--c-sage)' }}/>
              <h2 className="section-title" style={{ margin:0 }}>Metas</h2>
            </div>
            <div className="card" style={{ padding:'16px 16px 4px' }}>
              <Field label="Peso desejado" value={profile.goal_weight_kg} onChange={v=>set('goal_weight_kg',v)} type="number" placeholder="65" suffix="kg"/>
              {imc && (
                <div style={{ margin:'0 0 14px', padding:'10px 12px', background:'var(--c-sage-faint)', borderRadius:'var(--r-md)' }}>
                  <span style={{ fontSize:12, color:'var(--c-text-500)', fontFamily:'var(--font-ui)' }}>IMC na meta: </span>
                  <span style={{ fontSize:14, fontWeight:600, color:'var(--c-sage-deep)', fontFamily:'var(--font-ui)' }}>{imc}</span>
                </div>
              )}
              <Field label="Meta de água diária" value={profile.goal_water_ml} onChange={v=>set('goal_water_ml',v)} type="number" placeholder="2500" suffix="ml"/>
              <Field label="Meta de sono" value={profile.goal_sleep_h} onChange={v=>set('goal_sleep_h',v)} type="number" placeholder="7" suffix="h"/>
              <Field label="Meta de proteína" value={profile.goal_protein_g} onChange={v=>set('goal_protein_g',v)} type="number" placeholder="120" suffix="g"/>
            </div>
          </section>

          {/* Notificações */}
          <section style={{ marginBottom:28 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
              <Bell size={16} strokeWidth={1.8} style={{ color:'var(--c-lavender)' }}/>
              <h2 className="section-title" style={{ margin:0 }}>Notificações</h2>
            </div>
            <div className="card" style={{ padding:16 }}>
              <p style={{ fontFamily:'var(--font-editorial)', fontSize:14, color:'var(--c-text-500)', fontStyle:'italic', lineHeight:1.5, marginBottom:14 }}>
                Receba lembretes dos seus medicamentos nos horários programados.
              </p>
              <button className="btn-primary" onClick={enablePush}
                style={ profile.push_enabled ? { background:'var(--c-sage-faint)', color:'var(--c-sage-deep)' } : {} }
                disabled={profile.push_enabled}>
                {profile.push_enabled ? 'Notificações ativadas' : 'Ativar notificações'}
              </button>
              {pushStatus && <p style={{ fontSize:12, color:'var(--c-text-400)', fontFamily:'var(--font-ui)', marginTop:10, textAlign:'center' }}>{pushStatus}</p>}
            </div>
          </section>

          {/* Save */}
          <button className="btn-primary" onClick={save} disabled={saving} style={{ marginBottom:16 }}>
            {saving ? 'Salvando...' : saved ? 'Salvo!' : 'Salvar configurações'}
          </button>

          {/* Logout */}
          <button onClick={logout} style={{
            width:'100%', padding:'14px', borderRadius:'var(--r-md)', border:'1px solid var(--c-border)',
            background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            fontFamily:'var(--font-ui)', fontSize:14, color:'var(--c-text-400)',
          }}>
            <LogOut size={15} strokeWidth={1.8}/> Sair da conta
          </button>
        </div>
      )}
    </div>
  )
}
