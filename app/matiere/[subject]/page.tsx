"use client";

// LE TABLEAU DE BORD D'UNE MATIÈRE : le plan d'action (rapport d'adéquation
// niveau actuel → objectif, calibré sur le board choisi), la progression, la
// maîtrise, les points à travailler, les leçons et l'historique par période.
import { use, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import RichText from "@/components/RichText";
import ActivityHistory from "@/components/ActivityHistory";
import { SUBJECTS, type SubjectKey } from "@/lib/subjects";
import { gcseToStart, allowedTargets } from "@/lib/grades";
import SubjectSetup from "@/components/SubjectSetup";

type Plan = {
  headline?: string;
  gap_analysis?: string;
  weekly_rhythm?: { sessions_per_week?: number; minutes_per_session?: number; detail?: string };
  priorities?: { title?: string; why?: string; spec_area?: string }[];
  milestones?: { when?: string; goal?: string }[];
  exam_technique_focus?: string[];
  first_actions?: string[];
};

type Data = {
  first_name: string;
  subject: { key: string; labelFr: string; board: string; spec: string };
  enrolment: {
    id: string; board: string; spec: string; current_grade: string | null;
    baseline_grade: string | null; target_grade: string; exam_date: string | null;
    gcse_grade?: string | null; gcse_note?: string | null;
    action_plan: Plan | null;
  } | null;
  lessons: { id: string; title: string; spec_topic: string | null; stage: string; concepts: { key: string }[] | null; created_at: string }[];
  mastery: { lesson_id: string; concept_key: string; label: string; status: string }[];
  weak_points: { id: string; lesson_id: string; label: string; misconception: string | null }[];
  papers: { id: string; lesson_id: string; title: string; at: string; total_marks: number; awarded: number | null; decision: string | null }[];
  coached_paper_ids?: string[];
  exam_scores: { at: string; pct: number }[];
  avg_pct: number | null;
  estimated_grade: string | null;
};

const STAGE_LABEL: Record<string, string> = {
  captured: "Captured",
  course: "Lesson in hand",
  quiz: "Mastery being checked",
  practice: "Exercises in progress",
  done: "Wrapped up ✓",
};

export default function SubjectDashboard({ params }: { params: Promise<{ subject: string }> }) {
  const { subject } = use(params);
  const [data, setData] = useState<Data | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [planBusy, setPlanBusy] = useState(false);
  const [targetBusy, setTargetBusy] = useState(false);
  const planRequested = useRef(false);

  const load = useCallback(() => {
    fetch(`/api/subject/${subject}/overview`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Could not load this subject"))))
      .then(setData)
      .catch((e) => setErr(e.message));
  }, [subject]);
  useEffect(load, [load]);

  const genPlan = useCallback(
    async (force: boolean) => {
      setPlanBusy(true);
      try {
        await fetch("/api/enrolments/plan", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ subject, force }),
        });
        load();
      } finally {
        setPlanBusy(false);
      }
    },
    [subject, load]
  );

  // L'objectif est modifiable depuis la console — re-borné, plan régénéré.
  const changeTarget = useCallback(
    async (target: string) => {
      setTargetBusy(true);
      try {
        const r = await fetch("/api/enrolments", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ subject, target_grade: target }),
        });
        if (r.ok) { planRequested.current = false; load(); }
      } finally {
        setTargetBusy(false);
      }
    },
    [subject, load]
  );

  // Première visite : le plan d'action se génère tout seul.
  useEffect(() => {
    if (data?.enrolment && !data.enrolment.action_plan && !planRequested.current) {
      planRequested.current = true;
      genPlan(false);
    }
  }, [data, genPlan]);

  // Lien « Past-paper practice » (#papers) : l'ancre saute avant que la page
  // ait chargé ses données — on re-scrolle une fois le contenu rendu.
  useEffect(() => {
    if (!data || window.location.hash !== "#papers") return;
    const t = setTimeout(() => document.getElementById("papers")?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
    return () => clearTimeout(t);
  }, [data]);

  if (err) return <p className="text-gap font-semibold">{err}</p>;
  if (!data) return <p className="text-muted">Loading…</p>;

  const subjectLabel = SUBJECTS[data.subject.key as SubjectKey]?.labelEn || data.subject.labelFr;
  const e = data.enrolment;
  const plan = e?.action_plan || null;
  const shown = data.estimated_grade || e?.current_grade || "—";
  const lastScores = data.exam_scores.slice(-10);
  const masteryByLesson = new Map<string, { acquis: number; total: number }>();
  for (const m of data.mastery) {
    const cur = masteryByLesson.get(m.lesson_id) || { acquis: 0, total: 0 };
    cur.total += 1;
    if (m.status === "acquis") cur.acquis += 1;
    masteryByLesson.set(m.lesson_id, cur);
  }
  const acquis = data.mastery.filter((m) => m.status === "acquis").length;

  // LE CYCLE PAR TOPIC (nouveau format) : Lesson → Paper → Coached → Secured.
  const coachedIds = new Set(data.coached_paper_ids || []);
  const cycleOf = (lessonId: string, stage: string) => {
    const ps = (data.papers || []).filter((p) => p.lesson_id === lessonId);
    const markedPcts = ps.filter((p) => p.awarded !== null && p.total_marks > 0).map((p) => Math.round((100 * (p.awarded as number)) / p.total_marks));
    const bestPct = markedPcts.length ? Math.max(...markedPcts) : null;
    const hasTodo = ps.some((p) => p.awarded === null);
    const coached = ps.some((p) => coachedIds.has(p.id));
    const advanced = ps.some((p) => p.decision === "advance");
    const secured = coached && advanced && bestPct !== null && bestPct >= 75;
    return { bestPct, hasTodo, coached, secured, lessonDone: stage === "done" || ps.length > 0 };
  };
  const CycleChips = ({ lessonId, stage }: { lessonId: string; stage: string }) => {
    const c = cycleOf(lessonId, stage);
    if (c.secured) return <span className="chip-acquis shrink-0">Secured ✓</span>;
    return (
      <span className="flex items-center gap-1 shrink-0 flex-wrap">
        <span className={c.lessonDone ? "chip-acquis" : "chip-todo"}>{c.lessonDone ? "Lesson ✓" : STAGE_LABEL[stage] || stage}</span>
        {c.hasTodo && <span className="chip bg-amber-soft text-amber">Paper to do</span>}
        {c.bestPct !== null && <span className={c.bestPct >= 75 ? "chip-acquis" : "chip-fragile"}>Paper {c.bestPct}%</span>}
        {c.coached && <span className="chip-acquis">Coached ✓</span>}
      </span>
    );
  };

  return (
    <div>
      <Link href="/dashboard" className="text-sm text-faint hover:text-indigo font-semibold">← Dashboard</Link>

      <div className="flex items-end justify-between flex-wrap gap-3 mt-2">
        <div>
          <h1 className="font-serif font-black text-3xl text-indigo-deep">{subjectLabel}</h1>
          <p className="text-muted mt-1">
            {data.subject.board} A Level ({data.subject.spec})
            {e?.exam_date ? ` — exam ${e.exam_date.slice(0, 7)}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/coaching" className="btn-primary !py-2 !px-4">Coaching</Link>
          <Link href={`/lesson/new?subject=${subject}`} className="btn-amber !py-2 !px-4">＋ New lesson</Link>
        </div>
      </div>

      {!e && (
        <SubjectSetup
          subject={subject as SubjectKey}
          subjectLabel={subjectLabel}
          onDone={() => { planRequested.current = false; load(); }}
        />
      )}

      {/* ============ PROGRESSION (une fois la matière configurée) ============ */}
      {e && (
      <section className="card mt-5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <div className="text-center">
              <p className="text-[11px] font-mono uppercase tracking-wider text-faint">Start</p>
              <p className="font-serif font-black text-3xl text-muted">{e?.baseline_grade || (e?.gcse_grade ? gcseToStart(e.gcse_grade) : "—")}</p>
              {e?.gcse_grade ? (
                <p className="font-mono text-[11px] text-faint" title={e.gcse_note || undefined}>GCSE {e.gcse_grade}</p>
              ) : e?.gcse_note ? (
                <p className="font-mono text-[11px] text-faint" title={e.gcse_note}>level check</p>
              ) : null}
            </div>
            <span className="text-faint text-xl">→</span>
            <div className="text-center">
              <p className="text-[11px] font-mono uppercase tracking-wider text-indigo">Current{data.estimated_grade ? " (estimated)" : ""}</p>
              <p className="font-serif font-black text-3xl text-indigo">{shown}</p>
              {data.avg_pct !== null && <p className="font-mono text-[11px] text-faint">{data.avg_pct}% of marks</p>}
            </div>
            <span className="text-faint text-xl">→</span>
            <div className="text-center">
              <p className="text-[11px] font-mono uppercase tracking-wider text-amber">Target</p>
              {e ? (
                <select
                  value={e.target_grade || "A*"}
                  disabled={targetBusy}
                  onChange={(ev) => changeTarget(ev.target.value)}
                  className="font-serif font-black text-3xl text-amber bg-transparent cursor-pointer disabled:opacity-50 text-center"
                  title="Change your target — the action plan adapts"
                >
                  {(allowedTargets(e.current_grade || (e.gcse_grade ? gcseToStart(e.gcse_grade) : null)) as string[]).map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              ) : (
                <p className="font-serif font-black text-3xl text-amber">A*</p>
              )}
            </div>
          </div>
          {lastScores.length > 0 && (
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-faint mb-1">Exercise sets (% marks)</p>
              <div className="flex items-end gap-1 h-14">
                {lastScores.map((s, i) => (
                  <div key={i} className="w-5 rounded-t bg-indigo/80" style={{ height: `${Math.max(8, s.pct * 0.56)}px` }} title={`${s.pct}%`} />
                ))}
                <span className="text-[10px] font-mono text-faint ml-1 self-end">{lastScores[lastScores.length - 1].pct}%</span>
              </div>
            </div>
          )}
        </div>
        {e?.gcse_note && (
          <p className="text-xs text-faint mt-3">
            <span className="font-semibold text-muted">Why this starting level:</span> {e.gcse_note}
          </p>
        )}
        <p className="text-sm text-muted mt-4">
          {data.mastery.length > 0
            ? `${acquis}/${data.mastery.length} concepts secure · ${data.weak_points.length} point${data.weak_points.length === 1 ? "" : "s"} to work on`
            : "Concept-by-concept mastery will appear after your first lesson."}
        </p>
      </section>
      )}

      {/* ============ PLAN D'ACTION ============ */}
      <section className="mt-6">
        <div className="flex items-baseline justify-between flex-wrap gap-2">
          <h2 className="font-serif font-semibold text-xl">Your Tutoring Plan</h2>
          {e && plan && (
            <div className="flex gap-4">
              <a
                href={(() => {
                  const lines: string[] = [];
                  if (plan.headline) lines.push(plan.headline, "");
                  if (plan.weekly_rhythm) lines.push(`Rhythm: ${plan.weekly_rhythm.sessions_per_week ?? 3} sessions/week · ${plan.weekly_rhythm.minutes_per_session ?? 45} min`, "");
                  if (plan.priorities?.length) { lines.push("Priorities:"); plan.priorities.forEach((pr, i) => lines.push(`${i + 1}. ${pr.title || ""}${pr.why ? ` — ${pr.why}` : ""}`)); lines.push(""); }
                  if (plan.milestones?.length) { lines.push("Milestones:"); plan.milestones.forEach((m) => lines.push(`• ${m.when || ""} — ${m.goal || ""}`)); lines.push(""); }
                  if (plan.first_actions?.length) { lines.push("This week:"); plan.first_actions.forEach((a) => lines.push(`☐ ${a}`)); }
                  lines.push("", `Follow the progress: https://coach-emma-student.vercel.app/matiere/${subject}`);
                  const body = `Coach Emma Student — Tutoring Plan (${subjectLabel}, ${data.subject.board} ${data.subject.spec})\n\n` + lines.join("\n");
                  return `mailto:?subject=${encodeURIComponent(`Tutoring Plan — ${subjectLabel} (${e.baseline_grade || "start"} → ${e.target_grade})`)}&body=${encodeURIComponent(body)}`;
                })()}
                className="text-sm font-semibold text-indigo hover:text-indigo-deep"
                title="Send the full plan to yourself or your parents"
              >
                ✉ Email the plan
              </a>
              <button
                type="button"
                onClick={async () => {
                  const r = await fetch("/api/google/save-plan", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ subject }) });
                  const d = await r.json().catch(() => ({}));
                  if (r.ok && d.link) window.open(d.link, "_blank");
                  else if (r.status === 428) alert("Connect Google Drive first (My account → Integrations).");
                  else if (r.status === 503) alert("Google Drive is being enabled — try again soon.");
                  else alert(d.error || "Could not save to Drive");
                }}
                className="text-sm font-semibold text-indigo hover:text-indigo-deep"
                title="Save the plan as a Google Doc in your Drive"
              >
                🗂 Save to Drive
              </button>
              <button onClick={() => genPlan(true)} disabled={planBusy} className="text-sm font-semibold text-indigo hover:text-indigo-deep disabled:opacity-50">
                {planBusy ? "Regenerating…" : "Regenerate"}
              </button>
            </div>
          )}
        </div>

        {!e ? null : !plan ? (
          <div className="card p-6 mt-3">
            {planBusy || !planRequested.current ? (
              <div>
                <p className="font-serif font-semibold text-indigo-deep animate-pulse">
                  ✍️ Emma is writing your Tutoring Plan — it usually takes 1-2 minutes.
                </p>
                <p className="text-sm text-muted mt-2">
                  She is checking your starting point against every topic of the {data.subject.board} {data.subject.spec} specification,
                  to decide what to work on first and at what pace. It only happens once — the plan is saved.
                </p>
              </div>
            ) : (
              <p className="text-muted">The plan could not be generated.</p>
            )}
            {!planBusy && planRequested.current && (
              <button onClick={() => genPlan(true)} className="btn-primary mt-3 !py-2 !px-4">Try again</button>
            )}
          </div>
        ) : (
          <div className="card p-6 mt-3 space-y-5">
            <p className="text-[12.5px] text-muted bg-indigo-soft rounded-lg px-3 py-2 -mb-1">
              This plan drives your sessions: each priority below becomes lessons — click one to start it as a lesson.
            </p>
            {plan.headline && <p className="font-serif font-semibold text-lg text-indigo-deep">{plan.headline}</p>}
            {plan.gap_analysis && <RichText text={plan.gap_analysis} className="text-[15px] leading-relaxed" />}

            {plan.weekly_rhythm && (
              <div className="bg-indigo-soft rounded-xl px-4 py-3">
                <p className="text-sm font-semibold text-indigo">
                  Rhythm: {plan.weekly_rhythm.sessions_per_week ?? 3} sessions / week · {plan.weekly_rhythm.minutes_per_session ?? 45} min
                </p>
                {plan.weekly_rhythm.detail && <p className="text-sm text-muted mt-1">{plan.weekly_rhythm.detail}</p>}
              </div>
            )}

            {Array.isArray(plan.priorities) && plan.priorities.length > 0 && (
              <div>
                <p className="text-[11px] font-mono uppercase tracking-wider text-faint mb-2">Priorities</p>
                <ul className="space-y-2">
                  {plan.priorities.map((p, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="font-serif font-black text-amber">{i + 1}.</span>
                      <div>
                        <p className="font-semibold text-[15px]">{p.title}{p.spec_area ? <span className="font-mono text-[11px] text-faint font-normal"> — {p.spec_area}</span> : null}</p>
                        {p.why && <p className="text-sm text-muted">{p.why}</p>}
                        {p.title && (
                          <Link
                            href={`/lesson/new?subject=${encodeURIComponent(subject)}&title=${encodeURIComponent(p.title)}`}
                            className="inline-block text-[13px] font-semibold text-indigo hover:text-indigo-deep mt-0.5"
                          >
                            Start a lesson on this →
                          </Link>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {Array.isArray(plan.milestones) && plan.milestones.length > 0 && (
              <div>
                <p className="text-[11px] font-mono uppercase tracking-wider text-faint mb-2">Milestones</p>
                <ul className="space-y-1.5">
                  {plan.milestones.map((m, i) => (
                    <li key={i} className="text-sm"><span className="font-mono font-semibold text-indigo">{m.when}</span> — {m.goal}</li>
                  ))}
                </ul>
              </div>
            )}

            {Array.isArray(plan.exam_technique_focus) && plan.exam_technique_focus.length > 0 && (
              <div>
                <p className="text-[11px] font-mono uppercase tracking-wider text-faint mb-2">Exam technique to build</p>
                <ul className="space-y-1.5">
                  {plan.exam_technique_focus.map((t, i) => (
                    <li key={i} className="text-sm flex gap-2"><span className="text-amber">★</span><span>{t}</span></li>
                  ))}
                </ul>
              </div>
            )}

            {Array.isArray(plan.first_actions) && plan.first_actions.length > 0 && (
              <div className="bg-amber-soft rounded-xl px-4 py-3">
                <p className="text-sm font-semibold text-amber mb-1.5">This week</p>
                <ul className="space-y-1">
                  {plan.first_actions.map((a, i) => (
                    <li key={i} className="text-sm flex gap-2"><span>☐</span><span>{a}</span></li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ============ LEÇONS COUVERTES — la plus récente en évidence + drop-down ============ */}
      <section className="mt-8">
        <h2 className="font-serif font-semibold text-xl">Lessons & topics covered</h2>
        {data.lessons.length === 0 ? (
          <div className="card p-8 mt-4 text-center">
            <p className="text-muted">No {subjectLabel} lessons yet.</p>
            <Link href={`/lesson/new?subject=${subject}`} className="btn-amber mt-4 inline-block">Capture my first lesson</Link>
          </div>
        ) : (
          <>
            {/* Le tout dernier topic couvert — visible immédiatement */}
            {(() => {
              const latest = data.lessons[0];
              const m = masteryByLesson.get(latest.id);
              return (
                <Link href={`/lesson/${latest.id}`} className="card p-4 mt-3 flex items-center gap-3 flex-wrap border-amber hover:border-indigo transition">
                  <span className="chip bg-amber-soft text-amber shrink-0">Just covered</span>
                  <span className="flex-1 min-w-[200px]">
                    <span className="font-semibold text-[15px]">{latest.title}</span>
                    {latest.spec_topic && <span className="font-mono text-[11px] text-faint ml-2">{latest.spec_topic}</span>}
                  </span>
                  <CycleChips lessonId={latest.id} stage={latest.stage} />
                  <span className="font-mono text-xs text-faint shrink-0">
                    {new Date(latest.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </span>
                  {m && <span className="text-xs text-muted shrink-0">{m.acquis}/{m.total} secure</span>}
                </Link>
              );
            })()}
            {/* Le drop-down de TOUTES les leçons/topics couverts */}
            <details className="card mt-3 overflow-hidden">
              <summary className="px-5 py-3 cursor-pointer select-none flex items-center justify-between text-[15px] font-semibold hover:bg-indigo-soft/40">
                <span>All lessons &amp; topics ({data.lessons.length})</span>
                <span className="text-[11px] text-faint">▼</span>
              </summary>
              <div className="divide-y divide-line border-t border-line">
                {data.lessons.map((l) => {
                  const m = masteryByLesson.get(l.id);
                  const nConcepts = Array.isArray(l.concepts) ? l.concepts.length : 0;
                  return (
                    <Link key={l.id} href={`/lesson/${l.id}`} className="px-5 py-3 flex items-center gap-3 flex-wrap hover:bg-indigo-soft/40 transition">
                      <span className="flex-1 min-w-[200px]">
                        <span className="font-semibold text-[14.5px]">{l.title}</span>
                        {l.spec_topic && <span className="font-mono text-[11px] text-faint ml-2">{l.spec_topic}</span>}
                      </span>
                      <span className="text-xs text-muted shrink-0">{m ? `${m.acquis}/${m.total} secure` : `${nConcepts} concepts`}</span>
                      <CycleChips lessonId={l.id} stage={l.stage} />
                      <span className="font-mono text-xs text-faint shrink-0 w-14 text-right">
                        {new Date(l.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </details>
          </>
        )}
      </section>

      {/* ============ REPORTS — comptes rendus de tutoring & de coaching ============ */}
      <section className="mt-8">
        <h2 className="font-serif font-semibold text-xl">Reports</h2>
        <p className="text-sm text-muted mt-1">Every tutoring and coaching session leaves a recap — reread it, email it.</p>

        <div className="mt-4">
          <p className="text-[11px] font-mono uppercase tracking-wider text-faint mb-2">Tutoring session recaps</p>
          <ActivityHistory subject={subject} />
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
            <p className="text-[11px] font-mono uppercase tracking-wider text-faint">Coaching session recaps</p>
            <Link href="/coaching" className="btn-primary !py-1.5 !px-4 text-[13px]">Start a coaching session →</Link>
          </div>
          <ActivityHistory subject="coaching" />
        </div>
      </section>

      {/* ============ PAST PAPERS DONE — la bibliothèque centralisée ============ */}
      <section className="mt-8" id="papers">
        <div className="flex items-baseline justify-between flex-wrap gap-2">
          <h2 className="font-serif font-semibold text-xl">Past papers done</h2>
          <p className="text-sm text-faint">Every set is kept here — reopen it, reprint it, review the marking.</p>
        </div>
        {(!data.papers || data.papers.length === 0) ? (
          <p className="text-sm text-faint mt-3">Emma assigns a past paper at the end of each lesson — it will appear here, to do online or on paper.</p>
        ) : (
          <div className="card mt-4 divide-y divide-line overflow-hidden">
            {[...data.papers].sort((a, b) => (a.awarded === null ? -1 : 1) - (b.awarded === null ? -1 : 1)).map((pp) => (
              <Link key={pp.id} href={`/paper/${pp.id}`} className="p-4 flex items-center gap-3 flex-wrap hover:bg-indigo-soft/40 transition">
                <span className={pp.awarded === null ? "chip bg-amber-soft text-amber shrink-0" : pp.decision === "advance" ? "chip-acquis shrink-0" : "chip-fragile shrink-0"}>
                  {pp.awarded === null ? "to do" : `${pp.awarded}/${pp.total_marks} marks`}
                </span>
                <span className="flex-1 min-w-[200px] font-semibold text-[14.5px]">{pp.title}</span>
                {pp.awarded !== null && coachedIds.has(pp.id) && <span className="chip-acquis shrink-0">Coached ✓</span>}
                <span className="font-mono text-xs text-faint shrink-0">
                  {new Date(pp.at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                </span>
                <span className="text-indigo font-semibold text-sm shrink-0">{pp.awarded === null ? "Do it →" : "Open →"}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ============ POINTS À TRAVAILLER ============ */}
      <section className="mt-8">
        <h2 className="font-serif font-semibold text-xl">Points to work on</h2>
        <p className="text-sm text-muted mt-1">What's still fragile in {subjectLabel} — we re-test them until the A★.</p>
        {data.weak_points.length === 0 ? (
          <p className="text-sm text-faint mt-3">Nothing open — either you're just starting, or you're smashing it 💪</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {data.weak_points.map((w) => (
              <li key={w.id} className="card p-4 flex items-start gap-3">
                <span className="chip-non_acquis mt-0.5 shrink-0">to review</span>
                <div>
                  <Link href={`/lesson/${w.lesson_id}`} className="font-semibold text-[15px] hover:text-indigo">{w.label}</Link>
                  {w.misconception && <p className="text-sm text-muted mt-0.5">Misconception spotted: {w.misconception}</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

    </div>
  );
}
