import { ALL_MATCHES, getResult, isExact, isResultCorrect, calcScore } from "../data/matches.js";

export const BADGE_DEFS = {
  EZ:           { emoji:"⚡",  name:"EZ",                    desc:"Marcador exacto acertado",                          coins:50,     type:"season" },
  GRITALO:      { emoji:"👑",  name:"Grítalo Reina",         desc:"Más marcadores exactos de la jornada",              coins:80,     type:"dynamic" },
  SO_HOT:       { emoji:"🔥",  name:"So Hot",                desc:"5-7 resultados correctos en una jornada",           coins:20,     type:"season" },
  ON_FIRE:      { emoji:"🚒",  name:"On Fire",               desc:"8-10 resultados correctos en una jornada",          coins:40,     type:"season" },
  MODO_BESTIA:  { emoji:"🐺",  name:"En su Prime",           desc:"11-13 resultados correctos en una jornada",         coins:60,     type:"season" },
  EN_SU_PRIME:  { emoji:"🌟",  name:"Dios Plan",             desc:"14+ resultados correctos en una jornada",           coins:100,    type:"season" },
  MIL_IQ:       { emoji:"🧠",  name:"+1000 de IQ",           desc:"Acertó el resultado del partido más sorpresivo",    coins:50,     type:"season" },
  HACKER:       { emoji:"🧊",  name:"Hacker",                desc:"Único en acertar el marcador exacto de un partido", coins:150,    type:"season" },
  ALMANAQUE:    { emoji:"📖",  name:"El Almanaque",          desc:"Acertó todos los resultados de un mismo día",       coins:40,     type:"season" },
  CHATGPT:      { emoji:"🤖",  name:"Ni con ChatGPT",        desc:"Peor % de aciertos del día",                        coins:-10,    type:"season" },
  DELULU:       { emoji:"🤪",  name:"Delulu",                desc:"Pronóstico más alejado de la realidad del día",     coins:-10,    type:"season" },
  CASITA:       { emoji:"🏠",  name:"¿Todo bien en casita?", desc:"Más Delulus acumulados en la jornada",              coins:-30,    type:"dynamic" },
  QUE_BURRO:    { emoji:"🐴",  name:"Que Burro, Póngale 0",  desc:"No sumó puntos cuando todos los demás sí sumaron", coins:-20,    type:"season" },
  LA_CABRA:     { emoji:"🐐",  name:"La Cabra",              desc:"Mayor puntaje de la jornada",                       coins:100,    type:"dynamic" },
  CRUZAZULEO:   { emoji:"🔵",  name:"La Cruzazuleó",         desc:"Segundo lugar de la jornada",                       coins:60,     type:"dynamic" },
  MEJOR_NADOTA: { emoji:"🗑️", name:"Mejor Nadota",           desc:"Tercer lugar de la jornada",                        coins:20,     type:"dynamic" },
  F_WE:         { emoji:"💀",  name:"F we",                  desc:"Último lugar de la jornada",                        coins:-40,    type:"dynamic" },
  THE_CHOSEN:   { emoji:"🌌",  name:"The Chosen One",        desc:"Acertó todos los marcadores exactos de la jornada", coins:100000, type:"season" },
};

export const COIN_VALUES = Object.fromEntries(
  Object.entries(BADGE_DEFS).map(([k,v]) => [k, v.coins])
);

export const calcBadgesForJornada = (jornada, participants, results) => {
  const jMatches = ALL_MATCHES.filter(m => m.jornada === jornada);
  const finishedMatches = jMatches.filter(m => results[m.id]?.homeGoals != null);
  if (finishedMatches.length === 0) return [];

  const awarded = [];

  const stats = participants.map(p => {
    const preds = p.predictions || {};
    let pts = 0, exactCount = 0, resultCount = 0;
    finishedMatches.forEach(m => {
      const pred = preds[m.id];
      const real = results[m.id];
      if (!pred) return;
      const score = calcScore(pred, real);
      if (score != null) pts += score;
      if (isExact(pred, real)) exactCount++;
      if (isResultCorrect(pred, real)) resultCount++;
    });
    return { id: p.id, pts, exactCount, resultCount };
  });

  // ── EZ: uno por cada marcador exacto ──
  participants.forEach(p => {
    const preds = p.predictions || {};
    finishedMatches.forEach(m => {
      if (isExact(preds[m.id], results[m.id])) {
        awarded.push({ participantId: p.id, badgeKey: "EZ" });
      }
    });
  });

  // ── Grítalo Reina: más exactos de la jornada ──
  const maxExact = Math.max(...stats.map(s => s.exactCount));
  if (maxExact > 0) {
    stats.filter(s => s.exactCount === maxExact).forEach(s => {
      awarded.push({ participantId: s.id, badgeKey: "GRITALO" });
    });
  }

  // ── Rachas acumulables ──
  stats.forEach(s => {
    if (s.resultCount >= 5)  awarded.push({ participantId: s.id, badgeKey: "SO_HOT" });
    if (s.resultCount >= 8)  awarded.push({ participantId: s.id, badgeKey: "ON_FIRE" });
    if (s.resultCount >= 11) awarded.push({ participantId: s.id, badgeKey: "MODO_BESTIA" });
    if (s.resultCount >= 14) awarded.push({ participantId: s.id, badgeKey: "EN_SU_PRIME" });
  });

  // ── +1000 IQ: acertó el resultado del partido más sorpresivo ──
  const matchAccuracy = finishedMatches.map(m => {
    const acertaron = participants.filter(p => isResultCorrect((p.predictions||{})[m.id], results[m.id])).length;
    return { matchId: m.id, pct: participants.length > 0 ? acertaron / participants.length : 0 };
  }).sort((a,b) => a.pct - b.pct);

  if (matchAccuracy.length > 0) {
    const hardestMatch = matchAccuracy[0];
    participants.forEach(p => {
      if (isResultCorrect((p.predictions||{})[hardestMatch.matchId], results[hardestMatch.matchId])) {
        awarded.push({ participantId: p.id, badgeKey: "MIL_IQ" });
      }
    });
  }

  // ── Hacker: único en acertar el marcador exacto de un partido ──
  finishedMatches.forEach(m => {
    const acertaron = participants.filter(p => isExact((p.predictions||{})[m.id], results[m.id]));
    if (acertaron.length === 1) {
      awarded.push({ participantId: acertaron[0].id, badgeKey: "HACKER" });
    }
  });

  // ── Que Burro: no sumó puntos cuando todos los demás sí sumaron ──
  finishedMatches.forEach(m => {
    const real = results[m.id];
    participants.forEach(p => {
      const pred = (p.predictions||{})[m.id];
      if (!pred) return;
      const myPts = calcScore(pred, real);
      if (myPts !== 0) return;
      const todosLosDemas = participants.filter(pp => pp.id !== p.id);
      const todosSumaron = todosLosDemas.every(pp => {
        const ppPred = (pp.predictions||{})[m.id];
        if (!ppPred) return false;
        const ppPts = calcScore(ppPred, real);
        return ppPts != null && ppPts > 0;
      });
      if (todosSumaron) {
        awarded.push({ participantId: p.id, badgeKey: "QUE_BURRO" });
      }
    });
  });

  // ── Por día: Almanaque, Ni con ChatGPT, Delulu ──
  const matchesByDate = {};
  finishedMatches.forEach(m => {
    if (!matchesByDate[m.date]) matchesByDate[m.date] = [];
    matchesByDate[m.date].push(m);
  });

  const deluluCounts = {};
  participants.forEach(p => { deluluCounts[p.id] = 0; });

  Object.entries(matchesByDate).forEach(([date, dayMatches]) => {
    if (dayMatches.length === 0) return;

    // ── El Almanaque: acertó todos los resultados del día ──
    // ── Ni con ChatGPT: peor % de aciertos del día ──
    const dayStats = participants.map(p => {
      const preds = p.predictions || {};
      const acertados = dayMatches.filter(m => isResultCorrect(preds[m.id], results[m.id])).length;
      const allCorrect = acertados === dayMatches.length;
      return { id: p.id, acertados, pct: acertados / dayMatches.length, allCorrect };
    });

    dayStats.forEach(s => {
      if (s.allCorrect) awarded.push({ participantId: s.id, badgeKey: "ALMANAQUE" });
    });

    const minPct = Math.min(...dayStats.map(s => s.pct));
    dayStats.filter(s => s.pct === minPct).forEach(s => {
      awarded.push({ participantId: s.id, badgeKey: "CHATGPT" });
    });

    // ── Delulu del día: pronóstico más alejado de la realidad ──
    let maxDist = -1;
    let deluluPids = [];
    dayMatches.forEach(m => {
      const real = results[m.id];
      participants.forEach(p => {
        const pred = (p.predictions||{})[m.id];
        if (!pred || pred.home == null || isResultCorrect(pred, real)) return;
        const dist = Math.abs(Number(pred.home) - real.homeGoals) + Math.abs(Number(pred.away) - real.awayGoals);
        if (dist > maxDist) { maxDist = dist; deluluPids = [p.id]; }
        else if (dist === maxDist) { deluluPids.push(p.id); }
      });
    });

    if (maxDist > 0) {
      deluluPids.forEach(pid => {
        awarded.push({ participantId: pid, badgeKey: "DELULU" });
        deluluCounts[pid] = (deluluCounts[pid] || 0) + 1;
      });
    }
  });

  // ── ¿Todo bien en casita?: más DELULUs acumulados en la jornada ──
  const maxDelulu = Math.max(...Object.values(deluluCounts));
  if (maxDelulu > 0) {
    Object.entries(deluluCounts).filter(([,c]) => c === maxDelulu).forEach(([pid]) => {
      awarded.push({ participantId: Number(pid), badgeKey: "CASITA" });
    });
  }

  // ── The Chosen One: todos los marcadores exactos de la jornada ──
  participants.forEach(p => {
    const preds = p.predictions || {};
    const allExact = finishedMatches.every(m => isExact(preds[m.id], results[m.id]));
    if (allExact) awarded.push({ participantId: p.id, badgeKey: "THE_CHOSEN" });
  });

  // ── Clasificación jornada ──
  const sorted = [...stats].sort((a,b) => b.pts - a.pts);
  if (sorted.length > 0) {
    const maxPts = sorted[0].pts;
    sorted.filter(s => s.pts === maxPts).forEach(s => awarded.push({ participantId: s.id, badgeKey: "LA_CABRA" }));

    const rank2 = sorted.find(s => s.pts < maxPts);
    if (rank2) {
      sorted.filter(s => s.pts === rank2.pts).forEach(s => awarded.push({ participantId: s.id, badgeKey: "CRUZAZULEO" }));
      const rank3 = sorted.find(s => s.pts < rank2.pts);
      if (rank3) {
        sorted.filter(s => s.pts === rank3.pts).forEach(s => awarded.push({ participantId: s.id, badgeKey: "MEJOR_NADOTA" }));
      }
    }

    const minPts = sorted[sorted.length - 1].pts;
    sorted.filter(s => s.pts === minPts).forEach(s => awarded.push({ participantId: s.id, badgeKey: "F_WE" }));
  }

  return awarded;
};

export const calcCoinsFromBadges = (badgeKeys) => {
  return badgeKeys.reduce((sum, key) => sum + (COIN_VALUES[key] || 0), 0);
};
