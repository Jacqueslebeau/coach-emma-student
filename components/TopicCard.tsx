"use client";

// LA CARTE TOPIC — calquée sur « Vos préparations » de Coach Emma.
// Quatre menus : « View reports ▾ » (compte rendu de tutoring + de coaching),
// « Papers » (les papers À FAIRE : en ligne ou imprimer & uploader),
// « Paper results » (chaque paper noté : score, Coached ✓, points à préparer
// avant le coaching) et « Start ▾ » (Lesson / Past paper / Coaching — dans
// l'ordre du cycle, grisés selon l'avancement).
// Utilisée par My space (toutes matières) et par la console matière.
import { useState } from "react";
import Link from "next/link";
import { SUBJECTS, type SubjectKey } from "@/lib/subjects";

export type TopicPaper = { id: string; at: string; total_marks: number; awarded: number | null; decision: string | null; prep_points?: string[] };

export default function TopicCard({ lesson, masteryRows, weakPoints, papers, coachedIds, sessionMeta, showSubject = false }: {
  lesson: { id: string; title: string; subject: string; spec_topic: string | null; stage: string; created_at: string };
  masteryRows: { concept_key: string; label: string; status: string }[];
  weakPoints: { id: string; label: string; misconception: string | null }[];
  papers: TopicPaper[];
  coachedIds: Set<string>;
  sessionMeta?: { covered?: string[]; duration_min?: number } | null;
  showSubject?: boolean;
}) {
  const [panel, setPanel] = useState<null | "tutoring" | "coaching" | "papers" | "results">(null);
  const [reportsOpen, setReportsOpen] = useState(false);
  const [startOpen, setStartOpen] = useState(false);

  const todoPapers = papers.filter((p) => p.awarded === null);
  const markedPapers = papers.filter((p) => p.awarded !== null);
  const lastMarked = markedPapers[markedPapers.length - 1];
  const coachedCount = papers.filter((p) => coachedIds.has(p.id)).length;
  const uncoachedMarked = markedPapers.filter((p) => !coachedIds.has(p.id));
  const markedPcts = markedPapers.filter((p) => p.total_marks > 0).map((p) => Math.round((100 * (p.awarded as number)) / p.total_marks));
  const bestPct = markedPcts.length ? Math.max(...markedPcts) : null;
  const lessonDone = lesson.stage === "done" || papers.length > 0;
  const coached = coachedCount > 0;
  const secured = coached && markedPapers.some((p) => p.decision === "advance") && bestPct !== null && bestPct >= 75;

  const acquis = masteryRows.filter((m) => m.status === "acquis").length;
  const understanding = masteryRows.length > 0
    ? acquis === masteryRows.length ? "Strong — all concepts secure"
      : acquis >= masteryRows.length / 2 ? "Good — a few concepts to consolidate"
      : "Fragile — several concepts to revisit"
    : "Not checked yet";
  const statusLabel: Record<string, string> = { acquis: "secure", fragile: "fragile", non_acquis: "to review" };

  const togglePanel = (p: "tutoring" | "coaching" | "papers" | "results") => {
    setReportsOpen(false); setStartOpen(false);
    setPanel((x) => (x === p ? null : p));
  };

  return (
    <div className="p-5 border-l-4 border-l-indigo">
      {/* ===== En-tête ===== */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-[220px]">
          <h3 className="font-serif font-semibold text-lg leading-snug">{lesson.title}</h3>
          <p className="text-xs text-faint mt-0.5 font-mono">
            {showSubject && <span className="text-indigo font-semibold">{SUBJECTS[lesson.subject as SubjectKey]?.labelEn || lesson.subject} · </span>}
            {lesson.spec_topic || "—"} · {new Date(lesson.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
          </p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {secured ? (
              <span className="chip-acquis">Secured ✓</span>
            ) : (
              <>
                <span className={lessonDone ? "chip-acquis" : "chip-todo"}>{lessonDone ? "Lesson ✓" : "Lesson in progress"}</span>
                {todoPapers.length > 0 && <span className="chip bg-amber-soft text-amber">Paper to do</span>}
                {bestPct !== null && <span className={bestPct >= 75 ? "chip-acquis" : "chip-fragile"}>Paper {bestPct}%</span>}
                {coached && <span className="chip-acquis">Coached ✓</span>}
              </>
            )}
          </div>
        </div>
        {bestPct !== null && (
          <div className="text-center shrink-0">
            <div className="relative h-14 w-14">
              <svg viewBox="0 0 36 36" className="h-14 w-14 -rotate-90">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#E5E7EB" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.5" fill="none" stroke={bestPct >= 75 ? "#064E3B" : "#B45309"} strokeWidth="3"
                  strokeDasharray={`${Math.max(4, bestPct)} 100`} strokeLinecap="round" pathLength={100} />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center font-serif font-black text-[15px] text-indigo-deep">{bestPct}%</span>
            </div>
            <p className="text-[9.5px] font-mono uppercase tracking-wider text-faint mt-0.5">paper</p>
          </div>
        )}
      </div>

      {/* ===== Les 4 menus ===== */}
      <div className="flex flex-wrap items-center gap-2 mt-4">
        {/* View reports ▾ */}
        <div className="relative">
          <button
            onClick={() => { setStartOpen(false); setReportsOpen((o) => !o); }}
            className={panel === "tutoring" || panel === "coaching" ? "btn-primary !py-1.5 !px-3.5 text-[13px]" : "btn-ghost !py-1.5 !px-3.5 text-[13px]"}
          >
            View reports ▾
          </button>
          {reportsOpen && (
            <div className="absolute left-0 top-full mt-2 w-64 bg-white border border-line rounded-xl shadow-lg z-20 overflow-hidden py-1">
              <button onClick={() => togglePanel("tutoring")} className="block w-full text-left px-4 py-2.5 hover:bg-indigo-soft">
                <p className="text-sm font-semibold">📖 Tutoring report</p>
                <p className="text-[11.5px] text-faint">Understanding level, concept by concept</p>
              </button>
              <button onClick={() => togglePanel("coaching")} className="block w-full text-left px-4 py-2.5 hover:bg-indigo-soft">
                <p className="text-sm font-semibold">🎯 Coaching report</p>
                <p className="text-[11.5px] text-faint">Paper score, points to work on, debrief</p>
              </button>
            </div>
          )}
        </div>

        <button onClick={() => togglePanel("papers")} className={panel === "papers" ? "btn-primary !py-1.5 !px-3.5 text-[13px]" : "btn-ghost !py-1.5 !px-3.5 text-[13px]"}>
          Papers{todoPapers.length ? ` (${todoPapers.length} to do)` : ""}
        </button>
        <button onClick={() => togglePanel("results")} className={panel === "results" ? "btn-primary !py-1.5 !px-3.5 text-[13px]" : "btn-ghost !py-1.5 !px-3.5 text-[13px]"}>
          Paper results{markedPapers.length ? ` (${markedPapers.length})` : ""}
        </button>

        {/* Start ▾ */}
        <div className="relative ml-auto">
          <button onClick={() => { setReportsOpen(false); setStartOpen((o) => !o); }} className="btn-amber !py-2 !px-5">Start ▾</button>
          {startOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-line rounded-xl shadow-lg z-20 overflow-hidden py-1">
              {lessonDone ? (
                <div className="px-4 py-2.5 opacity-50 cursor-not-allowed">
                  <p className="text-sm font-semibold">🔒 Lesson</p>
                  <p className="text-[11.5px] text-faint">Lesson already done for this topic</p>
                </div>
              ) : (
                <Link href={`/lesson/${lesson.id}`} className="block px-4 py-2.5 hover:bg-indigo-soft">
                  <p className="text-sm font-semibold">📖 Lesson</p>
                  <p className="text-[11.5px] text-faint">Continue the lesson</p>
                </Link>
              )}
              {todoPapers[0] ? (
                <Link href={`/paper/${todoPapers[0].id}`} className="block px-4 py-2.5 hover:bg-indigo-soft">
                  <p className="text-sm font-semibold">📝 Past paper</p>
                  <p className="text-[11.5px] text-faint">Do the assigned paper — online or printed</p>
                </Link>
              ) : (
                <div className="px-4 py-2.5 opacity-50 cursor-not-allowed">
                  <p className="text-sm font-semibold">🔒 Past paper</p>
                  <p className="text-[11.5px] text-faint">
                    {papers.length === 0 ? "Assigned at the end of the lesson" : "All assigned papers done — the coaching can recommend another"}
                  </p>
                </div>
              )}
              {[0, 1].map((n) => {
                const done = coachedCount > n;
                const available = !done && coachedCount === n && uncoachedMarked.length > 0;
                const target = uncoachedMarked[0] || lastMarked;
                return done ? (
                  <div key={n} className="px-4 py-2.5 opacity-50 cursor-not-allowed">
                    <p className="text-sm font-semibold">🔒 Coaching {n + 1}</p>
                    <p className="text-[11.5px] text-faint">Coaching already done for this topic</p>
                  </div>
                ) : available && target ? (
                  <Link key={n} href={`/paper/${target.id}`} className="block px-4 py-2.5 hover:bg-indigo-soft">
                    <p className="text-sm font-semibold">🎙 Coaching {n + 1}</p>
                    <p className="text-[11.5px] text-faint">Debrief your marked paper with Emma</p>
                  </Link>
                ) : (
                  <div key={n} className="px-4 py-2.5 opacity-50 cursor-not-allowed">
                    <p className="text-sm font-semibold">🔒 Coaching {n + 1}</p>
                    <p className="text-[11.5px] text-faint">{markedPapers.length === 0 ? "Unlocks when your paper is marked" : n === 1 ? "After the second paper" : "—"}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ===== Panneaux ===== */}
      {panel === "tutoring" && (
        <div className="mt-4 bg-indigo-soft/40 rounded-xl p-4">
          <div className="flex items-baseline justify-between flex-wrap gap-2">
            <p className="font-semibold text-[14.5px]">📖 Tutoring report</p>
            <span className="text-[12px] text-muted">Understanding: <strong className="text-indigo-deep">{understanding}</strong></span>
          </div>
          {masteryRows.length > 0 ? (
            <div className="mt-2 space-y-1">
              {masteryRows.map((m) => (
                <div key={m.concept_key} className="flex items-center justify-between text-sm border-b border-line/60 pb-1 last:border-0">
                  <span>{m.label}</span>
                  <span className={m.status === "acquis" ? "chip-acquis" : m.status === "fragile" ? "chip-fragile" : "chip-non_acquis"}>
                    {statusLabel[m.status] || m.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-faint mt-2">The mastery check hasn&apos;t been taken yet.</p>
          )}
          {sessionMeta?.covered?.length ? (
            <p className="text-[12.5px] text-muted mt-3"><strong>Covered:</strong> {sessionMeta.covered.join(" → ")}{sessionMeta.duration_min ? ` · ${sessionMeta.duration_min} min` : ""}</p>
          ) : null}
          <Link href={`/lesson/${lesson.id}`} className="text-[13px] font-semibold text-indigo hover:text-indigo-deep inline-block mt-2">Open the lesson →</Link>
        </div>
      )}

      {panel === "coaching" && (
        <div className="mt-4 bg-indigo-soft/40 rounded-xl p-4">
          <p className="font-semibold text-[14.5px]">🎯 Coaching report</p>
          {lastMarked ? (
            <div className="mt-2 space-y-2 text-sm">
              <p><strong>Paper score:</strong> {lastMarked.awarded}/{lastMarked.total_marks}{bestPct !== null ? ` (${bestPct}%)` : ""} — {lastMarked.decision === "advance" ? "solid, on track" : "fragile, worth another go"}</p>
              {weakPoints.length > 0 && (
                <div>
                  <p className="font-semibold">Points to work on:</p>
                  <ul className="list-disc pl-5 mt-1 text-muted">
                    {weakPoints.map((w) => <li key={w.id}>{w.label}{w.misconception ? ` — ${w.misconception}` : ""}</li>)}
                  </ul>
                </div>
              )}
              <p className="text-muted">
                {coached
                  ? "Debriefed with Emma ✓ — reread the full conversation on the paper page."
                  : "Not debriefed yet — open the paper and start the coaching with Emma."}
              </p>
              <Link href={`/paper/${lastMarked.id}`} className="text-[13px] font-semibold text-indigo hover:text-indigo-deep inline-block">
                {coached ? "Reread the debrief →" : "Start the coaching on this paper →"}
              </Link>
            </div>
          ) : (
            <p className="text-sm text-faint mt-2">The coaching report appears once your past paper is marked.</p>
          )}
        </div>
      )}

      {panel === "papers" && (
        <div className="mt-4 bg-indigo-soft/40 rounded-xl p-4">
          <p className="font-semibold text-[14.5px]">📝 Papers to do</p>
          {todoPapers.length === 0 ? (
            <p className="text-sm text-faint mt-2">
              {papers.length === 0 ? "Emma assigns the paper at the end of the lesson — it will appear here." : "Nothing to do — every assigned paper is done. The coaching can recommend another one."}
            </p>
          ) : (
            <div className="mt-2 divide-y divide-line/60">
              {todoPapers.map((p, i) => (
                <div key={p.id} className="py-2.5 flex items-center gap-3 flex-wrap">
                  <span className="chip bg-amber-soft text-amber shrink-0">to do</span>
                  <span className="flex-1 min-w-[140px] text-sm font-semibold">Paper {markedPapers.length + i + 1} <span className="text-faint font-normal">· {p.total_marks} marks</span></span>
                  <Link href={`/paper/${p.id}`} className="btn-primary !py-1.5 !px-3.5 text-[12.5px]">Do it online →</Link>
                  <Link href={`/paper/${p.id}`} className="btn-ghost !py-1.5 !px-3.5 text-[12.5px]">🖨️ Print &amp; upload</Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {panel === "results" && (
        <div className="mt-4 bg-indigo-soft/40 rounded-xl p-4">
          <p className="font-semibold text-[14.5px]">📊 Paper results</p>
          {markedPapers.length === 0 ? (
            <p className="text-sm text-faint mt-2">Your marked papers will appear here, with your score and what to prepare before the coaching.</p>
          ) : (
            <div className="mt-2 space-y-3">
              {markedPapers.map((p, i) => {
                const pct = p.total_marks > 0 ? Math.round((100 * (p.awarded as number)) / p.total_marks) : 0;
                return (
                  <div key={p.id} className="bg-white/70 rounded-lg p-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={pct >= 75 ? "chip-acquis shrink-0" : "chip-fragile shrink-0"}>{p.awarded}/{p.total_marks} · {pct}%</span>
                      <span className="flex-1 min-w-[120px] text-sm font-semibold">Paper {i + 1}</span>
                      {coachedIds.has(p.id) && <span className="chip-acquis shrink-0">Coached ✓</span>}
                      <span className="font-mono text-[11px] text-faint shrink-0">{new Date(p.at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                      <Link href={`/paper/${p.id}`} className="text-indigo font-semibold text-[13px] shrink-0">See the marking →</Link>
                    </div>
                    {!coachedIds.has(p.id) && (p.prep_points || []).length > 0 && (
                      <div className="mt-2 border border-dashed border-amber rounded-lg px-3 py-2 text-[12.5px]">
                        <p className="font-semibold text-amber">📌 Before your coaching on this paper — prepare:</p>
                        <ul className="list-disc pl-5 mt-1 text-muted">
                          {(p.prep_points || []).map((pt, j) => <li key={j}>{pt}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
