"use client";

// La boucle d'apprentissage complète d'une leçon :
// cours (complet / concepts clés) → vérification de maîtrise → remédiation
// ciblée → exercices past-paper → correction au mark scheme → refaire ou
// avancer → points à travailler.
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import RichText from "@/components/RichText";
import SessionTimer from "@/components/SessionTimer";
import BackLink from "@/components/BackLink";
import AskEmma from "@/components/AskEmma";
import Whiteboard from "@/components/Whiteboard";
import { compressImage } from "@/lib/compressImage";
import type {
  Concept, Course, Exercise, ExerciseMark, QuizGrade, QuizQuestion, Remediation,
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
  | "remediation" | "exercises" | "exercise-result" | "done";

const STATUS_LABEL: Record<string, string> = {
  acquis: "secure", fragile: "fragile", non_acquis: "to review",
};

export default function LessonPage() {
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [course, setCourse] = useState<Course | null>(null);
  const [quiz, setQuiz] = useState<{ attempt_id: string; questions: QuizQuestion[] } | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizGrade, setQuizGrade] = useState<QuizGrade | null>(null);
  const [rem, setRem] = useState<{ attempt_id: string; remediation: Remediation } | null>(null);
  const [remAnswers, setRemAnswers] = useState<Record<string, string>>({});
  const [remGrade, setRemGrade] = useState<QuizGrade | null>(null);
  const [ex, setEx] = useState<{ attempt_id: string; exercises: Exercise[] } | null>(null);
  const [exAnswers, setExAnswers] = useState<Record<string, string>>({});
  const [exPhotos, setExPhotos] = useState<File[]>([]);
  const [mark, setMark] = useState<ExerciseMark | null>(null);

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
    const d = await api<{ course: Course }>(`/api/lessons/${id}/course`, {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ mode }),
    });
    setCourse(d.course); setPhase("course"); window.scrollTo(0, 0);
  })();

  const startQuiz = run(async () => {
    const d = await api<{ attempt_id: string; questions: QuizQuestion[] }>(`/api/lessons/${id}/quiz`, { method: "POST" });
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

  const startExercises = (conceptKeys?: string[], variant?: boolean) => run(async () => {
    const d = await api<{ attempt_id: string; exercises: Exercise[] }>(`/api/lessons/${id}/exercises`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ concept_keys: conceptKeys || [], variant: !!variant }),
    });
    setEx(d); setExAnswers({}); setExPhotos([]); setMark(null); setPhase("exercises"); window.scrollTo(0, 0);
  })();

  const submitExercises = run(async () => {
    if (!ex) return;
    const fd = new FormData();
    fd.set("attempt_id", ex.attempt_id);
    fd.set("answers", JSON.stringify(ex.exercises.map((e) => ({ id: e.id, answer: exAnswers[e.id] || "" }))));
    const compressed = await Promise.all(exPhotos.map(compressImage));
    compressed.forEach((p) => fd.append("photos", p));
    const d = await api<{ mark: ExerciseMark }>(`/api/lessons/${id}/mark`, { method: "POST", body: fd });
    setMark(d.mark); await refresh(); setPhase("exercise-result"); window.scrollTo(0, 0);
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
          <SessionTimer />
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

      {/* Le tableau blanc — l'espace de travail de la séance (Emma le lit) */}
      {phase !== "course-choice" && (
        <div className="mb-5">
          <Whiteboard lessonId={lesson.id} initial={(lesson as { whiteboard?: string }).whiteboard || ""} />
        </div>
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
          {busy && <p className="text-sm text-muted sm:col-span-2">Emma is writing your lesson…</p>}
        </div>
      )}

      {/* ÉTAPE 2 — le cours */}
      {phase === "course" && course && (
        <div>
          <div className="card p-6">
            <RichText text={course.intro} />
            {course.sections.map((s) => (
              <div key={s.concept_key} className="mt-5 pt-5 border-t border-line">
                <h2 className="font-serif font-semibold text-xl">{s.title}</h2>
                <RichText text={s.body} className="mt-2" />
              </div>
            ))}
            {course.recap && (
              <div className="mt-6 bg-indigo-soft rounded-xl p-5">
                <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-indigo">One-minute recap</p>
                <RichText text={course.recap} className="mt-1" />
              </div>
            )}
          </div>

          {/* La main levée : questions APRÈS la lecture, avant la vérification */}
          <AskEmma lessonId={lesson.id} stage="course" />

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
              <p className="font-mono text-[11px] text-faint">Question {i + 1} · {concepts.find((c) => c.key === q.concept_key)?.label || q.concept_key}</p>
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
              <button onClick={() => startExercises()} disabled={busy} className="text-sm font-semibold text-faint hover:text-indigo mt-4">
                Skip ahead to the exercises anyway →
              </button>
            </div>
          ) : (
            <button onClick={() => startExercises()} disabled={busy} className="btn-primary w-full !py-3">
              {busy ? "Emma is preparing your exercises…" : "All secure — on to the exercises →"}
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
                <button onClick={() => startExercises()} disabled={busy} className="btn-primary !py-2.5">
                  {busy ? "…" : "On to the exercises →"}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ÉTAPE 6 — exercices */}
      {phase === "exercises" && ex && (
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <p className="text-muted text-sm flex-1 min-w-[240px]">
              {lesson.exam_board || "Your board's"} past-paper style. Do them <strong>online</strong> or <strong>on paper</strong> — in that case,
              take a photo of your work and upload it below: Emma marks the handwriting against the mark scheme.
            </p>
            <Link href={`/paper/${ex.attempt_id}`} className="btn-ghost !py-1.5 !px-3.5 text-[13px] shrink-0" target="_blank">
              🖨️ Print / download this paper
            </Link>
          </div>
          {ex.exercises.map((e, i) => (
            <div key={e.id} className="card p-5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="font-mono text-[11px] text-faint">Exercise {i + 1}</p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {e.command_word && <span className="chip bg-amber-soft text-amber font-mono">“{e.command_word}”</span>}
                  {e.question_type && <span className="chip-todo">{e.question_type}</span>}
                  <span className="chip-todo">{e.marks} marks{e.time_min ? ` · ~${e.time_min} min` : ""}</span>
                </div>
              </div>
              <RichText text={e.statement} className="mt-1.5" />
              {(e.exam_expectation || e.method_note) && (
                <p className="text-xs text-muted mt-2 bg-indigo-soft rounded-lg px-3 py-2">
                  🎯 <strong>What the examiner expects:</strong> {e.exam_expectation || e.method_note}
                </p>
              )}
              <textarea
                className="input mt-3 min-h-[90px] font-mono text-[14px]"
                placeholder="Your answer here… (or leave blank if you're uploading a photo of your work)"
                value={exAnswers[e.id] || ""}
                onChange={(ev) => setExAnswers((a) => ({ ...a, [e.id]: ev.target.value }))}
              />
            </div>
          ))}
          <div className="card p-5">
            <label className="text-sm font-semibold">Photo(s) of your work <span className="text-faint font-normal">(up to 3)</span></label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="mt-2 block w-full text-sm text-muted"
              onChange={(e) => setExPhotos(Array.from(e.target.files || []).slice(0, 3))}
            />
            {exPhotos.length > 0 && (
              <p className="text-xs text-faint mt-1">{exPhotos.map((p) => p.name).join(" · ")}</p>
            )}
          </div>
          <button onClick={submitExercises} disabled={busy} className="btn-primary w-full !py-3">
            {busy ? "Emma is marking your work against the mark scheme…" : "Send for marking"}
          </button>
        </div>
      )}

      {/* ÉTAPE 7 — correction des exercices + décision */}
      {phase === "exercise-result" && mark && ex && (
        <div className="space-y-4">
          <div className="card p-5 bg-indigo-soft border-indigo-soft">
            <p className="font-semibold text-indigo-deep">{mark.summary}</p>
            <p className="font-mono text-sm text-indigo mt-2">
              Total: {mark.items.reduce((s, i) => s + (i.marks_awarded || 0), 0)}
              /{mark.items.reduce((s, i) => s + (i.marks_total || 0), 0)} marks
            </p>
          </div>
          {ex.exercises.map((e, i) => {
            const it = mark.items.find((x) => x.id === e.id);
            if (!it) return null;
            const tone = it.verdict === "secure" ? "chip-acquis" : it.verdict === "fragile" ? "chip-fragile" : "chip-non_acquis";
            return (
              <div key={e.id} className="card p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={tone}>{it.marks_awarded}/{it.marks_total} marks</span>
                    <p className="font-mono text-[11px] text-faint">Exercise {i + 1}</p>
                  </div>
                </div>
                <RichText text={it.feedback} className="mt-2" />
                <p className="text-sm text-muted mt-2"><strong>Method marks:</strong> {it.method_comment}</p>
                {Array.isArray(it.exam_habits) && it.exam_habits.length > 0 && (
                  <div className="text-sm mt-2 bg-learning-bg rounded-lg px-3 py-2">
                    <strong className="text-learning">Exam technique to fix:</strong>
                    <ul className="list-disc pl-5 mt-1 text-muted">
                      {it.exam_habits.map((h, j) => <li key={j}>{h}</li>)}
                    </ul>
                  </div>
                )}
                {it.misconception && <p className="text-sm text-gap font-semibold mt-1">Misconception spotted: {it.misconception}</p>}
                <details className="mt-2">
                  <summary className="text-sm font-semibold text-indigo cursor-pointer">Step-by-step solution (mark scheme)</summary>
                  <RichText text={it.model_solution} className="mt-2" />
                </details>
              </div>
            );
          })}
          <AskEmma lessonId={lesson.id} stage="exercise-result" />

          {mark.decision === "redo" ? (
            <div className="card p-5 border-amber">
              <h2 className="font-serif font-semibold text-lg">Emma's verdict: go again — different variation</h2>
              <p className="text-sm text-muted mt-1">
                Same concept(s), different question. Doing it again is what makes it stick.
              </p>
              <button onClick={() => startExercises(mark.redo_concept_keys, true)} disabled={busy} className="btn-amber mt-3">
                {busy ? "Emma is preparing the variation…" : "Try a targeted variation"}
              </button>
            </div>
          ) : (
            <button onClick={() => setPhase("done")} className="btn-primary w-full !py-3">
              Loop closed ✓ — see my summary
            </button>
          )}
        </div>
      )}

      {/* ÉTAPE 8 — bilan de la leçon */}
      {phase === "done" && (
        <div className="space-y-4">
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
            <Link href="/dashboard" className="btn-primary">Back to dashboard</Link>
            <button onClick={() => startExercises()} disabled={busy} className="btn-ghost">More exercises</button>
          </div>
        </div>
      )}
    </div>
  );
}
