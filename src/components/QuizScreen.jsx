import { useState, useEffect } from "react";
import { QUIZ_QUESTIONS } from "../data/quiz.js";
import { C, card, sec, btn } from "./ui.jsx";

const getTodayDate = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
};

const getDailyQuestions = (date) => {
  // Deterministic shuffle based on date
  const seed = date.split("-").reduce((a,b)=>a+Number(b),0);
  const easy = QUIZ_QUESTIONS.filter(q=>q.difficulty==="facil");
  const medium = QUIZ_QUESTIONS.filter(q=>q.difficulty==="media");
  const hard = QUIZ_QUESTIONS.filter(q=>q.difficulty==="dificil");

  const pick = (arr, n, offset=0) => {
    const shuffled = [...arr].sort((a,b)=>{
      const ha = (a.id||0)*seed+offset, hb = (b.id||0)*seed+offset;
      return ha%97 - hb%97;
    });
    return shuffled.slice(0,n);
  };

  return [
    ...pick(easy,2),
    ...pick(medium,2,1),
    ...pick(hard,1,2),
  ].map((q,i)=>({...q, id:q.id||i+1}));
};

export const QuizScreen = ({ participant, onSaveAnswers }) => {
  const [todayAnswers, setTodayAnswers] = useState(null);
  const [selected, setSelected] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  const today = getTodayDate();
  const questions = getDailyQuestions(today);

  useEffect(()=>{
    if (!participant) { setLoading(false); return; }
    // Check if already answered today (from local state passed via props)
    setLoading(false);
  },[participant]);

  if (!participant) return (
    <div style={{ maxWidth:600, margin:"0 auto", padding:"24px 16px", textAlign:"center" }}>
      <div style={{ fontSize:40, marginBottom:12 }}>🧠</div>
      <div style={{ color:"#888" }}>Inicia sesión para jugar el quiz diario.</div>
    </div>
  );

  const handleSubmit = async () => {
    if (Object.keys(selected).length < questions.length) return;
    let coins = 0;
    const answers = questions.map((q,i) => {
      const isCorrect = selected[i] === q.correct_index;
      if (isCorrect) coins += 10;
      return { questionId:q.id, selectedIndex:selected[i], isCorrect, coinsEarned:isCorrect?10:0 };
    });
    if (Object.values(selected).filter((_,i)=>selected[i]===questions[i]?.correct_index).length === 5) coins += 20;
    await onSaveAnswers(answers, coins);
    setSubmitted(true);
    setTodayAnswers({ answers, coins });
  };

  const answered = submitted || !!todayAnswers;
  const results = todayAnswers?.answers || [];
  const totalCoins = todayAnswers?.coins || 0;
  const correct = results.filter(r=>r.isCorrect).length;

  const diffLabel = {facil:"🟢 Fácil", media:"🟡 Media", dificil:"🔴 Difícil"};
  const catEmoji = {Historia:"🏆",Jugadores:"⭐",Momentos:"⚽",Selecciones:"🌎",Cultura:"📚"};

  return (
    <div style={{ maxWidth:600, margin:"0 auto", padding:"20px 16px" }}>
      <div style={{ fontSize:22, fontWeight:900, marginBottom:4 }}>🧠 Quiz <span style={{color:C.red}}>Mundialista</span></div>
      <div style={{ fontSize:12, color:"#888", marginBottom:20 }}>
        {today} · 5 preguntas · Una vez por día · +10 🪙 por acierto
      </div>

      {answered && (
        <div style={{ ...card, textAlign:"center", background:"rgba(27,127,74,0.1)", border:"1px solid #1b7f4a", marginBottom:20 }}>
          <div style={{ fontSize:36, marginBottom:8 }}>
            {correct===5?"🌟":correct>=3?"🔥":correct>=1?"👍":"😅"}
          </div>
          <div style={{ fontSize:20, fontWeight:900 }}>{correct}/5 correctas</div>
          <div style={{ fontSize:16, color:"#fbbf24", fontWeight:700, marginTop:4 }}>+{totalCoins} 🪙 FIFA Coins</div>
          {correct===5&&<div style={{ fontSize:13, color:"#4ade80", marginTop:4 }}>¡Bonus de jornada perfecta! +20 🪙</div>}
        </div>
      )}

      {questions.map((q,i)=>{
        const ans = results[i];
        const isAnswered = answered;
        const myAnswer = isAnswered ? ans?.selectedIndex : selected[i];
        const isCorrect = isAnswered ? ans?.isCorrect : false;

        return (
          <div key={i} style={{ ...card, marginBottom:12 }}>
            <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:8 }}>
              <span style={{ fontSize:11, color:"#888" }}>{catEmoji[q.category]||"❓"} {q.category}</span>
              <span style={{ fontSize:10, color:"#666" }}>·</span>
              <span style={{ fontSize:11, color:"#666" }}>{diffLabel[q.difficulty]||q.difficulty}</span>
              <span style={{ fontSize:11, color:"#555", marginLeft:"auto" }}>Pregunta {i+1}/5</span>
            </div>
            <div style={{ fontWeight:700, fontSize:15, marginBottom:12, lineHeight:1.4 }}>{q.question}</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {q.options.map((opt,oi)=>{
                let bg = "rgba(255,255,255,0.04)", border = "1px solid #333", color = "#ccc";
                if (myAnswer === oi) {
                  if (!isAnswered) { bg="#0f3460"; border=`1px solid ${C.red}`; color="#fff"; }
                  else if (isCorrect) { bg="rgba(27,127,74,0.2)"; border="1px solid #1b7f4a"; color="#4ade80"; }
                  else { bg="rgba(127,27,27,0.2)"; border="1px solid #7f1b1b"; color="#f87171"; }
                } else if (isAnswered && oi === q.correct_index) {
                  bg="rgba(27,127,74,0.1)"; border="1px solid #1b7f4a"; color="#4ade80";
                }
                return (
                  <button key={oi} disabled={isAnswered}
                    style={{ background:bg, border, borderRadius:8, color, padding:"10px 14px", textAlign:"left", cursor:isAnswered?"default":"pointer", fontSize:14, fontWeight:myAnswer===oi?700:"normal" }}
                    onClick={()=>!isAnswered&&setSelected(p=>({...p,[i]:oi}))}>
                    {["A","B","C","D"][oi]}. {opt}
                    {isAnswered && oi===q.correct_index && <span style={{float:"right"}}>✅</span>}
                    {isAnswered && myAnswer===oi && !isCorrect && <span style={{float:"right"}}>❌</span>}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {!answered && (
        <button
          style={{ ...btn(), width:"100%", marginTop:8, opacity:Object.keys(selected).length<questions.length?0.5:1 }}
          onClick={handleSubmit}
          disabled={Object.keys(selected).length < questions.length}>
          {Object.keys(selected).length < questions.length
            ? `Responde todas las preguntas (${Object.keys(selected).length}/5)`
            : "Enviar respuestas"}
        </button>
      )}
    </div>
  );
};
