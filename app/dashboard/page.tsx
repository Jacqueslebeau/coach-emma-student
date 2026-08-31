"use client";

// MY SPACE — calqué sur « Vos préparations » de Coach Emma :
// - cartes matière ALLÉGÉES (un seul bouton : Tutoring Plan) ;
// - LES TOPICS en cartes (comptes rendus / papers / résultats / Start ▾),
//   filtrables par Period ▾ (avec Custom from→to), Subject ▾ et 🔍 recherche
//   par titre — pagination par lots de 15 ;
// - suivi parent + intégrations.
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SUBJECTS, SUBJECT_KEYS, type SubjectKey } from "@/lib/subjects";
import TopicCard, { type TopicPaper } from "@/components/TopicCard";
import ParentPanel from "@/components/ParentPanel";
import IntegrationsPanel from "@/components/IntegrationsPanel";
import BackLink from "@/components/BackLink";

type Enrolment = {
  id: string; subject: string; board: string; spec: string;
  current_grade: string | null; baseline_grade: string | null; target_grade: string;
  exam_date: string | null; gcse_grade?: string | null; gcse_note?: string | null; action_plan: unknown;
};
type Roll = {
  lessons: number; lessons_done: number; open_weak_points: number;
  minutes: number; scores: { at: string; pct: number }[];
  avg_pct: number | null; estimated_grade: string | null;
};
type Overview = {
  first_name: string;
  profile: { tutor_style: string; target_grade: string; content_lang?: string };
  enrolments: Enrolment[];
  by_subject: Record<string, Roll>;
  lessons: { id: string; subject: string; title: string; spec_topic: string | null; stage: string; created_at: string }[];
  mastery: { lesson_id: string; concept_key: string; label: string; status: string }[];
  weak_points: { id: string; lesson_id: string; label: string; misconception: string | null }[];
  papers?: (TopicPaper & { lesson_id: string })[];
  coached_paper_ids?: string[];
  lesson_sessions?: { ref_id: string; started_at: string; duration_min: number }[];
};

type PeriodKey = "all" | "week" | "lastweek" | "month" | "custom";
const PERIOD_LABEL: Record<PeriodKey, string> = {
  all: "All", week: "This week", lastweek: "Last week", month: "This month", custom: "Custom…",
};

function periodRange(p: PeriodKey, from: string, to: string): [number, number] | null {
  const now = new Date();
  const day = now.getDay() || 7; // lundi = début de semaine
  const startOfWeek = new Date(now); startOfWeek.setHours(0, 0, 0, 0); startOfWeek.setDate(now.getDate() - day + 1);
  if (p === "week") return [startOfWeek.getTime(), Infinity];
  if (p === "lastweek") { const s = new Date(startOfWeek); s.setDate(s.getDate() - 7); return [s.getTime(), startOfWeek.getTime()]; }
  if (p === "month") { const s = new Date(now.getFullYear(), now.getMonth(), 1); return [s.getTime(), Infinity]; }
  if (p === "custom") {
    const f = from ? new Date(from).getTime() : 0;
    const t = to ? new Date(to + "T23:59:59").getTime() : Infinity;
    return [f, t];
  }
  return null; // all
}

const PAGE = 15;

export default function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState<Overview | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
  // Filtres des topics
  const [period, setPeriod] = useState<PeriodKey>("all");
  const [from, setFrom] = useState(""); const [to, setTo] = useState("");
  const [subjectFilter, setSubjectFilter] = useState<string>("");
  const [query, setQuery] = useState("");
  const [periodOpen, setPeriodOpen] = useState(false);
  const [subjOpen, setSubjOpen] = useState(false);
  const [shown, setShown] = useState(PAGE);

  const load = useCallback(() => {
    fetch("/api/overview")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Could not load your dashboard"))))
      .then(setData)
      .catch((e) => setErr(e.message));
  }, []);
  useEffect(load, [load]);

  const coachedIds = useMemo(() => new Set(data?.coached_paper_ids || []), [data]);

  // La liste filtrée des topics (période sur la date de la leçon, matière, titre).
  const topics = useMemo(() => {
    if (!data) return [];
    const range = periodRange(period, from, to);
    const q = query.trim().toLowerCase();
    return data.lessons.filter((l) => {
      if (subjectFilter && l.subject !== subjectFilter) return false;
      if (q && !`${l.title} ${l.spec_topic || ""}`.toLowerCase().includes(q)) return false;
      if (range) {
        const t = new Date(l.created_at).getTime();
        if (t < range[0] || t >= range[1]) return false;
      }
      return true;
    });
  }, [data, period, from, to, subjectFilter, query]);

  // Temps passé sur la période (sessions de leçons des topics affichés).
  const periodMinutes = useMemo(() => {
    if (!data) return 0;
    const range = periodRange(period, from, to);
    const ids = new Set(topics.map((t) => t.id));
    return (data.lesson_sessions || [])
      .filter((s) => ids.has(s.ref_id) && (!range || (new Date(s.started_at).getTime() >= range[0] && new Date(s.started_at).getTime() < range[1])))
      .reduce((sum, s) => sum + s.duration_min, 0);
  }, [data, topics, period, from, to]);

  useEffect(() => setShown(PAGE), [period, from, to, subjectFilter, query]);

  if (err) return <p className="text-gap font-semibold">{err}</p>;
  if (!data) return <p className="text-muted">Loading…</p>;

  const enrolledKeys = new Set(data.enrolments.map((e) => e.subject));
  const legacyKeys = Object.keys(data.by_subject).filter((k) => !enrolledKeys.has(k));

  return (
    <div>
      <BackLink fallback="/" />
      <div className="flex items-end justify-between flex-wrap gap-3 mt-2">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-wider text-amber font-semibold">Your dashboard</p>
          <h1 className="font-serif font-black text-3xl text-indigo-deep">My space</h1>
          <p className="text-muted mt-1">Hi {data.first_name || "champ"} 👋 — your tutorings, your topics, your progress.</p>
        </div>
      </div>

      {/* ============ CARTE HÉRO — démarrer un tutoring ============ */}
      <div className="card p-6 mt-6 flex items-center gap-5 flex-wrap relative">
        <span className="text-3xl">🎯</span>
        <div className="flex-1 min-w-[220px]">
          <h2 className="font-serif font-semibold text-xl">Start your tutoring</h2>
          <p className="text-sm text-muted mt-0.5">
            Pick a subject — Emma finds your real starting point, you set the goal, and she builds
            your Tutoring Plan.
          </p>
        </div>
        <div className="relative shrink-0">
          <button type="button" onClick={() => setPickerOpen((o) => !o)} className="btn-amber !py-2.5 !px-5">
            New tutoring ▾
          </button>
          {pickerOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-line rounded-xl shadow-lg z-20 overflow-hidden">
              <input
                autoFocus
                className="w-full px-3.5 py-2.5 text-sm border-b border-line outline-none"
                placeholder="Search a subject…"
                value={pickerQuery}
                onChange={(ev) => setPickerQuery(ev.target.value)}
              />
              <div className="max-h-64 overflow-y-auto py-1">
                {SUBJECT_KEYS
                  .filter((k) => SUBJECTS[k].labelEn.toLowerCase().includes(pickerQuery.toLowerCase()))
                  .map((k) => {
                    const taken = enrolledKeys.has(k);
                    return taken ? (
                      <div key={k} className="px-3.5 py-2 text-sm text-faint opacity-50 cursor-not-allowed flex justify-between">
                        <span>{SUBJECTS[k].labelEn}</span>
                        <span className="text-[11px]">already started</span>
                      </div>
                    ) : (
                      <button
                        key={k}
                        type="button"
                        onClick={() => { setPickerOpen(false); router.push(`/tutoring/new?subject=${k}`); }}
                        className="w-full text-left px-3.5 py-2 text-sm font-semibold hover:bg-indigo-soft"
                      >
                        {SUBJECTS[k].labelEn}
                      </button>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ============ MY TUTORINGS — cartes matière ALLÉGÉES ============ */}
      <section className="mt-6 rounded-2xl overflow-hidden border border-line">
        <div className="bg-indigo-deep text-white px-5 py-3 flex items-center justify-between">
          <h2 className="font-serif font-semibold text-lg">My tutorings</h2>
          <span className="text-xs opacity-80">
            {data.enrolments.length} subject{data.enrolments.length === 1 ? "" : "s"}
          </span>
        </div>
        {data.enrolments.length === 0 && legacyKeys.length === 0 ? (
          <div className="bg-white p-8 text-center">
            <p className="text-muted">
              Nothing here yet — your tutorings will appear here once you start one from
              «&nbsp;Start your tutoring&nbsp;» above.
            </p>
          </div>
        ) : (
          <div className="bg-white divide-y divide-line">
            {data.enrolments.map((e) => {
              const s = SUBJECTS[e.subject as SubjectKey];
              const r = data.by_subject[e.subject];
              const shownGrade = r?.estimated_grade || e.current_grade || e.baseline_grade || "—";
              return (
                <div key={e.id} className="p-5 border-l-4 border-l-indigo flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-[220px]">
                    <h3 className="font-serif font-semibold text-xl">{s?.labelEn || e.subject}</h3>
                    <p className="text-xs text-faint mt-0.5">
                      {e.board} · {e.spec}{e.exam_date ? ` · exam ${e.exam_date.slice(0, 7)}` : ""}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span className="chip-todo">
                        {e.gcse_grade
                          ? `Start: GCSE ${e.gcse_grade} (≈ ${e.baseline_grade || "—"})`
                          : `Start: level ${e.baseline_grade || "—"}`} → target {e.target_grade || "A*"}
                      </span>
                      {r && <span className="chip bg-white border border-line text-faint">{r.lessons} topic{r.lessons === 1 ? "" : "s"} · {Math.round(r.minutes / 6) / 10} h</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-center">
                      <div className="relative h-14 w-14">
                        <svg viewBox="0 0 36 36" className="h-14 w-14 -rotate-90">
                          <circle cx="18" cy="18" r="15.5" fill="none" stroke="#E5E7EB" strokeWidth="3" />
                          <circle cx="18" cy="18" r="15.5" fill="none" stroke="#064E3B" strokeWidth="3"
                            strokeDasharray={`${Math.max(4, r?.avg_pct ?? 8)} 100`} strokeLinecap="round" pathLength={100} />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center font-serif font-black text-lg text-indigo-deep">{shownGrade}</span>
                      </div>
                      <p className="text-[9.5px] font-mono uppercase tracking-wider text-faint mt-0.5">progress</p>
                    </div>
                    <Link href={`/matiere/${e.subject}`} className="btn-ghost !py-2 !px-4 text-[13.5px]">Tutoring Plan</Link>
                  </div>
                </div>
              );
            })}
            {legacyKeys.map((k) => {
              const s = SUBJECTS[k as SubjectKey];
              return (
                <div key={k} className="p-5 border-l-4 border-l-amber flex items-center justify-between gap-2 flex-wrap">
                  <h3 className="font-serif font-semibold text-xl">{s?.labelEn || k}</h3>
                  <Link href={`/tutoring/new?subject=${k}`} className="btn-primary !py-1.5 !px-4 text-[13px]">Set up →</Link>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ============ YOUR TOPICS — le cœur : cartes façon Coach Emma ============ */}
      <section className="mt-6 rounded-2xl overflow-hidden border border-line">
        <div className="bg-indigo-deep text-white px-5 py-3 flex items-center justify-between">
          <h2 className="font-serif font-semibold text-lg">Your topics</h2>
          <span className="text-xs opacity-80">{topics.length} topic{topics.length === 1 ? "" : "s"}</span>
        </div>

        {/* Barre de filtres : Period ▾ · Subject ▾ · 🔍 recherche */}
        <div className="bg-indigo-soft/40 border-b border-line px-5 py-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="relative">
              <button
                type="button"
                onClick={() => { setSubjOpen(false); setPeriodOpen((o) => !o); }}
                className="btn-ghost !py-2 !px-3.5 text-[13px] bg-white"
              >
                📅 Period: <strong>{PERIOD_LABEL[period]}</strong> ▾
              </button>
              {periodOpen && (
                <div className="absolute left-0 top-full mt-2 w-60 bg-white border border-line rounded-xl shadow-lg z-20 overflow-hidden py-1">
                  {(Object.keys(PERIOD_LABEL) as PeriodKey[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => { setPeriod(p); if (p !== "custom") setPeriodOpen(false); }}
                      className={`block w-full text-left px-4 py-2 text-sm font-semibold hover:bg-indigo-soft ${period === p ? "text-indigo" : ""}`}
                    >
                      {PERIOD_LABEL[p]}
                    </button>
                  ))}
                  {period === "custom" && (
                    <div className="px-4 py-2 flex gap-2 items-center border-t border-line">
                      <input type="date" className="input !py-1 !px-2 text-[12.5px]" value={from} onChange={(e) => setFrom(e.target.value)} />
                      <span className="text-faint text-xs">→</span>
                      <input type="date" className="input !py-1 !px-2 text-[12.5px]" value={to} onChange={(e) => setTo(e.target.value)} />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => { setPeriodOpen(false); setSubjOpen((o) => !o); }}
                className="btn-ghost !py-2 !px-3.5 text-[13px] bg-white"
              >
                📚 Subject: <strong>{subjectFilter ? (SUBJECTS[subjectFilter as SubjectKey]?.labelEn || subjectFilter) : "All"}</strong> ▾
              </button>
              {subjOpen && (
                <div className="absolute left-0 top-full mt-2 w-60 bg-white border border-line rounded-xl shadow-lg z-20 overflow-hidden py-1">
                  <button type="button" onClick={() => { setSubjectFilter(""); setSubjOpen(false); }} className="block w-full text-left px-4 py-2 text-sm font-semibold hover:bg-indigo-soft">All</button>
                  {SUBJECT_KEYS.map((k) => (
                    <button key={k} type="button" onClick={() => { setSubjectFilter(k); setSubjOpen(false); }} className="block w-full text-left px-4 py-2 text-sm font-semibold hover:bg-indigo-soft">
                      {SUBJECTS[k].labelEn}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <input
              className="input flex-1 min-w-[180px] !py-2 text-[13.5px]"
              placeholder="🔍 Search a lesson…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <span className="font-mono text-[11.5px] text-faint shrink-0">{Math.round(periodMinutes / 6) / 10} h</span>
          </div>
        </div>

        {topics.length === 0 ? (
          <div className="bg-white p-8 text-center">
            <p className="text-muted">
              {data.lessons.length === 0
                ? "Your topics will appear here after your first lesson."
                : "No topic matches these filters."}
            </p>
          </div>
        ) : (
          <div className="bg-white divide-y divide-line">
            {topics.slice(0, shown).map((l) => (
              <TopicCard
                key={l.id}
                lesson={l}
                masteryRows={data.mastery.filter((m) => m.lesson_id === l.id)}
                weakPoints={data.weak_points.filter((w) => w.lesson_id === l.id)}
                papers={(data.papers || []).filter((p) => p.lesson_id === l.id)}
                coachedIds={coachedIds}
                showSubject
              />
            ))}
          </div>
        )}
        {topics.length > shown && (
          <button
            type="button"
            onClick={() => setShown((n) => n + PAGE)}
            className="w-full bg-white border-t border-line py-3 text-sm font-semibold text-indigo hover:text-indigo-deep"
          >
            Show {Math.min(PAGE, topics.length - shown)} more ↓
          </button>
        )}
      </section>

      {/* ============ SUIVI PARENT & CONNEXIONS ============ */}
      <ParentPanel />

      {/* ============ INTEGRATIONS (Google Drive) ============ */}
      <IntegrationsPanel />
    </div>
  );
}
