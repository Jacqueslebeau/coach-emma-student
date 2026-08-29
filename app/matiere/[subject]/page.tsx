"use client";

// LE TABLEAU DE BORD D'UNE MATIÈRE : le plan d'action (rapport d'adéquation
// niveau actuel → objectif, calibré sur le board choisi), la progression, la
// maîtrise, les points à travailler, les leçons et l'historique par période.
import { use, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import RichText from "@/components/RichText";
import ActivityHistory from "@/components/ActivityHistory";
import { SUBJECTS, type SubjectKey } from "@/lib/subjects";

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
    action_plan: Plan | null;
  } | null;
  lessons: { id: string; title: string; spec_topic: string | null; stage: string; concepts: { key: string }[] | null; created_at: string }[];
  mastery: { lesson_id: string; concept_key: string; label: string; status: string }[];
  weak_points: { id: string; lesson_id: string; label: string; misconception: string | null }[];
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

  // Première visite : le plan d'action se génère tout seul.
  useEffect(() => {
    if (data?.enrolment && !data.enrolment.action_plan && !planRequested.current) {
      planRequested.current = true;
      genPlan(false);
    }
  }, [data, genPlan]);

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
        <Link href={`/lesson/new?subject=${subject}`} className="btn-amber !py-2 !px-4">＋ New lesson</Link>
      </div>

      {!e && (
        <div className="card p-5 mt-5 border-amber">
          <p className="text-sm text-muted">
            This subject isn't set up yet (board, starting grade, target) — without that, there's no
            action plan and no calibration to your exam board.
          </p>
          <Link href="/onboarding" className="btn-primary mt-3 inline-block !py-2 !px-4">Set up →</Link>
        </div>
      )}

      {/* ============ PROGRESSION ============ */}
      <section className="card mt-5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <div className="text-center">
              <p className="text-[11px] font-mono uppercase tracking-wider text-faint">Start</p>
              <p className="font-serif font-black text-3xl text-muted">{e?.baseline_grade || "—"}</p>
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
              <p className="font-serif font-black text-3xl text-amber">{e?.target_grade || "A*"}</p>
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
        <p className="text-sm text-muted mt-4">
          {data.mastery.length > 0
            ? `${acquis}/${data.mastery.length} concepts secure · ${data.weak_points.length} point${data.weak_points.length === 1 ? "" : "s"} to work on`
            : "Concept-by-concept mastery will appear after your first lesson."}
        </p>
      </section>

      {/* ============ PLAN D'ACTION ============ */}
      <section className="mt-6">
        <div className="flex items-baseline justify-between">
          <h2 className="font-serif font-semibold text-xl">Your action plan</h2>
          {e && plan && (
            <button onClick={() => genPlan(true)} disabled={planBusy} className="text-sm font-semibold text-indigo hover:text-indigo-deep disabled:opacity-50">
              {planBusy ? "Regenerating…" : "Regenerate"}
            </button>
          )}
        </div>

        {!e ? null : !plan ? (
          <div className="card p-6 mt-3">
            <p className="text-muted">
              {planBusy || !planRequested.current
                ? "Emma is analysing the gap between your grade and your target, and preparing your action plan…"
                : "The plan could not be generated."}
            </p>
            {!planBusy && planRequested.current && (
              <button onClick={() => genPlan(true)} className="btn-primary mt-3 !py-2 !px-4">Try again</button>
            )}
          </div>
        ) : (
          <div className="card p-6 mt-3 space-y-5">
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

      {/* ============ LEÇONS ============ */}
      <section className="mt-8">
        <h2 className="font-serif font-semibold text-xl">Lessons & topics covered</h2>
        {data.lessons.length === 0 ? (
          <div className="card p-8 mt-4 text-center">
            <p className="text-muted">No {subjectLabel} lessons yet.</p>
            <Link href={`/lesson/new?subject=${subject}`} className="btn-amber mt-4 inline-block">Capture my first lesson</Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            {data.lessons.map((l) => {
              const m = masteryByLesson.get(l.id);
              const nConcepts = Array.isArray(l.concepts) ? l.concepts.length : 0;
              return (
                <Link key={l.id} href={`/lesson/${l.id}`} className="card p-5 hover:border-indigo transition">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-[15.5px] leading-snug">{l.title}</h3>
                    <span className={l.stage === "done" ? "chip-acquis shrink-0" : "chip-todo shrink-0"}>
                      {STAGE_LABEL[l.stage] || l.stage}
                    </span>
                  </div>
                  {l.spec_topic && <p className="font-mono text-[11px] text-faint mt-1">{l.spec_topic}</p>}
                  <p className="text-sm text-muted mt-3">
                    {m ? `${m.acquis}/${m.total} concepts secure` : `${nConcepts} concepts — mastery to be checked`}
                  </p>
                </Link>
              );
            })}
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

      {/* ============ HISTORIQUE ============ */}
      <section className="mt-8">
        <h2 className="font-serif font-semibold text-xl">Session history</h2>
        <p className="text-sm text-muted mt-1 mb-3">This week, last week, this month — or a custom range.</p>
        <ActivityHistory subject={subject} />
      </section>
    </div>
  );
}
