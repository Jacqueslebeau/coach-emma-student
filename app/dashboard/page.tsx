"use client";

// Tableau de bord : LA VUE PROGRESSION — niveau de départ → niveau actuel →
// objectif A*, séances (durée + couvert), topics/leçons, points à travailler.
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

type Overview = {
  first_name: string;
  profile: { tutor_style: string; current_grade: string | null; baseline_grade: string | null; target_grade: string };
  lessons: { id: string; title: string; spec_topic: string | null; stage: string; concepts: { key: string }[] | null; created_at: string }[];
  mastery: { lesson_id: string; concept_key: string; label: string; status: string }[];
  weak_points: { id: string; lesson_id: string; label: string; misconception: string | null; created_at: string }[];
  sessions: { id: string; kind: string; ref_id: string | null; title: string; started_at: string; duration_min: number; summary: { covered?: string[] } }[];
  exam_scores: { at: string; pct: number }[];
  avg_pct: number | null;
  estimated_grade: string | null;
};

const STAGE_LABEL: Record<string, string> = {
  captured: "Capturée",
  course: "Cours en main",
  quiz: "Maîtrise en vérification",
  practice: "Exercices en cours",
  done: "Bouclée ✓",
};
const GRADES = ["E", "D", "C", "B", "A", "A*"];
const STYLES: { key: string; label: string; hint: string }[] = [
  { key: "sympa", label: "Sympa", hint: "chaleureuse, encourageante" },
  { key: "strict", label: "Stricte", hint: "cadrée, exigeante" },
  { key: "direct", label: "Direct", hint: "l'essentiel, zéro détour" },
  { key: "chatty", label: "Chatty", hint: "conversationnelle (5 min max)" },
];

export default function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState<Overview | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    fetch("/api/overview")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Chargement impossible"))))
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
  if (!data) return <p className="text-muted">Chargement…</p>;

  const p = data.profile;
  const currentShown = data.estimated_grade || p.current_grade || "—";
  const masteryByLesson = new Map<string, { acquis: number; total: number }>();
  for (const m of data.mastery) {
    const cur = masteryByLesson.get(m.lesson_id) || { acquis: 0, total: 0 };
    cur.total += 1;
    if (m.status === "acquis") cur.acquis += 1;
    masteryByLesson.set(m.lesson_id, cur);
  }
  const totalMinutes = data.sessions.reduce((s, x) => s + x.duration_min, 0);
  const lastScores = data.exam_scores.slice(-10);

  return (
    <div>
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-serif font-black text-3xl text-indigo-deep">Salut {data.first_name || "champion"} 👋</h1>
          <p className="text-muted mt-1">Maths · Edexcel A Level — objectif <span className="font-serif font-black text-amber">{p.target_grade || "A*"}</span></p>
        </div>
        <button onClick={logout} className="text-sm text-faint hover:text-indigo font-semibold">Se déconnecter</button>
      </div>

      {/* ============ PROGRESSION ============ */}
      <section className="card mt-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <div className="text-center">
              <p className="text-[11px] font-mono uppercase tracking-wider text-faint">Départ</p>
              <p className="font-serif font-black text-3xl text-muted">{p.baseline_grade || "—"}</p>
            </div>
            <span className="text-faint text-xl">→</span>
            <div className="text-center">
              <p className="text-[11px] font-mono uppercase tracking-wider text-indigo">Actuel{data.estimated_grade ? " (estimé)" : ""}</p>
              <p className="font-serif font-black text-3xl text-indigo">{currentShown}</p>
              {data.avg_pct !== null && <p className="font-mono text-[11px] text-faint">{data.avg_pct}% des marks</p>}
            </div>
            <span className="text-faint text-xl">→</span>
            <div className="text-center">
              <p className="text-[11px] font-mono uppercase tracking-wider text-amber">Objectif</p>
              <p className="font-serif font-black text-3xl text-amber">{p.target_grade || "A*"}</p>
            </div>
          </div>
          {/* Tendance des séries d'exercices */}
          {lastScores.length > 0 && (
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-faint mb-1">Séries d'exercices (% marks)</p>
              <div className="flex items-end gap-1 h-14">
                {lastScores.map((s, i) => (
                  <div key={i} className="w-5 rounded-t bg-indigo/80" style={{ height: `${Math.max(8, s.pct * 0.56)}px` }} title={`${s.pct}%`} />
                ))}
                <span className="text-[10px] font-mono text-faint ml-1 self-end">{lastScores[lastScores.length - 1].pct}%</span>
              </div>
            </div>
          )}
        </div>
        {!p.current_grade && (
          <p className="text-sm text-learning font-semibold mt-4 bg-learning-bg rounded-xl px-4 py-2.5">
            Renseigne ton niveau actuel dans les réglages ci-dessous — c'est ta ligne de départ pour mesurer la progression.
          </p>
        )}
      </section>

      {/* ============ RÉGLAGES : style d'Emma + niveaux ============ */}
      <section className="card mt-4 p-5">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
          <div>
            <p className="text-sm font-semibold mb-2">Ton Emma <span className="text-faint font-normal">(le ton change, pas l'exigence)</span></p>
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
          <div className="flex gap-4">
            <label className="text-sm font-semibold">
              Niveau actuel
              <select
                className="input mt-1 !py-1.5"
                value={p.current_grade || ""}
                onChange={(e) => e.target.value && patchProfile({ current_grade: e.target.value })}
              >
                <option value="">—</option>
                {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </label>
            <label className="text-sm font-semibold">
              Objectif
              <select
                className="input mt-1 !py-1.5"
                value={p.target_grade || "A*"}
                onChange={(e) => patchProfile({ target_grade: e.target.value })}
              >
                {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </label>
          </div>
        </div>
      </section>

      {/* ============ ACTIONS ============ */}
      <div className="grid sm:grid-cols-2 gap-4 mt-6">
        <Link href="/lesson/new" className="card p-5 hover:border-indigo transition">
          <h2 className="font-serif font-semibold text-lg">📚 Nouvelle leçon</h2>
          <p className="text-sm text-muted mt-1">Titre, notes ou photo du cours — la boucle complète jusqu'aux exercices corrigés.</p>
        </Link>
        <Link href="/coaching" className="card p-5 hover:border-amber transition">
          <h2 className="font-serif font-semibold text-lg">🎯 Coaching d'examen</h2>
          <p className="text-sm text-muted mt-1">Pas de maths ici : le stress, la stratégie, le jour J. Emma t'écoute et te prépare.</p>
        </Link>
      </div>

      {/* ============ LEÇONS / TOPICS COUVERTS ============ */}
      <section className="mt-8">
        <h2 className="font-serif font-semibold text-xl">Leçons & topics couverts</h2>
        {data.lessons.length === 0 ? (
          <div className="card p-8 mt-4 text-center">
            <p className="text-muted">Aucune leçon pour l'instant.</p>
            <Link href="/lesson/new" className="btn-amber mt-4">Capturer ma première leçon</Link>
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
                    {m ? `${m.acquis}/${m.total} concepts acquis` : `${nConcepts} concepts — maîtrise à vérifier`}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* ============ SÉANCES ============ */}
      <section className="mt-8">
        <div className="flex items-baseline justify-between">
          <h2 className="font-serif font-semibold text-xl">Tes séances</h2>
          {totalMinutes > 0 && <p className="font-mono text-xs text-faint">{Math.round(totalMinutes / 6) / 10} h au total</p>}
        </div>
        {data.sessions.length === 0 ? (
          <p className="text-sm text-faint mt-3">Ta première séance apparaîtra ici automatiquement.</p>
        ) : (
          <div className="card mt-4 divide-y divide-line overflow-hidden">
            {data.sessions.map((s) => (
              <div key={s.id} className="p-4 flex items-start gap-3 flex-wrap">
                <span className={s.kind === "coaching" ? "chip bg-amber-soft text-amber shrink-0" : "chip-todo shrink-0"}>
                  {s.kind === "coaching" ? "coaching" : "leçon"}
                </span>
                <div className="flex-1 min-w-[200px]">
                  <p className="font-semibold text-[14.5px]">{s.title}</p>
                  {Array.isArray(s.summary?.covered) && s.summary.covered.length > 0 && (
                    <p className="text-xs text-muted mt-0.5">{s.summary.covered.join(" → ")}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="font-mono text-xs text-faint">
                    {new Date(s.started_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                  </p>
                  <p className="font-mono text-xs font-semibold text-indigo">{s.duration_min} min</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ============ POINTS À TRAVAILLER ============ */}
      <section className="mt-8">
        <h2 className="font-serif font-semibold text-xl">Points à travailler</h2>
        <p className="text-sm text-muted mt-1">Ce qui reste fragile — on les re-teste jusqu'à l'A★.</p>
        {data.weak_points.length === 0 ? (
          <p className="text-sm text-faint mt-3">Rien d'ouvert — soit tu démarres, soit tu gères 💪</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {data.weak_points.map((w) => (
              <li key={w.id} className="card p-4 flex items-start gap-3">
                <span className="chip-non_acquis mt-0.5 shrink-0">à revoir</span>
                <div>
                  <Link href={`/lesson/${w.lesson_id}`} className="font-semibold text-[15px] hover:text-indigo">{w.label}</Link>
                  {w.misconception && <p className="text-sm text-muted mt-0.5">Méprise repérée : {w.misconception}</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
