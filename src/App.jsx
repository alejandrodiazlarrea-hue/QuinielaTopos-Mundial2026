import { useState, useEffect, useCallback } from "react";

// ─── SUPABASE ─────────────────────────────────────────────────────────────────

const SUPA_URL = "https://nuiioqmdgpybzquasiho.supabase.co";
const SUPA_KEY = "sb_publishable_7qTq6ecM3AFXgarwaf1AsQ_Jluz9z-I";

const supa = async (path, options = {}) => {
  const res = await fetch(`${SUPA_URL}/rest/v1/${path}`, {
    headers: {
      "apikey": SUPA_KEY,
      "Authorization": `Bearer ${SUPA_KEY}`,
      "Content-Type": "application/json",
      "Prefer": options.prefer || "",
    },
    ...options,
  });
  if (res.status === 204 || res.status === 201) return null;
  return res.json();
};

const db = {
  getConfig: async () => {
    const rows = await supa("config?select=key,value");
    const cfg = {};
    (rows || []).forEach(r => { cfg[r.key] = r.value; });
    return cfg;
  },
  setConfig: async (key, value) => {
    await supa(`config?key=eq.${key}`, {
      method: "PATCH",
      prefer: "return=minimal",
      body: JSON.stringify({ value }),
    });
  },
  getParticipants: async () => {
    return await supa("participants?select=id,name,predictions,password&order=id.asc") || [];
  },
  upsertParticipant: async (p) => {
    await supa("participants", {
      method: "POST",
      prefer: "resolution=merge-duplicates,return=minimal",
      body: JSON.stringify({ id: p.id, name: p.name, predictions: p.predictions, password: p.password || "" }),
    });
  },
  getResults: async () => {
    const rows = await supa("results?select=match_id,home_goals,away_goals") || [];
    const res = {};
    rows.forEach(r => { res[r.match_id] = { homeGoals: r.home_goals, awayGoals: r.away_goals }; });
    return res;
  },
  upsertResult: async (matchId, homeGoals, awayGoals) => {
    await supa("results", {
      method: "POST",
      prefer: "resolution=merge-duplicates,return=minimal",
      body: JSON.stringify({ match_id: matchId, home_goals: homeGoals, away_goals: awayGoals }),
    });
  },
  deleteParticipant: async (id) => {
    await supa(`participants?id=eq.${id}`, {
      method: "DELETE",
      prefer: "return=minimal",
    });
  },
};

// ─── CALENDARIO OFICIAL FIFA 2026 ─────────────────────────────────────────────

const ALL_MATCHES = [
  {id:1,  jornada:1, group:"A", home:"México",          away:"Sudáfrica",      date:"2026-06-11", time:"13:00"},
  {id:2,  jornada:1, group:"A", home:"Corea del Sur",   away:"Chequia",        date:"2026-06-11", time:"20:00"},
  {id:3,  jornada:1, group:"B", home:"Canadá",          away:"Bosnia y Herz.", date:"2026-06-12", time:"13:00"},
  {id:4,  jornada:1, group:"D", home:"Estados Unidos",  away:"Paraguay",       date:"2026-06-12", time:"19:00"},
  {id:5,  jornada:1, group:"B", home:"Qatar",           away:"Suiza",          date:"2026-06-13", time:"13:00"},
  {id:6,  jornada:1, group:"C", home:"Brasil",          away:"Marruecos",      date:"2026-06-13", time:"16:00"},
  {id:7,  jornada:1, group:"C", home:"Haití",           away:"Escocia",        date:"2026-06-13", time:"19:00"},
  {id:8,  jornada:1, group:"D", home:"Australia",       away:"Turquía",        date:"2026-06-14", time:"22:00"},
  {id:9,  jornada:1, group:"E", home:"Alemania",        away:"Curazao",        date:"2026-06-14", time:"11:00"},
  {id:10, jornada:1, group:"F", home:"Países Bajos",    away:"Japón",          date:"2026-06-14", time:"14:00"},
  {id:11, jornada:1, group:"E", home:"Costa de Marfil", away:"Ecuador",        date:"2026-06-14", time:"17:00"},
  {id:12, jornada:1, group:"F", home:"Suecia",          away:"Túnez",          date:"2026-06-14", time:"20:00"},
  {id:13, jornada:1, group:"H", home:"España",          away:"Cabo Verde",     date:"2026-06-15", time:"10:00"},
  {id:14, jornada:1, group:"G", home:"Bélgica",         away:"Egipto",         date:"2026-06-15", time:"13:00"},
  {id:15, jornada:1, group:"H", home:"Arabia Saudita",  away:"Uruguay",        date:"2026-06-15", time:"16:00"},
  {id:16, jornada:1, group:"G", home:"Irán",            away:"Nueva Zelanda",  date:"2026-06-15", time:"19:00"},
  {id:17, jornada:1, group:"I", home:"Francia",         away:"Senegal",        date:"2026-06-16", time:"13:00"},
  {id:18, jornada:1, group:"I", home:"Iraq",            away:"Noruega",        date:"2026-06-16", time:"16:00"},
  {id:19, jornada:1, group:"J", home:"Argentina",       away:"Argelia",        date:"2026-06-16", time:"19:00"},
  {id:20, jornada:1, group:"J", home:"Austria",         away:"Jordania",       date:"2026-06-17", time:"22:00"},
  {id:21, jornada:1, group:"K", home:"Portugal",        away:"Congo RD",       date:"2026-06-17", time:"11:00"},
  {id:22, jornada:1, group:"L", home:"Inglaterra",      away:"Croacia",        date:"2026-06-17", time:"14:00"},
  {id:23, jornada:1, group:"L", home:"Ghana",           away:"Panamá",         date:"2026-06-17", time:"17:00"},
  {id:24, jornada:1, group:"K", home:"Uzbekistán",      away:"Colombia",       date:"2026-06-17", time:"20:00"},
  {id:25, jornada:2, group:"A", home:"Chequia",         away:"Sudáfrica",      date:"2026-06-18", time:"10:00"},
  {id:26, jornada:2, group:"B", home:"Suiza",           away:"Bosnia y Herz.", date:"2026-06-18", time:"13:00"},
  {id:27, jornada:2, group:"B", home:"Canadá",          away:"Qatar",          date:"2026-06-18", time:"16:00"},
  {id:28, jornada:2, group:"A", home:"México",          away:"Corea del Sur",  date:"2026-06-18", time:"19:00"},
  {id:29, jornada:2, group:"D", home:"Estados Unidos",  away:"Australia",      date:"2026-06-19", time:"13:00"},
  {id:30, jornada:2, group:"C", home:"Escocia",         away:"Marruecos",      date:"2026-06-19", time:"16:00"},
  {id:31, jornada:2, group:"C", home:"Brasil",          away:"Haití",          date:"2026-06-19", time:"19:00"},
  {id:32, jornada:2, group:"D", home:"Turquía",         away:"Paraguay",       date:"2026-06-20", time:"22:00"},
  {id:33, jornada:2, group:"F", home:"Países Bajos",    away:"Suecia",         date:"2026-06-20", time:"11:00"},
  {id:34, jornada:2, group:"E", home:"Alemania",        away:"Costa de Marfil",date:"2026-06-20", time:"14:00"},
  {id:35, jornada:2, group:"E", home:"Ecuador",         away:"Curazao",        date:"2026-06-20", time:"20:00"},
  {id:36, jornada:2, group:"F", home:"Túnez",           away:"Japón",          date:"2026-06-21", time:"22:00"},
  {id:37, jornada:2, group:"H", home:"España",          away:"Arabia Saudita", date:"2026-06-21", time:"10:00"},
  {id:38, jornada:2, group:"G", home:"Bélgica",         away:"Irán",           date:"2026-06-21", time:"13:00"},
  {id:39, jornada:2, group:"H", home:"Uruguay",         away:"Cabo Verde",     date:"2026-06-21", time:"16:00"},
  {id:40, jornada:2, group:"G", home:"Nueva Zelanda",   away:"Egipto",         date:"2026-06-21", time:"19:00"},
  {id:41, jornada:2, group:"J", home:"Argentina",       away:"Austria",        date:"2026-06-22", time:"11:00"},
  {id:42, jornada:2, group:"I", home:"Francia",         away:"Iraq",           date:"2026-06-22", time:"15:00"},
  {id:43, jornada:2, group:"I", home:"Noruega",         away:"Senegal",        date:"2026-06-22", time:"18:00"},
  {id:44, jornada:2, group:"J", home:"Jordania",        away:"Argelia",        date:"2026-06-22", time:"21:00"},
  {id:45, jornada:2, group:"K", home:"Portugal",        away:"Uzbekistán",     date:"2026-06-23", time:"11:00"},
  {id:46, jornada:2, group:"L", home:"Inglaterra",      away:"Ghana",          date:"2026-06-23", time:"14:00"},
  {id:47, jornada:2, group:"L", home:"Panamá",          away:"Croacia",        date:"2026-06-23", time:"17:00"},
  {id:48, jornada:2, group:"K", home:"Colombia",        away:"Congo RD",       date:"2026-06-23", time:"20:00"},
  {id:49, jornada:3, group:"B", home:"Suiza",           away:"Canadá",         date:"2026-06-24", time:"13:00"},
  {id:50, jornada:3, group:"B", home:"Bosnia y Herz.",  away:"Qatar",          date:"2026-06-24", time:"13:00"},
  {id:51, jornada:3, group:"C", home:"Escocia",         away:"Brasil",         date:"2026-06-24", time:"16:00"},
  {id:52, jornada:3, group:"C", home:"Marruecos",       away:"Haití",          date:"2026-06-24", time:"16:00"},
  {id:53, jornada:3, group:"A", home:"Chequia",         away:"México",         date:"2026-06-24", time:"19:00"},
  {id:54, jornada:3, group:"A", home:"Sudáfrica",       away:"Corea del Sur",  date:"2026-06-24", time:"19:00"},
  {id:55, jornada:3, group:"E", home:"Curazao",         away:"Costa de Marfil",date:"2026-06-25", time:"14:00"},
  {id:56, jornada:3, group:"E", home:"Ecuador",         away:"Alemania",       date:"2026-06-25", time:"14:00"},
  {id:57, jornada:3, group:"F", home:"Japón",           away:"Suecia",         date:"2026-06-25", time:"17:00"},
  {id:58, jornada:3, group:"F", home:"Túnez",           away:"Países Bajos",   date:"2026-06-25", time:"17:00"},
  {id:59, jornada:3, group:"D", home:"Turquía",         away:"Estados Unidos", date:"2026-06-25", time:"20:00"},
  {id:60, jornada:3, group:"D", home:"Paraguay",        away:"Australia",      date:"2026-06-25", time:"20:00"},
  {id:61, jornada:3, group:"I", home:"Noruega",         away:"Francia",        date:"2026-06-26", time:"13:00"},
  {id:62, jornada:3, group:"I", home:"Senegal",         away:"Iraq",           date:"2026-06-26", time:"13:00"},
  {id:63, jornada:3, group:"H", home:"Cabo Verde",      away:"Arabia Saudita", date:"2026-06-26", time:"18:00"},
  {id:64, jornada:3, group:"H", home:"Uruguay",         away:"España",         date:"2026-06-26", time:"18:00"},
  {id:65, jornada:3, group:"G", home:"Egipto",          away:"Irán",           date:"2026-06-26", time:"21:00"},
  {id:66, jornada:3, group:"G", home:"Nueva Zelanda",   away:"Bélgica",        date:"2026-06-26", time:"21:00"},
  {id:67, jornada:3, group:"L", home:"Panamá",          away:"Inglaterra",     date:"2026-06-27", time:"15:00"},
  {id:68, jornada:3, group:"L", home:"Croacia",         away:"Ghana",          date:"2026-06-27", time:"15:00"},
  {id:69, jornada:3, group:"K", home:"Colombia",        away:"Portugal",       date:"2026-06-27", time:"17:30"},
  {id:70, jornada:3, group:"K", home:"Congo RD",        away:"Uzbekistán",     date:"2026-06-27", time:"17:30"},
  {id:71, jornada:3, group:"J", home:"Argelia",         away:"Austria",        date:"2026-06-27", time:"20:00"},
  {id:72, jornada:3, group:"J", home:"Jordania",        away:"Argentina",      date:"2026-06-27", time:"20:00"},
];

const FLAGS = {
  "México":"🇲🇽","Sudáfrica":"🇿🇦","Corea del Sur":"🇰🇷","Chequia":"🇨🇿",
  "Canadá":"🇨🇦","Bosnia y Herz.":"🇧🇦","Qatar":"🇶🇦","Suiza":"🇨🇭",
  "Brasil":"🇧🇷","Marruecos":"🇲🇦","Haití":"🇭🇹","Escocia":"🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  "Estados Unidos":"🇺🇸","Paraguay":"🇵🇾","Australia":"🇦🇺","Turquía":"🇹🇷",
  "Alemania":"🇩🇪","Curazao":"🇨🇼","Costa de Marfil":"🇨🇮","Ecuador":"🇪🇨",
  "Países Bajos":"🇳🇱","Japón":"🇯🇵","Suecia":"🇸🇪","Túnez":"🇹🇳",
  "Bélgica":"🇧🇪","Egipto":"🇪🇬","Irán":"🇮🇷","Nueva Zelanda":"🇳🇿",
  "España":"🇪🇸","Cabo Verde":"🇨🇻","Arabia Saudita":"🇸🇦","Uruguay":"🇺🇾",
  "Francia":"🇫🇷","Senegal":"🇸🇳","Iraq":"🇮🇶","Noruega":"🇳🇴",
  "Argentina":"🇦🇷","Argelia":"🇩🇿","Austria":"🇦🇹","Jordania":"🇯🇴",
  "Portugal":"🇵🇹","Congo RD":"🇨🇩","Uzbekistán":"🇺🇿","Colombia":"🇨🇴",
  "Inglaterra":"🏴󠁧󠁢󠁥󠁮󠁧󠁿","Croacia":"🇭🇷","Ghana":"🇬🇭","Panamá":"🇵🇦",
};

const ABBR = {
  "México":"MEX","Sudáfrica":"RSA","Corea del Sur":"KOR","Chequia":"CZE",
  "Canadá":"CAN","Bosnia y Herz.":"BIH","Qatar":"QAT","Suiza":"SUI",
  "Brasil":"BRA","Marruecos":"MAR","Haití":"HAI","Escocia":"SCO",
  "Estados Unidos":"USA","Paraguay":"PAR","Australia":"AUS","Turquía":"TUR",
  "Alemania":"GER","Curazao":"CUW","Costa de Marfil":"CIV","Ecuador":"ECU",
  "Países Bajos":"NED","Japón":"JPN","Suecia":"SWE","Túnez":"TUN",
  "Bélgica":"BEL","Egipto":"EGY","Irán":"IRN","Nueva Zelanda":"NZL",
  "España":"ESP","Cabo Verde":"CPV","Arabia Saudita":"KSA","Uruguay":"URU",
  "Francia":"FRA","Senegal":"SEN","Iraq":"IRQ","Noruega":"NOR",
  "Argentina":"ARG","Argelia":"ALG","Austria":"AUT","Jordania":"JOR",
  "Portugal":"POR","Congo RD":"COD","Uzbekistán":"UZB","Colombia":"COL",
  "Inglaterra":"ENG","Croacia":"CRO","Ghana":"GHA","Panamá":"PAN",
};

const DAYS_ES = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const MONTHS_ES = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
const formatDate = (s) => {
  const [y,m,d] = s.split("-").map(Number);
  const dt = new Date(y,m-1,d);
  return `${DAYS_ES[dt.getDay()]} ${d} ${MONTHS_ES[m-1]}`;
};

const getResult = (hg,ag) => { if (hg==null||ag==null) return null; return hg>ag?"H":ag>hg?"A":"D"; };
const calcScore = (pred,real) => {
  if (!pred||real.homeGoals==null||real.awayGoals==null||pred.home==null||pred.away==null) return null;
  let pts=0;
  if (getResult(Number(pred.home),Number(pred.away))===getResult(real.homeGoals,real.awayGoals)) pts++;
  if (Number(pred.home)===real.homeGoals) pts++;
  if (Number(pred.away)===real.awayGoals) pts++;
  return pts;
};

// ─── STYLES ───────────────────────────────────────────────────────────────────

const C = {red:"#e94560",bg:"#0d0d1a",card:"rgba(255,255,255,0.04)",border:"rgba(233,69,96,0.2)",blue:"#0f3460"};
const inp = {background:C.blue,border:"1px solid #444",borderRadius:8,color:"#fff",padding:"10px 14px",fontSize:15,outline:"none",width:"100%",boxSizing:"border-box"};
const card = {background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:20,marginBottom:16};
const sec = {fontSize:13,fontWeight:700,textTransform:"uppercase",letterSpacing:2,color:C.red,marginBottom:12};
const row = {display:"flex",alignItems:"center",padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,0.06)",gap:6,flexWrap:"nowrap",overflowX:"auto"};
const btn = (v="primary") => ({
  background:v==="primary"?C.red:v==="success"?"#1b7f4a":"transparent",
  border:v==="outline"?`1px solid ${C.red}`:"none",
  color:v==="outline"?C.red:"#fff",
  borderRadius:8,padding:"10px 20px",cursor:"pointer",fontSize:14,fontWeight:700,
});
const pill = (color) => ({background:color||"#1a1a2e",borderRadius:20,padding:"2px 8px",fontSize:11,fontWeight:700,color:"#fff",display:"inline-block",whiteSpace:"nowrap"});

// ─── COMPONENTS ───────────────────────────────────────────────────────────────

const ScoreInput = ({value,onChange,disabled}) => (
  <input type="number" min="0" max="20"
    value={value==null?"":value}
    onChange={e=>onChange(e.target.value===""?null:Number(e.target.value))}
    disabled={disabled}
    style={{width:44,textAlign:"center",background:disabled?"#1a1a2e":C.blue,border:`1px solid ${C.red}`,borderRadius:6,color:"#fff",fontSize:18,fontWeight:700,padding:"4px 0",outline:"none"}}
  />
);

const DateHeader = ({dateStr}) => (
  <div style={{fontSize:12,fontWeight:700,color:C.red,textTransform:"uppercase",letterSpacing:1,padding:"12px 0 4px",borderTop:"1px solid rgba(233,69,96,0.15)",marginTop:6}}>
    📅 {formatDate(dateStr)}
  </div>
);

const Flash = ({msg}) => msg ? (
  <div style={{background:"rgba(27,127,74,0.2)",border:"1px solid #1b7f4a",color:"#4ade80",borderRadius:6,padding:"3px 12px",fontSize:12,fontWeight:700}}>{msg}</div>
) : null;

// ─── MODAL DE CONTRASEÑA ──────────────────────────────────────────────────────

const PasswordModal = ({participant, onSuccess, onCancel, isNew}) => {
  const [pass, setPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (isNew) {
      if (!pass.trim()) { setError("Pon una contraseña"); return; }
      if (pass !== confirmPass) { setError("Las contraseñas no coinciden"); return; }
      onSuccess(pass);
    } else {
      if (pass === participant.password) { onSuccess(); }
      else { setError("Contraseña incorrecta"); setPass(""); }
    }
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200}}>
      <div style={{...card,width:320,margin:0,padding:28}}>
        <div style={{fontWeight:900,fontSize:18,marginBottom:4}}>
          {isNew ? "Crea tu contraseña" : `Hola, ${participant.name}`}
        </div>
        <div style={{color:"#888",fontSize:13,marginBottom:20}}>
          {isNew ? "Solo tú la sabrás. No se puede recuperar." : "Ingresa tu contraseña para continuar."}
        </div>
        <input
          style={{...inp,marginBottom:10}}
          type="password"
          placeholder="Contraseña"
          value={pass}
          onChange={e=>setPass(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&(isNew?setConfirmPass(""):handleSubmit())}
          autoFocus
        />
        {isNew && (
          <input
            style={{...inp,marginBottom:10}}
            type="password"
            placeholder="Confirmar contraseña"
            value={confirmPass}
            onChange={e=>setConfirmPass(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&handleSubmit()}
          />
        )}
        {error && <div style={{color:C.red,fontSize:12,marginBottom:10}}>{error}</div>}
        <div style={{display:"flex",gap:8,marginTop:4}}>
          <button style={{...btn("outline"),flex:1}} onClick={onCancel}>Cancelar</button>
          <button style={{...btn(),flex:1}} onClick={handleSubmit}>Entrar</button>
        </div>
      </div>
    </div>
  );
};

// ─── SCREENS ──────────────────────────────────────────────────────────────────

const HomeScreen = ({participants,adminAuth,participantName,setParticipantName,passInput,setPassInput,passError,handleNewParticipant,handleAdminLogin,handleSelectParticipant,setScreen}) => (
  <div style={{maxWidth:520,margin:"0 auto",padding:"24px 16px"}}>
    <div style={{textAlign:"center",marginBottom:32}}>
      <div style={{fontSize:60,marginBottom:8}}>⚽</div>
      <h1 style={{fontSize:28,fontWeight:900,margin:0,color:"#fff"}}>Quiniela <span style={{color:C.red}}>Mundial 2026</span></h1>
      <p style={{color:"#888",marginTop:8,fontSize:14}}>48 equipos · 12 grupos · 72 partidos · 11 Jun – 27 Jun</p>
    </div>

    <div style={card}>
      <div style={sec}>Soy participante</div>
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        <input style={inp} placeholder="Tu nombre (nuevo)" value={participantName}
          onChange={e=>setParticipantName(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&handleNewParticipant()} />
        <button style={{...btn(),whiteSpace:"nowrap"}} onClick={handleNewParticipant}>Registrarme</button>
      </div>
      {participants.length>0&&(
        <>
          <div style={{color:"#888",fontSize:12,marginBottom:8}}>Ya tengo cuenta — selecciona tu nombre:</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            {participants.map(p=>(
              <button key={p.id} style={btn("outline")} onClick={()=>handleSelectParticipant(p)}>
                {p.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>

    <div style={card}>
      <div style={sec}>Acceso Administrador</div>
      {!adminAuth?(
        <div style={{display:"flex",gap:8}}>
          <input style={inp} type="password" placeholder="Contraseña" value={passInput}
            onChange={e=>setPassInput(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&handleAdminLogin()} />
          <button style={btn()} onClick={handleAdminLogin}>Entrar</button>
        </div>
      ):(
        <button style={btn()} onClick={()=>setScreen("admin")}>Panel de Admin</button>
      )}
      {passError&&<div style={{color:C.red,fontSize:12,marginTop:6}}>Contraseña incorrecta</div>}
      {!adminAuth&&<div style={{color:"#555",fontSize:11,marginTop:6}}>Contraseña inicial: admin123</div>}
    </div>

    <button style={{...btn("outline"),width:"100%",marginTop:4}} onClick={()=>setScreen("ranking")}>
      🏆 Ver Tabla General
    </button>
  </div>
);

const AdminScreen = ({participants,results,openJornadas,savedMsg,handleResultChange,toggleJornada,newAdminPass,setNewAdminPass,handleChangePass,ranking,handleDeleteParticipant}) => {
  const [gFilter,setGFilter] = useState("Todos");
  const [jFilter,setJFilter] = useState(0);
  const [confirmDelete,setConfirmDelete] = useState(null); // participant id
  const groups=[...new Set(ALL_MATCHES.map(m=>m.group))];
  const filtered=ALL_MATCHES.filter(m=>(gFilter==="Todos"||m.group===gFilter)&&(jFilter===0||m.jornada===jFilter));
  const byDate=filtered.reduce((acc,m)=>{if(!acc[m.date])acc[m.date]=[];acc[m.date].push(m);return acc;},{});

  return (
    <div style={{maxWidth:800,margin:"0 auto",padding:"20px 16px"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:8}}>
        <div>
          <div style={{fontSize:20,fontWeight:900}}>Panel de <span style={{color:C.red}}>Administrador</span></div>
          <div style={{fontSize:12,color:"#888"}}>{participants.length} participante(s)</div>
        </div>
        <Flash msg={savedMsg}/>
      </div>

      <div style={card}>
        <div style={sec}>Control de Jornadas</div>
        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
          {[1,2,3].map(j=>{
            const dates={1:"11–17 Jun",2:"18–23 Jun",3:"24–27 Jun"};
            return (
              <div key={j} style={{flex:1,background:openJornadas[j]?"rgba(27,127,74,0.15)":"rgba(233,69,96,0.08)",border:"1px solid "+(openJornadas[j]?"#1b7f4a":"#333"),borderRadius:10,padding:"14px 16px",textAlign:"center",minWidth:120}}>
                <div style={{fontWeight:800,fontSize:15,marginBottom:2}}>Jornada {j}</div>
                <div style={{fontSize:10,color:"#666",marginBottom:6}}>{dates[j]}</div>
                <div style={{fontSize:11,color:openJornadas[j]?"#4ade80":"#888",marginBottom:10}}>{openJornadas[j]?"🟢 ABIERTA":"🔴 CERRADA"}</div>
                <button style={btn(openJornadas[j]?"success":"outline")} onClick={()=>toggleJornada(j)}>
                  {openJornadas[j]?"Cerrar":"Abrir"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div style={card}>
        <div style={sec}>Capturar Resultados</div>
        <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
          <select style={{...inp,width:"auto"}} value={gFilter} onChange={e=>setGFilter(e.target.value)}>
            <option value="Todos">Todos los grupos</option>
            {groups.map(g=><option key={g} value={g}>Grupo {g}</option>)}
          </select>
          <select style={{...inp,width:"auto"}} value={jFilter} onChange={e=>setJFilter(Number(e.target.value))}>
            <option value={0}>Todas las jornadas</option>
            <option value={1}>Jornada 1 (11–17 Jun)</option>
            <option value={2}>Jornada 2 (18–23 Jun)</option>
            <option value={3}>Jornada 3 (24–27 Jun)</option>
          </select>
        </div>
        {Object.entries(byDate).map(([date,matches])=>(
          <div key={date}>
            <DateHeader dateStr={date}/>
            {matches.map(m=>{
              const r=results[m.id]||{};
              const done=r.homeGoals!=null&&r.awayGoals!=null;
              return (
                <div key={m.id} style={row}>
                  <div style={{display:"flex",gap:4,flexShrink:0}}>
                    <span style={pill("#1a1a2e")}>G{m.group}</span>
                    <span style={pill("#0f2d6e")}>J{m.jornada}</span>
                    <span style={{fontSize:11,color:"#666",alignSelf:"center"}}>{m.time}</span>
                  </div>
                  <div style={{flex:1,display:"flex",alignItems:"center",gap:8,justifyContent:"flex-end"}}>
                    <span style={{fontSize:13,color:"#ccc",fontWeight:600,minWidth:52,textAlign:"right"}}>{FLAGS[m.home]||"🏳️"} {ABBR[m.home]||m.home}</span>
                    <ScoreInput value={r.homeGoals} onChange={v=>handleResultChange(m.id,"homeGoals",v)}/>
                    <span style={{color:"#555",fontSize:12}}>-</span>
                    <ScoreInput value={r.awayGoals} onChange={v=>handleResultChange(m.id,"awayGoals",v)}/>
                    <span style={{fontSize:13,color:"#ccc",fontWeight:600,minWidth:52}}>{ABBR[m.away]||m.away} {FLAGS[m.away]||"🏳️"}</span>
                    {done&&<span style={{background:"rgba(27,127,74,0.2)",border:"1px solid #1b7f4a",color:"#4ade80",borderRadius:6,padding:"2px 8px",fontSize:11,fontWeight:700}}>✓</span>}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div style={card}>
        <div style={sec}>Cambiar Contraseña Admin</div>
        <div style={{display:"flex",gap:8}}>
          <input style={inp} type="password" placeholder="Nueva contraseña" value={newAdminPass} onChange={e=>setNewAdminPass(e.target.value)}/>
          <button style={btn()} onClick={handleChangePass}>Cambiar</button>
        </div>
      </div>

      <div style={card}>
        <div style={sec}>Participantes ({participants.length})</div>
        {participants.length===0
          ?<div style={{color:"#555",fontSize:13}}>Aún no hay participantes.</div>
          :participants.map(p=>{
            const pr=ranking.find(r=>r.id===p.id);
            return (
              <div key={p.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,0.05)",gap:8}}>
                <span style={{fontWeight:600,flex:1}}>{p.name}</span>
                <span style={{color:C.red,fontWeight:700,minWidth:50,textAlign:"right"}}>{pr?.total??0} pts</span>
                {confirmDelete===p.id?(
                  <div style={{display:"flex",gap:6,alignItems:"center"}}>
                    <span style={{fontSize:12,color:"#f87171"}}>¿Eliminar?</span>
                    <button onClick={()=>{handleDeleteParticipant(p.id);setConfirmDelete(null);}}
                      style={{background:"#7f1b1b",border:"none",color:"#fff",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:12,fontWeight:700}}>
                      Sí
                    </button>
                    <button onClick={()=>setConfirmDelete(null)}
                      style={{background:"#333",border:"none",color:"#fff",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:12,fontWeight:700}}>
                      No
                    </button>
                  </div>
                ):(
                  <button onClick={()=>setConfirmDelete(p.id)}
                    style={{background:"transparent",border:"1px solid #444",color:"#888",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:12,fontWeight:700}}>
                    🗑️
                  </button>
                )}
              </div>
            );
          })
        }
      </div>
    </div>
  );
};

const ParticipantScreen = ({activeParticipant,openJornadas,results,currentPreds,handlePredChange,savePredictions,savedMsg,ranking,activeParticipantId}) => {
  if (!activeParticipant) return null;
  const openJs=Object.entries(openJornadas).filter(([,v])=>v).map(([k])=>Number(k));
  const available=ALL_MATCHES.filter(m=>openJs.includes(m.jornada));
  const dateLabelRange={1:"11–17 Jun",2:"18–23 Jun",3:"24–27 Jun"};

  return (
    <div style={{maxWidth:700,margin:"0 auto",padding:"20px 16px"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:8}}>
        <div>
          <div style={{fontSize:20,fontWeight:900}}>Hola, <span style={{color:C.red}}>{activeParticipant.name}</span></div>
          <div style={{fontSize:12,color:"#888"}}>
            {openJs.length>0?`Jornada(s) disponible(s): ${openJs.map(j=>"J"+j).join(", ")}`:"No hay jornadas abiertas."}
          </div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <Flash msg={savedMsg}/>
          {available.length>0&&<button style={btn()} onClick={savePredictions}>Guardar quiniela</button>}
        </div>
      </div>

      {available.length===0?(
        <div style={{...card,textAlign:"center",padding:40}}>
          <div style={{fontSize:40,marginBottom:12}}>🔒</div>
          <div style={{color:"#888"}}>No hay jornadas abiertas. El admin las abrirá cuando sea momento.</div>
        </div>
      ):(
        [1,2,3].map(j=>{
          if (!openJornadas[j]) return null;
          const jMatches=available.filter(m=>m.jornada===j);
          const byDate=jMatches.reduce((acc,m)=>{if(!acc[m.date])acc[m.date]=[];acc[m.date].push(m);return acc;},{});
          return (
            <div key={j} style={card}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                <div style={sec}>Jornada {j} <span style={{color:"#555",fontSize:11,letterSpacing:0}}>· {dateLabelRange[j]}</span></div>
                <button style={{...btn(),padding:"6px 14px",fontSize:13}} onClick={savePredictions}>Guardar J{j}</button>
              </div>
              {Object.entries(byDate).map(([date,matches])=>(
                <div key={date}>
                  <DateHeader dateStr={date}/>
                  {matches.map(m=>{
                    const pred=currentPreds[m.id]||{};
                    const r=results[m.id];
                    const done=r&&r.homeGoals!=null&&r.awayGoals!=null;
                    const pts=done?calcScore(pred,r):null;
                    return (
                      <div key={m.id} style={row}>
                        <div style={{display:"flex",gap:4,flexShrink:0,alignItems:"center"}}>
                          <span style={pill("#0f2d6e")}>G{m.group}</span>
                          <span style={{fontSize:11,color:"#666"}}>{m.time}</span>
                        </div>
                        <div style={{flex:1,display:"flex",alignItems:"center",gap:8,justifyContent:"flex-end"}}>
                          <span style={{fontSize:13,color:"#ccc",fontWeight:600,minWidth:52,textAlign:"right"}}>{FLAGS[m.home]||"🏳️"} {ABBR[m.home]||m.home}</span>
                          <ScoreInput value={pred.home} onChange={v=>handlePredChange(m.id,"home",v)} disabled={done}/>
                          <span style={{color:"#555",fontSize:12}}>-</span>
                          <ScoreInput value={pred.away} onChange={v=>handlePredChange(m.id,"away",v)} disabled={done}/>
                          <span style={{fontSize:13,color:"#ccc",fontWeight:600,minWidth:52}}>{ABBR[m.away]||m.away} {FLAGS[m.away]||"🏳️"}</span>
                          {done&&pts!==null&&(
                            <span style={{...pill(pts===3?"#1b7f4a":pts===0?"#7f1b1b":"#7f5a00"),minWidth:36,textAlign:"center"}}>
                              {pts}pt{pts!==1?"s":""}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          );
        })
      )}

      {(ranking.find(r=>r.id===activeParticipantId)?.total??0)>0&&(
        <div style={{...card,textAlign:"center"}}>
          <div style={sec}>Mis puntos acumulados</div>
          <div style={{fontSize:48,fontWeight:900,color:C.red}}>{ranking.find(r=>r.id===activeParticipantId)?.total}</div>
          <div style={{color:"#888",fontSize:13}}>puntos totales</div>
        </div>
      )}
    </div>
  );
};

const RankingScreen = ({ranking,results,participants,openJornadas}) => {
  const medals=["🥇","🥈","🥉"];
  const maxPts=ranking[0]?.total||1;
  const jugados=Object.values(results).filter(r=>r.homeGoals!=null).length;
  return (
    <div style={{maxWidth:600,margin:"0 auto",padding:"20px 16px"}}>
      <div style={{fontSize:22,fontWeight:900,marginBottom:4}}>🏆 Tabla <span style={{color:C.red}}>General</span></div>
      <div style={{fontSize:12,color:"#888",marginBottom:20}}>1pt ganador/empate · 1pt goles local · 1pt goles visitante</div>
      {ranking.length===0?(
        <div style={{...card,textAlign:"center",padding:40}}>
          <div style={{fontSize:40,marginBottom:12}}>👥</div>
          <div style={{color:"#888"}}>Aún no hay participantes ni resultados.</div>
        </div>
      ):ranking.map((p,i)=>(
        <div key={p.id} style={{...card,display:"flex",alignItems:"center",gap:14,padding:"14px 18px",
          background:i===0?"rgba(233,69,96,0.08)":C.card,
          border:`1px solid ${i===0?"rgba(233,69,96,0.4)":C.border}`}}>
          <div style={{fontSize:i<3?26:18,fontWeight:900,minWidth:36,textAlign:"center",color:i>=3?"#555":undefined}}>
            {i<3?medals[i]:`#${i+1}`}
          </div>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,fontSize:16}}>{p.name}</div>
            <div style={{marginTop:6,background:"rgba(255,255,255,0.06)",borderRadius:4,height:6,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${Math.round((p.total/maxPts)*100)}%`,background:i===0?C.red:C.blue,borderRadius:4}}/>
            </div>
            <div style={{fontSize:11,color:"#666",marginTop:4}}>{p.played} partidos con pronóstico</div>
          </div>
          <div style={{fontSize:28,fontWeight:900,color:i===0?C.red:"#e8e8f0"}}>
            {p.total}<span style={{fontSize:12,color:"#888",fontWeight:400}}> pts</span>
          </div>
        </div>
      ))}
      <div style={{...card,marginTop:8}}>
        <div style={sec}>Estado del Torneo</div>
        <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
          {[
            {label:"Partidos jugados",value:`${jugados}/72`},
            {label:"Participantes",value:participants.length},
            {label:"Jornadas abiertas",value:`${Object.values(openJornadas).filter(Boolean).length}/3`},
          ].map(s=>(
            <div key={s.label} style={{flex:1,textAlign:"center",minWidth:100}}>
              <div style={{fontSize:24,fontWeight:900,color:C.red}}>{s.value}</div>
              <div style={{fontSize:11,color:"#888"}}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export default function QuinielaMundial() {
  const [screen,setScreen] = useState("home");
  const [adminAuth,setAdminAuth] = useState(false);
  const [adminPass,setAdminPass] = useState("admin123");
  const [passInput,setPassInput] = useState("");
  const [passError,setPassError] = useState(false);
  const [participantName,setParticipantName] = useState("");
  const [newAdminPass,setNewAdminPass] = useState("");
  const [results,setResults] = useState({});
  const [participants,setParticipants] = useState([]);
  const [openJornadas,setOpenJornadas] = useState({1:false,2:false,3:false});
  const [loaded,setLoaded] = useState(false);
  const [activeParticipantId,setActiveParticipantId] = useState(null);
  const [currentPreds,setCurrentPreds] = useState({});
  const [savedMsg,setSavedMsg] = useState("");

  // Modal contraseña
  const [modal,setModal] = useState(null); // {type: "new"|"login", participant}

  useEffect(()=>{
    Promise.all([db.getConfig(),db.getParticipants(),db.getResults()])
      .then(([cfg,parts,res])=>{
        if (cfg.open_jornadas) setOpenJornadas(cfg.open_jornadas);
        if (cfg.admin_pass) setAdminPass(cfg.admin_pass);
        setParticipants(parts);
        setResults(res);
        setLoaded(true);
      }).catch(()=>setLoaded(true));
  },[]);

  useEffect(()=>{
    const interval=setInterval(async()=>{
      const [parts,res]=await Promise.all([db.getParticipants(),db.getResults()]);
      setParticipants(parts);
      setResults(res);
    },15000);
    return ()=>clearInterval(interval);
  },[]);

  const flash=(msg="✅ Guardado")=>{setSavedMsg(msg);setTimeout(()=>setSavedMsg(""),2500);};

  const enterAsParticipant = (p) => {
    setActiveParticipantId(p.id);
    setCurrentPreds({...(p.predictions||{})});
    setScreen("participant");
  };

  // Seleccionar participante existente → pide contraseña
  const handleSelectParticipant = useCallback((p)=>{
    setModal({type:"login", participant:p});
  },[]);

  // Registrar nuevo participante → pide crear contraseña
  const handleNewParticipant = useCallback(()=>{
    const name=participantName.trim();
    if (!name) return;
    if (participants.find(p=>p.name.toLowerCase()===name.toLowerCase())){
      flash("⚠️ Ese nombre ya existe, selecciónalo abajo");
      return;
    }
    setModal({type:"new", participant:{name}});
  },[participantName,participants]);

  // Confirmar nuevo participante con contraseña
  const handleNewWithPassword = useCallback(async(password)=>{
    const name=participantName.trim();
    const np={id:Date.now(), name, predictions:{}, password};
    await db.upsertParticipant(np);
    const updated=[...participants,np];
    setParticipants(updated);
    setParticipantName("");
    setModal(null);
    enterAsParticipant(np);
  },[participantName,participants]);

  const handleAdminLogin = useCallback(()=>{
    if (passInput===adminPass){setAdminAuth(true);setPassError(false);setScreen("admin");setPassInput("");}
    else setPassError(true);
  },[passInput,adminPass]);

  const handleResultChange = useCallback(async(matchId,field,val)=>{
    setResults(prev=>{
      const r=prev[matchId]||{};
      const updated={...r,[field]:val};
      const nr={...prev,[matchId]:updated};
      db.upsertResult(matchId,nr[matchId].homeGoals??null,nr[matchId].awayGoals??null);
      return nr;
    });
  },[]);

  const toggleJornada = useCallback(async(j)=>{
    const newOJ={...openJornadas,[j]:!openJornadas[j]};
    setOpenJornadas(newOJ);
    await db.setConfig("open_jornadas",newOJ);
    flash(newOJ[j]?`✅ Jornada ${j} abierta`:`🔒 Jornada ${j} cerrada`);
  },[openJornadas]);

  const handleChangePass = useCallback(async()=>{
    if (!newAdminPass.trim()) return;
    setAdminPass(newAdminPass);
    await db.setConfig("admin_pass",newAdminPass);
    setNewAdminPass("");
    flash("✅ Contraseña actualizada");
  },[newAdminPass]);

  const handlePredChange = useCallback((matchId,field,val)=>{
    setCurrentPreds(prev=>({...prev,[matchId]:{...(prev[matchId]||{}),[field]:val}}));
  },[]);

  const handleDeleteParticipant = useCallback(async(id)=>{
    await db.deleteParticipant(id);
    setParticipants(prev=>prev.filter(p=>p.id!==id));
    flash("🗑️ Participante eliminado");
  },[]);

  const savePredictions = useCallback(async()=>{
    const updated=participants.map(p=>p.id===activeParticipantId?{...p,predictions:{...currentPreds}}:p);
    setParticipants(updated);
    const me=updated.find(p=>p.id===activeParticipantId);
    if (me) await db.upsertParticipant(me);
    flash("✅ Quiniela guardada");
  },[activeParticipantId,currentPreds,participants]);

  const ranking=participants.map(p=>{
    let total=0,played=0;
    ALL_MATCHES.forEach(m=>{
      const r=results[m.id];
      const pred=(p.predictions||{})[m.id];
      if (r&&r.homeGoals!=null&&pred){
        const pts=calcScore(pred,r);
        if (pts!==null){total+=pts;played++;}
      }
    });
    return {...p,total,played};
  }).sort((a,b)=>b.total-a.total);

  const activeParticipant=participants.find(p=>p.id===activeParticipantId);

  if (!loaded) return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}>
      <div style={{fontSize:40}}>⚽</div>
      <div style={{color:C.red,fontSize:18,fontWeight:700}}>Cargando quiniela…</div>
    </div>
  );

  const navBtn=(active)=>({
    background:active?C.red:"transparent",border:`1px solid ${active?C.red:"#333"}`,
    color:active?"#fff":"#aaa",borderRadius:6,padding:"6px 14px",cursor:"pointer",fontSize:13,fontWeight:600,
  });

  return (
    <div style={{minHeight:"100vh",background:`linear-gradient(135deg,${C.bg} 0%,#0f1932 50%,${C.bg} 100%)`,fontFamily:"'Segoe UI',system-ui,sans-serif",color:"#e8e8f0"}}>

      {/* Modal contraseña */}
      {modal&&(
        modal.type==="new"?(
          <PasswordModal
            participant={modal.participant}
            isNew={true}
            onSuccess={handleNewWithPassword}
            onCancel={()=>setModal(null)}
          />
        ):(
          <PasswordModal
            participant={modal.participant}
            isNew={false}
            onSuccess={()=>{setModal(null);enterAsParticipant(modal.participant);}}
            onCancel={()=>setModal(null)}
          />
        )
      )}

      <div style={{background:"linear-gradient(90deg,#0f1932,#1a0a2e)",borderBottom:`2px solid ${C.red}`,padding:"12px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100}}>
        <div style={{fontSize:20,fontWeight:900,color:"#fff"}}>⚽ <span style={{color:C.red}}>QUINIELA</span> 2026</div>
        <nav style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          <button style={navBtn(screen==="home")} onClick={()=>setScreen("home")}>Inicio</button>
          {activeParticipant&&<button style={navBtn(screen==="participant")} onClick={()=>setScreen("participant")}>Mi Quiniela</button>}
          {adminAuth&&<button style={navBtn(screen==="admin")} onClick={()=>setScreen("admin")}>Admin</button>}
          <button style={navBtn(screen==="ranking")} onClick={()=>setScreen("ranking")}>Ranking</button>
        </nav>
      </div>

      {screen==="home"&&<HomeScreen participants={participants} adminAuth={adminAuth} participantName={participantName} setParticipantName={setParticipantName} passInput={passInput} setPassInput={setPassInput} passError={passError} handleNewParticipant={handleNewParticipant} handleAdminLogin={handleAdminLogin} handleSelectParticipant={handleSelectParticipant} setScreen={setScreen}/>}
      {screen==="admin"&&<AdminScreen participants={participants} results={results} openJornadas={openJornadas} savedMsg={savedMsg} handleResultChange={handleResultChange} toggleJornada={toggleJornada} newAdminPass={newAdminPass} setNewAdminPass={setNewAdminPass} handleChangePass={handleChangePass} ranking={ranking} handleDeleteParticipant={handleDeleteParticipant}/>}
      {screen==="participant"&&<ParticipantScreen activeParticipant={activeParticipant} openJornadas={openJornadas} results={results} currentPreds={currentPreds} handlePredChange={handlePredChange} savePredictions={savePredictions} savedMsg={savedMsg} ranking={ranking} activeParticipantId={activeParticipantId}/>}
      {screen==="ranking"&&<RankingScreen ranking={ranking} results={results} participants={participants} openJornadas={openJornadas}/>}
    </div>
  );
}
