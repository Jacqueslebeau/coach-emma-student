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
import { compressImage } from "@/lib/compressImage";
import type {
  Concept, Course, Exercise, ExerciseMark, QuizGrade, QuizQuestion, Remediation,
} from "@/lib/types";

type Detail = {
  lesson: {
    id: string; title: string; spec_topic: string | null; stage: string;
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
  acquis: "acquis", fragile: "fragile", non_acquis: "à revoir",
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
    if (!r.ok) { setError("Leçon introuvable"); return null; }
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
      if (!r.ok) throw new Error(d.error || "Erreur — réessaie.");
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
  if (!detail || phase === "loading") return <p className="text-muted">Chargement…</p>;

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
          <p className="font-mono text-[11px] text-faint">{lesson.spec_topic || "Maths · Edexcel 9MA0"}</p>
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

      {/* ÉTAPE 1 — choix du cours */}
      {phase === "course-choice" && (
        <div className="grid sm:grid-cols-2 gap-4">
          <button onClick={() => chooseCourse("full")} disabled={busy} className="card p-6 text-left hover:border-indigo transition disabled:opacity-60">
            <h2 className="font-serif font-semibold text-lg">Cours complet</h2>
            <p className="text-sm text-muted mt-1.5">
              Chaque concept expliqué à fond : l'intuition, la notation, un exemple travaillé, le piège d'examen.
            </p>
            <span className="chip-todo mt-4">~10 min de lecture</span>
          </button>
          <button onClick={() => chooseCourse("key")} disabled={busy} className="card p-6 text-left hover:border-amber transition disabled:opacity-60">
            <h2 className="font-serif font-semibold text-lg">Concepts clés</h2>
            <p className="text-sm text-muted mt-1.5">
              La version rapide : formules, réflexes, pièges. Pour réviser ou si le cours du prof était clair.
            </p>
            <span className="chip bg-amber-soft text-amber mt-4">~3 min de lecture</span>
          </button>
          {busy && <p className="text-sm text-muted sm:col-span-2">Emma écrit ton cours…</p>}
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
                <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-indigo">Le récap minute</p>
                <RichText text={course.recap} className="mt-1" />
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-6">
            <button onClick={startQuiz} disabled={busy} className="btn-primary !py-3 !px-6">
              {busy ? "Emma prépare tes questions…" : "Vérifier ma maîtrise →"}
            </button>
            {!course.sections.length ? null : course.mode === "key" ? (
              <button onClick={() => chooseCourse("full")} disabled={busy} className="btn-ghost">Voir le cours complet</button>
            ) : (
              <button onClick={() => chooseCourse("key")} disabled={busy} className="btn-ghost">Version concepts clés</button>
            )}
          </div>
        </div>
      )}

      {/* ÉTAPE 3 — quiz de maîtrise */}
      {phase === "quiz" && quiz && (
        <div className="space-y-4">
          <p className="text-muted text-sm">
            Réponds avec ton résultat <strong>et l'étape clé de ta méthode</strong> — c'est la méthode qu'on vérifie, pas la chance.
          </p>
          {quiz.questions.map((q, i) => (
            <div key={q.id} className="card p-5">
              <p className="font-mono text-[11px] text-faint">Question {i + 1} · {concepts.find((c) => c.key === q.concept_key)?.label || q.concept_key}</p>
              <RichText text={q.question} className="mt-1.5" />
              <textarea
                className="input mt-3 min-h-[70px] font-mono text-[14px]"
                placeholder="Ta réponse (résultat + méthode)…"
                value={quizAnswers[q.id] || ""}
                onChange={(e) => setQuizAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
              />
            </div>
          ))}
          <button onClick={submitQuiz} disabled={busy} className="btn-primary w-full !py-3">
            {busy ? "Emma corrige…" : "Envoyer mes réponses"}
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
                  <span className={tone}>{it.verdict === "correct" ? "juste" : it.verdict === "partial" ? "presque" : "faux"}</span>
                  <p className="font-mono text-[11px] text-faint">Question {i + 1}</p>
                </div>
                <RichText text={it.feedback} className="mt-2" />
                {it.misconception && (
                  <p className="text-sm text-gap font-semibold mt-1">Méprise repérée : {it.misconception}</p>
                )}
                <details className="mt-2">
                  <summary className="text-sm font-semibold text-indigo cursor-pointer">Voir la solution modèle</summary>
                  <RichText text={it.model_answer} className="mt-2" />
                </details>
              </div>
            );
          })}

          {notAcquired.length > 0 ? (
            <div className="card p-5 border-amber">
              <h2 className="font-serif font-semibold text-lg">On reprend ce qui coince — précisément</h2>
              <p className="text-sm text-muted mt-1">Pas toute la leçon : juste le concept, expliqué autrement.</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {notAcquired.map((c) => (
                  <button key={c.key} onClick={() => startRemediation(c.key)} disabled={busy} className="btn-amber !py-2 text-[13px]">
                    Revoir « {c.label} »
                  </button>
                ))}
              </div>
              <button onClick={() => startExercises()} disabled={busy} className="text-sm font-semibold text-faint hover:text-indigo mt-4">
                Passer quand même aux exercices →
              </button>
            </div>
          ) : (
            <button onClick={() => startExercises()} disabled={busy} className="btn-primary w-full !py-3">
              {busy ? "Emma prépare tes exercices…" : "Tout est acquis — place aux exercices →"}
            </button>
          )}
        </div>
      )}

      {/* ÉTAPE 5 — remédiation ciblée */}
      {phase === "remediation" && rem && (
        <div className="space-y-4">
          <div className="card p-6 border-amber">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-amber">Remédiation ciblée</p>
            <RichText text={rem.remediation.explanation} className="mt-2" />
          </div>
          {!remGrade ? (
            <>
              {rem.remediation.questions.map((q, i) => (
                <div key={q.id} className="card p-5">
                  <p className="font-mono text-[11px] text-faint">Re-vérification {i + 1}/2</p>
                  <RichText text={q.question} className="mt-1.5" />
                  <textarea
                    className="input mt-3 min-h-[70px] font-mono text-[14px]"
                    placeholder="Ta réponse…"
                    value={remAnswers[q.id] || ""}
                    onChange={(e) => setRemAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                  />
                </div>
              ))}
              <button onClick={submitRemediation} disabled={busy} className="btn-primary w-full !py-3">
                {busy ? "Emma corrige…" : "Vérifier"}
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
                    {it.verdict === "correct" ? "juste" : it.verdict === "partial" ? "presque" : "faux"}
                  </span>
                  <RichText text={it.feedback} className="mt-2" />
                  <details className="mt-2">
                    <summary className="text-sm font-semibold text-indigo cursor-pointer">Solution modèle</summary>
                    <RichText text={it.model_answer} className="mt-2" />
                  </details>
                </div>
              ))}
              <div className="flex flex-wrap gap-3">
                {notAcquired.filter((c) => c.key !== rem.remediation.concept_key).map((c) => (
                  <button key={c.key} onClick={() => startRemediation(c.key)} disabled={busy} className="btn-amber !py-2 text-[13px]">
                    Revoir « {c.label} »
                  </button>
                ))}
                <button onClick={() => startExercises()} disabled={busy} className="btn-primary !py-2.5">
                  {busy ? "…" : "Place aux exercices →"}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ÉTAPE 6 — exercices */}
      {phase === "exercises" && ex && (
        <div className="space-y-4">
          <p className="text-muted text-sm">
            Style past paper Edexcel. Fais-les <strong>en ligne</strong> ou <strong>sur papier</strong> — dans ce cas,
            prends ta copie en photo et uploade-la en bas : Emma corrige le manuscrit au mark scheme.
          </p>
          {ex.exercises.map((e, i) => (
            <div key={e.id} className="card p-5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="font-mono text-[11px] text-faint">Exercice {i + 1}</p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {e.command_word && <span className="chip bg-amber-soft text-amber font-mono">“{e.command_word}”</span>}
                  {e.question_type && <span className="chip-todo">{e.question_type}</span>}
                  <span className="chip-todo">{e.marks} marks{e.time_min ? ` · ~${e.time_min} min` : ""}</span>
                </div>
              </div>
              <RichText text={e.statement} className="mt-1.5" />
              {(e.exam_expectation || e.method_note) && (
                <p className="text-xs text-muted mt-2 bg-indigo-soft rounded-lg px-3 py-2">
                  🎯 <strong>Ce que l'examinateur attend :</strong> {e.exam_expectation || e.method_note}
                </p>
              )}
              <textarea
                className="input mt-3 min-h-[90px] font-mono text-[14px]"
                placeholder="Ta réponse ici… (ou laisse vide si tu uploades ta copie en photo)"
                value={exAnswers[e.id] || ""}
                onChange={(ev) => setExAnswers((a) => ({ ...a, [e.id]: ev.target.value }))}
              />
            </div>
          ))}
          <div className="card p-5">
            <label className="text-sm font-semibold">Photo(s) de ta copie <span className="text-faint font-normal">(jusqu'à 3)</span></label>
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
            {busy ? "Emma corrige ta copie au mark scheme…" : "Envoyer pour correction"}
          </button>
        </div>
      )}

      {/* ÉTAPE 7 — correction des exercices + décision */}
      {phase === "exercise-result" && mark && ex && (
        <div className="space-y-4">
          <div className="card p-5 bg-indigo-soft border-indigo-soft">
            <p className="font-semibold text-indigo-deep">{mark.summary}</p>
            <p className="font-mono text-sm text-indigo mt-2">
              Total : {mark.items.reduce((s, i) => s + (i.marks_awarded || 0), 0)}
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
                    <p className="font-mono text-[11px] text-faint">Exercice {i + 1}</p>
                  </div>
                </div>
                <RichText text={it.feedback} className="mt-2" />
                <p className="text-sm text-muted mt-2"><strong>Method marks :</strong> {it.method_comment}</p>
                {Array.isArray(it.exam_habits) && it.exam_habits.length > 0 && (
                  <div className="text-sm mt-2 bg-learning-bg rounded-lg px-3 py-2">
                    <strong className="text-learning">Technique d'examen à corriger :</strong>
                    <ul className="list-disc pl-5 mt-1 text-muted">
                      {it.exam_habits.map((h, j) => <li key={j}>{h}</li>)}
                    </ul>
                  </div>
                )}
                {it.misconception && <p className="text-sm text-gap font-semibold mt-1">Méprise repérée : {it.misconception}</p>}
                <details className="mt-2">
                  <summary className="text-sm font-semibold text-indigo cursor-pointer">Corrigé pas à pas (mark scheme)</summary>
                  <RichText text={it.model_solution} className="mt-2" />
                </details>
              </div>
            );
          })}
          {mark.decision === "redo" ? (
            <div className="card p-5 border-amber">
              <h2 className="font-serif font-semibold text-lg">Verdict d'Emma : on refait — variante différente</h2>
              <p className="text-sm text-muted mt-1">
                Même(s) concept(s), autre énoncé. C'est en refaisant qu'on sécurise.
              </p>
              <button onClick={() => startExercises(mark.redo_concept_keys, true)} disabled={busy} className="btn-amber mt-3">
                {busy ? "Emma prépare la variante…" : "Refaire une variante ciblée"}
              </button>
            </div>
          ) : (
            <button onClick={() => setPhase("done")} className="btn-primary w-full !py-3">
              Boucle bouclée ✓ — voir mon bilan
            </button>
          )}
        </div>
      )}

      {/* ÉTAPE 8 — bilan de la leçon */}
      {phase === "done" && (
        <div className="space-y-4">
          <div className="card p-6">
            <h2 className="font-serif font-black text-2xl text-indigo-deep">Bilan de la leçon</h2>
            <div className="mt-4 space-y-2">
              {concepts.map((c) => {
                const s = statusOf(c.key);
                const cls = s === "todo" ? "chip-todo" : `chip-${s}`;
                return (
                  <div key={c.key} className="flex items-center justify-between border-b border-line pb-2 last:border-0">
                    <span className="text-[15px] font-semibold">{c.label}</span>
                    <span className={cls}>{s === "todo" ? "non vérifié" : STATUS_LABEL[s]}</span>
                  </div>
                );
              })}
            </div>
          </div>
          {weak_points.filter((w) => w.status === "open").length > 0 && (
            <div className="card p-6 border-amber">
              <h3 className="font-serif font-semibold text-lg">Tes points à travailler</h3>
              <p className="text-sm text-muted mt-1">Emma te les re-proposera — c'est ça qui construit l'A★.</p>
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
            <Link href="/dashboard" className="btn-primary">Retour au tableau de bord</Link>
            <button onClick={() => startExercises()} disabled={busy} className="btn-ghost">Encore des exercices</button>
          </div>
        </div>
      )}
    </div>
  );
}
