const SUPA_URL = "https://nuiioqmdgpybzquasiho.supabase.co";
const SUPA_KEY = "sb_publishable_7qTq6ecM3AFXgarwaf1AsQ_Jluz9z-I";

export const supa = async (path, options = {}) => {
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

export const db = {
  // Config
  getConfig: async () => {
    const rows = await supa("config?select=key,value");
    const cfg = {};
    (rows || []).forEach(r => { cfg[r.key] = r.value; });
    return cfg;
  },
  setConfig: async (key, value) => {
    await supa(`config?key=eq.${key}`, {
      method: "PATCH", prefer: "return=minimal",
      body: JSON.stringify({ value }),
    });
  },

  // Participants
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
  deleteParticipant: async (id) => {
    await supa(`participants?id=eq.${id}`, { method: "DELETE", prefer: "return=minimal" });
  },

  // Results
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

  // Scorers
  getScorers: async () => {
    return await supa("scorers?select=id,player_name,team,goals&order=goals.desc") || [];
  },
  upsertScorer: async (scorer) => {
    await supa("scorers", {
      method: "POST",
      prefer: "resolution=merge-duplicates,return=minimal",
      body: JSON.stringify(scorer),
    });
  },
  deleteScorer: async (id) => {
    await supa(`scorers?id=eq.${id}`, { method: "DELETE", prefer: "return=minimal" });
  },

  // Badges
  getBadges: async () => {
    return await supa("badges?select=id,participant_id,badge_key,jornada,earned_at&order=earned_at.desc") || [];
  },
  insertBadge: async (participantId, badgeKey, jornada) => {
    await supa("badges", {
      method: "POST",
      prefer: "return=minimal",
      body: JSON.stringify({ participant_id: participantId, badge_key: badgeKey, jornada }),
    });
  },
  deleteBadgesByJornada: async (jornada) => {
    await supa(`badges?jornada=eq.${jornada}`, { method: "DELETE", prefer: "return=minimal" });
  },

  // Coins
  getCoins: async () => {
    return await supa("coins?select=participant_id,total") || [];
  },
  upsertCoins: async (participantId, total) => {
    await supa("coins", {
      method: "POST",
      prefer: "resolution=merge-duplicates,return=minimal",
      body: JSON.stringify({ participant_id: participantId, total }),
    });
  },

  // Quiz
  getQuizQuestions: async () => {
    return await supa("quiz_questions?select=id,category,difficulty,question,options,correct_index") || [];
  },
  getQuizAnswers: async (participantId, date) => {
    return await supa(`quiz_answers?participant_id=eq.${participantId}&quiz_date=eq.${date}&select=question_id,selected_index,is_correct,coins_earned`) || [];
  },
  getAllQuizAnswers: async (date) => {
    return await supa(`quiz_answers?quiz_date=eq.${date}&select=participant_id,question_id,selected_index,is_correct,coins_earned`) || [];
  },
  insertQuizAnswer: async (participantId, questionId, date, selectedIndex, isCorrect, coinsEarned) => {
    await supa("quiz_answers", {
      method: "POST",
      prefer: "return=minimal",
      body: JSON.stringify({
        participant_id: participantId,
        question_id: questionId,
        quiz_date: date,
        selected_index: selectedIndex,
        is_correct: isCorrect,
        coins_earned: coinsEarned,
      }),
    });
  },
};
