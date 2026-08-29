"use client";

// Configuration du compte : pour chaque matière suivie — le board, le niveau
// actuel, l'objectif au A Level et la session d'examen. À la validation,
// chaque matière reçoit son PLAN D'ACTION (rapport d'adéquation) sur son
// tableau de bord.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BOARD_OPTIONS, SUBJECTS, SUBJECT_KEYS, type SubjectKey } from "@/lib/subjects";

const GRADES = ["E", "D", "C", "B", "A", "A*"];

type Row = {
  on: boolean;
  board: string;        // board key ("edexcel"…)
  current_grade: string;
  target_grade: string;
  exam_date: string;    // "2027-06"
};

export default function Onboarding() {
  const router = useRouter();
  const [rows, setRows] = useState<Record<SubjectKey, Row>>(() =>
    Object.fromEntries(
      SUBJECT_KEYS.map((k) => [k, { on: false, board: BOARD_OPTIONS[k][0].board, current_grade: "", target_grade: "A*", exam_date: "" }])
    ) as Record<SubjectKey, Row>
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pré-remplit avec les inscriptions existantes (modification du set-up).
  useEffect(() => {
    fetch("/api/enrolments")
      .then((r) => (r.ok ? r.json() : { enrolments: [] }))
      .then((d) => {
        const next = { ...rows };
        for (const e of d.enrolments || []) {
          const k = e.subject as SubjectKey;
          if (!next[k]) continue;
          const opt = BOARD_OPTIONS[k].find((o) => o.label === e.board);
          next[k] = {
            on: true,
            board: opt?.board || BOARD_OPTIONS[k][0].board,
            current_grade: e.current_grade || "",
            target_grade: e.target_grade || "A*",
            exam_date: (e.exam_date || "").slice(0, 7),
          };
        }
        setRows(next);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function patch(k: SubjectKey, p: Partial<Row>) {
    setRows((r) => ({ ...r, [k]: { ...r[k], ...p } }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const enrolments = SUBJECT_KEYS.filter((k) => rows[k].on).map((k) => ({
      subject: k,
      board: rows[k].board,
      current_grade: rows[k].current_grade || null,
      target_grade: rows[k].target_grade || "A*",
      exam_date: rows[k].exam_date || null,
    }));
    if (!enrolments.length) { setError("Choisis au moins une matière."); return; }
    setBusy(true); setError(null);
    try {
      const r = await fetch("/api/enrolments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ enrolments }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Enregistrement impossible");
      router.push("/dashboard");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="font-serif font-black text-3xl text-indigo-deep">Tes matières</h1>
      <p className="text-muted mt-2">
        Pour chaque matière : ton exam board (chaque board a ses papers et son mark scheme — Emma
        s'y calibre), ton niveau actuel, ton objectif au A Level et ta session d'examen. Tu recevras
        un <span className="font-semibold text-ink">plan d'action</span> par matière.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        {SUBJECT_KEYS.map((k) => {
          const s = SUBJECTS[k];
          const row = rows[k];
          const opts = BOARD_OPTIONS[k];
          return (
            <div key={k} className={`card p-5 transition ${row.on ? "border-indigo" : "opacity-80"}`}>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={row.on}
                  onChange={(e) => patch(k, { on: e.target.checked })}
                  className="h-5 w-5 accent-[#064E3B]"
                />
                <span className="font-serif font-semibold text-lg">{s.labelFr}</span>
                {k === "french" && <span className="chip-todo">candidat libre</span>}
              </label>

              {row.on && (
                <div className="grid sm:grid-cols-4 gap-4 mt-4">
                  <label className="text-sm font-semibold">
                    Exam board
                    <select className="input mt-1 !py-1.5" value={row.board} onChange={(e) => patch(k, { board: e.target.value })}>
                      {opts.map((o) => <option key={o.board} value={o.board}>{o.label} · {o.spec}</option>)}
                    </select>
                  </label>
                  <label className="text-sm font-semibold">
                    Niveau actuel
                    <select className="input mt-1 !py-1.5" value={row.current_grade} onChange={(e) => patch(k, { current_grade: e.target.value })}>
                      <option value="">—</option>
                      {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </label>
                  <label className="text-sm font-semibold">
                    Objectif A Level
                    <select className="input mt-1 !py-1.5" value={row.target_grade} onChange={(e) => patch(k, { target_grade: e.target.value })}>
                      {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </label>
                  <label className="text-sm font-semibold">
                    Session d'examen
                    <input
                      type="month"
                      className="input mt-1 !py-1.5"
                      value={row.exam_date}
                      onChange={(e) => patch(k, { exam_date: e.target.value })}
                    />
                  </label>
                </div>
              )}
            </div>
          );
        })}

        {error && <p className="text-sm text-gap font-semibold">{error}</p>}
        <button className="btn-primary w-full !py-3" disabled={busy}>
          {busy ? "Enregistrement…" : "Valider mes matières →"}
        </button>
      </form>
    </div>
  );
}
