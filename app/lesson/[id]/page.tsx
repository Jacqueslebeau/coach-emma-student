"use client";

// La boucle d'apprentissage complète d'une leçon :
// cours (complet / concepts clés) → vérification de maîtrise → remédiation
// ciblée → exercices past-paper → correction au mark scheme → refaire ou
// avancer → points à travailler.
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import RichText from "@/components/RichText";
import BackLink from "@/components/BackLink";
import AskEmma from "@/components/AskEmma";
import ConceptExplainer from "@/components/ConceptExplainer";
import LessonListen from "@/components/LessonListen";
import SpeakButton from "@/components/SpeakButton";
import VoiceTalk from "@/components/VoiceTalk";
import WaitOverlay from "@/components/WaitOverlay";
import type {
  Concept, Course, QuizGrade, QuizQuestion, Remediation,
} from "@/lib/types";

type Detail = {
  lesson: {
    id: string; title: string; subject: string; exam_board: string | null;
    spec_topic: string | null; stage: string;
    concepts: Concept[]; course: Record<string, Course>;
  };
  mastery: { concept_key: string; label: string; status: string }[];
  weak_points: { id: string; concept_key: string; label: string; misconception: string | null; status: string }[];
  first_name: string;
};

type Phase =
  | "loading" | "course-choice" | "course" | "quiz" | "quiz-result"
  | "remediation" | "done";

const STATUS_LABEL: Record<string, string> = {
  acquis: "secure", fragile: "fragile", non_acquis: "to review",
};

export default function LessonPage() {
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Pop-up d'attente pour les fabrications longues (leçon, questions).
  const [waiting, setWaiting] = useState<null | "course" | "quiz">(null);
  // Mode 🎧 Listen : Emma présente la leçon (pop-ups visuels + voix).
  // L'audio est créé au niveau page et DÉBLOQUÉ dans le clic du bouton.
  const [listening, setListening] = useState(false);
  const listenAudioRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    const a = new Audio();
    listenAudioRef.current = a;
    return () => a.pause();
  }, []);

  const [course, setCourse] = useState<Course | null>(null);
  const [quiz, setQuiz] = useState<{ attempt_id: string; questions: QuizQuestion[] } | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizGrade, setQuizGrade] = useState<QuizGrade | null>(null);
  const [rem, setRem] = useState<{ attempt_id: string; remediation: Remediation } | null>(null);
  const [remAnswers, setRemAnswers] = useState<Record<string, string>>({});
  const [remGrade, setRemGrade] = useState<QuizGrade | null>(null);
  // Le past paper assigné en fin de leçon (nouveau format : il se fait à part).
  const [assignedPaper, setAssignedPaper] = useState<string | null>(null);

  const refresh = useCallback(async (): Promise<Detail | null> => {
    const r = await fetch(`/api/lessons/${id}`);
    if (!r.ok) { setError("Lesson not found"); return null; }
    const d: Detail = await r.json();
    setDetail(d);
    return d;
  }, [id]);

  useEffect(() => {
    refresh().then((d) => {
      if (!d) return;
      if (d.lesson.stage === "done") { setPhase("done"); return; }
      const c = d.lesson.course || {};
      const existing = c.full?.sections?.length ? c.full : c.key?.sections?.length ? c.key : null;
      if (existing) { setCourse(existing); setPhase("course"); }
      else setPhase("course-choice");
    });
  }, [refresh]);

  // PRÉCHAUFFAGE : dès que le cours s'affiche, on génère en tâche de fond les
  // storyboards de toutes les sections (cachés côté serveur). Le clic 🎬/🎧
  // ne paie alors plus que la voix (~3-5 s) au lieu de toute la génération.
  const warmedRef = useRef<string | null>(null);
  useEffect(() => {
    if (phase !== "course" || !course || !detail) return;
    const mode = course.mode === "full" ? "full" : "key";
    if (warmedRef.current === mode) return;
    warmedRef.current = mode;
    const keys = ["overview", ...course.sections.map((s) => s.concept_key), ...(course.recap ? ["recap"] : [])];
    (async () => {
      // 2 générations en parallèle max — silencieux, jamais bloquant.
      const queue = [...keys];
      const worker = async () => {
        for (let k = queue.shift(); k; k = queue.shift()) {
          await fetch(`/api/lessons/${detail.lesson.id}/speak`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ mode, section: k, format: "slides" }),
          }).catch(() => {});
        }
      };
      await Promise.all([worker(), worker()]);
    })();
  }, [phase, course, detail]);

  async function api<T>(path: string, init?: RequestInit): Promise<T> {
    setBusy(true); setError(null);
    try {
      const r = await fetch(path, init);
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Something went wrong — try again.");
      return d as T;
    } finally {
      setBusy(false);
    }
  }

  const run = (fn: () => Promise<void>) => () => { fn().catch((e) => setError((e as Error).message)); };

  const chooseCourse = (mode: "full" | "key") => run(async () => {
    setWaiting("course");
    const d = await api<{ course: Course }>(`/api/lessons/${id}/course`, {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ mode }),
    }).finally(() => setWaiting(null));
    setCourse(d.course); setPhase("course"); window.scrollTo(0, 0);
    // La relecture factuelle tourne en arrière-plan côté serveur : on
    // re-synchronise silencieusement le cours réparé quelques minutes après.
    setTimeout(async () => {
      const fresh = await refresh();
      const c = (fresh?.lesson.course || {})[mode];
      if (c?.sections?.length) setCourse(c);
    }, 180_000);
  })();

  const startQuiz = run(async () => {
    setWaiting("quiz");
    const d = await api<{ attempt_id: string; questions: QuizQuestion[] }>(`/api/lessons/${id}/quiz`, { method: "POST" })
      .finally(() => setWaiting(null));
    setQuiz(d); setQuizAnswers({}); setQuizGrade(null); setPhase("quiz"); window.scrollTo(0, 0);
  });

  const submitQuiz = run(async () => {
    if (!quiz) return;
    const answers = quiz.questions.map((q) => ({ id: q.id, answer: quizAnswers[q.id] || "" }));
    const d = await api<{ grade: QuizGrade }>(`/api/lessons/${id}/grade`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ attempt_id: quiz.attempt_id, answers }),
    });
    setQuizGrade(d.grade); await refresh(); setPhase("quiz-result"); window.scrollTo(0, 0);
  });

  const startRemediation = (conceptKey: string) => run(async () => {
    const d = await api<{ attempt_id: string; remediation: Remediation }>(`/api/lessons/${id}/remediate`, {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ concept_key: conceptKey }),
    });
    setRem(d); setRemAnswers({}); setRemGrade(null); setPhase("remediation"); window.scrollTo(0, 0);
  })();

  const submitRemediation = run(async () => {
    if (!rem) return;
    const answers = rem.remediation.questions.map((q) => ({ id: q.id, answer: remAnswers[q.id] || "" }));
    const d = await api<{ grade: QuizGrade }>(`/api/lessons/${id}/grade`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ attempt_id: rem.attempt_id, answers }),
    });
    setRemGrade(d.grade); await refresh();
  });

  // FIN DE LEÇON (nouveau format) : Emma ASSIGNE le past paper — il se fait
  // à part (en ligne ou imprimé), visible dans My space, débriefé ensuite.
  const finishLesson = run(async () => {
    const d = await api<{ attempt_id: string }>(`/api/lessons/${id}/exercises`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ concept_keys: [], variant: false, assign: true }),
    });
    setAssignedPaper(d.attempt_id);
    await refresh();
    setPhase("done");
    window.scrollTo(0, 0);
  });

  if (error && !detail) return <p className="text-gap font-semibold">{error}</p>;
  if (!detail || phase === "loading") return <p className="text-muted">Loading…</p>;

  const { lesson, mastery, weak_points } = detail;
  const concepts = lesson.concepts || [];
  const statusOf = (key: string) => mastery.find((m) => m.concept_key === key)?.status || "todo";
  const notAcquired = concepts.filter((c) => {
    const s = statusOf(c.key);
    return s === "fragile" || s === "non_acquis";
  });

  return (
    <div className="max-w-3xl mx-auto">
      {/* En-tête leçon + barre de maîtrise (toujours visible) */}
      <div className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <BackLink />
          <p className="font-mono text-[11px] text-faint">
            {[lesson.exam_board, lesson.spec_topic].filter(Boolean).join(" · ") || "A Level"}
          </p>
        </div>
        <h1 className="font-serif font-black text-2xl text-indigo-deep mt-0.5">{lesson.title}</h1>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {concepts.map((c) => {
            const s = statusOf(c.key);
            const cls = s === "todo" ? "chip-todo" : `chip-${s}`;
            return (
              <span key={c.key} className={cls} title={c.why || c.label}>
                {c.label}{s !== "todo" ? ` · ${STATUS_LABEL[s]}` : ""}
              </span>
            );
          })}
        </div>
      </div>

      {error && <p className="text-sm text-gap font-semibold mb-4">{error}</p>}

      {waiting === "course" && (
        <WaitOverlay
          title="Emma is writing your lesson"
          lines={[
            "📚 Reading your board's specification…",
            "✍️ Writing each concept for YOUR starting point…",
            "🎯 Adding the exam traps and the A* edge…",
            "🔍 A second pair of eyes checks every fact…",
          ]}
          note="Usually 1-2 minutes — it's written for you, not pulled from a stock."
        />
      )}
      {waiting === "quiz" && (
        <WaitOverlay
          title="Emma is preparing your mastery check"
          lines={[
            "🎯 One question per concept…",
            "⚖️ Calibrating to your level…",
            "✍️ Wording them exam-style…",
          ]}
          note="About 30 seconds."
        />
      )}

      {/* ÉTAPE 1 — choix du cours */}
      {phase === "course-choice" && (
        <div className="grid sm:grid-cols-2 gap-4">
          <button onClick={() => chooseCourse("full")} disabled={busy} className="card p-6 text-left hover:border-indigo transition disabled:opacity-60">
            <h2 className="font-serif font-semibold text-lg">Full lesson</h2>
            <p className="text-sm text-muted mt-1.5">
              Every concept explained in depth: the intuition, the notation, a worked example, the exam trap.
            </p>
            <span className="chip-todo mt-4">~10 min read</span>
          </button>
          <button onClick={() => chooseCourse("key")} disabled={busy} className="card p-6 text-left hover:border-amber transition disabled:opacity-60">
            <h2 className="font-serif font-semibold text-lg">Key concepts</h2>
            <p className="text-sm text-muted mt-1.5">
              The quick version: formulas, reflexes, traps. For revision, or if your teacher's lesson was clear.
            </p>
            <span className="chip bg-amber-soft text-amber mt-4">~3 min read</span>
          </button>
          {busy && (
            <p className="text-sm text-muted sm:col-span-2 animate-pulse">
              ✍️ Emma is writing your lesson against the {detail.lesson.exam_board || "board"} spec — usually about 2 minutes. Worth the wait: it&apos;s written for YOUR starting point.
            </p>
          )}
        </div>
      )}

      {/* ÉTAPE 2 — le cours : LIRE (à ton rythme) ou ÉCOUTER (Emma présente,
          pop-ups visuels au fil de sa voix) — jamais les deux en même temps. */}
      {phase === "course" && course && (
        <div>
          <div className="rounded-xl bg-indigo-soft px-4 py-2.5 text-[13.5px] text-indigo-deep flex items-center justify-between gap-3 flex-wrap">
            <span>📖 <strong>Read it</strong> at your own pace — or stuck on one concept? Hit <strong>🎬 Watch Emma explain</strong>.</span>
            <button
              type="button"
              onClick={() => {
                const a = listenAudioRef.current;
                if (a) {
                  a.src = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=";
                  a.play().catch(() => {});
                }
                setListening(true);
              }}
              className="btn-primary !py-1.5 !px-4 text-[13px] shrink-0"
              title="Emma presents the lesson out loud, with visuals popping up as she talks"
            >
              🎧 Listen — Emma presents it
            </button>
          </div>

          {/* 🎙 La tutrice en direct : Emma ENTEND l'élève et répond de vive
              voix, ancrée sur CETTE leçon (même mécanisme que le coaching). */}
          <div className="mt-3 flex justify-end">
            <VoiceTalk mode="lesson" lessonId={lesson.id} label="🎙 Talk to Emma about this lesson" />
          </div>
          {listening && (
            <LessonListen
              lessonId={lesson.id}
              mode={course.mode === "full" ? "full" : "key"}
              sections={[
                // L'ouverture : le concept en une phrase + l'annonce du plan.
                { key: "overview", title: "What we'll cover today" },
                ...course.sections.map((s) => ({ key: s.concept_key, title: s.title })),
                ...(course.recap ? [{ key: "recap", title: "One-minute recap" }] : []),
              ]}
              audio={listenAudioRef.current}
              onClose={() => { listenAudioRef.current?.pause(); setListening(false); }}
            />
          )}
          <div className="card p-6 mt-4">
            <RichText text={course.intro} />
            {course.sections.map((s) => (
              <div key={s.concept_key} className="mt-5 pt-5 border-t border-line">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <h2 className="font-serif font-semibold text-xl">{s.title}</h2>
                  <ConceptExplainer
                    lessonId={lesson.id}
                    mode={course.mode === "full" ? "full" : "key"}
                    section={s.concept_key}
                    title={s.title}
                    compact
                  />
                </div>
                <RichText text={s.body} className="mt-2" />
              </div>
            ))}
            {course.recap && (
              <div className="mt-6 bg-indigo-soft rounded-xl p-5">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-indigo">One-minute recap</p>
                  <ConceptExplainer
                    lessonId={lesson.id}
                    mode={course.mode === "full" ? "full" : "key"}
                    section="recap"
                    title="One-minute recap"
                    compact
                  />
                </div>
                <RichText text={course.recap} className="mt-1" />
              </div>
            )}
          </div>

          {/* La main levée : pause la lecture, pose ta question, on reprend */}
          <div id="ask-emma-course">
            <AskEmma lessonId={lesson.id} stage="course" />
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-6">
            <button onClick={startQuiz} disabled={busy} className="btn-primary !py-3 !px-6">
              {busy ? "Emma is preparing your questions…" : "Check my mastery →"}
            </button>
            {!course.sections.length ? null : course.mode === "key" ? (
              <button onClick={() => chooseCourse("full")} disabled={busy} className="btn-ghost">See the full lesson</button>
            ) : (
              <button onClick={() => chooseCourse("key")} disabled={busy} className="btn-ghost">Key concepts version</button>
            )}
          </div>
        </div>
      )}

      {/* ÉTAPE 3 — quiz de maîtrise */}
      {phase === "quiz" && quiz && (
        <div className="space-y-4">
          <p className="text-muted text-sm">
            Answer with your result <strong>and the key step of your working</strong> — it's the method we're checking, not luck.
          </p>
          {quiz.questions.map((q, i) => (
            <div key={q.id} className="card p-5">
              <div className="flex items-start justify-between gap-2">
                <p className="font-mono text-[11px] text-faint">Question {i + 1} · {concepts.find((c) => c.key === q.concept_key)?.label || q.concept_key}</p>
                <SpeakButton text={q.question} title="Emma asks it aloud" />
              </div>
              <RichText text={q.question} className="mt-1.5" />
              <textarea
                className="input mt-3 min-h-[70px] font-mono text-[14px]"
                placeholder="Your answer (result + method)…"
                value={quizAnswers[q.id] || ""}
                onChange={(e) => setQuizAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
              />
            </div>
          ))}
          <button onClick={submitQuiz} disabled={busy} className="btn-primary w-full !py-3">
            {busy ? "Emma is marking…" : "Send my answers"}
          </button>
        </div>
      )}

      {/* ÉTAPE 4 — résultat du diagnostic */}
      {phase === "quiz-result" && quizGrade && quiz && (
        <div className="space-y-4">
          <div className="card p-5 bg-indigo-soft border-indigo-soft">
            <p className="font-semibold text-indigo-deep">{quizGrade.encouragement}</p>
          </div>
          {quiz.questions.map((q, i) => {
            const it = quizGrade.items.find((x) => x.id === q.id);
            if (!it) return null;
            const tone = it.verdict === "correct" ? "chip-acquis" : it.verdict === "partial" ? "chip-fragile" : "chip-non_acquis";
            return (
              <div key={q.id} className="card p-5">
                <div className="flex items-center gap-2">
                  <span className={tone}>{it.verdict === "correct" ? "correct" : it.verdict === "partial" ? "nearly" : "wrong"}</span>
                  <p className="font-mono text-[11px] text-faint">Question {i + 1}</p>
                </div>
                <RichText text={it.feedback} className="mt-2" />
                {it.misconception && (
                  <p className="text-sm text-gap font-semibold mt-1">Misconception spotted: {it.misconception}</p>
                )}
                <details className="mt-2">
                  <summary className="text-sm font-semibold text-indigo cursor-pointer">See the model answer</summary>
                  <RichText text={it.model_answer} className="mt-2" />
                </details>
              </div>
            );
          })}

          <AskEmma lessonId={lesson.id} stage="quiz-result" />

          {notAcquired.length > 0 ? (
            <div className="card p-5 border-amber">
              <h2 className="font-serif font-semibold text-lg">Let's revisit what's not clicking — precisely</h2>
              <p className="text-sm text-muted mt-1">Not the whole lesson: just the concept, explained a different way.</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {notAcquired.map((c) => (
                  <button key={c.key} onClick={() => startRemediation(c.key)} disabled={busy} className="btn-amber !py-2 text-[13px]">
                    Revisit “{c.label}”
                  </button>
                ))}
              </div>
              <button onClick={finishLesson} disabled={busy} className="text-sm font-semibold text-faint hover:text-indigo mt-4">
                Finish the lesson anyway — get my past paper →
              </button>
            </div>
          ) : (
            <button onClick={finishLesson} disabled={busy} className="btn-primary w-full !py-3">
              {busy ? "Emma is writing your past paper…" : "All secure — finish & get my past paper →"}
            </button>
          )}
        </div>
      )}

      {/* ÉTAPE 5 — remédiation ciblée */}
      {phase === "remediation" && rem && (
        <div className="space-y-4">
          <div className="card p-6 border-amber">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-amber">Targeted revisit</p>
            <RichText text={rem.remediation.explanation} className="mt-2" />
          </div>
          {!remGrade ? (
            <>
              {rem.remediation.questions.map((q, i) => (
                <div key={q.id} className="card p-5">
                  <p className="font-mono text-[11px] text-faint">Re-check {i + 1}/2</p>
                  <RichText text={q.question} className="mt-1.5" />
                  <textarea
                    className="input mt-3 min-h-[70px] font-mono text-[14px]"
                    placeholder="Your answer…"
                    value={remAnswers[q.id] || ""}
                    onChange={(e) => setRemAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                  />
                </div>
              ))}
              <button onClick={submitRemediation} disabled={busy} className="btn-primary w-full !py-3">
                {busy ? "Emma is marking…" : "Check"}
              </button>
            </>
          ) : (
            <>
              <div className="card p-5 bg-indigo-soft border-indigo-soft">
                <p className="font-semibold text-indigo-deep">{remGrade.encouragement}</p>
              </div>
              {remGrade.items.map((it) => (
                <div key={it.id} className="card p-5">
                  <span className={it.verdict === "correct" ? "chip-acquis" : it.verdict === "partial" ? "chip-fragile" : "chip-non_acquis"}>
                    {it.verdict === "correct" ? "correct" : it.verdict === "partial" ? "nearly" : "wrong"}
                  </span>
                  <RichText text={it.feedback} className="mt-2" />
                  <details className="mt-2">
                    <summary className="text-sm font-semibold text-indigo cursor-pointer">Model answer</summary>
                    <RichText text={it.model_answer} className="mt-2" />
                  </details>
                </div>
              ))}
              <div className="flex flex-wrap gap-3">
                {notAcquired.filter((c) => c.key !== rem.remediation.concept_key).map((c) => (
                  <button key={c.key} onClick={() => startRemediation(c.key)} disabled={busy} className="btn-amber !py-2 text-[13px]">
                    Revisit “{c.label}”
                  </button>
                ))}
                <button onClick={finishLesson} disabled={busy} className="btn-primary !py-2.5">
                  {busy ? "…" : "Finish the lesson — get my past paper →"}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ÉTAPES EXERCICES SUPPRIMÉES — nouveau format : le past paper
          est assigné en fin de leçon et se fait à part sur /paper/[id],
          puis est débriefé avec Emma (écrit ou vocal). */}

      {/* ÉTAPE 8 — bilan de la leçon + LE PAST PAPER ASSIGNÉ */}
      {phase === "done" && (
        <div className="space-y-4">
          {assignedPaper && (
            <div className="card p-6 border-amber bg-amber-soft/30">
              <h2 className="font-serif font-black text-xl text-indigo-deep">📝 Your past paper is ready</h2>
              <p className="text-sm text-muted mt-1.5">
                Emma wrote it on today&apos;s topic, in your board&apos;s exam format. Do it <strong>now or later</strong> —
                it stays in <strong>My space</strong> until it&apos;s done. Online, or print it and upload your script.
                Once marked, Emma debriefs it with you.
              </p>
              <Link href={`/paper/${assignedPaper}`} className="btn-amber inline-block mt-4 !py-2.5 !px-5">
                Open my past paper →
              </Link>
            </div>
          )}
          <div className="card p-6">
            <h2 className="font-serif font-black text-2xl text-indigo-deep">Lesson summary</h2>
            <div className="mt-4 space-y-2">
              {concepts.map((c) => {
                const s = statusOf(c.key);
                const cls = s === "todo" ? "chip-todo" : `chip-${s}`;
                return (
                  <div key={c.key} className="flex items-center justify-between border-b border-line pb-2 last:border-0">
                    <span className="text-[15px] font-semibold">{c.label}</span>
                    <span className={cls}>{s === "todo" ? "not checked" : STATUS_LABEL[s]}</span>
                  </div>
                );
              })}
            </div>
          </div>
          {weak_points.filter((w) => w.status === "open").length > 0 && (
            <div className="card p-6 border-amber">
              <h3 className="font-serif font-semibold text-lg">Your points to work on</h3>
              <p className="text-sm text-muted mt-1">Emma will bring these back — that's what builds the A★.</p>
              <ul className="mt-3 space-y-2">
                {weak_points.filter((w) => w.status === "open").map((w) => (
                  <li key={w.id} className="text-sm">
                    <span className="font-semibold">{w.label}</span>
                    {w.misconception && <span className="text-muted"> — {w.misconception}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex gap-3">
            <Link href="/dashboard" className="btn-primary">Back to My space</Link>
            {detail && <Link href={`/matiere/${detail.lesson.subject}`} className="btn-ghost">Subject console →</Link>}
          </div>
        </div>
      )}
    </div>
  );
}
