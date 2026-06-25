import { useState } from "react";
import { KNOCKOUT_ROUNDS, ROUND_LABELS, formatKnockoutDate, calcKnockoutScore } from "../data/knockout.js";
import { FLAGS, ABBR } from "../data/matches.js";
import { C, card, sec, btn, pill, ScoreInput } from "./ui.jsx";

const ALL_TEAMS = [
  "A definir",
  "Alemania","Argelia","Argentina","Arabia Saudita","Austria","Australia",
  "Bélgica","Bosnia y Herz.","Brasil",
  "Cabo Verde","Canadá","Chequia","Colombia","Congo RD","Corea del Sur","Costa de Marfil","Croacia","Curazao",
  "Ecuador","Egipto","Escocia","España","Estados Unidos",
  "Francia","Ghana","Haití","Inglaterra","Irán","Iraq",
  "Japón","Jordania","Marruecos","México","Noruega","Nueva Zelanda",
  "Países Bajos","Panamá","Paraguay","Portugal","Qatar",
  "Senegal","Sudáfrica","Suecia","Suiza","Túnez","Turquía",
  "Uruguay","Uzbekistán",
];

export const KnockoutScreen = ({ matches, predictions, participants, onSavePred, activeParticipantId, isAdmin, onToggleMatch, onUpdateTeams, onSaveResult }) => {
  const [savedMsg, setSavedMsg] = useState({});
  const [resultInputs, setResultInputs] = useState({});
  const [predInputs, setPredInputs] = useState({});
  const [activeTab, setActiveTab] = useState("mis");
  const [roundFilter, setRoundFilter] = useState("16avos");

  const flash = (matchId) => {
    setSavedMsg(prev => ({ ...prev, [matchId]: true }));
    setTimeout(() => setSavedMsg(prev => ({ ...prev, [matchId]: false })), 2000);
  };

  const byRound = KNOCKOUT_ROUNDS.reduce((acc, r) => {
    acc[r] = matches.filter(m => m.round === r);
    return acc;
  }, {});

  const getMyPred = (matchId) => predictions.find(p => p.match_id === matchId);
  const isDefinido = (team) => team && team !== "A definir";

  const getPredLocal = (matchId, field, myPred) => {
    const key = `${matchId}_${field}`;
    if (predInputs[key] !== undefined) return predInputs[key];
    if (myPred?.[field] != null) return myPred[field];
    return "";
  };

  const setPredLocal = (matchId, field, value) => {
    setPredInputs(prev => ({ ...prev, [`${matchId}_${field}`]: value }));
  };

  const localIsDrawn = (matchId, myPred) => {
    const h = predInputs[`${matchId}_home_goals`] !== undefined ? predInputs[`${matchId}_home_goals`] : myPred?.home_goals;
    const a = predInputs[`${matchId}_away_goals`] !== undefined ? predInputs[`${matchId}_away_goals`] : myPred?.away_goals;
    return h !== "" && h != null && a !== "" && a != null && Number(h) === Number(a);
  };

  const savePredLocal = (matchId, myPred, overrides = {}) => {
    const homeGoals = overrides.home_goals !== undefined ? overrides.home_goals : (predInputs[`${matchId}_home_goals`] !== undefined ? predInputs[`${matchId}_home_goals`] : myPred?.home_goals);
    const awayGoals = overrides.away_goals !== undefined ? overrides.away_goals : (predInputs[`${matchId}_away_goals`] !== undefined ? predInputs[`${matchId}_away_goals`] : myPred?.away_goals);
    const qualifier = overrides.qualifier !== undefined ? overrides.qualifier : (predInputs[`${matchId}_qualifier`] !== undefined ? predInputs[`${matchId}_qualifier`] : myPred?.qualifier ?? null);
    onSavePred(matchId, { home_goals: homeGoals, away_goals: awayGoals, qualifier });
  };

  const renderMatch = (m, showAllPreds = false) => {
    const myPred = getMyPred(m.id);
    const hasResult = m.home_goals != null && m.away_goals != null;
    const isOpen = m.is_open;
    const bothDefined = isDefinido(m.home) && isDefinido(m.away);
    const pts = hasResult && myPred ? calcKnockoutScore(myPred, m) : null;
    const drawn = localIsDrawn(m.id, myPred);

    return (
      <div key={m.id} style={{ ...card, marginBottom:10, padding:"14px 16px" }}>
        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10, flexWrap:"wrap" }}>
          <span style={pill("#0f2d6e")}>#{m.id}</span>
          <span style={{ fontSize:11, color:"#666" }}>{m.time} CDMX</span>
          <span style={{ fontSize:10, color:"#555" }}>📍 {m.venue}</span>
          {hasResult && <span style={{ ...pill("#1b7f4a"), fontSize:11 }}>Final</span>}
          {!hasResult && isOpen && <span style={{ ...pill("#1b7f4a"), fontSize:11 }}>🟢 Abierto</span>}
          {!hasResult && !isOpen && <span style={{ ...pill("#333"), fontSize:11 }}>🔴 Cerrado</span>}
        </div>

        {/* Equipos */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:12, marginBottom:12 }}>
          <div style={{ fontWeight:700, fontSize:15, textAlign:"right", minWidth:100 }}>
            {FLAGS[m.home]||"🏳️"} {ABBR[m.home]||m.home}
          </div>
          {hasResult ? (
            <div style={{ textAlign:"center" }}>
              <div style={{ fontWeight:900, fontSize:18, color:C.red }}>{m.home_goals} - {m.away_goals}</div>
              {m.qualifier && (
                <div style={{ fontSize:11, color:"#4ade80", marginTop:4 }}>
                  Clasifica: {FLAGS[m.qualifier]||"🏳️"} {ABBR[m.qualifier]||m.qualifier}
                </div>
              )}
            </div>
          ) : (
            <div style={{ fontWeight:700, fontSize:14, color:"#555" }}>vs</div>
          )}
          <div style={{ fontWeight:700, fontSize:15, textAlign:"left", minWidth:100 }}>
            {FLAGS[m.away]||"🏳️"} {ABBR[m.away]||m.away}
          </div>
        </div>

        {/* Admin — Equipos */}
        {isAdmin && (
          <div style={{ marginBottom:10, padding:"10px", background:"rgba(255,255,255,0.03)", borderRadius:8 }}>
            <div style={{ fontSize:11, color:"#888", marginBottom:6 }}>⚙️ Admin — Equipos</div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
              <select
                style={{ background:"#0f1932", border:"1px solid #333", borderRadius:6, color:"#fff", padding:"6px 10px", fontSize:12, flex:1 }}
                value={m.home}
                onChange={e => onUpdateTeams(m.id, e.target.value, m.away)}>
                {ALL_TEAMS.map(t => <option key={t} value={t}>{FLAGS[t]||""} {t}</option>)}
              </select>
              <span style={{ color:"#555" }}>vs</span>
              <select
                style={{ background:"#0f1932", border:"1px solid #333", borderRadius:6, color:"#fff", padding:"6px 10px", fontSize:12, flex:1 }}
                value={m.away}
                onChange={e => onUpdateTeams(m.id, m.home, e.target.value)}>
                {ALL_TEAMS.map(t => <option key={t} value={t}>{FLAGS[t]||""} {t}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* Admin — Resultado */}
        {isAdmin && (
          <div style={{ marginBottom:10, padding:"10px", background:"rgba(255,255,255,0.03)", borderRadius:8 }}>
            <div style={{ fontSize:11, color:"#888", marginBottom:6 }}>⚙️ Admin — Resultado</div>
            <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
              <button
                style={{ ...btn(isOpen ? "success" : "outline"), fontSize:12, padding:"6px 12px" }}
                onClick={() => onToggleMatch(m.id, !isOpen)}>
                {isOpen ? "🔒 Cerrar" : "🟢 Abrir"}
              </button>
              <ScoreInput
                value={resultInputs[`${m.id}_home`] ?? m.home_goals}
                onChange={v => setResultInputs(prev => ({ ...prev, [`${m.id}_home`]: v }))}
              />
              <span style={{ color:"#555" }}>-</span>
              <ScoreInput
                value={resultInputs[`${m.id}_away`] ?? m.away_goals}
                onChange={v => setResultInputs(prev => ({ ...prev, [`${m.id}_away`]: v }))}
              />
              {resultInputs[`${m.id}_home`] != null && resultInputs[`${m.id}_away`] != null &&
               Number(resultInputs[`${m.id}_home`]) === Number(resultInputs[`${m.id}_away`]) && bothDefined && (
                <select
                  style={{ background:"#0f1932", border:"1px solid #333", borderRadius:6, color:"#fff", padding:"6px 10px", fontSize:12 }}
                  value={resultInputs[`${m.id}_qualifier`] ?? m.qualifier ?? ""}
                  onChange={e => setResultInputs(prev => ({ ...prev, [`${m.id}_qualifier`]: e.target.value }))}>
                  <option value="">¿Quién clasifica?</option>
                  <option value={m.home}>{FLAGS[m.home]||""} {ABBR[m.home]||m.home}</option>
                  <option value={m.away}>{FLAGS[m.away]||""} {ABBR[m.away]||m.away}</option>
                </select>
              )}
              <button
                style={{ ...btn(), fontSize:12, padding:"6px 12px" }}
                onClick={() => {
                  const hg = resultInputs[`${m.id}_home`] ?? m.home_goals;
                  const ag = resultInputs[`${m.id}_away`] ?? m.away_goals;
                  const q = hg != null && ag != null && Number(hg) !== Number(ag)
                    ? (Number(hg) > Number(ag) ? m.home : m.away)
                    : (resultInputs[`${m.id}_qualifier`] ?? m.qualifier);
                  onSaveResult(m.id, hg, ag, q);
                  flash(m.id);
                }}>
                {savedMsg[m.id] ? "✅" : "Guardar"}
              </button>
            </div>
          </div>
        )}

        {/* Pronóstico participante activo */}
        {!isAdmin && isOpen && bothDefined && activeParticipantId && (
          <div style={{ borderTop:"1px solid rgba(255,255,255,0.06)", paddingTop:10 }}>
            <div style={{ fontSize:12, color:"#888", marginBottom:8 }}>Tu pronóstico (90 min)</div>
            <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
              <span style={{ fontSize:13, color:"#ccc", fontWeight:600 }}>{ABBR[m.home]||m.home}</span>
              <ScoreInput
                value={getPredLocal(m.id, "home_goals", myPred)}
                onChange={v => {
                  setPredLocal(m.id, "home_goals", v);
                  savePredLocal(m.id, myPred, { home_goals: v });
                }}
                disabled={hasResult}
              />
              <span style={{ color:"#555" }}>-</span>
              <ScoreInput
                value={getPredLocal(m.id, "away_goals", myPred)}
                onChange={v => {
                  setPredLocal(m.id, "away_goals", v);
                  savePredLocal(m.id, myPred, { away_goals: v });
                }}
                disabled={hasResult}
              />
              <span style={{ fontSize:13, color:"#ccc", fontWeight:600 }}>{ABBR[m.away]||m.away}</span>
            </div>

            {/* Selector clasificado si empate */}
            {drawn && bothDefined && !hasResult && (
              <div style={{ marginTop:10 }}>
                <div style={{ fontSize:12, color:"#888", marginBottom:6 }}>¿Quién clasifica?</div>
                <div style={{ display:"flex", gap:8 }}>
                  {[m.home, m.away].map(team => {
                    const localQ = predInputs[`${m.id}_qualifier`] !== undefined ? predInputs[`${m.id}_qualifier`] : myPred?.qualifier;
                    return (
                      <button key={team}
                        style={{
                          background: localQ === team ? C.red : "rgba(255,255,255,0.05)",
                          border: `1px solid ${localQ === team ? C.red : "#333"}`,
                          borderRadius:8, color:"#fff", padding:"8px 14px", cursor:"pointer", fontSize:13, fontWeight:600
                        }}
                        onClick={() => {
                          setPredLocal(m.id, "qualifier", team);
                          savePredLocal(m.id, myPred, { qualifier: team });
                        }}>
                        {FLAGS[team]||"🏳️"} {ABBR[team]||team}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {pts !== null && (
              <div style={{ marginTop:8 }}>
                <span style={{ ...pill(pts >= 5 ? "#1b7f4a" : pts === 0 ? "#7f1b1b" : "#7f5a00"), fontSize:12 }}>
                  {pts}pts
                </span>
              </div>
            )}
          </div>
        )}

        {/* Pronóstico cerrado */}
        {!isAdmin && !isOpen && myPred && myPred.home_goals != null && (
          <div style={{ borderTop:"1px solid rgba(255,255,255,0.06)", paddingTop:10 }}>
            <div style={{ fontSize:12, color:"#888", marginBottom:4 }}>Tu pronóstico</div>
            <div style={{ fontSize:14, fontWeight:700 }}>
              {myPred.home_goals} - {myPred.away_goals}
              {myPred.qualifier && <span style={{ fontSize:12, color:"#888", marginLeft:8 }}>Clasifica: {FLAGS[myPred.qualifier]||""} {ABBR[myPred.qualifier]||myPred.qualifier}</span>}
            </div>
            {pts !== null && (
              <span style={{ ...pill(pts >= 5 ? "#1b7f4a" : pts === 0 ? "#7f1b1b" : "#7f5a00"), fontSize:12, marginTop:6, display:"inline-block" }}>
                {pts}pts
              </span>
            )}
          </div>
        )}

        {/* Pronósticos de todos */}
        {showAllPreds && (
          <div style={{ borderTop:"1px solid rgba(255,255,255,0.06)", paddingTop:10, marginTop:8 }}>
            <div style={{ fontSize:12, color:"#888", marginBottom:8 }}>Pronósticos del grupo</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {participants.map(p => {
                const pPred = predictions.find(pr => pr.participant_id === p.id && pr.match_id === m.id);
                const pPts = hasResult && pPred ? calcKnockoutScore(pPred, m) : null;
                const hasPred = pPred && pPred.home_goals != null;
                return (
                  <div key={p.id} style={{
                    background: pPts >= 5 ? "rgba(27,127,74,0.2)" : pPts === 0 && hasResult ? "rgba(127,27,27,0.2)" : "rgba(255,255,255,0.05)",
                    border: `1px solid ${pPts >= 5 ? "#1b7f4a" : pPts === 0 && hasResult ? "#7f1b1b" : "#333"}`,
                    borderRadius:8, padding:"6px 10px", minWidth:80, textAlign:"center"
                  }}>
                    <div style={{ fontSize:11, color:"#888", marginBottom:2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", maxWidth:80 }}>{p.name}</div>
                    <div style={{ fontWeight:700, fontSize:14 }}>
                      {hasPred ? `${pPred.home_goals}-${pPred.away_goals}` : <span style={{ color:"#555" }}>—</span>}
                    </div>
                    {hasPred && pPred.qualifier && (
                      <div style={{ fontSize:10, color:"#888" }}>{FLAGS[pPred.qualifier]||""} {ABBR[pPred.qualifier]||pPred.qualifier}</div>
                    )}
                    {pPts !== null && (
                      <div style={{ fontSize:10, color: pPts >= 5 ? "#4ade80" : pPts === 0 ? "#f87171" : "#fbbf24", fontWeight:700, marginTop:2 }}>
                        {pPts}pts
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const roundsWithMatches = KNOCKOUT_ROUNDS.filter(r => byRound[r]?.length > 0);

  return (
    <div style={{ maxWidth:760, margin:"0 auto", padding:"20px 16px" }}>
      <div style={{ fontSize:22, fontWeight:900, marginBottom:4 }}>🏆 <span style={{color:C.red}}>Eliminatorias</span></div>
      <div style={{ fontSize:12, color:"#888", marginBottom:16 }}>2pts resultado · 1pt goles · +1pt exacto · +1pt clasificado</div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
        <button style={{ ...btn(activeTab === "mis" ? "primary" : "outline"), fontSize:13 }} onClick={() => setActiveTab("mis")}>
          Mis pronósticos
        </button>
        <button style={{ ...btn(activeTab === "todos" ? "primary" : "outline"), fontSize:13 }} onClick={() => setActiveTab("todos")}>
          📋 Ver todos
        </button>
      </div>

      {/* Filtro de ronda */}
      <div style={{ display:"flex", gap:6, marginBottom:16, flexWrap:"wrap" }}>
        {roundsWithMatches.map(r => (
          <button key={r}
            style={{ ...btn(roundFilter === r ? "primary" : "outline"), fontSize:11, padding:"6px 10px" }}
            onClick={() => setRoundFilter(r)}>
            {ROUND_LABELS[r]}
          </button>
        ))}
      </div>

      {/* Partidos */}
      {(() => {
        const roundMatches = byRound[roundFilter] || [];
        const byDate = roundMatches.reduce((acc, m) => {
          if (!acc[m.date]) acc[m.date] = [];
          acc[m.date].push(m);
          return acc;
        }, {});

        return Object.entries(byDate).map(([date, dayMatches]) => (
          <div key={date}>
            <div style={{ fontSize:12, color:"#666", fontWeight:700, padding:"6px 0", marginBottom:6, borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
              {formatKnockoutDate(date)}
            </div>
            {dayMatches.map(m => renderMatch(m, activeTab === "todos"))}
          </div>
        ));
      })()}
    </div>
  );
};
