export const KNOCKOUT_ROUNDS = ["16avos", "8tavos", "Cuartos", "Semifinal", "3er lugar", "Final"];

export const ROUND_LABELS = {
  "16avos":    "16avos de Final",
  "8tavos":    "8tavos de Final",
  "Cuartos":   "Cuartos de Final",
  "Semifinal": "Semifinales",
  "3er lugar": "3er Lugar",
  "Final":     "Final",
};

export const DAYS_ES = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
export const MONTHS_ES = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];

export const formatKnockoutDate = (s) => {
  const [y,m,d] = s.split("-").map(Number);
  const dt = new Date(y,m-1,d);
  return `${DAYS_ES[dt.getDay()]} ${d} ${MONTHS_ES[m-1]}`;
};

export const calcKnockoutScore = (pred, match) => {
  if (!pred || match.home_goals == null || match.away_goals == null) return null;
  if (pred.home_goals == null || pred.away_goals == null) return null;
  let pts = 0;
  const predHome = Number(pred.home_goals);
  const predAway = Number(pred.away_goals);
  const realHome = match.home_goals;
  const realAway = match.away_goals;

  // Resultado 90min
  const predResult = predHome > predAway ? "H" : predAway > predHome ? "A" : "D";
  const realResult = realHome > realAway ? "H" : realAway > realHome ? "A" : "D";
  if (predResult === realResult) pts += 2;

  // Goles
  if (predHome === realHome) pts++;
  if (predAway === realAway) pts++;

  // Marcador exacto bonus
  if (predHome === realHome && predAway === realAway) pts++;

  // Clasificado
  if (match.qualifier && pred.qualifier && pred.qualifier === match.qualifier) pts++;

  return pts;
};
