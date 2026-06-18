import { useState } from "react";
import { BADGE_DEFS } from "../data/badges.js";
import { C, card, sec } from "./ui.jsx";

export const BadgesScreen = ({ participants, earnedBadges }) => {
  const [selected, setSelected] = useState(null);

  const badgeStats = {};
  Object.keys(BADGE_DEFS).forEach(key => {
    const earned = earnedBadges.filter(b => b.badge_key === key);
    badgeStats[key] = {
      total: earned.length,
      winners: [...new Set(earned.map(b => b.participant_id))],
    };
  });

  const howTo = {
    EZ:           "Se otorga cada vez que aciertas el marcador exacto de un partido.",
    GRITALO:      "Al que más marcadores exactos acierte en toda la jornada.",
    SO_HOT:       "Si aciertas entre 5 y 7 resultados correctos en la jornada.",
    ON_FIRE:      "Si aciertas entre 8 y 10 resultados correctos en la jornada.",
    MODO_BESTIA:  "Si aciertas entre 11 y 13 resultados correctos en la jornada.",
    EN_SU_PRIME:  "Si aciertas 14 o más resultados correctos en la jornada.",
    MIL_IQ:       "Al que acierte el resultado del partido más sorpresivo de la jornada (el que menos gente acertó).",
    HACKER:       "Si eres el único de todo el grupo en acertar el marcador exacto de un partido.",
    ALMANAQUE:    "Si aciertas todos los resultados de todos los partidos de un mismo día.",
    CHATGPT:      "Al participante con el peor porcentaje de aciertos del día.",
    DELULU:       "Al que tenga el pronóstico más alejado de la realidad en todos los partidos de un mismo día.",
    CASITA:       "Al que acumule más DELULUs en toda la jornada.",
    QUE_BURRO:    "Si no sumas ningún punto en un partido donde todos los demás sí sumaron.",
    LA_CABRA:     "Al que termine en primer lugar de puntos en la jornada.",
    CRUZAZULEO:   "Al que termine en segundo lugar de puntos en la jornada.",
    MEJOR_NADOTA: "Al que termine en tercer lugar de puntos en la jornada.",
    F_WE:         "Al que termine en último lugar de puntos en la jornada.",
    THE_CHOSEN:   "Si aciertas todos los marcadores exactos de todos los partidos de la jornada. Prácticamente imposible — pero si lo logras, eres una leyenda.",
  };

  return (
    <div style={{ maxWidth:700, margin:"0 auto", padding:"20px 16px" }}>
      <div style={{ fontSize:22, fontWeight:900, marginBottom:4 }}>🏅 Biblioteca de <span style={{color:C.red}}>Badges</span></div>
      <div style={{ fontSize:12, color:"#888", marginBottom:20 }}>Todos los badges del torneo y cómo obtenerlos</div>
      {Object.entries(BADGE_DEFS).map(([key, def]) => {
        const stats = badgeStats[key];
        const winners = stats.winners.map(id => participants.find(p => p.id === id)?.name).filter(Boolean);
        const isOpen = selected === key;
        return (
          <div key={key} style={{...card, marginBottom:8, cursor:"pointer", border: isOpen?`1px solid ${C.red}`:card.border}}
            onClick={() => setSelected(isOpen ? null : key)}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ fontSize:28, minWidth:36, textAlign:"center" }}>{def.emoji}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:15 }}>{def.name}</div>
                <div style={{ fontSize:12, color:"#888" }}>{def.desc}</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:18, fontWeight:900, color: def.coins>0?C.red:def.coins<0?"#f87171":"#888" }}>
                  {def.coins>0?`+${def.coins}`:def.coins===0?"—":def.coins} 🪙
                </div>
                <div style={{ fontSize:11, color:"#555" }}>{stats.total} otorgado{stats.total!==1?"s":""}</div>
              </div>
            </div>
            {isOpen && (
              <div style={{ marginTop:12, paddingTop:12, borderTop:"1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ fontSize:13, color:"#ccc", marginBottom:10, lineHeight:1.5 }}>
                  📋 <strong>¿Cómo obtenerlo?</strong><br/>
                  <span style={{color:"#aaa"}}>{howTo[key]}</span>
                </div>
                <div style={{ fontSize:12, color:"#888", marginBottom:8 }}>
                  <strong style={{color:"#ccc"}}>Tipo:</strong> {def.type === "season" ? "Acumulable — puedes ganarlo varias veces" : "Dinámico — se asigna al final de cada jornada"}
                </div>
                {winners.length > 0 ? (
                  <div style={{ fontSize:12, color:"#888" }}>
                    <strong style={{color:"#ccc"}}>Obtenido por:</strong>{" "}
                    {winners.slice(0,5).join(", ")}{winners.length>5?` y ${winners.length-5} más`:""}
                  </div>
                ) : (
                  <div style={{ fontSize:12, color:"#555" }}>Nadie lo ha obtenido aún</div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
