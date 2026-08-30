"use client";

// Configuration du compte : pour chaque matière suivie — le board, la note
// GCSE obtenue (point de départ RÉEL ; relevé uploadable en option pour la
// nuance), l'objectif au A Level (borné : jamais sous le niveau projeté, jamais
// sous B) et la session d'examen. À la validation, chaque matière reçoit son
// PLAN D'ACTION dimensionné sur le temps restant.
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BOARD_OPTIONS, SUBJECTS, SUBJECT_KEYS, type SubjectKey } from "@/lib/subjects";
import { GCSE_GRADES, gcseToStart, allowedTargets } from "@/lib/grades";
import BackLink from "@/components/BackLink";

type Row = {
  on: boolean;
  board: string;        // board key ("edexcel"…)
  gcse_grade: string;   // note GCSE 9-1
  gcse_note: string;    // nuance lue sur le relevé (optionnel)
  target_grade: string;
  exam_date: string;    // "2027-06"
};

export default function Onboarding() {
  const router = useRouter();
  const [rows, setRows] = useState<Record<SubjectKey, Row>>(() =>
    Object.fromEntries(
      SUBJECT_KEYS.map((k) => [k, { on: false, board: BOARD_OPTIONS[k][0].board, gcse_grade: "", gcse_note: "", target_grade: "A*", exam_date: "" }])
    ) as Record<SubjectKey, Row>
  );
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState(false);
  const [slipMsg, setSlipMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Pré-remplit avec les inscriptions existantes (modification du set-up).
  useEffect(() => {
    fetch("/api/enrolments")
      .then((r) => (r.ok ? r.json() : { enrolments: [] }))
      .then((d) => {
        setRows((prev) => {
          const next = { ...prev };
          for (const e of d.enrolments || []) {
            const k = e.subject as SubjectKey;
            if (!next[k]) continue;
            const opt = BOARD_OPTIONS[k].find((o) => o.label === e.board);
            next[k] = {
              on: true,
              board: opt?.board || BOARD_OPTIONS[k][0].board,
              gcse_grade: e.gcse_grade || "",
              gcse_note: e.gcse_note || "",
              target_grade: e.target_grade || "A*",
              exam_date: (e.exam_date || "").slice(0, 7),
            };
          }
          return next;
        });
      })
      .catch(() => {});
  }, []);

  function patch(k: SubjectKey, p: Partial<Row>) {
    setRows((r) => {
      const merged = { ...r[k], ...p };
      // L'objectif reste dans la fenêtre autorisée quand le GCSE change.
      const allowed = allowedTargets(merged.gcse_grade ? gcseToStart(merged.gcse_grade) : null) as string[];
      if (!allowed.includes(merged.target_grade)) merged.target_grade = allowed[0];
      return { ...r, [k]: merged };
    });
  }

  // Upload OPTIONNEL du relevé de résultats : Emma lit les notes (et la nuance).
  async function onSlip(file: File) {
    setReading(true); setSlipMsg(null); setError(null);
    try {
      const b64 = await new Promise<string>((res, rej) => {
        const fr = new FileReader();
        fr.onload = () => res(String(fr.result).split(",")[1] || "");
        fr.onerror = rej;
        fr.readAsDataURL(file);
      });
      const r = await fetch("/api/gcse-extract", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ image: b64, media_type: file.type || "image/jpeg" }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Could not read the slip");
      if (!d.readable) { setSlipMsg(`Emma couldn't read this document${d.reason ? ` — ${d.reason}` : ""}. Enter your grades manually.`); return; }
      let found = 0;
      for (const res of d.results || []) {
        const k = res.subject as SubjectKey;
        if (!SUBJECT_KEYS.includes(k) || !res.grade) continue;
        patch(k, { on: true, gcse_grade: String(res.grade), gcse_note: res.detail || "" });
        found++;
      }
      setSlipMsg(found ? `Emma read ${found} grade${found > 1 ? "s" : ""} from your results slip — check and adjust below.` : "No matching subjects found on this slip — enter your grades manually.");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setReading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const enrolments = SUBJECT_KEYS.filter((k) => rows[k].on).map((k) => ({
      subject: k,
      board: rows[k].board,
      gcse_grade: rows[k].gcse_grade || null,
      gcse_note: rows[k].gcse_note || null,
      target_grade: rows[k].target_grade || "A*",
      exam_date: rows[k].exam_date || null,
    }));
    if (!enrolments.length) { setError("Choose at least one subject."); return; }
    setBusy(true); setError(null);
    try {
      const r = await fetch("/api/enrolments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ enrolments }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Could not save your subjects");
      router.push("/dashboard");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <BackLink />
      <h1 className="font-serif font-black text-3xl text-indigo-deep mt-2">Your subjects</h1>
      <p className="text-muted mt-2">
        For each subject: your exam board (every board has its own papers and mark scheme — Emma
        calibrates to it), the <span className="font-semibold text-ink">GCSE grade you achieved</span>,
        your A Level target and your exam session. You&apos;ll get a realistic{" "}
        <span className="font-semibold text-ink">action plan</span> sized to the time you actually have.
      </p>

      <div className="card p-4 mt-5 border-dashed">
        <p className="text-sm font-semibold">Optional — upload your GCSE results slip</p>
        <p className="text-xs text-muted mt-1">
          Emma reads your exact grades (and the marks behind them when shown — a high 7 and a low 7
          don&apos;t start from the same place). You can also just enter your grades below.
        </p>
        <div className="mt-2 flex items-center gap-3">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="text-sm"
            onChange={(e) => e.target.files?.[0] && onSlip(e.target.files[0])}
            disabled={reading}
          />
          {reading && <span className="text-xs text-muted animate-pulse">Emma is reading your slip…</span>}
        </div>
        {slipMsg && <p className="text-xs text-indigo-deep font-semibold mt-2">{slipMsg}</p>}
      </div>

      <form onSubmit={onSubmit} className="mt-5 space-y-4">
        {SUBJECT_KEYS.map((k) => {
          const s = SUBJECTS[k];
          const row = rows[k];
          const opts = BOARD_OPTIONS[k];
          const start = row.gcse_grade ? gcseToStart(row.gcse_grade) : null;
          const targets = allowedTargets(start) as string[];
          return (
            <div key={k} className={`card p-5 transition ${row.on ? "border-indigo" : "opacity-80"}`}>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={row.on}
                  onChange={(e) => patch(k, { on: e.target.checked })}
                  className="h-5 w-5 accent-[#064E3B]"
                />
                <span className="font-serif font-semibold text-lg">{s.labelEn}</span>
                {k === "french" && <span className="chip-todo">private candidate</span>}
              </label>

              {row.on && (
                <>
                  <div className="grid sm:grid-cols-4 gap-4 mt-4">
                    <label className="text-sm font-semibold">
                      Exam board
                      <select className="input mt-1 !py-1.5" value={row.board} onChange={(e) => patch(k, { board: e.target.value })}>
                        {opts.map((o) => <option key={o.board} value={o.board}>{o.label} · {o.spec}</option>)}
                      </select>
                    </label>
                    <label className="text-sm font-semibold">
                      GCSE grade
                      <select className="input mt-1 !py-1.5" value={row.gcse_grade} onChange={(e) => patch(k, { gcse_grade: e.target.value })}>
                        <option value="">—</option>
                        {GCSE_GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </label>
                    <label className="text-sm font-semibold">
                      A Level target
                      <select className="input mt-1 !py-1.5" value={row.target_grade} onChange={(e) => patch(k, { target_grade: e.target.value })}>
                        {targets.map((g) => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </label>
                    <label className="text-sm font-semibold">
                      Exam session
                      <input
                        type="month"
                        className="input mt-1 !py-1.5"
                        value={row.exam_date}
                        onChange={(e) => patch(k, { exam_date: e.target.value })}
                      />
                    </label>
                  </div>
                  {start && (
                    <p className="text-xs text-muted mt-2">
                      Projected A Level starting point: <span className="font-semibold text-ink">{start}</span>
                      {row.gcse_note && <> · from your slip: {row.gcse_note}</>}
                      {" "}— your target can&apos;t be below where you already are.
                    </p>
                  )}
                </>
              )}
            </div>
          );
        })}

        {error && <p className="text-sm text-gap font-semibold">{error}</p>}
        <button className="btn-primary w-full !py-3" disabled={busy}>
          {busy ? "Saving…" : "Confirm my subjects →"}
        </button>
      </form>
    </div>
  );
}
