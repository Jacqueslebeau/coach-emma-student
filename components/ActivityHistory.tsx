"use client";

// Historique d'activité filtrable : séances de leçons et de coaching sur une
// période (cette semaine / semaine dernière / mois / custom from→to), avec la
// matière de chaque séance. `subject` fixe le filtre (page matière) ; sans lui,
// des puces par matière permettent de filtrer (tableau de bord).
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SUBJECTS, type SubjectKey } from "@/lib/subjects";
import PeriodFilter, { currentWeek, type Period } from "@/components/PeriodFilter";

type Session = {
  id: string;
  kind: string;
  ref_id: string | null;
  title: string;
  subject: string;
  started_at: string;
  duration_min: number;
  summary: { covered?: string[] } | null;
};

type ActivityData = {
  sessions: Session[];
  totals: { count: number; minutes: number; by_subject: Record<string, { count: number; minutes: number }> };
};

export function subjectChipLabel(subject: string): string {
  if (subject === "coaching") return "coaching";
  return SUBJECTS[subject as SubjectKey]?.labelEn || subject;
}

// Récap d'une séance envoyable par email (mailto — l'élève choisit le destinataire).
function recapMailto(s: Session): string {
  const date = new Date(s.started_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const covered = Array.isArray(s.summary?.covered) && s.summary!.covered!.length
    ? s.summary!.covered!.map((c) => `• ${c}`).join("\n")
    : "• (no detail recorded)";
  const subjectName = subjectChipLabel(s.subject);
  const body =
    `Coach Emma Student — session recap\n\n` +
    `Subject: ${subjectName}\nSession: ${s.title}\nDate: ${date}\nDuration: ${s.duration_min} min\n\n` +
    `Covered:\n${covered}\n\n` +
    `Full history: https://coach-emma-student.vercel.app/dashboard`;
  return `mailto:?subject=${encodeURIComponent(`Session recap — ${subjectName} (${date})`)}&body=${encodeURIComponent(body)}`;
}

const PAGE = 5;

export default function ActivityHistory({ subject }: { subject?: string }) {
  const [period, setPeriod] = useState<Period>(currentWeek);
  const [pick, setPick] = useState<string>(""); // filtre matière local (dashboard)
  const [data, setData] = useState<ActivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [shown, setShown] = useState(PAGE); // pagination : 5 par 5

  const effective = subject || pick;
  useEffect(() => {
    setLoading(true);
    const qs = new URLSearchParams({ from: period.from, to: period.to });
    if (effective) qs.set("subject", effective);
    fetch(`/api/activity?${qs}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => { setData(d); setShown(PAGE); })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [period, effective]);

  const filters = useMemo(
    () => [
      { key: "", label: "All" },
      ...Object.values(SUBJECTS).map((s) => ({ key: s.key as string, label: s.labelEn })),
      { key: "coaching", label: "Coaching" },
    ],
    []
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PeriodFilter value={period} onChange={setPeriod} />
        {data && (
          <p className="font-mono text-xs text-faint">
            {data.totals.count} session{data.totals.count === 1 ? "" : "s"} · {Math.round(data.totals.minutes / 6) / 10} h
          </p>
        )}
      </div>

      {!subject && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setPick(f.key)}
              className={
                pick === f.key
                  ? "chip !text-[12px] !py-1 !px-3 bg-amber-soft text-amber border border-amber/40"
                  : "chip !text-[12px] !py-1 !px-3 bg-white border border-line text-faint hover:text-indigo"
              }
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-faint mt-4">Loading…</p>
      ) : !data || data.sessions.length === 0 ? (
        <p className="text-sm text-faint mt-4">No sessions in this period.</p>
      ) : (
        <>
          <div className="card mt-4 divide-y divide-line overflow-hidden">
            {data.sessions.slice(0, shown).map((s) => (
              <div key={s.id} className="p-4 flex items-start gap-3 flex-wrap">
                <span className={s.kind === "coaching" ? "chip bg-amber-soft text-amber shrink-0" : "chip-todo shrink-0"}>
                  {subjectChipLabel(s.subject)}
                </span>
                <div className="flex-1 min-w-[200px]">
                  {s.kind === "lesson" && s.ref_id ? (
                    <Link href={`/lesson/${s.ref_id}`} className="font-semibold text-[14.5px] hover:text-indigo">{s.title}</Link>
                  ) : (
                    <p className="font-semibold text-[14.5px]">{s.title}</p>
                  )}
                  {Array.isArray(s.summary?.covered) && s.summary!.covered!.length > 0 && (
                    <p className="text-xs text-muted mt-0.5">{s.summary!.covered!.join(" → ")}</p>
                  )}
                  <a href={recapMailto(s)} className="text-[11px] font-semibold text-faint hover:text-indigo inline-block mt-1">
                    ✉ Email this recap
                  </a>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-mono text-xs text-faint">
                    {new Date(s.started_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </p>
                  <p className="font-mono text-xs font-semibold text-indigo">{s.duration_min} min</p>
                </div>
              </div>
            ))}
          </div>
          {data.sessions.length > shown && (
            <button
              type="button"
              onClick={() => setShown((n) => n + PAGE)}
              className="mt-3 w-full text-sm font-semibold text-indigo hover:text-indigo-deep"
            >
              Show {Math.min(PAGE, data.sessions.length - shown)} more ({data.sessions.length - shown} left) ↓
            </button>
          )}
        </>
      )}
    </div>
  );
}
