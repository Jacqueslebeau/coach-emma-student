"use client";

// Tableau de bord : TOUT PAR MATIÈRE — une carte par matière inscrite
// (board, départ → actuel estimé → objectif, leçons, points ouverts, temps),
// le style d'Emma, et l'historique des séances filtrable par période.
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { SUBJECTS, SUBJECT_KEYS, type SubjectKey } from "@/lib/subjects";
import ActivityHistory from "@/components/ActivityHistory";
import ParentPanel from "@/components/ParentPanel";
import IntegrationsPanel from "@/components/IntegrationsPanel";

type Enrolment = {
  id: string; subject: string; board: string; spec: string;
  current_grade: string | null; baseline_grade: string | null; target_grade: string;
  exam_date: string | null; action_plan: unknown;
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
  lessons: { id: string; subject: string }[];
};

const STYLES: { key: string; label: string; hint: string }[] = [
  { key: "sympa", label: "Friendly", hint: "warm and encouraging" },
  { key: "strict", label: "Strict", hint: "structured and demanding" },
  { key: "direct", label: "Direct", hint: "straight to the point, no detours" },
  { key: "chatty", label: "Chatty", hint: "conversational (5 min max)" },
];

export default function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState<Overview | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");

  const load = useCallback(() => {
    fetch("/api/overview")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Could not load your dashboard"))))
      .then(setData)
      .catch((e) => setErr(e.message));
  }, []);
  useEffect(load, [load]);

  async function patchProfile(patch: Record<string, string>) {
    setSaving(true);
    try {
      await fetch("/api/profile", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(patch) });
      load();
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    await supabaseBrowser().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  if (err) return <p className="text-gap font-semibold">{err}</p>;
  if (!data) return <p className="text-muted">Loading…</p>;

  const p = data.profile;
  // Matières à afficher : les inscriptions + les matières qui ont déjà des
  // leçons sans inscription (comptes d'avant l'onboarding).
  const enrolledKeys = new Set(data.enrolments.map((e) => e.subject));
  const legacyKeys = Object.keys(data.by_subject).filter((k) => !enrolledKeys.has(k));

  return (
    <div>
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-wider text-amber font-semibold">Your dashboard</p>
          <h1 className="font-serif font-black text-3xl text-indigo-deep">My space</h1>
          <p className="text-muted mt-1">Hi {data.first_name || "champ"} 👋 — your tutorings, your coaching, your progress.</p>
        </div>
        <button onClick={logout} className="text-sm text-faint hover:text-indigo font-semibold">Sign out</button>
      </div>

      {/* ============ CARTE HÉRO — démarrer (façon « Préparez un entretien ») ============ */}
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

      {/* ============ MY TUTORINGS — façon « Vos préparations » ============ */}
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
              const shown = r?.estimated_grade || e.current_grade || e.baseline_grade || "—";
              return (
                <div key={e.id} className="p-5 border-l-4 border-l-indigo">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-[220px]">
                      <h3 className="font-serif font-semibold text-xl">{s?.labelEn || e.subject}</h3>
                      <p className="text-xs text-faint mt-0.5">
                        {e.board} · {e.spec}{e.exam_date ? ` · exam ${e.exam_date.slice(0, 7)}` : ""}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <span className="chip-todo">Level &amp; goal: {e.baseline_grade || "—"} → {e.target_grade || "A*"}</span>
                        {r?.estimated_grade && <span className="chip-acquis">Currently ~{r.estimated_grade}</span>}
                        {r && r.open_weak_points > 0 && <span className="chip-fragile">{r.open_weak_points} point{r.open_weak_points === 1 ? "" : "s"} to work on</span>}
                        {r && <span className="chip bg-white border border-line text-faint">{r.lessons} lesson{r.lessons === 1 ? "" : "s"} · {Math.round(r.minutes / 6) / 10} h</span>}
                      </div>
                    </div>
                    {/* Cercle de progression (façon score d'adéquation) */}
                    <div className="text-center shrink-0">
                      <div className="relative h-16 w-16">
                        <svg viewBox="0 0 36 36" className="h-16 w-16 -rotate-90">
                          <circle cx="18" cy="18" r="15.5" fill="none" stroke="#E5E7EB" strokeWidth="3" />
                          <circle
                            cx="18" cy="18" r="15.5" fill="none" stroke="#064E3B" strokeWidth="3"
                            strokeDasharray={`${Math.max(4, r?.avg_pct ?? 8)} 100`} strokeLinecap="round"
                            pathLength={100}
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center font-serif font-black text-xl text-indigo-deep">
                          {shown}
                        </span>
                      </div>
                      <p className="text-[10px] font-mono uppercase tracking-wider text-faint mt-1">
                        {r?.avg_pct !== null && r?.avg_pct !== undefined ? `${r.avg_pct}% marks` : "progress"}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    <Link href={`/matiere/${e.subject}`} className="btn-ghost !py-1.5 !px-3.5 text-[13px]">Tutoring Plan &amp; reports</Link>
                    <Link href={`/matiere/${e.subject}#papers`} className="btn-ghost !py-1.5 !px-3.5 text-[13px]">Past-paper practice</Link>
                    <Link href="/coaching" className="btn-ghost !py-1.5 !px-3.5 text-[13px]">Coaching</Link>
                    <Link href={`/lesson/new?subject=${e.subject}`} className="btn-amber !py-1.5 !px-4 text-[13px] ml-auto">Start a lesson</Link>
                  </div>
                </div>
              );
            })}
            {legacyKeys.map((k) => {
              const s = SUBJECTS[k as SubjectKey];
              const r = data.by_subject[k];
              return (
                <div key={k} className="p-5 border-l-4 border-l-amber">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <h3 className="font-serif font-semibold text-xl">{s?.labelEn || k}</h3>
                      <p className="text-sm text-muted mt-1">
                        {r.lessons} lesson{r.lessons === 1 ? "" : "s"} · {r.open_weak_points} point{r.open_weak_points === 1 ? "" : "s"} to work on
                      </p>
                    </div>
                    <Link href={`/tutoring/new?subject=${k}`} className="btn-primary !py-1.5 !px-4 text-[13px]">Set up →</Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ============ RÉGLAGES : style + langue d'Emma ============ */}
      <section className="card mt-6 p-5">
        <div className="flex flex-wrap items-start gap-x-10 gap-y-4">
          <div>
            <p className="text-sm font-semibold mb-2">Your Emma <span className="text-faint font-normal">(the tone changes, the standards don't)</span></p>
            <div className="flex flex-wrap gap-2">
              {STYLES.map((s) => (
                <button
                  key={s.key}
                  onClick={() => patchProfile({ tutor_style: s.key })}
                  disabled={saving}
                  title={s.hint}
                  className={
                    p.tutor_style === s.key
                      ? "btn-primary !py-1.5 !px-3.5 text-[13px]"
                      : "btn-ghost !py-1.5 !px-3.5 text-[13px]"
                  }
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          {/* Tout se passe en anglais — c'est un A Level. Le français (programme
              du bac) viendra comme offre séparée ; content_lang reste en base. */}
        </div>
      </section>

      {/* ============ SUIVI PARENT & CONNEXIONS ============ */}
      <ParentPanel />

      {/* ============ INTEGRATIONS (Google Drive) ============ */}
      <IntegrationsPanel />

      {/* ============ HISTORIQUE DES SÉANCES (filtrable) ============ */}
      <section className="mt-8">
        <h2 className="font-serif font-semibold text-xl">Your sessions</h2>
        <p className="text-sm text-muted mt-1 mb-3">This week, last week, this month — or a custom range.</p>
        <ActivityHistory />
      </section>
    </div>
  );
}
