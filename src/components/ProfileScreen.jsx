import { ALL_MATCHES, calcScore, isExact, isResultCorrect } from "../data/matches.js";
import { BADGE_DEFS, calcCoinsFromBadges } from "../data/badges.js";
import { C, card, sec } from "./ui.jsx";

export const ProfileScreen = ({ participant, results, earnedBadges, coins, quizAnswers }) => {
  if (!participant) return null;

  const pBadges = earnedBadges.filter(b => b.participant_id === participant.id);
  const pCoins = coins.find(c => c.participant_id === participant.id)?.total || 0;

  // Stats
  const finishedMatches = ALL_MATCHES.filter(m => results[m.id]?.homeGoals != null);
  let totalPts = 0, totalExact = 0, totalResult = 0;
  const byJornada = {1:{pts:0,played:0}, 2:{pts:0,played:0}, 3:{pts:0,played:0}};

  finishedMatches.forEach(m => {
    const pred = (participant.predictions||{})[m.id];
    const real = results[m.id];
    if (!pred) return;
    const pts = calcScore(pred, real) || 0;
    totalPts += pts;
    if (isExact(pred, real)) totalExact++;
    if (isResultCorrect(pred, real)) totalResult++;
    byJornada[m.jornada].pts += pts;
    byJornada[m.jornada].played++;
  });

  const jornadas = Object.entries(byJornada).filter(([,v]) => v.played > 0);
  const bestJ = jornadas.length > 0 ? jornadas.reduce((a,b) => b[1].pts > a[1].pts ? b : a) : null;
  const worstJ = jornadas.length > 0 ? jornadas.reduce((a,b) => b[1].pts < a[1].pts ? b : a) : null;

  // Badge counts with jornada info
  const badgeCounts = {};
  pBadges.forEach(b => {
    if (!badgeCounts[b.badge_key]) badgeCounts[b.badge_key] = { count: 0, jornadas: [] };
    badgeCounts[b.badge_key].count++;
    badgeCounts[b.badge_key].jornadas.push(b.jornada);
  });
  const sortedBadges = Object.entries(badgeCounts).sort((a,b) => b[1].count - a[1].count);

  // Quiz history
  const quizHistory = quizAnswers ? (() => {
    const byLabel = {};
    quizAnswers.forEach(a => {
      if (!a.quiz_label) return;
      if (!byLabel[a.quiz_label]) byLabel[a.quiz_label] = { correct: 0, total: 0, coins: 0 };
      byLabel[a.quiz_label].total++;
      if (a.is_correct) byLabel[a.quiz_label].correct++;
      byLabel[a.quiz_label].coins += a.coins_earned || 0;
    });
    return Object.entries(byLabel).sort((a,b) => {
      const na = parseInt(a[0].replace("quiz-",""));
      const nb = parseInt(b[0].replace("quiz-",""));
      return na - nb;
    });
  })() : [];

  return (
    <div style={{ maxWidth:600, margin:"0 auto", padding:"20px 16px" }}>
      {/* Header */}
      <div style={{ ...card, textAlign:"center", padding:"24px 20px" }}>
        <div style={{ fontSize:48, marginBottom:8 }}>👤</div>
        <div style={{ fontSize:24, fontWeight:900 }}>{participant.name}</div>
        <div style={{ display:"flex", justifyContent:"center", gap:24, marginTop:16 }}>
          <div>
            <div style={{ fontSize:28, fontWeight:900, color:C.red }}>{totalPts}</div>
            <div style={{ fontSize:11, color:"#888" }}>pts totales</div>
          </div>
          <div>
            <div style={{ fontSize:28, fontWeight:900, color:"#fbbf24" }}>{pCoins>=0?`+${pCoins}`:pCoins}</div>
            <div style={{ fontSize:11, color:"#888" }}>FIFA Coins 🪙</div>
          </div>
          <div>
            <div style={{ fontSize:28, fontWeight:900, color:"#4ade80" }}>{totalExact}</div>
            <div style={{ fontSize:11, color:"#888" }}>exactos ⚡</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={card}>
        <div style={sec}>📊 Resumen</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          {[
            { label:"Total de aciertos", value:totalResult },
            { label:"Marcadores exactos", value:totalExact },
            { label:"Mejor jornada", value:bestJ?`J${bestJ[0]} (${bestJ[1].pts}pts)`:"—" },
            { label:"Peor jornada", value:worstJ?`J${worstJ[0]} (${worstJ[1].pts}pts)`:"—" },
            { label:"Partidos jugados", value:finishedMatches.filter(m=>(participant.predictions||{})[m.id]).length },
            { label:"Promedio pts/jornada", value:jornadas.length>0?(totalPts/jornadas.length).toFixed(1):"—" },
          ].map(s=>(
            <div key={s.label} style={{ background:"rgba(255,255,255,0.04)", borderRadius:8, padding:"10px 14px" }}>
              <div style={{ fontSize:11, color:"#888", marginBottom:4 }}>{s.label}</div>
              <div style={{ fontSize:18, fontWeight:700, color:C.red }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Por jornada */}
      <div style={card}>
        <div style={sec}>📅 Por jornada</div>
        <div style={{ display:"flex", gap:10 }}>
          {[1,2,3].map(j => (
            <div key={j} style={{ flex:1, background:"rgba(255,255,255,0.04)", borderRadius:8, padding:"12px", textAlign:"center" }}>
              <div style={{ fontSize:12, color:"#888", marginBottom:4 }}>Jornada {j}</div>
              <div style={{ fontSize:24, fontWeight:900, color:byJornada[j].played>0?C.red:"#444" }}>{byJornada[j].pts}</div>
              <div style={{ fontSize:11, color:"#555" }}>{byJornada[j].played} partidos</div>
            </div>
          ))}
        </div>
      </div>

      {/* Badges */}
      {sortedBadges.length > 0 && (
        <div style={card}>
          <div style={sec}>🏅 Badges acumulados ({pBadges.length})</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
            {sortedBadges.map(([key, info]) => {
              const def = BADGE_DEFS[key];
              if (!def) return null;
              return (
                <div key={key} style={{ background:"rgba(255,255,255,0.06)", border:`1px solid rgba(255,255,255,0.1)`, borderRadius:10, padding:"10px 14px", textAlign:"center", minWidth:90 }}>
                  <div style={{ fontSize:28 }}>{def.emoji}</div>
                  <div style={{ fontSize:11, fontWeight:700, color:"#ccc", marginTop:4 }}>{def.name}</div>
                  {info.count > 1 && <div style={{ fontSize:10, color:C.red, fontWeight:700 }}>×{info.count}</div>}
                  <div style={{ fontSize:10, color:"#555", marginTop:2 }}>
                    {info.jornadas.filter(j=>j>0).map(j=>`J${j}`).join(", ")}
                  </div>
                  <div style={{ fontSize:10, color:def.coins>=0?"#4ade80":"#f87171", fontWeight:700, marginTop:2 }}>
                    {def.coins>0?`+${def.coins}`:def.coins} 🪙
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quiz history */}
      {quizHistory.length > 0 && (
        <div style={card}>
          <div style={sec}>🧠 Historial de Quizzes</div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {quizHistory.map(([label, data]) => {
              const num = label.replace("quiz-","");
              const pct = data.total > 0 ? Math.round((data.correct/data.total)*100) : 0;
              return (
                <div key={label} style={{ display:"flex", alignItems:"center", gap:12, background:"rgba(255,255,255,0.04)", borderRadius:8, padding:"10px 14px" }}>
                  <div style={{ fontSize:14, fontWeight:700, color:C.red, minWidth:80 }}>Quiz {num}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                      <span style={{ fontSize:12, color:"#888" }}>{data.correct}/{data.total} correctas</span>
                      <span style={{ fontSize:12, color:"#fbbf24", fontWeight:700 }}>+{data.coins} 🪙</span>
                    </div>
                    <div style={{ height:4, background:"rgba(255,255,255,0.08)", borderRadius:2 }}>
                      <div style={{ height:"100%", width:`${pct}%`, background:pct===100?"#4ade80":pct>=60?C.red:"#f87171", borderRadius:2 }}/>
                    </div>
                  </div>
                  <div style={{ fontSize:20 }}>{pct===100?"🌟":pct>=60?"✅":"😅"}</div>
                </div>
              );
            })}
          </div>
          <div style={{ fontSize:12, color:"#888", marginTop:10, textAlign:"center" }}>
            {quizHistory.length} quiz{quizHistory.length!==1?"zes":""} completado{quizHistory.length!==1?"s":""}
          </div>
        </div>
      )}

      {/* FIFA Coins desglose */}
      <div style={card}>
        <div style={sec}>🪙 FIFA Coins</div>
        <div style={{ textAlign:"center", padding:"8px 0 16px" }}>
          <div style={{ fontSize:40, fontWeight:900, color:"#fbbf24" }}>{pCoins >= 0 ? `+${pCoins}` : pCoins}</div>
          <div style={{ fontSize:13, color:"#888", marginTop:4 }}>coins acumuladas en el torneo</div>
        </div>
        {sortedBadges.length > 0 && (
          <div>
            {sortedBadges.map(([key, info]) => {
              const def = BADGE_DEFS[key];
              if (!def || def.coins === 0) return null;
              const total = def.coins * info.count;
              return (
                <div key={key} style={{ display:"flex", justifyContent:"space-between", padding:"4px 0", borderBottom:"1px solid rgba(255,255,255,0.05)", fontSize:13 }}>
                  <span>{def.emoji} {def.name} {info.count>1?`×${info.count}`:""}</span>
                  <span style={{ color: total>=0?"#4ade80":"#f87171", fontWeight:700 }}>{total>=0?`+${total}`:total} 🪙</span>
                </div>
              );
            })}
            {quizHistory.length > 0 && (
              <div style={{ display:"flex", justifyContent:"space-between", padding:"4px 0", borderBottom:"1px solid rgba(255,255,255,0.05)", fontSize:13 }}>
                <span>🧠 Quiz ({quizHistory.length} completados)</span>
                <span style={{ color:"#4ade80", fontWeight:700 }}>+{quizHistory.reduce((sum,[,d])=>sum+d.coins,0)} 🪙</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
