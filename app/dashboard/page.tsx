"use client";

// Tableau de bord : TOUT PAR MATIÈRE — une carte par matière inscrite
// (board, départ → actuel estimé → objectif, leçons, points ouverts, temps),
// le style d'Emma, et l'historique des séances filtrable par période.
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { SUBJECTS, type SubjectKey } from "@/lib/subjects";
import ActivityHistory from "@/components/ActivityHistory";
import ParentPanel from "@/components/ParentPanel";

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
  // Matières à afficher : les inscriptions + les matières qui ont déjà des
  // leçons sans inscription (comptes d'avant l'onboarding).
  const enrolledKeys = new Set(data.enrolments.map((e) => e.subject));
  const legacyKeys = Object.keys(data.by_subject).filter((k) => !enrolledKeys.has(k));

  return (
    <div>
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-serif font-black text-3xl text-indigo-deep">Salut {data.first_name || "champion"} 👋</h1>
          <p className="text-muted mt-1">Chaque matière a son tableau de bord, son board et son plan d'action.</p>
        </div>
        <button onClick={logout} className="text-sm text-faint hover:text-indigo font-semibold">Se déconnecter</button>
      </div>

      {/* ============ MES MATIÈRES ============ */}
      <section className="mt-6">
        <div className="flex items-baseline justify-between">
          <h2 className="font-serif font-semibold text-xl">Mes matières</h2>
          <Link href="/onboarding" className="text-sm font-semibold text-indigo hover:text-indigo-deep">
            {data.enrolments.length ? "Modifier mes matières" : "Configurer"}
          </Link>
        </div>

        {data.enrolments.length === 0 && legacyKeys.length === 0 ? (
          <div className="card p-8 mt-4 text-center">
            <p className="text-muted">
              Commence par choisir tes matières, ton exam board et ton objectif — Emma te prépare un
              plan d'action par matière.
            </p>
            <Link href="/onboarding" className="btn-amber mt-4 inline-block">Configurer mes matières →</Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            {data.enrolments.map((e) => {
              const s = SUBJECTS[e.subject as SubjectKey];
              const r = data.by_subject[e.subject];
              const shown = r?.estimated_grade || e.current_grade || "—";
              return (
                <Link key={e.id} href={`/matiere/${e.subject}`} className="card p-5 hover:border-indigo transition">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-serif font-semibold text-lg">{s?.labelFr || e.subject}</h3>
                    <span className="chip-todo shrink-0">{e.board} · {e.spec}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    <span className="font-serif font-black text-2xl text-muted">{e.baseline_grade || "—"}</span>
                    <span className="text-faint">→</span>
                    <span className="font-serif font-black text-2xl text-indigo">{shown}</span>
                    <span className="text-faint">→</span>
                    <span className="font-serif font-black text-2xl text-amber">{e.target_grade || "A*"}</span>
                    {r?.avg_pct !== null && r?.avg_pct !== undefined && (
                      <span className="font-mono text-[11px] text-faint self-end pb-1">{r.avg_pct}% des marks</span>
                    )}
                  </div>
                  <p className="text-sm text-muted mt-3">
                    {r ? `${r.lessons} leçon${r.lessons > 1 ? "s" : ""} · ${r.open_weak_points} point${r.open_weak_points > 1 ? "s" : ""} à travailler · ${Math.round(r.minutes / 6) / 10} h` : "Pas encore de leçon — le plan d'action t'attend"}
                    {e.exam_date ? ` · examen ${e.exam_date.slice(0, 7)}` : ""}
                  </p>
                </Link>
              );
            })}
            {legacyKeys.map((k) => {
              const s = SUBJECTS[k as SubjectKey];
              const r = data.by_subject[k];
              return (
                <Link key={k} href={`/matiere/${k}`} className="card p-5 hover:border-indigo transition">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-serif font-semibold text-lg">{s?.labelFr || k}</h3>
                    <span className="chip-non_acquis shrink-0">board à configurer</span>
                  </div>
                  <p className="text-sm text-muted mt-3">
                    {r.lessons} leçon{r.lessons > 1 ? "s" : ""} · {r.open_weak_points} point{r.open_weak_points > 1 ? "s" : ""} à travailler
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* ============ ACTIONS ============ */}
      <div className="grid sm:grid-cols-2 gap-4 mt-6">
        <Link href="/lesson/new" className="card p-5 hover:border-indigo transition">
          <h2 className="font-serif font-semibold text-lg">📚 Nouvelle leçon</h2>
          <p className="text-sm text-muted mt-1">Titre, notes ou photo du cours — la boucle complète jusqu'aux exercices corrigés.</p>
        </Link>
        <Link href="/coaching" className="card p-5 hover:border-amber transition">
          <h2 className="font-serif font-semibold text-lg">🎯 Coaching d'examen</h2>
          <p className="text-sm text-muted mt-1">Pas de contenu ici : le stress, la stratégie, le jour J. Emma t'écoute et te prépare.</p>
        </Link>
      </div>

      {/* ============ RÉGLAGES : style + langue d'Emma ============ */}
      <section className="card mt-6 p-5">
        <div className="flex flex-wrap items-start gap-x-10 gap-y-4">
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
          <div>
            <p className="text-sm font-semibold mb-2">Langue d'Emma <span className="text-faint font-normal">(l'A Level se passe en anglais)</span></p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => patchProfile({ content_lang: "en" })}
                disabled={saving}
                title="Cours, exercices, corrections et coaching en anglais — comme le jour J"
                className={(p.content_lang || "en") === "en" ? "btn-primary !py-1.5 !px-3.5 text-[13px]" : "btn-ghost !py-1.5 !px-3.5 text-[13px]"}
              >
                English 🇬🇧 (défaut)
              </button>
              <button
                onClick={() => patchProfile({ content_lang: "fr" })}
                disabled={saving}
                title="Explications en français — les énoncés, command words et corrigés restent en anglais"
                className={p.content_lang === "fr" ? "btn-primary !py-1.5 !px-3.5 text-[13px]" : "btn-ghost !py-1.5 !px-3.5 text-[13px]"}
              >
                Explications en français
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ============ SUIVI PARENT & CONNEXIONS ============ */}
      <ParentPanel />

      {/* ============ HISTORIQUE DES SÉANCES (filtrable) ============ */}
      <section className="mt-8">
        <h2 className="font-serif font-semibold text-xl">Tes séances</h2>
        <p className="text-sm text-muted mt-1 mb-3">Par semaine, semaine dernière, mois — ou une période custom.</p>
        <ActivityHistory />
      </section>
    </div>
  );
}
