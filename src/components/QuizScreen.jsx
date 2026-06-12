import { useState, useEffect, useRef } from "react";
import { QUIZ_QUESTIONS } from "../data/quiz.js";
import { C, card, sec, btn } from "./ui.jsx";
import { db } from "../lib/supabase.js";

const getTodayDate = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
};

// Hardcoded assignments computed offline — guaranteed zero repeats across 17 quizzes
const ASSIGNMENTS = {
  easy:   [16,2,34,32,11,24,36,27,30,22,23,28,26,13,35,14,0,9,6,39,15,29,5,4,12,37,21,1,31,25,10,33,17,19,8,38,18,3,7,20],
  medium: [3,20,38,19,30,33,21,22,17,26,28,31,0,12,37,34,16,6,27,10,15,11,23,4,13,36,35,39,1,7,18,14,25,8,29,2,5,24,32,9],
  hard:   [5,8,9,16,6,10,13,18,19,1,2,14,0,4,15,7,3,11,17,12],
};

const getDailyQuestions = (label) => {
  const quizNum = parseInt(label.replace("quiz-","")) || 1;
  const i = quizNum - 1;

  const easy = QUIZ_QUESTIONS.filter(q => q.difficulty === "facil");
  const medium = QUIZ_QUESTIONS.filter(q => q.difficulty === "media");
  const hard = QUIZ_QUESTIONS.filter(q => q.difficulty === "dificil");

  const picked = [
    easy[ASSIGNMENTS.easy[i * 2]],
    easy[ASSIGNMENTS.easy[i * 2 + 1]],
    medium[ASSIGNMENTS.medium[i * 2]],
    medium[ASSIGNMENTS.medium[i * 2 + 1]],
    hard[ASSIGNMENTS.hard[i]],
  ];

  return picked.map((q, idx) => ({ ...q, idx }));
};

const TIMER_SECONDS = 15;

export const QuizScreen = ({ participant, openQuizDates, onSaveAnswers }) => {
  const today = getTodayDate();
  const [activeLabel, setActiveLabel] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState({});
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [phase, setPhase] = useState("list"); // list | playing | done
  const [results, setResults] = useState(null);
  const [completedLabels, setCompletedLabels] = useState([]);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!participant) { setLoading(false); return; }
    // Check which quizzes participant already completed
    db.getQuizAnswersByParticipant(participant.id).then(answers => {
      const labels = [...new Set(answers.map(a => a.quiz_label).filter(Boolean))];
      console.log("Completed quiz labels from DB:", labels);
      setCompletedLabels(labels);
      setLoading(false);
    });
  }, [participant]);

  // Use refs to avoid stale closures in timer
  const currentQRef = useRef(0);
  const questionsRef = useRef([]);
  const selectedRef = useRef({});
  const advancingRef = useRef(false);

  useEffect(() => { currentQRef.current = currentQ; }, [currentQ]);
  useEffect(() => { questionsRef.current = questions; }, [questions]);

  const doAdvance = (sel, sel_map) => {
    if (advancingRef.current) return;
    advancingRef.current = true;
    clearInterval(timerRef.current);
    const q = currentQRef.current;
    const qs = questionsRef.current;
    setTimeout(() => {
      advancingRef.current = false;
      if (q < qs.length - 1) {
        setCurrentQ(q + 1);
        setTimeLeft(TIMER_SECONDS);
      } else {
        // Last question — finish directly with the selection map
        const finalSel = sel_map;
        const answers = qs.map((question, i) => {
          const s = finalSel[i] ?? -1;
          const isCorrect = s === question.correct_index;
          return { questionId: question.idx, selectedIndex: s, isCorrect, coinsEarned: isCorrect ? 10 : 0 };
        });
        let coins = answers.reduce((sum, a) => sum + a.coinsEarned, 0);
        if (answers.every(a => a.isCorrect)) coins += 20;
        setResults({ answers, coins, correct: answers.filter(a => a.isCorrect).length });
        setPhase("done");
        onSaveAnswers(answers, coins, activeLabelRef.current);
        setCompletedLabels(prev => [...prev, activeLabelRef.current]);
        setCompletedLabels(prev => [...prev, activeLabelRef.current]);
      }
    }, sel === -1 ? 800 : 1000);
  };

  // Timer — resets per question
  useEffect(() => {
    if (phase !== "playing") return;
    advancingRef.current = false;
    setTimeLeft(TIMER_SECONDS);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Time's up
          setSelected(s => {
            if (s[currentQRef.current] === undefined) {
              const updated = { ...s, [currentQRef.current]: -1 };
              selectedRef.current = updated;
              doAdvance(-1, updated);
              return updated;
            }
            return s;
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, currentQ]); // eslint-disable-line

  const handleSelect = (optIdx) => {
    if (selected[currentQ] !== undefined) return;
    clearInterval(timerRef.current);
    const updated = { ...selected, [currentQ]: optIdx };
    selectedRef.current = updated;
    setSelected(updated);
    doAdvance(optIdx, updated);
  };



  const startQuiz = (label) => {
    const qs = getDailyQuestions(label);
    setQuestions(qs);
    setActiveLabel(label);
    setCurrentQ(0);
    setSelected({});
    setTimeLeft(TIMER_SECONDS);
    setResults(null);
    setPhase("playing");
  };

  if (!participant) return (
    <div style={{ maxWidth:600, margin:"0 auto", padding:"24px 16px", textAlign:"center" }}>
      <div style={{ fontSize:40, marginBottom:12 }}>🧠</div>
      <div style={{ color:"#888" }}>Inicia sesión para jugar el quiz diario.</div>
    </div>
  );

  if (loading) return (
    <div style={{ maxWidth:600, margin:"0 auto", padding:"24px 16px", textAlign:"center" }}>
      <div style={{ color:C.red }}>Cargando quiz…</div>
    </div>
  );

  // ── LIST PHASE ──
  if (phase === "list") {
    const available = openQuizDates || [];
    return (
      <div style={{ maxWidth:600, margin:"0 auto", padding:"20px 16px" }}>
        <div style={{ fontSize:22, fontWeight:900, marginBottom:4 }}>🧠 Quiz <span style={{color:C.red}}>Mundialista</span></div>
        <div style={{ fontSize:12, color:"#888", marginBottom:20 }}>5 preguntas · 15 segundos por pregunta · +10 🪙 por acierto</div>

        {available.length === 0 ? (
          <div style={{ ...card, textAlign:"center", padding:40 }}>
            <div style={{ fontSize:40, marginBottom:12 }}>🔒</div>
            <div style={{ color:"#888" }}>No hay quizzes disponibles aún. El admin los abrirá pronto.</div>
          </div>
        ) : (
          available.map(label => {
            const done = completedLabels.includes(label);
            return (
              <div key={label} style={{ ...card, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 20px" }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:16 }}>Quiz del {label}</div>
                  <div style={{ fontSize:12, color:"#888", marginTop:2 }}>5 preguntas · +10 🪙 c/u · Bonus +20 🪙 si aciertas todas</div>
                </div>
                <button
                  style={{
                    ...btn(done ? "success" : "primary"),
                    minWidth:100,
                    background: done ? C.green : C.red,
                    cursor: done ? "default" : "pointer",
                  }}
                  disabled={done}
                  onClick={() => !done && startQuiz(label)}>
                  {done ? "✅ Completado" : "Jugar"}
                </button>
              </div>
            );
          })
        )}
      </div>
    );
  }

  // ── DONE PHASE ──
  if (phase === "done" && results) {
    return (
      <div style={{ maxWidth:600, margin:"0 auto", padding:"20px 16px" }}>
        <div style={{ fontSize:22, fontWeight:900, marginBottom:20 }}>🧠 Quiz <span style={{color:C.red}}>Completado</span></div>
        <div style={{ ...card, textAlign:"center", padding:32, background:"rgba(27,127,74,0.1)", border:"1px solid #1b7f4a" }}>
          <div style={{ fontSize:50, marginBottom:8 }}>
            {results.correct===5?"🌟":results.correct>=3?"🔥":results.correct>=1?"👍":"😅"}
          </div>
          <div style={{ fontSize:24, fontWeight:900, marginBottom:4 }}>{results.correct}/5 correctas</div>
          <div style={{ fontSize:20, color:"#fbbf24", fontWeight:700 }}>+{results.coins} 🪙 FIFA Coins</div>
          {results.correct===5&&<div style={{ fontSize:13, color:"#4ade80", marginTop:6 }}>¡Bonus perfecto! +20 🪙 extra</div>}
        </div>

        {/* Answer review */}
        <div style={{ marginTop:16 }}>
          {questions.map((q, i) => {
            const ans = results.answers[i];
            const timedOut = ans.selectedIndex === -1;
            return (
              <div key={i} style={{ ...card, marginBottom:8, padding:"12px 16px" }}>
                <div style={{ fontSize:13, fontWeight:700, marginBottom:8 }}>{i+1}. {q.question}</div>
                <div style={{ fontSize:13 }}>
                  {timedOut ? (
                    <span style={{ color:"#f87171" }}>⏱️ Tiempo agotado — Respuesta correcta: {q.options[q.correct_index]}</span>
                  ) : ans.isCorrect ? (
                    <span style={{ color:"#4ade80" }}>✅ {q.options[ans.selectedIndex]}</span>
                  ) : (
                    <span>
                      <span style={{ color:"#f87171" }}>❌ {q.options[ans.selectedIndex]}</span>
                      <span style={{ color:"#888" }}> → ✅ {q.options[q.correct_index]}</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <button style={{ ...btn("outline"), width:"100%", marginTop:8 }} onClick={() => setPhase("list")}>
          Volver a la lista
        </button>
      </div>
    );
  }

  // ── PLAYING PHASE ──
  const q = questions[currentQ];
  if (!q) return null;
  const timerPct = (timeLeft / TIMER_SECONDS) * 100;
  const timerColor = timeLeft > 15 ? "#4ade80" : timeLeft > 7 ? "#fbbf24" : C.red;
  const answered = selected[currentQ] !== undefined;

  return (
    <div style={{ maxWidth:600, margin:"0 auto", padding:"20px 16px" }}>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
        <div style={{ fontSize:13, color:"#888" }}>Pregunta {currentQ+1} / {questions.length}</div>
        <div style={{ fontSize:22, fontWeight:900, color:timerColor, fontVariantNumeric:"tabular-nums", minWidth:40, textAlign:"right" }}>
          {timeLeft}s
        </div>
      </div>

      {/* Timer bar */}
      <div style={{ height:6, background:"rgba(255,255,255,0.08)", borderRadius:3, marginBottom:20, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${timerPct}%`, background:timerColor, borderRadius:3, transition:"width 1s linear" }}/>
      </div>

      {/* Question */}
      <div style={{ ...card, padding:"20px" }}>
        <div style={{ fontSize:11, color:"#888", marginBottom:8 }}>
          {q.category} · {q.difficulty === "facil" ? "🟢 Fácil" : q.difficulty === "media" ? "🟡 Media" : "🔴 Difícil"}
        </div>
        <div style={{ fontWeight:700, fontSize:17, lineHeight:1.4, marginBottom:20 }}>{q.question}</div>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {q.options.map((opt, oi) => {
            const sel = selected[currentQ];
            let bg = "rgba(255,255,255,0.04)", border = "1px solid #333", color = "#ccc";
            if (answered) {
              if (oi === q.correct_index) { bg="rgba(27,127,74,0.2)"; border="1px solid #1b7f4a"; color="#4ade80"; }
              else if (sel === oi) { bg="rgba(127,27,27,0.2)"; border="1px solid #7f1b1b"; color="#f87171"; }
            } else if (sel === oi) {
              bg=C.blue; border=`1px solid ${C.red}`; color="#fff";
            }
            return (
              <button key={oi} disabled={answered}
                style={{ background:bg, border, borderRadius:8, color, padding:"12px 16px", textAlign:"left", cursor:answered?"default":"pointer", fontSize:14, fontWeight:sel===oi?700:"normal" }}
                onClick={() => handleSelect(oi)}>
                <span style={{ color:"#666", marginRight:8 }}>{["A","B","C","D"][oi]}.</span> {opt}
                {answered && oi===q.correct_index && <span style={{float:"right"}}>✅</span>}
                {answered && sel===oi && oi!==q.correct_index && <span style={{float:"right"}}>❌</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Progress dots */}
      <div style={{ display:"flex", justifyContent:"center", gap:8, marginTop:16 }}>
        {questions.map((_,i) => (
          <div key={i} style={{
            width:10, height:10, borderRadius:"50%",
            background: i < currentQ ? (results?.answers[i]?.isCorrect ? "#4ade80" : "#f87171") :
                        i === currentQ ? C.red : "#333"
          }}/>
        ))}
      </div>
    </div>
  );
};
