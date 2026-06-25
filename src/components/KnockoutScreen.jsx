import { useState } from "react";
import { KNOCKOUT_ROUNDS, ROUND_LABELS, formatKnockoutDate, calcKnockoutScore } from "../data/knockout.js";
import { FLAGS, ABBR } from "../data/matches.js";
import { C, card, sec, row, btn, pill, ScoreInput } from "./ui.jsx";

export const KnockoutScreen = ({ matches, predictions, participants, onSavePred, activeParticipantId, isAdmin, onToggleMatch, onUpdateTeams, onSaveResult }) => {
  const [editTeams, setEditTeams] = useState({});
  const [teamInputs, setTeamInputs] = useState({});
  const [savedMsg, setSavedMsg] = useState({});
  const [resultInputs, setResultInputs] = useState({});

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

  return (
    <div style={{ maxWidth:760, margin:"0 auto", padding:"20px 16px" }}>
      <div style={{ fontSize:22, fontWeight:900, marginBottom:4 }}>🏆 <span style={{color:C.red}}>Eliminatorias</span></div>
      <div style={{ fontSize:12, color:"#888", marginBottom:20 }}>2pts resultado · 1pt goles · +1pt exacto · +1pt clasificado</div>

      {KNOCKOUT_ROUNDS.map(round => {
        const roundMatches = byRound[round];
        if (!roundMatches || roundMatches.length === 0) return null;

        // Agrupar por fecha
        const byDate = roundMatches.reduce((acc, m) => {
          if (!acc[m.date]) acc[m.date] = [];
          acc[m.date].push(m);
          return acc;
        }, {});

        return (
          <div key={round} style={{ marginBottom:24 }}>
            <div style={{ fontSize:16, fontWeight:900, color:C.red, marginBottom:12, textTransform:"uppercase", letterSpacing:1 }}>
              {ROUND_LABELS[round]}
            </div>

            {Object.entries(byDate).map(([date, dayMatches]) => (
              <div key={date}>
                <div style={{ fontSize:12, color:"#666", fontWeight:700, padding:"6px 0", marginBottom:6, borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
                  {formatKnockoutDate(date)}
                </div>

                {dayMatches.map(m => {
                  const myPred = getMyPred(m.id);
                  const hasResult = m.home_goals != null && m.away_goals != null;
                  const isOpen = m.is_open;
                  const homeOk = isDefinido(m.home);
                  const awayOk = isDefinido(m.away);
                  const bothDefined = homeOk && awayOk;
                  const pts = hasResult && myPred ? calcKnockoutScore(myPred, m) : null;

                  // Determinar si pronóstico tiene empate en 90min
                  const predIsDrawn = myPred && myPred.home_goals != null && myPred.away_goals != null &&
                    Number(myPred.home_goals) === Number(myPred.away_goals);

                  // Resultado real en 90min
                  const realIsDrawn = hasResult && m.home_goals === m.away_goals;

                  return (
                    <div key={m.id} style={{ ...card, marginBottom:10, padding:"14px 16px" }}>
                      {/* Header partido */}
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
                          <div style={{ fontWeight:900, fontSize:18, color:C.red }}>
                            {m.home_goals} - {m.away_goals}
                            {m.qualifier && (
                              <div style={{ fontSize:11, color:"#4ade80", textAlign:"center", marginTop:4 }}>
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

                      {/* Admin: editar equipos */}
                      {isAdmin && (
                        <div style={{ marginBottom:10, padding:"10px", background:"rgba(255,255,255,0.03)", borderRadius:8 }}>
                          <div style={{ fontSize:11, color:"#888", marginBottom:6 }}>⚙️ Admin — Equipos</div>
                          <div style={{ display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
                            <input
                              style={{ background:"#0f1932", border:"1px solid #333", borderRadius:6, color:"#fff", padding:"6px 10px", fontSize:12, flex:1, minWidth:100 }}
                              placeholder="Local"
                              value={teamInputs[`${m.id}_home`] ?? m.home}
                              onChange={e => setTeamInputs(prev => ({ ...prev, [`${m.id}_home`]: e.target.value }))}
                            />
                            <span style={{ color:"#555" }}>vs</span>
                            <input
                              style={{ background:"#0f1932", border:"1px solid #333", borderRadius:6, color:"#fff", padding:"6px 10px", fontSize:12, flex:1, minWidth:100 }}
                              placeholder="Visitante"
                              value={teamInputs[`${m.id}_away`] ?? m.away}
                              onChange={e => setTeamInputs(prev => ({ ...prev, [`${m.id}_away`]: e.target.value }))}
                            />
                            <button
                              style={{ ...btn("outline"), fontSize:12, padding:"6px 12px" }}
                              onClick={() => onUpdateTeams(m.id, teamInputs[`${m.id}_home`] ?? m.home, teamInputs[`${m.id}_away`] ?? m.away)}>
                              Guardar
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Admin: abrir/cerrar + resultado */}
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
                            {/* Selector clasificado si hay empate en resultado */}
                            {resultInputs[`${m.id}_home`] != null && resultInputs[`${m.id}_away`] != null &&
                             Number(resultInputs[`${m.id}_home`]) === Number(resultInputs[`${m.id}_away`]) && bothDefined && (
                              <select
                                style={{ background:"#0f1932", border:"1px solid #333", borderRadius:6, color:"#fff", padding:"6px 10px", fontSize:12 }}
                                value={resultInputs[`${m.id}_qualifier`] ?? m.qualifier ?? ""}
                                onChange={e => setResultInputs(prev => ({ ...prev, [`${m.id}_qualifier`]: e.target.value }))}>
                                <option value="">¿Quién clasifica?</option>
                                <option value={m.home}>{ABBR[m.home]||m.home}</option>
                                <option value={m.away}>{ABBR[m.away]||m.away}</option>
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

                      {/* Pronóstico del participante */}
                      {!isAdmin && isOpen && bothDefined && activeParticipantId && (
                        <div style={{ borderTop:"1px solid rgba(255,255,255,0.06)", paddingTop:10 }}>
                          <div style={{ fontSize:12, color:"#888", marginBottom:8 }}>Tu pronóstico (90 min)</div>
                          <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                            <span style={{ fontSize:13, color:"#ccc", fontWeight:600 }}>{ABBR[m.home]||m.home}</span>
                            <ScoreInput
                              value={myPred?.home_goals}
                              onChange={v => onSavePred(m.id, { ...myPred, home_goals: v, qualifier: myPred?.qualifier })}
                              disabled={hasResult}
                            />
                            <span style={{ color:"#555" }}>-</span>
                            <ScoreInput
                              value={myPred?.away_goals}
                              onChange={v => onSavePred(m.id, { ...myPred, away_goals: v, qualifier: myPred?.qualifier })}
                              disabled={hasResult}
                            />
                            <span style={{ fontSize:13, color:"#ccc", fontWeight:600 }}>{ABBR[m.away]||m.away}</span>
                          </div>
                          {/* Selector clasificado si empate en pronóstico */}
                          {predIsDrawn && bothDefined && !hasResult && (
                            <div style={{ marginTop:8 }}>
                              <div style={{ fontSize:12, color:"#888", marginBottom:6 }}>¿Quién clasifica?</div>
                              <div style={{ display:"flex", gap:8 }}>
                                {[m.home, m.away].map(team => (
                                  <button key={team}
                                    style={{
                                      background: myPred?.qualifier === team ? C.red : "rgba(255,255,255,0.05)",
                                      border: `1px solid ${myPred?.qualifier === team ? C.red : "#333"}`,
                                      borderRadius:8, color:"#fff", padding:"8px 14px", cursor:"pointer", fontSize:13, fontWeight:600
                                    }}
                                    onClick={() => onSavePred(m.id, { ...myPred, qualifier: team })}>
                                    {FLAGS[team]||"🏳️"} {ABBR[team]||team}
                                  </button>
                                ))}
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

                      {/* Mostrar pronóstico ya guardado si partido cerrado */}
                      {!isAdmin && !isOpen && myPred && myPred.home_goals != null && (
                        <div style={{ borderTop:"1px solid rgba(255,255,255,0.06)", paddingTop:10 }}>
                          <div style={{ fontSize:12, color:"#888", marginBottom:4 }}>Tu pronóstico</div>
                          <div style={{ fontSize:14, fontWeight:700 }}>
                            {myPred.home_goals} - {myPred.away_goals}
                            {myPred.qualifier && <span style={{ fontSize:12, color:"#888", marginLeft:8 }}>Clasifica: {ABBR[myPred.qualifier]||myPred.qualifier}</span>}
                          </div>
                          {pts !== null && (
                            <span style={{ ...pill(pts >= 5 ? "#1b7f4a" : pts === 0 ? "#7f1b1b" : "#7f5a00"), fontSize:12, marginTop:6, display:"inline-block" }}>
                              {pts}pts
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
};
