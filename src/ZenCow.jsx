import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { T } from "./constants/theme.js";
import TelaHome     from "./screens/TelaHome.jsx";
import TelaPets     from "./screens/TelaPets.jsx";
import TelaCloset   from "./screens/TelaCloset.jsx";
import TelaBeauty   from "./screens/TelaBeauty.jsx";
import TelaCasa     from "./screens/TelaCasa.jsx";
import TelaMemorias from "./screens/TelaMemorias.jsx";

const SUPABASE_URL = "https://uxkjvbjlsbgmbalokisf.supabase.co";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const sb      = createClient(SUPABASE_URL, SUPABASE_KEY);
const DATA_ID = "zencow-main";

const INIT_STATE = {
  pets:         [],
  petOpenId:    null,
  pecas:        [],
  looks:        [],
  beautyProdutos: [],
  beautyDiario:   [],
  tarefas:      [],
  compras:      [],
  manutencoes:  [],
  memorias:     [],
};

const NAV = [
  { id:"home",     icon:"🏠", label:"Início"   },
  { id:"pets",     icon:"🐾", label:"Pets"     },
  { id:"closet",   icon:"👗", label:"Closet"   },
  { id:"beauty",   icon:"✨", label:"Beauty"   },
  { id:"casa",     icon:"🏡", label:"Casa"     },
  { id:"memorias", icon:"📷", label:"Memórias" },
];

export default function ZenCow() {
  const [tela,     setTela]     = useState("home");
  const [state,    setState]    = useState(INIT_STATE);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const saveTimer = useRef(null);

  /* ── Load ─────────────────────────────────────────────────── */
  useEffect(() => {
    (async () => {
      try {
        const { data } = await sb
          .from("zencow_data")
          .select("data")
          .eq("id", DATA_ID)
          .maybeSingle();
        if (data?.data) setState(prev => ({ ...prev, ...data.data }));
      } catch (e) {
        console.warn("ZenCow load error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ── Save (debounced 1.5 s) ───────────────────────────────── */
  const persist = useCallback(async (snapshot) => {
    setSaving(true);
    try {
      const { petOpenId, ...persistable } = snapshot; // petOpenId é UI transient
      await sb.from("zencow_data").upsert({ id: DATA_ID, data: persistable });
    } catch (e) {
      console.warn("ZenCow save error:", e);
    } finally {
      setSaving(false);
    }
  }, []);

  const update = useCallback((patch) => {
    setState(prev => {
      const next = typeof patch === "function" ? patch(prev) : { ...prev, ...patch };
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => persist(next), 1500);
      return next;
    });
  }, [persist]);

  /* ── Setter factory ───────────────────────────────────────── */
  const mk = key => fn =>
    update(prev => ({ ...prev, [key]: typeof fn === "function" ? fn(prev[key]) : fn }));

  const setPets           = mk("pets");
  const setPecas          = mk("pecas");
  const setLooks          = mk("looks");
  const setBeautyProdutos = mk("beautyProdutos");
  const setBeautyDiario   = mk("beautyDiario");
  const setTarefas        = mk("tarefas");
  const setCompras        = mk("compras");
  const setManutencoes    = mk("manutencoes");
  const setMemorias       = mk("memorias");
  const setPetOpenId      = id => setState(prev => ({ ...prev, petOpenId: id }));

  const onMenu = () => setMenuOpen(true);

  /* ── Loading screen ───────────────────────────────────────── */
  if (loading) return (
    <div style={{ height:"100dvh",display:"flex",flexDirection:"column",
      alignItems:"center",justifyContent:"center",background:T.bg }}>
      <div style={{ fontSize:52,marginBottom:14,
        animation:"spin 2.5s linear infinite" }}>🐄</div>
      <div style={{ fontSize:14,color:T.textMute,fontWeight:700 }}>Carregando ZenCow...</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );

  /* ── App shell ────────────────────────────────────────────── */
  return (
    <div style={{ height:"100dvh",display:"flex",flexDirection:"column",
      background:T.bg,maxWidth:430,margin:"0 auto",
      position:"relative",overflow:"hidden" }}>

      {/* save indicator bar */}
      {saving && (
        <div style={{ position:"absolute",top:0,left:0,right:0,height:2,zIndex:999,
          background:`linear-gradient(90deg,${T.blue},${T.sand},${T.moss})`,
          animation:"savepulse 1s ease-in-out infinite alternate" }}/>
      )}

      {/* screen area */}
      <div style={{ flex:1,overflow:"hidden",display:"flex",flexDirection:"column" }}>
        {tela==="home" && (
          <TelaHome
            state={state} update={update}
            pets={state.pets} pecas={state.pecas} memorias={state.memorias}
            onMenu={onMenu}/>
        )}
        {tela==="pets" && (
          <TelaPets
            pets={state.pets}         setPets={setPets}
            petOpenId={state.petOpenId} setPetOpenId={setPetOpenId}
            onMenu={onMenu}/>
        )}
        {tela==="closet" && (
          <TelaCloset
            pecas={state.pecas}   setPecas={setPecas}
            looks={state.looks}   setLooks={setLooks}
            onMenu={onMenu}/>
        )}
        {tela==="beauty" && (
          <TelaBeauty
            produtos={state.beautyProdutos} setProdutos={setBeautyProdutos}
            diario={state.beautyDiario}     setDiario={setBeautyDiario}
            onMenu={onMenu}/>
        )}
        {tela==="casa" && (
          <TelaCasa
            tarefas={state.tarefas}         setTarefas={setTarefas}
            compras={state.compras}          setCompras={setCompras}
            manutencoes={state.manutencoes}  setManutencoes={setManutencoes}
            onMenu={onMenu}/>
        )}
        {tela==="memorias" && (
          <TelaMemorias
            memorias={state.memorias} setMemorias={setMemorias}
            onMenu={onMenu}/>
        )}
      </div>

      {/* bottom nav */}
      <nav style={{ display:"flex",background:T.bgCard,
        borderTop:`1px solid ${T.border}`,
        paddingBottom:"env(safe-area-inset-bottom)",
        flexShrink:0,zIndex:100 }}>
        {NAV.map(n => (
          <button key={n.id} onClick={() => setTela(n.id)} style={{
            flex:1,padding:"8px 2px 6px",display:"flex",flexDirection:"column",
            alignItems:"center",gap:2,background:"none",border:"none" }}>
            <span style={{ fontSize:20 }}>{n.icon}</span>
            <span style={{ fontSize:9,fontWeight:700,letterSpacing:.3,
              textTransform:"uppercase",
              color: tela===n.id ? T.blue : T.textMute }}>{n.label}</span>
            {tela===n.id && (
              <div style={{ width:18,height:2,borderRadius:99,background:T.blue }}/>
            )}
          </button>
        ))}
      </nav>

      {/* side drawer */}
      {menuOpen && (
        <>
          <div onClick={() => setMenuOpen(false)}
            style={{ position:"absolute",inset:0,background:"rgba(0,0,0,.4)",zIndex:200 }}/>
          <div style={{ position:"absolute",top:0,left:0,bottom:0,width:"72%",
            background:T.bgCard,zIndex:201,
            padding:"52px 20px 24px",
            display:"flex",flexDirection:"column",gap:4 }}>
            <div className="serif"
              style={{ fontSize:22,fontWeight:700,marginBottom:16,color:T.text }}>
              🐄 ZenCow
            </div>
            {NAV.map(n => (
              <button key={n.id} onClick={() => { setTela(n.id); setMenuOpen(false); }} style={{
                display:"flex",alignItems:"center",gap:12,
                padding:"11px 14px",borderRadius:14,textAlign:"left",
                background: tela===n.id ? T.blueBg : "transparent",
                border:     tela===n.id ? `1px solid ${T.blue}22` : "none" }}>
                <span style={{ fontSize:22 }}>{n.icon}</span>
                <span style={{ fontSize:15,fontWeight:700,
                  color: tela===n.id ? T.blue : T.text }}>{n.label}</span>
              </button>
            ))}
          </div>
        </>
      )}

      <style>{`
        @keyframes savepulse { from{opacity:.5} to{opacity:1} }
      `}</style>
    </div>
  );
}
